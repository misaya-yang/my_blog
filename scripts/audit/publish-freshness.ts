import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { desc } from "drizzle-orm";
import {
  aiKnowledgeChunks,
  posts as postsTable,
} from "../../drizzle/schema.js";
import { closeDb, getDb, getPublicDiscoveryPosts } from "../../server/db.js";
import { getKnowledgeIndexStatus } from "../../server/ai/knowledgeDb.js";
import {
  groupArchivePosts,
  type DiscoveryPost,
} from "../../server/discovery.js";
import { renderRssXml, renderSitemapXml } from "../../server/seo.js";
import {
  contentSeriesCatalog,
  type ResearchTrack,
} from "../../shared/content-series.js";

const execFileAsync = promisify(execFile);

function debug(stage: string) {
  if (process.env.PUBLISH_FRESHNESS_DEBUG) {
    console.error(`[publish-freshness] ${stage}`);
  }
}

type PublicPostSnapshot = {
  slug: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string | null;
  materialHash: string;
};

type PublishSnapshot = {
  generatedAt: string;
  publicPosts: PublicPostSnapshot[];
};

type PublishFreshnessReport = {
  generatedAt: string;
  git: {
    branch: string;
    commit: string;
    dirty: boolean;
  };
  baseUrl: string;
  publicInventory: Array<{
    slug: string;
    title: string;
    categorySlug: string | null;
    tagSlugs: string[];
    publishedAt: string | null;
    updatedAt: string | null;
    seriesSlug: string | null;
    seriesOrder: number | null;
  }>;
  nonPublicInventory: Array<{
    slug: string;
    title: string;
    status: string;
    visibility: string;
  }>;
  metadataIssues: string[];
  generatedAssets: {
    sitemap: FeedCheck;
    rss: FeedCheck;
    archive: {
      ok: boolean;
      publicSlugs: string[];
      missingPublicSlugs: string[];
    };
  };
  trackCoverage: TrackCoverageCheck;
  agentKnowledge: {
    ok: boolean;
    chunkCount: number;
    publicPostCount: number;
    indexedPublicPostCount: number;
    hiddenOrDraftExcludedCount: number;
    stalePublicPostSlugs: string[];
    extraIndexedPostSlugs: string[];
    indexedPostSlugs: string[];
    nonPublicIndexedSlugs: string[];
    lastReindexAt: string | null;
  };
  dateDrift: {
    comparedPublicPosts: number;
    publishedAtChanged: string[];
    updatedAtChangedWithoutMaterialChange: string[];
  } | null;
  routeChecks: RouteCheck[];
  blockers: string[];
};

type FeedCheck = {
  ok: boolean;
  publicSlugs: string[];
  missingPublicSlugs: string[];
  leakedNonPublicSlugs: string[];
};

type TrackCoverageCheck = {
  ok: boolean;
  publicTrackSlugs: Record<ResearchTrack, string[]>;
  missingPublicSlugs: string[];
  mismatchedPrimarySeriesSlugs: string[];
  configuredUnknownSlugs: string[];
  configuredNonPublicSlugs: string[];
};

type RouteCheck =
  | {
      path: string;
      state: "skipped";
      reason: string;
    }
  | {
      path: string;
      state: "checked";
      status: number;
      ok: boolean;
      contentType: string | null;
    }
  | {
      path: string;
      state: "error";
      ok: false;
      error: string;
    };

