import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { verifyVisitorSession } from "./auth.js";
import { blogAdminProcedure } from "./blogAdminProcedure.js";
import * as db from "./db.js";
import { getRequestHeader, getRequestSource } from "./httpRequest.js";
import {
  assertWindowRateLimit,
  recordWindowRateLimitHit,
} from "./rateLimit.js";
import {
  buildArticleFeedbackSignal,
  buildSearchMissSignals,
  sortReaderSignals,
} from "./readerSignals.js";
import { loadLatestPublishFreshnessSignals } from "./publishFreshnessSignals.js";
import {
  listSearchMissOpportunities,
  resetSearchMissesForTests,
} from "./searchMisses.js";
import {
  FEEDBACK_REASONS,
  formatFeedbackMessageWithReason,
  parseFeedbackMessageWithReason,
  type FeedbackReason,
} from "@shared/feedbackReasons";
import { redactDirectContact } from "../shared/redaction.js";

const ENGAGEMENT_MAX_SUBMISSIONS = 4;
const ENGAGEMENT_WINDOW_MS = 60 * 1000;
const engagementSubmissions = new Map<
  string,
  { count: number; firstSeenAt: number }
>();

const feedbackStatusInput = z.enum(["new", "reviewed", "hidden"]);
const feedbackReasonInput = z.enum(FEEDBACK_REASONS);

const optionalTrimmedText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform(value => (value ? value : null));

const optionalEmailInput = z.preprocess(
  value => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .email()
    .max(320)
    .optional()
    .transform(value => (value ? value.toLowerCase() : null))
);

const subscriptionInput = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform(value => value.toLowerCase()),
  preferredLanguage: z.enum(["zh", "en"]).optional(),
  interests: optionalTrimmedText(240),
});

const feedbackCreateInput = z.object({
  postId: z.number().int().positive(),
  type: z.enum(["useful", "not_useful"]),
  reason: feedbackReasonInput.optional(),
  message: optionalTrimmedText(600),
  visitorName: optionalTrimmedText(80),
  replyEmail: optionalEmailInput,
});

const feedbackUpdateStatusInput = z.object({
  id: z.number().int().positive(),
  status: feedbackStatusInput,
});

function engagementRateLimitKey(source: string, bucket: string) {
  return `${bucket}:${source}`;
}

function assertEngagementAllowed(source: string, bucket: string) {
  assertWindowRateLimit({
    store: engagementSubmissions,
    key: engagementRateLimitKey(source, bucket),
    maxAttempts: ENGAGEMENT_MAX_SUBMISSIONS,
    windowMs: ENGAGEMENT_WINDOW_MS,
    message: "Too many engagement submissions. Try again later.",
  });
}

function recordEngagementSubmission(source: string, bucket: string) {
  recordWindowRateLimitHit({
    store: engagementSubmissions,
    key: engagementRateLimitKey(source, bucket),
    windowMs: ENGAGEMENT_WINDOW_MS,
  });
}

export function __resetEngagementRateLimitsForTests() {
  engagementSubmissions.clear();
  resetSearchMissesForTests();
}

export const engagementRouter = router({
  subscribe: publicProcedure
    .input(subscriptionInput)
    .mutation(async ({ input, ctx }) => {
      const source = getRequestSource(ctx.req);
      assertEngagementAllowed(source, "subscription");

      const result = await db.upsertSubscriber({
        email: input.email,
        preferredLanguage: input.preferredLanguage ?? null,
        interests: input.interests,
        source,
      });
      recordEngagementSubmission(source, "subscription");

      return {
        success: true,
        status: result.created ? "created" : "existing",
      } as const;
    }),

  feedback: router({
    create: publicProcedure
      .input(feedbackCreateInput)
      .mutation(async ({ input, ctx }) => {
        const source = getRequestSource(ctx.req);
        assertEngagementAllowed(source, "feedback");

        const post = await db.getPostById(input.postId);
        if (
          !post ||
          post.status !== "published" ||
          post.visibility !== "public"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        const visitor = await verifyVisitorSession(ctx.req);
        await db.createPostFeedback({
          postId: input.postId,
          visitorId: visitor?.visitorId ?? null,
          visitorName: visitor?.displayName ?? input.visitorName,
          type: input.type,
          message: formatFeedbackMessageWithReason(input.message, input.reason),
          replyEmail: input.replyEmail,
          source,
          userAgent: getRequestHeader(ctx.req, "user-agent") ?? null,
        });
        recordEngagementSubmission(source, "feedback");

        return { success: true, status: "new" } as const;
      }),

    list: blogAdminProcedure
      .input(
        z.object({
          postId: z.number().int().positive().optional(),
          status: feedbackStatusInput.optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.listPostFeedback({
          postId: input.postId,
          status: input.status,
          limit: input.limit,
        });
      }),

    markReviewed: blogAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const feedback = await db.markPostFeedbackReviewed(input.id);
        if (!feedback) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feedback not found",
          });
        }
        return { success: true, feedback };
      }),

    updateStatus: blogAdminProcedure
      .input(feedbackUpdateStatusInput)
      .mutation(async ({ input }) => {
        const feedback = await db.updatePostFeedbackStatus(
          input.id,
          input.status
        );
        if (!feedback) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feedback not found",
          });
        }
        return { success: true, feedback };
      }),
  }),

  subscribers: router({
    list: blogAdminProcedure.query(async () => {
      return await db.listSubscribers();
    }),
  }),

  contentRadar: router({
    summary: blogAdminProcedure.query(async () => {
      const [feedback, subscribers] = await Promise.all([
        db.listPostFeedback({ limit: 100 }),
        db.listSubscribers(),
      ]);
      return await buildEngagementContentRadar(feedback, subscribers);
    }),
  }),
});