type CliOptions = {
  snapshotOnly: boolean;
  outputPath: string | null;
  comparePath: string | null;
  baseUrl: string;
  routeBaseUrl: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    snapshotOnly: false,
    outputPath: null,
    comparePath: null,
    baseUrl: normalizeBaseUrl(
      process.env.SITE_URL ??
        process.env.VITE_SITE_URL ??
        process.env.AUDIT_BASE_URL ??
        "http://localhost:3000"
    ),
    routeBaseUrl: normalizeBaseUrl(process.env.AUDIT_BASE_URL ?? ""),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--snapshot-only") {
      options.snapshotOnly = true;
    } else if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
    } else if (arg === "--output") {
      options.outputPath = argv[index + 1] ?? null;
      index += 1;
    } else if (arg.startsWith("--compare=")) {
      options.comparePath = arg.slice("--compare=".length);
    } else if (arg === "--compare") {
      options.comparePath = argv[index + 1] ?? null;
      index += 1;
    } else if (arg.startsWith("--base-url=")) {
      options.baseUrl = normalizeBaseUrl(arg.slice("--base-url=".length));
      options.routeBaseUrl = options.baseUrl;
    } else if (arg === "--base-url") {
      options.baseUrl = normalizeBaseUrl(argv[index + 1] ?? "");
      options.routeBaseUrl = options.baseUrl;
      index += 1;
    }
  }

  return options;
}

async function buildSnapshot(
  publicPosts: DiscoveryPost[]
): Promise<PublishSnapshot> {
  return {
    generatedAt: new Date().toISOString(),
    publicPosts: publicPosts.map(toPublicPostSnapshot).sort(bySlug),
  };
}

async function runPublishFreshness(
  options: CliOptions
): Promise<PublishFreshnessReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  debug("collecting git, posts, knowledge");
  const git = await collectGitState(process.cwd());
  const publicPosts = await getPublicDiscoveryPosts();
  const allPosts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.publishedAt));
  const knowledgeStatus = await getKnowledgeIndexStatus();
  const knowledgeRows = await db.select().from(aiKnowledgeChunks);
  debug("collected git, posts, knowledge");

  const nonPublicPosts = allPosts.filter(post => !isPublishedPublic(post));
  const publicSlugs = publicPosts.map(post => post.slug).sort();
  const nonPublicSlugs = new Set(nonPublicPosts.map(post => post.slug));
  const sitemapXml = renderSitemapXml(options.baseUrl, publicPosts);
  const rssXml = renderRssXml(options.baseUrl, publicPosts);
  const archiveGroups = groupArchivePosts(publicPosts);
  const archiveSlugs = archiveGroups
    .flatMap(group => group.posts.map(post => post.slug))
    .sort();
  const indexedPublicRows = knowledgeRows.filter(
    row =>
      row.statusSnapshot === "published" && row.visibilitySnapshot === "public"
  );
  const nonPublicIndexedSlugs = Array.from(
    new Set(
      knowledgeRows
        .map(row => row.postSlug)
        .filter((slug): slug is string =>
          Boolean(slug && nonPublicSlugs.has(slug))
        )
    )
  ).sort();
  const dateDrift = options.comparePath
    ? await compareWithSnapshot(options.comparePath, publicPosts)
    : null;

  const generatedAssets = {
    sitemap: checkFeedCoverage(
      sitemapXml,
      publicSlugs,
      Array.from(nonPublicSlugs)
    ),
    rss: checkFeedCoverage(
      rssXml,
      publicSlugs.slice(0, 20),
      Array.from(nonPublicSlugs)
    ),
    archive: {
      ok: publicSlugs.every(slug => archiveSlugs.includes(slug)),
      publicSlugs: archiveSlugs,
      missingPublicSlugs: publicSlugs.filter(
        slug => !archiveSlugs.includes(slug)
      ),
    },
  };
  const trackCoverage = checkTrackCoverage(publicPosts, allPosts);
  const metadataIssues = collectMetadataIssues(publicPosts);
  const routeChecks = await collectRouteChecks(
    options.routeBaseUrl,
    publicPosts,
    nonPublicPosts
  );
  debug("collected route checks");
  const agentKnowledge = {
    ok:
      knowledgeStatus.publicPostCount === publicPosts.length &&
      knowledgeStatus.indexedPublicPostCount === publicPosts.length &&
      knowledgeStatus.chunkCount >= publicPosts.length &&
      knowledgeStatus.stalePublicPostSlugs.length === 0 &&
      knowledgeStatus.extraIndexedPostSlugs.length === 0 &&
      nonPublicIndexedSlugs.length === 0,
    chunkCount: knowledgeStatus.chunkCount,
    publicPostCount: knowledgeStatus.publicPostCount,
    indexedPublicPostCount: knowledgeStatus.indexedPublicPostCount,
    hiddenOrDraftExcludedCount: knowledgeStatus.hiddenOrDraftExcludedCount,
    stalePublicPostSlugs: knowledgeStatus.stalePublicPostSlugs,
    extraIndexedPostSlugs: knowledgeStatus.extraIndexedPostSlugs,
    indexedPostSlugs: knowledgeStatus.indexedPostSlugs,
    nonPublicIndexedSlugs,
    lastReindexAt: toIsoString(knowledgeStatus.lastReindexAt),
  };

  const blockers = collectBlockers({
    publicPosts,
    metadataIssues,
    generatedAssets,
    trackCoverage,
    agentKnowledge,
    dateDrift,
    routeChecks,
    indexedPublicRowsCount: indexedPublicRows.length,
  });

  return {
    generatedAt: new Date().toISOString(),
    git,
    baseUrl: options.baseUrl,
    publicInventory: publicPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      categorySlug: post.category?.slug ?? null,
      tagSlugs: post.tags.map(tag => tag.slug).sort(),
      publishedAt: toIsoString(post.publishedAt),
      updatedAt: toIsoString(post.updatedAt),
      seriesSlug: post.seriesSlug,
      seriesOrder: post.seriesOrder,
    })),
    nonPublicInventory: nonPublicPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      status: post.status,
      visibility: post.visibility,
    })),
    metadataIssues,
    generatedAssets,
    trackCoverage,
    agentKnowledge,
    dateDrift,
    routeChecks,
    blockers,
  };
}

function toPublicPostSnapshot(post: DiscoveryPost): PublicPostSnapshot {
  return {
    slug: post.slug,
    title: post.title,
    publishedAt: toIsoString(post.publishedAt),
    updatedAt: toIsoString(post.updatedAt),
    materialHash: hashMaterial({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      status: post.status,
      visibility: post.visibility,
      categorySlug: post.category?.slug ?? null,
      tagSlugs: post.tags.map(tag => tag.slug).sort(),
      seriesSlug: post.seriesSlug,
      seriesTitle: post.seriesTitle,
      seriesOrder: post.seriesOrder,
      featuredRank: post.featuredRank,
      pinnedTrack: post.pinnedTrack,
      publishedAt: toIsoString(post.publishedAt),
    }),
  };
}

function collectMetadataIssues(publicPosts: DiscoveryPost[]) {
  const issues: string[] = [];
  const seenSlugs = new Set<string>();

  for (const post of publicPosts) {
    if (seenSlugs.has(post.slug))
      issues.push(`${post.slug}: duplicate slug in public inventory`);
    seenSlugs.add(post.slug);
    if (!post.title?.trim()) issues.push(`${post.slug}: missing title`);
    if (!post.slug?.trim()) issues.push(`${post.title}: missing slug`);
    if (!post.excerpt?.trim()) issues.push(`${post.slug}: missing excerpt`);
    if (post.status !== "published")
      issues.push(`${post.slug}: status is ${post.status}`);
    if (post.visibility !== "public")
      issues.push(`${post.slug}: visibility is ${post.visibility}`);
    if (!post.publishedAt) issues.push(`${post.slug}: missing publishedAt`);
    if (!post.category?.slug) issues.push(`${post.slug}: missing category`);
    if (post.tags.length === 0) issues.push(`${post.slug}: missing tags`);
    if (!post.seriesSlug || !post.seriesTitle || !post.seriesOrder) {
      issues.push(`${post.slug}: missing primary series metadata`);
    }
  }

  return issues.sort();
}

function checkFeedCoverage(
  xml: string,
  publicSlugs: string[],
  nonPublicSlugs: string[]
): FeedCheck {
  const missingPublicSlugs = publicSlugs.filter(
    slug => !xml.includes(`/post/${slug}`)
  );
  const leakedNonPublicSlugs = nonPublicSlugs.filter(slug =>
    xml.includes(slug)
  );

  return {
    ok: missingPublicSlugs.length === 0 && leakedNonPublicSlugs.length === 0,
    publicSlugs,
    missingPublicSlugs,
    leakedNonPublicSlugs,
  };
}