async function buildEngagementContentRadar(feedback: any[], subscribers: any[]) {
  const visibleFeedback = feedback.filter(item => item.status !== "hidden");
  const searchMissOpportunities = listSearchMissOpportunities();
  const articleMap = new Map<
    string,
    {
      postId: number | null;
      postTitle: string;
      postSlug: string | null;
      total: number;
      useful: number;
      notUseful: number;
      newCount: number;
      messageCount: number;
      latestAt: Date | string | null;
      sampleMessages: string[];
      reasonCounts: Map<FeedbackReason, number>;
    }
  >();

  for (const item of visibleFeedback) {
    const key = item.postSlug || `post:${item.postId}`;
    const entry = articleMap.get(key) ?? {
      postId: item.postId ?? null,
      postTitle: item.postTitle || "Unknown article",
      postSlug: item.postSlug ?? null,
      total: 0,
      useful: 0,
      notUseful: 0,
      newCount: 0,
      messageCount: 0,
      latestAt: null,
      sampleMessages: [] as string[],
      reasonCounts: new Map<FeedbackReason, number>(),
    };

    entry.total += 1;
    if (item.type === "useful") entry.useful += 1;
    if (item.type === "not_useful") entry.notUseful += 1;
    if (item.status === "new") entry.newCount += 1;
    const parsedMessage = parseFeedbackMessageWithReason(item.message);
    if (parsedMessage.reason) {
      entry.reasonCounts.set(
        parsedMessage.reason,
        (entry.reasonCounts.get(parsedMessage.reason) ?? 0) + 1
      );
    }
    if (parsedMessage.message) {
      entry.messageCount += 1;
      if (entry.sampleMessages.length < 3)
        entry.sampleMessages.push(redactDirectContact(parsedMessage.message));
    }
    if (
      !entry.latestAt ||
      new Date(item.createdAt).getTime() > new Date(entry.latestAt).getTime()
    ) {
      entry.latestAt = item.createdAt ?? null;
    }
    articleMap.set(key, entry);
  }

  const interestCounts = new Map<string, number>();
  const languageBreakdown = { zh: 0, en: 0, unknown: 0 };
  let activeCount = 0;

  for (const subscriber of subscribers) {
    if (subscriber.status === "active") activeCount += 1;
    if (subscriber.preferredLanguage === "zh") languageBreakdown.zh += 1;
    else if (subscriber.preferredLanguage === "en") languageBreakdown.en += 1;
    else languageBreakdown.unknown += 1;

    for (const phrase of splitInterestPhrases(subscriber.interests)) {
      interestCounts.set(phrase, (interestCounts.get(phrase) ?? 0) + 1);
    }
  }

  const feedbackOpportunities = Array.from(articleMap.values())
    .map(entry => ({
      ...entry,
      reasonCounts: Array.from(entry.reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort(
          (a, b) =>
            b.count - a.count || a.reason.localeCompare(b.reason)
        ),
    }))
    .sort(
      (a, b) =>
        b.notUseful - a.notUseful ||
        b.newCount - a.newCount ||
        new Date(b.latestAt ?? 0).getTime() -
          new Date(a.latestAt ?? 0).getTime()
    )
    .slice(0, 6);
  const searchMissBacklog = searchMissOpportunities.slice(0, 8);
  const searchMissSignals = buildSearchMissSignals(searchMissBacklog);
  const feedbackSignals = feedbackOpportunities.map(item =>
    buildArticleFeedbackSignal({
      articleSlug: item.postSlug,
      feedbackType: item.notUseful > 0 ? "not_useful" : "feedback",
      count: item.total,
      excerpt:
        item.sampleMessages.length > 0
          ? item.sampleMessages.join(" ")
          : item.postTitle,
      firstSeenAt: item.latestAt ?? new Date(0),
      lastSeenAt: item.latestAt ?? new Date(0),
    })
  );
  const publishFreshnessSignals = await loadLatestPublishFreshnessSignals();
  const readerSignalItems = sortReaderSignals([
    ...feedbackSignals,
    ...searchMissSignals,
    ...publishFreshnessSignals,
  ]);

  return {
    feedback: {
      total: visibleFeedback.length,
      newCount: visibleFeedback.filter(item => item.status === "new").length,
      reviewedCount: visibleFeedback.filter(item => item.status === "reviewed")
        .length,
      hiddenCount: feedback.filter(item => item.status === "hidden").length,
      usefulCount: visibleFeedback.filter(item => item.type === "useful")
        .length,
      notUsefulCount: visibleFeedback.filter(item => item.type === "not_useful")
        .length,
      opportunities: feedbackOpportunities,
    },
    subscriptions: {
      total: subscribers.length,
      activeCount,
      languageBreakdown,
      topInterests: Array.from(interestCounts.entries())
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
        .slice(0, 8),
      delivery: {
        connected: false,
        status: "stored_only" as const,
        exportAvailable: subscribers.length > 0,
      },
    },
    searchMisses: {
      total: searchMissOpportunities.reduce((sum, item) => sum + item.count, 0),
      uniqueQueries: searchMissOpportunities.length,
      opportunities: searchMissBacklog,
    },
    readerSignals: {
      total: readerSignalItems.length,
      items: readerSignalItems,
    },
    writingBacklog: buildWritingBacklog(
      feedbackOpportunities,
      searchMissBacklog
    ),
  };
}

function buildWritingBacklog(
  feedbackOpportunities: Array<{
    postId: number | null;
    postTitle: string;
    postSlug: string | null;
    total: number;
    notUseful: number;
    newCount: number;
    latestAt: Date | string | null;
    sampleMessages: string[];
    reasonCounts?: Array<{ reason: FeedbackReason; count: number }>;
  }>,
  searchMissOpportunities: Array<{
    query: string;
    count: number;
    lastSeenAt: Date | string;
    suggestedPrompt: string;
  }>
) {
  const feedbackItems = feedbackOpportunities.map(item => ({
    id: `feedback:${item.postSlug ?? item.postId ?? "unknown"}`,
    kind: "feedback" as const,
    title: item.postTitle,
    signalCount: item.total,
    status: item.newCount > 0 ? ("new" as const) : ("reviewed" as const),
    priority:
      item.notUseful > 0 || item.newCount > 0
        ? ("high" as const)
        : ("normal" as const),
    sourceLabel: "reader feedback",
    sourceHref: item.postSlug ? `/post/${item.postSlug}` : null,
    draftHref: buildEditorIntentHref({
      idea: item.postTitle,
      source: "feedback",
      article: item.postSlug,
    }),
    latestAt: item.latestAt,
    evidence: item.sampleMessages.slice(0, 2).map(redactDirectContact),
  }));

  const searchItems = searchMissOpportunities.map(item => ({
    id: `search:${item.query.toLowerCase()}`,
    kind: "search_miss" as const,
    title: item.query,
    signalCount: item.count,
    status: "new" as const,
    priority: item.count > 1 ? ("high" as const) : ("normal" as const),
    sourceLabel: "zero-result search",
    sourceHref: null,
    draftHref: buildEditorIntentHref({
      idea: item.query,
      source: "search_miss",
    }),
    latestAt: item.lastSeenAt,
    evidence: [redactDirectContact(item.suggestedPrompt)],
  }));

  return [...feedbackItems, ...searchItems]
    .sort(
      (a, b) =>
        getPriorityWeight(b.priority) - getPriorityWeight(a.priority) ||
        b.signalCount - a.signalCount ||
        new Date(b.latestAt ?? 0).getTime() -
          new Date(a.latestAt ?? 0).getTime()
    )
    .slice(0, 10);
}

function getPriorityWeight(priority: "high" | "normal") {
  return priority === "high" ? 1 : 0;
}

function buildEditorIntentHref(input: {
  idea: string;
  source: "feedback" | "search_miss";
  article?: string | null;
}) {
  const params = new URLSearchParams({
    idea: input.idea,
    source: input.source,
  });
  if (input.article) params.set("article", input.article);
  return `/write?${params.toString()}`;
}

function splitInterestPhrases(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,;，、\n]/)
    .map(item => item.trim().toLowerCase())
    .filter(item => item.length >= 2)
    .slice(0, 20);
}