export function checkTrackCoverage(
  publicPosts: DiscoveryPost[],
  allPosts: Array<typeof postsTable.$inferSelect>
): TrackCoverageCheck {
  const allPostSlugs = new Set(allPosts.map(post => post.slug));
  const nonPublicSlugs = new Set(
    allPosts.filter(post => !isPublishedPublic(post)).map(post => post.slug)
  );
  const configuredUnknownSlugs = new Set<string>();
  const configuredNonPublicSlugs = new Set<string>();
  const orderedSlugsByTrack: Record<ResearchTrack, Set<string>> = {
    algorithms: new Set(),
    applications: new Set(),
  };

  for (const series of contentSeriesCatalog) {
    for (const slug of series.orderedPostSlugs) {
      orderedSlugsByTrack[series.track].add(slug);
      if (!allPostSlugs.has(slug))
        configuredUnknownSlugs.add(`${series.slug}:${slug}`);
      if (nonPublicSlugs.has(slug))
        configuredNonPublicSlugs.add(`${series.slug}:${slug}`);
    }
  }

  const publicTrackSlugs: Record<ResearchTrack, string[]> = {
    algorithms: [],
    applications: [],
  };
  const missingPublicSlugs: string[] = [];
  const mismatchedPrimarySeriesSlugs: string[] = [];

  for (const post of publicPosts) {
    const track = getPostTrack(post);
    if (!track) continue;

    publicTrackSlugs[track].push(post.slug);
    if (!orderedSlugsByTrack[track].has(post.slug)) {
      missingPublicSlugs.push(`${track}:${post.slug}`);
    }

    const primarySeries = post.seriesSlug
      ? contentSeriesCatalog.find(series => series.slug === post.seriesSlug)
      : null;
    if (
      post.seriesSlug &&
      (!primarySeries ||
        primarySeries.track !== track ||
        !(primarySeries.orderedPostSlugs as readonly string[]).includes(
          post.slug
        ))
    ) {
      mismatchedPrimarySeriesSlugs.push(`${post.seriesSlug}:${post.slug}`);
    }
  }

  return {
    ok:
      missingPublicSlugs.length === 0 &&
      mismatchedPrimarySeriesSlugs.length === 0 &&
      configuredUnknownSlugs.size === 0 &&
      configuredNonPublicSlugs.size === 0,
    publicTrackSlugs: {
      algorithms: publicTrackSlugs.algorithms.sort(),
      applications: publicTrackSlugs.applications.sort(),
    },
    missingPublicSlugs: missingPublicSlugs.sort(),
    mismatchedPrimarySeriesSlugs: mismatchedPrimarySeriesSlugs.sort(),
    configuredUnknownSlugs: Array.from(configuredUnknownSlugs).sort(),
    configuredNonPublicSlugs: Array.from(configuredNonPublicSlugs).sort(),
  };
}

function getPostTrack(post: DiscoveryPost): ResearchTrack | null {
  if (
    post.pinnedTrack === "algorithms" ||
    post.pinnedTrack === "applications"
  ) {
    return post.pinnedTrack;
  }
  if (post.category?.slug === "ai-algorithms") return "algorithms";
  if (post.category?.slug === "ai-applications") return "applications";
  return null;
}

async function compareWithSnapshot(
  comparePath: string,
  publicPosts: DiscoveryPost[]
) {
  const previous = JSON.parse(
    await readFile(resolve(comparePath), "utf-8")
  ) as PublishSnapshot;
  const currentBySlug = new Map(
    publicPosts.map(post => [post.slug, toPublicPostSnapshot(post)])
  );
  const publishedAtChanged: string[] = [];
  const updatedAtChangedWithoutMaterialChange: string[] = [];
  let comparedPublicPosts = 0;

  for (const before of previous.publicPosts) {
    const after = currentBySlug.get(before.slug);
    if (!after) continue;
    comparedPublicPosts += 1;
    if (before.publishedAt !== after.publishedAt) {
      publishedAtChanged.push(before.slug);
    }
    if (
      before.materialHash === after.materialHash &&
      before.updatedAt !== after.updatedAt
    ) {
      updatedAtChangedWithoutMaterialChange.push(before.slug);
    }
  }

  return {
    comparedPublicPosts,
    publishedAtChanged: publishedAtChanged.sort(),
    updatedAtChangedWithoutMaterialChange:
      updatedAtChangedWithoutMaterialChange.sort(),
  };
}

async function collectRouteChecks(
  baseUrl: string,
  publicPosts: DiscoveryPost[],
  nonPublicPosts: Array<typeof postsTable.$inferSelect>
): Promise<RouteCheck[]> {
  if (!baseUrl) {
    return [
      {
        path: "(all)",
        state: "skipped",
        reason: "Set AUDIT_BASE_URL to run HTTP route freshness checks.",
      },
    ];
  }

  const firstPublicPost = publicPosts[0];
  const firstCategory = firstPublicPost?.category?.slug;
  const firstTag = firstPublicPost?.tags[0]?.slug;
  const firstNonPublic = nonPublicPosts[0];
  const paths = [
    "/",
    "/archive",
    "/rss.xml",
    "/sitemap.xml",
    "/robots.txt",
    firstPublicPost ? `/post/${firstPublicPost.slug}` : null,
    firstCategory ? `/categories/${firstCategory}` : null,
    firstTag ? `/tags/${firstTag}` : null,
    firstNonPublic ? `/post/${firstNonPublic.slug}` : null,
  ].filter((path): path is string => Boolean(path));

  return Promise.all(
    paths.map(async path => {
      const expectHidden =
        firstNonPublic && path === `/post/${firstNonPublic.slug}`;
      return checkRoute(baseUrl, path, expectHidden ? 404 : 200);
    })
  );
}

async function checkRoute(
  baseUrl: string,
  path: string,
  expectedStatus: number
): Promise<RouteCheck> {
  try {
    const response = await fetch(new URL(path, baseUrl), {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    return {
      path,
      state: "checked",
      status: response.status,
      ok: response.status === expectedStatus,
      contentType: response.headers.get("content-type"),
    };
  } catch (error) {
    return {
      path,
      state: "error",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function collectBlockers(input: {
  publicPosts: DiscoveryPost[];
  metadataIssues: string[];
  generatedAssets: PublishFreshnessReport["generatedAssets"];
  trackCoverage: PublishFreshnessReport["trackCoverage"];
  agentKnowledge: PublishFreshnessReport["agentKnowledge"];
  dateDrift: PublishFreshnessReport["dateDrift"];
  routeChecks: RouteCheck[];
  indexedPublicRowsCount: number;
}) {
  const blockers: string[] = [];

  if (input.publicPosts.length === 0)
    blockers.push("No public posts are available.");
  blockers.push(...input.metadataIssues.map(issue => `Metadata: ${issue}`));

  if (!input.generatedAssets.sitemap.ok) {
    blockers.push(
      `Sitemap mismatch: missing=[${input.generatedAssets.sitemap.missingPublicSlugs.join(", ")}], leaked=[${input.generatedAssets.sitemap.leakedNonPublicSlugs.join(", ")}]`
    );
  }
  if (!input.generatedAssets.rss.ok) {
    blockers.push(
      `RSS mismatch: missing=[${input.generatedAssets.rss.missingPublicSlugs.join(", ")}], leaked=[${input.generatedAssets.rss.leakedNonPublicSlugs.join(", ")}]`
    );
  }
  if (!input.generatedAssets.archive.ok) {
    blockers.push(
      `Archive mismatch: missing=[${input.generatedAssets.archive.missingPublicSlugs.join(", ")}]`
    );
  }
  if (!input.trackCoverage.ok) {
    blockers.push(
      `Track coverage mismatch: missing=[${input.trackCoverage.missingPublicSlugs.join(", ")}], primarySeries=[${input.trackCoverage.mismatchedPrimarySeriesSlugs.join(", ")}], unknown=[${input.trackCoverage.configuredUnknownSlugs.join(", ")}], nonPublic=[${input.trackCoverage.configuredNonPublicSlugs.join(", ")}]`
    );
  }
  if (!input.agentKnowledge.ok) {
    blockers.push(
      `Agent knowledge mismatch: ${input.agentKnowledge.indexedPublicPostCount}/${input.agentKnowledge.publicPostCount} public posts indexed, stale=[${input.agentKnowledge.stalePublicPostSlugs.join(", ")}], extra=[${input.agentKnowledge.extraIndexedPostSlugs.join(", ")}], nonPublic=[${input.agentKnowledge.nonPublicIndexedSlugs.join(", ")}]`
    );
  }
  if (input.indexedPublicRowsCount < input.publicPosts.length) {
    blockers.push(
      `Agent knowledge chunk count is implausible: ${input.indexedPublicRowsCount} public rows for ${input.publicPosts.length} public posts.`
    );
  }
  if (input.dateDrift?.publishedAtChanged.length) {
    blockers.push(
      `Publish date drift detected: ${input.dateDrift.publishedAtChanged.join(", ")}`
    );
  }
  if (input.dateDrift?.updatedAtChangedWithoutMaterialChange.length) {
    blockers.push(
      `Updated date drift without material changes: ${input.dateDrift.updatedAtChangedWithoutMaterialChange.join(", ")}`
    );
  }

  for (const route of input.routeChecks) {
    if (route.state === "checked" && !route.ok) {
      blockers.push(`Route ${route.path} returned ${route.status}`);
    } else if (route.state === "error") {
      blockers.push(`Route ${route.path} failed: ${route.error}`);
    }
  }

  return blockers;
}

async function collectGitState(
  cwd: string
): Promise<PublishFreshnessReport["git"]> {
  const [branch, commit, status] = await Promise.all([
    runGit(cwd, ["branch", "--show-current"]),
    runGit(cwd, ["rev-parse", "--short", "HEAD"]),
    runGit(cwd, ["status", "--short"]),
  ]);

  return {
    branch: branch.trim() || "detached",
    commit: commit.trim() || "unknown",
    dirty: status.trim().length > 0,
  };
}

async function runGit(cwd: string, args: string[]) {
  try {
    const result = await execFileAsync("git", args, { cwd });
    return result.stdout;
  } catch {
    return "";
  }
}

async function writeJson(path: string, value: unknown) {
  const outputPath = resolve(path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function isPublishedPublic(post: { status: string; visibility: string }) {
  return post.status === "published" && post.visibility === "public";
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function hashMaterial(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function bySlug(left: { slug: string }, right: { slug: string }) {
  return left.slug.localeCompare(right.slug);
}

function normalizeBaseUrl(value: string) {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  try {
    const publicPosts = await getPublicDiscoveryPosts();

    if (options.snapshotOnly) {
      const snapshot = await buildSnapshot(publicPosts);
      if (!options.outputPath) {
        throw new Error("--snapshot-only requires --output");
      }
      await writeJson(options.outputPath, snapshot);
      console.log(
        JSON.stringify(
          {
            status: "snapshot",
            output: options.outputPath,
            publicPosts: snapshot.publicPosts.length,
          },
          null,
          2
        )
      );
      return;
    }

    const report = await runPublishFreshness(options);
    if (options.outputPath) {
      await writeJson(options.outputPath, report);
    }

    console.log(
      JSON.stringify(
        {
          status: report.blockers.length === 0 ? "pass" : "blocked",
          output: options.outputPath,
          publicPosts: report.publicInventory.length,
          chunks: report.agentKnowledge.chunkCount,
          blockers: report.blockers,
        },
        null,
        2
      )
    );

    if (report.blockers.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await closeDb();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
