import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AuthRequiredState,
  EmptyState,
  LoadingState,
  MetricTile,
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
  Surface,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { isKnowledgeRefreshStale } from "@/lib/knowledgeRefresh";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { getContentHealthSummary } from "@shared/content-ops";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Globe2,
  ShieldCheck,
  Loader2,
  FileText,
  MessageSquareText,
  CheckCircle2,
  Download,
  Users,
  Save,
  X,
  Folder,
  Tags,
  Bot,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type PostVisibility = "hidden" | "admin" | "public";
type BacklogKind = "feedback" | "search_miss" | "agent_question";
type BacklogPriority = "high" | "normal";
type BacklogItem = {
  id: string;
  kind: BacklogKind;
  title: string;
  signalCount: number;
  status: string;
  priority: BacklogPriority;
  sourceHref: string | null;
  draftHref: string;
  latestAt: Date | string | null;
  evidence: string[];
};
type EngagementRadarSummary = {
  writingBacklog?: BacklogItem[];
  feedback?: { newCount?: number };
  searchMisses?: { uniqueQueries?: number };
};
type AgentQuestionRadarSummary = {
  summary?: {
    noSourceRuns?: number;
    failedRuns?: number;
  };
  suggestedIdeas?: Array<{
    ideaId: string;
    proposedTitle: string;
    rationale: string;
    supportCount: number;
    status?: string;
  }>;
};

const visibilityOptions: Array<{
  value: PostVisibility;
  labelKey: string;
  icon: LucideIcon;
}> = [
  { value: "hidden", labelKey: "manage.visibility.hidden", icon: EyeOff },
  { value: "admin", labelKey: "manage.visibility.admin", icon: ShieldCheck },
  { value: "public", labelKey: "manage.visibility.public", icon: Globe2 },
];

export default function Manage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [categoryDraft, setCategoryDraft] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [newTag, setNewTag] = useState({ name: "", slug: "" });
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [tagDraft, setTagDraft] = useState({ name: "", slug: "" });
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("manage.pageTitle"),
      description: t("manage.pageSubtitle"),
      path: "/manage",
      noindex: true,
    })
  );

  // 获取文章列表
  const {
    data: postsData,
    isLoading,
    isError: postsError,
    error: postsLoadError,
    refetch,
  } = trpc.posts.list.useQuery(
    {
      search: search || undefined,
      categorySlug: categorySlug === "all" ? undefined : categorySlug,
      limit: 50,
      includeUnpublished: true,
    },
    { enabled: isAdmin }
  );
  const utils = trpc.useUtils();
  const notifyPostMutation = useCallback(
    (result: unknown, successMessage: string) => {
      void utils.agent.adminKnowledgeStatus.invalidate();

      if (isKnowledgeRefreshStale(result)) {
        toast.warning(t("manage.toast.knowledgeRefreshStale"));
        return;
      }

      toast.success(successMessage);
    },
    [t, utils]
  );

  // 删除文章
  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: result => {
      notifyPostMutation(result, t("manage.toast.deleted"));
      refetch();
      setDeleteId(null);
    },
    onError: error => {
      toast.error(error.message || t("manage.toast.deleteFailed"));
    },
  });

  // 获取分类列表
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const categoriesMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);
  const { data: tagsData } = trpc.tags.list.useQuery();
  const { data: feedbackData, isLoading: feedbackLoading } =
    trpc.engagement.feedback.list.useQuery({ limit: 20 }, { enabled: isAdmin });
  const { data: subscribersData, isLoading: subscribersLoading } =
    trpc.engagement.subscribers.list.useQuery(undefined, { enabled: isAdmin });
  const {
    data: contentRadarData,
    isLoading: contentRadarLoading,
    isError: contentRadarError,
  } = trpc.engagement.contentRadar.summary.useQuery(undefined, {
    enabled: isAdmin,
  });
  const {
    data: agentRadarData,
    isLoading: agentRadarLoading,
    isError: agentRadarError,
  } = trpc.agent.adminQuestionRadar.useQuery(
    { limit: 50 },
    { enabled: isAdmin, retry: false }
  );

  // 切换发布状态
  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: result => {
      notifyPostMutation(result, t("manage.toast.statusUpdated"));
      refetch();
    },
    onError: error => {
      toast.error(error.message || t("manage.toast.updateFailed"));
    },
  });

  const markFeedbackReviewed =
    trpc.engagement.feedback.markReviewed.useMutation({
      onSuccess: () => {
        toast.success(t("manage.engagement.feedbackReviewed"));
        utils.engagement.feedback.list.invalidate();
        utils.engagement.contentRadar.summary.invalidate();
      },
      onError: error => {
        toast.error(
          error.message || t("manage.engagement.feedbackReviewFailed")
        );
      },
    });
  const updateFeedbackStatus =
    trpc.engagement.feedback.updateStatus.useMutation({
      onSuccess: () => {
        toast.success(t("manage.engagement.feedbackReviewed"));
        utils.engagement.feedback.list.invalidate();
        utils.engagement.contentRadar.summary.invalidate();
      },
      onError: error => {
        toast.error(
          error.message || t("manage.engagement.feedbackReviewFailed")
        );
      },
    });

  const contentHealth = useMemo(
    () => getContentHealthSummary((postsData?.posts ?? []) as any[]),
    [postsData?.posts]
  );
  const healthMetrics: Array<{
    labelKey: string;
    value: number;
    icon: LucideIcon;
    tone?: "neutral" | "warning";
  }> = [
    {
      labelKey: "manage.health.drafts",
      value: contentHealth.drafts,
      icon: FileText,
    },
    {
      labelKey: "manage.health.public",
      value: contentHealth.publishedPublic,
      icon: Globe2,
    },
    {
      labelKey: "manage.health.ownerOnly",
      value: contentHealth.ownerOnlyPreviews,
      icon: ShieldCheck,
    },
    {
      labelKey: "manage.health.hidden",
      value: contentHealth.hidden,
      icon: EyeOff,
      tone: "warning",
    },
    {
      labelKey: "manage.health.noExcerpt",
      value: contentHealth.missingExcerpt,
      icon: MessageSquareText,
      tone: "warning",
    },
    {
      labelKey: "manage.health.noCategory",
      value: contentHealth.missingCategory,
      icon: Folder,
      tone: "warning",
    },
    {
      labelKey: "manage.health.noTags",
      value: contentHealth.missingTags,
      icon: Tags,
      tone: "warning",
    },
    {
      labelKey: "manage.health.recent",
      value: contentHealth.updatedRecently,
      icon: CheckCircle2,
    },
  ];

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.categoryCreated"));
      setNewCategory({ name: "", slug: "", description: "" });
      utils.categories.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const updateCategoryMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.categoryUpdated"));
      setEditingCategoryId(null);
      utils.categories.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const deleteCategoryMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.categoryDeleted"));
      utils.categories.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.tagCreated"));
      setNewTag({ name: "", slug: "" });
      utils.tags.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const updateTagMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.tagUpdated"));
      setEditingTagId(null);
      utils.tags.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const deleteTagMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success(t("manage.taxonomy.tagDeleted"));
      utils.tags.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const togglePublish = (post: any) => {
    updateMutation.mutate({
      id: post.id,
      status: post.status === "published" ? "draft" : "published",
    });
  };

  const setVisibility = (post: any, visibility: PostVisibility) => {
    if (post.visibility === visibility) return;
    updateMutation.mutate({
      id: post.id,
      visibility,
    });
  };

  const exportSubscribers = () => {
    if (!subscribersData?.length) return;

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = subscribersData.map((subscriber: any) => [
      subscriber.email,
      subscriber.preferredLanguage ?? "",
      subscriber.interests ?? "",
      subscriber.status,
      subscriber.createdAt ? new Date(subscriber.createdAt).toISOString() : "",
    ]);
    const csv = [
      ["email", "preferred_language", "interests", "status", "created_at"],
      ...rows,
    ]
      .map(row => row.map(escapeCsv).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscribers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const beginCategoryEdit = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryDraft({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
  };

  const beginTagEdit = (tag: any) => {
    setEditingTagId(tag.id);
    setTagDraft({ name: tag.name, slug: tag.slug });
  };

  const renderVisibilityControl = (post: any) => (
    <div className="owner-segmented inline-grid grid-cols-3">
      {visibilityOptions.map(option => {
        const Icon = option.icon;
        const active = (post.visibility ?? "admin") === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={t(option.labelKey)}
            disabled={updateMutation.isPending}
            onClick={() => setVisibility(post, option.value)}
            className={`owner-segmented-item flex min-w-0 items-center justify-center gap-1.5 px-2 text-xs font-medium ${
              active ? "owner-segmented-item-active" : ""
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );

  // 未登录提示
  if (!authLoading && !isAdmin) {
    return (
      <AuthRequiredState
        icon={<FileText className="h-4 w-4" />}
        title={t("manage.pleaseLogin")}
        description={t("manage.loginRequired")}
        loginLabel={t("manage.loginBtn")}
        homeLabel={t("nav.home")}
        backLabel={t("manage.backLabel")}
      />
    );
  }

  // 加载中
  if (authLoading) {
    return (
      <div className="space-page grid min-h-screen place-items-center px-4">
        <SpaceBackdrop subtle />
        <LoadingState
          title={t("common.loadingNotes")}
          description={t("common.loadingHint")}
          className="relative z-10 w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="space-page owner-dark-scope">
      <SpaceBackdrop subtle />
      <SiteHeader
        active="manage"
        backHref="/"
        backLabel={t("manage.backLabel")}
        compact
      />

      <main className="owner-ops-page container relative z-10 px-4 py-8 sm:px-6">
        <div className="owner-ops-hero mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="signal-chip mb-5">
              <FileText className="h-4 w-4" />
              {t("manage.cmsLabel")}
            </div>
            <h2 className="display-title text-4xl leading-tight text-white">
              {t("manage.pageTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {t("manage.pageSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="owner-button border-primary/20 bg-slate-950/50 text-primary"
            >
              <Link href="/manage/agent">
                <Bot className="mr-2 h-4 w-4" />
                {t("agentOps.title")}
              </Link>
            </Button>
            <Button asChild className="owner-primary-action">
              <Link href="/write">
                <Plus className="mr-2 h-4 w-4" />
                {t("manage.writeArticle")}
              </Link>
            </Button>
          </div>
        </div>

        <Surface as="div" className="owner-command-strip mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("manage.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-primary/15 bg-slate-950/40 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={categorySlug} onValueChange={setCategorySlug}>
            <SelectTrigger className="w-full border-primary/15 bg-slate-950/40 text-white lg:w-[220px]">
              <SelectValue placeholder={t("manage.categoryFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("manage.categoryAll")}</SelectItem>
              {categoriesData?.map(category => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-slate-400">
            {t("manage.articleCount", { count: postsData?.total || 0 })}
          </div>
        </Surface>

        <section className="owner-dashboard-kpis owner-ops-kpi-strip mb-6">
          {healthMetrics.map(({ labelKey, value, icon: Icon, tone }) => (
            <MetricTile
              key={labelKey}
              icon={<Icon className="h-4 w-4" />}
              value={value}
              label={t(labelKey)}
              tone={tone}
            />
          ))}
        </section>

        {/* 文章列表 */}
        {isLoading ? (
          <LoadingState
            title={t("common.loadingNotes")}
            description={t("common.loadingHint")}
          />
        ) : postsError ? (
          <EmptyState
            icon={<FileText className="h-4 w-4" />}
            title={t("manage.loadFailed")}
            description={postsLoadError?.message || t("manage.loadFailedHint")}
            action={
              <Button
                type="button"
                variant="outline"
                className="owner-button"
                onClick={() => void refetch()}
              >
                {t("common.retry")}
              </Button>
            }
          />
        ) : postsData?.posts.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-4 w-4" />}
            title={t("manage.noArticles")}
            description={t("manage.noArticlesHint")}
            action={
              <Button asChild className="owner-primary-action">
                <Link href="/write">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("manage.writeArticle")}
                </Link>
              </Button>
            }
          />
        ) : (
          <section className="owner-ops-ledger">
            <div className="grid gap-3 md:hidden">
              {postsData?.posts.map(post => (
                <article key={post.id} className="owner-panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/post/${post.slug}`}
                        className="line-clamp-2 text-sm font-semibold leading-6 text-white hover:text-primary"
                      >
                        {post.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>
                          {categoriesMap.get(post.categoryId ?? 0) ||
                            t("common.uncategorized")}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(
                            language === "zh" ? "zh-CN" : "en-US"
                          )}
                        </span>
                        <span>·</span>
                        <span>
                          {post.viewCount} {t("manage.table.views")}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {post.status === "published"
                        ? t("manage.status.published")
                        : t("manage.status.draft")}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {renderVisibilityControl(post)}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="owner-button"
                      >
                        <Link href={`/post/${post.slug}`}>
                          {t("manage.action.view")}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="owner-button"
                      >
                        <Link href={`/write/${post.slug}`}>
                          {t("manage.action.edit")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="owner-button"
                        onClick={() => togglePublish(post)}
                      >
                        {post.status === "published"
                          ? t("manage.action.unpublish")
                          : t("manage.action.publish")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-400/25 bg-red-950/15 text-red-100 hover:bg-red-500/15"
                        onClick={() => setDeleteId(post.id)}
                      >
                        {t("manage.action.delete")}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="owner-table-wrap hidden md:block">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="w-[400px] text-slate-300">
                      {t("manage.table.title")}
                    </TableHead>
                    <TableHead className="text-slate-300">
                      {t("manage.table.category")}
                    </TableHead>
                    <TableHead className="text-slate-300">
                      {t("manage.table.status")}
                    </TableHead>
                    <TableHead className="min-w-[280px] text-slate-300">
                      {t("manage.table.visibility")}
                    </TableHead>
                    <TableHead className="text-slate-300">
                      {t("manage.table.views")}
                    </TableHead>
                    <TableHead className="text-slate-300">
                      {t("manage.table.createdAt")}
                    </TableHead>
                    <TableHead className="w-[70px] text-slate-300">
                      {t("manage.table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postsData?.posts.map(post => (
                    <TableRow
                      key={post.id}
                      className="border-primary/10 hover:bg-primary/5"
                    >
                      <TableCell>
                        <Link
                          href={`/post/${post.slug}`}
                          className="line-clamp-1 font-medium text-white hover:text-primary"
                        >
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {categoriesMap.get(post.categoryId ?? 0) || (
                          <span className="text-slate-500">
                            {t("common.uncategorized")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "published"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {post.status === "published"
                            ? t("manage.status.published")
                            : t("manage.status.draft")}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderVisibilityControl(post)}</TableCell>
                      <TableCell className="text-slate-300">
                        {post.viewCount}
                      </TableCell>
                      <TableCell>
                        {new Date(post.createdAt).toLocaleDateString(
                          language === "zh" ? "zh-CN" : "en-US"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("manage.table.actions")}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/post/${post.slug}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t("manage.action.view")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/write/${post.slug}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t("manage.action.edit")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => togglePublish(post)}
                            >
                              {post.status === "published" ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  {t("manage.action.unpublish")}
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("manage.action.publish")}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(post.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("manage.action.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section className="owner-ops-taxonomy mt-8 grid gap-6 xl:grid-cols-2">
          <Surface as="div">
            <SectionHeader
              icon={<Folder className="h-4 w-4" />}
              title={t("manage.taxonomy.categoriesTitle")}
            />
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
              <Input
                value={newCategory.name}
                onChange={e =>
                  setNewCategory(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("manage.taxonomy.name")}
                className="border-primary/15 bg-slate-950/40 text-white"
              />
              <Input
                value={newCategory.slug}
                onChange={e =>
                  setNewCategory(prev => ({ ...prev, slug: e.target.value }))
                }
                placeholder={t("manage.taxonomy.slug")}
                className="border-primary/15 bg-slate-950/40 text-white"
              />
              <Input
                value={newCategory.description}
                onChange={e =>
                  setNewCategory(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("manage.taxonomy.description")}
                className="border-primary/15 bg-slate-950/40 text-white"
              />
              <Button
                type="button"
                disabled={
                  !newCategory.name.trim() ||
                  !newCategory.slug.trim() ||
                  createCategory.isPending
                }
                onClick={() =>
                  createCategory.mutate({
                    name: newCategory.name.trim(),
                    slug: newCategory.slug.trim(),
                    description: newCategory.description.trim() || undefined,
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("common.create")}
              </Button>
            </div>
            <div className="grid gap-2">
              {categoriesData?.map(category => (
                <div
                  key={category.id}
                  className="rounded-lg border border-primary/10 bg-slate-950/30 p-3"
                >
                  {editingCategoryId === category.id ? (
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
                      <Input
                        value={categoryDraft.name}
                        onChange={e =>
                          setCategoryDraft(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        value={categoryDraft.slug}
                        onChange={e =>
                          setCategoryDraft(prev => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                      />
                      <Input
                        value={categoryDraft.description}
                        onChange={e =>
                          setCategoryDraft(prev => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          updateCategoryMutation.mutate({
                            id: category.id,
                            name: categoryDraft.name.trim(),
                            slug: categoryDraft.slug.trim(),
                            description:
                              categoryDraft.description.trim() || null,
                          })
                        }
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="owner-button"
                        onClick={() => setEditingCategoryId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {category.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          /{category.slug}
                        </p>
                        {category.description && (
                          <p className="mt-1 text-sm text-slate-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="owner-button"
                          onClick={() => beginCategoryEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                          {t("common.edit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-red-400/25 bg-red-950/15 text-red-100 hover:bg-red-500/15"
                          onClick={() => {
                            if (
                              window.confirm(
                                t("manage.taxonomy.deleteCategoryConfirm")
                              )
                            ) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Surface>

          <Surface as="div">
            <SectionHeader
              icon={<Tags className="h-4 w-4" />}
              title={t("manage.taxonomy.tagsTitle")}
            />
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                value={newTag.name}
                onChange={e =>
                  setNewTag(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("manage.taxonomy.name")}
                className="border-primary/15 bg-slate-950/40 text-white"
              />
              <Input
                value={newTag.slug}
                onChange={e =>
                  setNewTag(prev => ({ ...prev, slug: e.target.value }))
                }
                placeholder={t("manage.taxonomy.slug")}
                className="border-primary/15 bg-slate-950/40 text-white"
              />
              <Button
                type="button"
                disabled={
                  !newTag.name.trim() ||
                  !newTag.slug.trim() ||
                  createTag.isPending
                }
                onClick={() =>
                  createTag.mutate({
                    name: newTag.name.trim(),
                    slug: newTag.slug.trim(),
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("common.create")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsData?.map(tag => (
                <div
                  key={tag.id}
                  className="rounded-lg border border-primary/10 bg-slate-950/30 p-2"
                >
                  {editingTagId === tag.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="h-8 w-36"
                        value={tagDraft.name}
                        onChange={e =>
                          setTagDraft(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        className="h-8 w-36"
                        value={tagDraft.slug}
                        onChange={e =>
                          setTagDraft(prev => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        onClick={() =>
                          updateTagMutation.mutate({
                            id: tag.id,
                            name: tagDraft.name.trim(),
                            slug: tagDraft.slug.trim(),
                          })
                        }
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        className="owner-button"
                        onClick={() => setEditingTagId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2 text-sm text-white">
                        {tag.name}
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => beginTagEdit(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-200 hover:bg-red-500/15"
                        onClick={() => {
                          if (
                            window.confirm(
                              t("manage.taxonomy.deleteTagConfirm")
                            )
                          ) {
                            deleteTagMutation.mutate(tag.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Surface>
        </section>

        <WritingBacklogPanel
          loading={contentRadarLoading}
          radar={contentRadarData}
          agentRadar={agentRadarData}
          agentLoading={agentRadarLoading}
          hasError={contentRadarError || agentRadarError}
        />

        <ContentRadarPanel
          loading={contentRadarLoading}
          radar={contentRadarData}
        />

        <section className="owner-ops-engagement mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="owner-panel p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-white">
                  <MessageSquareText className="h-5 w-5 owner-icon-accent" />
                  <h3 className="text-lg font-semibold">
                    {t("manage.engagement.feedbackTitle")}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  {t("manage.engagement.feedbackDescription")}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                {t("manage.engagement.feedbackCount", {
                  count: feedbackData?.length ?? 0,
                })}
              </Badge>
            </div>

            {feedbackLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin owner-icon-accent" />
              </div>
            ) : feedbackData?.length ? (
              <div className="grid gap-3">
                {feedbackData.map((item: any) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-primary/10 bg-slate-950/30 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              item.type === "useful" ? "default" : "secondary"
                            }
                          >
                            {item.type === "useful"
                              ? t("manage.engagement.useful")
                              : t("manage.engagement.notUseful")}
                          </Badge>
                          <Badge
                            variant={
                              item.status === "new" ? "default" : "secondary"
                            }
                          >
                            {getFeedbackStatusLabel(item.status, t)}
                          </Badge>
                        </div>
                        <h4 className="line-clamp-1 text-sm font-semibold text-white">
                          {item.postTitle || t("manage.engagement.unknownPost")}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {item.message || t("manage.engagement.noMessage")}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.visitorName || t("manage.engagement.anonymous")}
                          {item.replyEmail
                            ? ` · ${maskEmail(item.replyEmail)}`
                            : ""}
                          {item.createdAt
                            ? ` · ${new Date(item.createdAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {item.postSlug && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="owner-button"
                          >
                            <Link href={`/post/${item.postSlug}`}>
                              {t("manage.action.view")}
                            </Link>
                          </Button>
                        )}
                        {item.status === "new" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="owner-button"
                            disabled={
                              markFeedbackReviewed.isPending ||
                              updateFeedbackStatus.isPending
                            }
                            onClick={() =>
                              markFeedbackReviewed.mutate({ id: item.id })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {t("manage.engagement.markReviewed")}
                          </Button>
                        )}
                        {item.status !== "hidden" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-300/20 bg-amber-950/15 text-amber-100 hover:bg-amber-500/15"
                            disabled={updateFeedbackStatus.isPending}
                            onClick={() =>
                              updateFeedbackStatus.mutate({
                                id: item.id,
                                status: "hidden",
                              })
                            }
                          >
                            <EyeOff className="h-4 w-4" />
                            {t("manage.engagement.markHidden")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-primary/10 bg-slate-950/25 py-10 text-center">
                <MessageSquareText className="mx-auto mb-3 h-8 w-8 owner-icon-accent" />
                <p className="text-sm text-slate-400">
                  {t("manage.engagement.feedbackEmpty")}
                </p>
              </div>
            )}
          </div>

          <div className="owner-panel p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 owner-icon-accent" />
                  <h3 className="text-lg font-semibold">
                    {t("manage.engagement.subscribersTitle")}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  {t("manage.engagement.subscribersDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="owner-button shrink-0"
                disabled={!subscribersData?.length}
                onClick={exportSubscribers}
              >
                <Download className="h-4 w-4" />
                {t("manage.engagement.export")}
              </Button>
            </div>

            {subscribersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin owner-icon-accent" />
              </div>
            ) : subscribersData?.length ? (
              <div className="grid gap-3">
                {subscribersData.slice(0, 8).map((subscriber: any) => (
                  <div
                    key={subscriber.id}
                    className="rounded-lg border border-primary/10 bg-slate-950/30 p-3"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {maskEmail(subscriber.email)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(subscriber.preferredLanguage || "-").toUpperCase()}
                      {subscriber.interests ? ` · ${subscriber.interests}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-primary/10 bg-slate-950/25 py-10 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 owner-icon-accent" />
                <p className="text-sm text-slate-400">
                  {t("manage.engagement.subscribersEmpty")}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("manage.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("manage.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("manage.deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("manage.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContentRadarPanel({
  loading,
  radar,
}: {
  loading: boolean;
  radar: any;
}) {
  const { language, t } = useLanguage();
  const opportunities = radar?.feedback?.opportunities ?? [];
  const topInterests = radar?.subscriptions?.topInterests ?? [];
  const languageBreakdown = radar?.subscriptions?.languageBreakdown ?? {
    zh: 0,
    en: 0,
    unknown: 0,
  };

  return (
    <section className="owner-panel mt-8 p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white">
            <Bot className="h-5 w-5 owner-icon-accent" />
            <h3 className="text-lg font-semibold">
              {t("manage.engagement.radarTitle")}
            </h3>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            {t("manage.engagement.radarDescription")}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-primary/20 text-primary"
        >
          {t("manage.engagement.deliveryStored")}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin owner-icon-accent" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div>
            <div className="mb-3 grid gap-3 md:grid-cols-4">
              <RadarMetric
                label={t("manage.engagement.radarNewFeedback")}
                value={String(radar?.feedback?.newCount ?? 0)}
              />
              <RadarMetric
                label={t("manage.engagement.radarNotUseful")}
                value={String(radar?.feedback?.notUsefulCount ?? 0)}
              />
              <RadarMetric
                label={t("manage.engagement.radarSubscribers")}
                value={String(radar?.subscriptions?.activeCount ?? 0)}
              />
              <RadarMetric
                label={t("manage.engagement.radarHidden")}
                value={String(radar?.feedback?.hiddenCount ?? 0)}
              />
            </div>
            <h4 className="mb-3 text-sm font-semibold text-white">
              {t("manage.engagement.opportunitiesTitle")}
            </h4>
            <div className="grid gap-3">
              {opportunities.length === 0 ? (
                <p className="rounded-lg border border-primary/10 bg-slate-950/25 p-4 text-sm text-slate-500">
                  {t("manage.engagement.opportunitiesEmpty")}
                </p>
              ) : (
                opportunities.map((item: any) => (
                  <article
                    key={item.postSlug || item.postId}
                    className="rounded-lg border border-primary/10 bg-slate-950/30 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h5 className="line-clamp-1 text-sm font-semibold text-white">
                          {item.postTitle}
                        </h5>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("manage.engagement.feedbackCount", {
                            count: item.total,
                          })}{" "}
                          · {t("manage.engagement.notUseful")} {item.notUseful}{" "}
                          · {t("manage.engagement.statusNew")} {item.newCount}
                        </p>
                        {item.sampleMessages?.length > 0 && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                            {item.sampleMessages[0]}
                          </p>
                        )}
                        {item.latestAt && (
                          <p className="mt-2 text-xs text-slate-500">
                            {t("manage.engagement.latestSignal")}:{" "}
                            {new Date(item.latestAt).toLocaleString(
                              language === "zh" ? "zh-CN" : "en-US"
                            )}
                          </p>
                        )}
                      </div>
                      {item.postSlug && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="owner-button shrink-0"
                        >
                          <Link href={`/post/${item.postSlug}`}>
                            {t("manage.action.view")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-primary/10 bg-slate-950/30 p-4">
            <h4 className="text-sm font-semibold text-white">
              {t("manage.engagement.subscriptionSummary")}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {t("manage.engagement.languageBreakdown", {
                zh: languageBreakdown.zh,
                en: languageBreakdown.en,
                unknown: languageBreakdown.unknown,
              })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topInterests.length > 0 ? (
                topInterests.map((item: any) => (
                  <Badge
                    key={item.phrase}
                    variant="outline"
                    className="border-primary/20 text-primary"
                  >
                    {item.phrase} · {item.count}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  {t("manage.engagement.noInterests")}
                </span>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {t("manage.engagement.deliveryDescription")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function WritingBacklogPanel({
  loading,
  radar,
  agentRadar,
  agentLoading,
  hasError,
}: {
  loading: boolean;
  radar?: EngagementRadarSummary;
  agentRadar?: AgentQuestionRadarSummary;
  agentLoading: boolean;
  hasError: boolean;
}) {
  const { language, t } = useLanguage();
  const engagementItems = radar?.writingBacklog ?? [];
  const agentItems: BacklogItem[] = (agentRadar?.suggestedIdeas ?? []).map(idea => ({
    id: idea.ideaId,
    kind: "agent_question",
    title: idea.proposedTitle,
    signalCount: idea.supportCount,
    status: idea.status ?? "new",
    priority: idea.supportCount > 1 ? "high" : "normal",
    sourceHref: "/manage/agent",
    draftHref: `/write?idea=${encodeURIComponent(idea.proposedTitle)}&source=agent_radar`,
    latestAt: null,
    evidence: [idea.rationale],
  }));
  const backlogItems = [...engagementItems, ...agentItems].slice(0, 10);
  const isLoading = loading || agentLoading;
  const noSourceCount = agentRadar?.summary?.noSourceRuns ?? 0;
  const failedCount = agentRadar?.summary?.failedRuns ?? 0;
  const hasAnyRadarData = Boolean(radar || agentRadar);

  return (
    <section className="owner-panel mt-8 p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white">
            <Lightbulb className="h-5 w-5 owner-icon-accent" />
            <h3 className="text-lg font-semibold">
              {t("manage.engagement.backlogTitle")}
            </h3>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            {t("manage.engagement.backlogDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary">
            {t("manage.engagement.backlogOwnerOnly")}
          </Badge>
          <Badge variant="outline" className="border-primary/20 text-primary">
            {t("manage.engagement.backlogPrivacy")}
          </Badge>
        </div>
      </div>

      {hasError && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
          {backlogItems.length > 0 || hasAnyRadarData
            ? t("manage.engagement.backlogPartial")
            : t("manage.engagement.backlogUnavailable")}
        </div>
      )}

      {hasAnyRadarData || !hasError ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <RadarMetric
            label={t("manage.engagement.backlogSignals")}
            value={String(backlogItems.length)}
          />
          <RadarMetric
            label={t("manage.engagement.radarNewFeedback")}
            value={String(radar?.feedback?.newCount ?? 0)}
          />
          <RadarMetric
            label={t("manage.engagement.radarSearchMisses")}
            value={String(radar?.searchMisses?.uniqueQueries ?? 0)}
          />
          <RadarMetric
            label={t("manage.engagement.backlogAgentGaps")}
            value={String(noSourceCount + failedCount)}
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin owner-icon-accent" />
        </div>
      ) : backlogItems.length === 0 ? (
        <div className="rounded-lg border border-primary/10 bg-slate-950/25 py-10 text-center">
          <Lightbulb className="mx-auto mb-3 h-8 w-8 owner-icon-accent" />
          <p className="text-sm text-slate-400">
            {hasError
              ? t("manage.engagement.backlogUnavailable")
              : t("manage.engagement.backlogEmpty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {backlogItems.map(item => (
            <article
              key={`${item.kind}:${item.id}`}
              className="rounded-lg border border-primary/10 bg-slate-950/30 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {getBacklogKindLabel(item.kind, t)}
                    </Badge>
                    <Badge
                      variant={item.priority === "high" ? "default" : "secondary"}
                    >
                      {getBacklogPriorityLabel(item.priority, t)}
                    </Badge>
                    <Badge variant="outline" className="border-primary/20">
                      {getBacklogStatusLabel(item.status, t)}
                    </Badge>
                  </div>
                  <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {getBacklogSourceLabel(item.kind, t)} ·{" "}
                    {t("manage.engagement.backlogSignalCount", {
                      count: item.signalCount,
                    })}
                    {formatBacklogLatestAt(item.latestAt, language)}
                  </p>
                  {item.evidence?.[0] && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                      {item.evidence[0]}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.sourceHref && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="owner-button"
                    >
                      <Link href={item.sourceHref}>
                        {t("manage.engagement.backlogInspect")}
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="owner-button"
                  >
                    <Link href={item.draftHref}>
                      {t("manage.engagement.backlogDraft")}
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {t("manage.engagement.backlogPersistenceNote")}
      </p>
    </section>
  );
}

function RadarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-slate-950/30 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function getFeedbackStatusLabel(status: string, t: (key: string) => string) {
  if (status === "hidden") return t("manage.engagement.statusHidden");
  if (status === "reviewed") return t("manage.engagement.statusReviewed");
  return t("manage.engagement.statusNew");
}

function getBacklogKindLabel(kind: string, t: (key: string) => string) {
  if (kind === "search_miss") return t("manage.engagement.backlogKindSearch");
  if (kind === "agent_question")
    return t("manage.engagement.backlogKindAgent");
  return t("manage.engagement.backlogKindFeedback");
}

function getBacklogPriorityLabel(priority: string, t: (key: string) => string) {
  if (priority === "high") return t("manage.engagement.backlogPriorityHigh");
  return t("manage.engagement.backlogPriorityNormal");
}

function getBacklogStatusLabel(status: string, t: (key: string) => string) {
  if (status === "planned") return t("manage.engagement.backlogStatusPlanned");
  if (status === "dismissed")
    return t("manage.engagement.backlogStatusDismissed");
  if (status === "reviewed")
    return t("manage.engagement.backlogStatusReviewed");
  return t("manage.engagement.backlogStatusNew");
}

function getBacklogSourceLabel(kind: BacklogKind, t: (key: string) => string) {
  if (kind === "search_miss") return t("manage.engagement.backlogSearchSource");
  if (kind === "agent_question")
    return t("manage.engagement.backlogAgentSource");
  return t("manage.engagement.backlogFeedbackSource");
}

function formatBacklogLatestAt(
  latestAt: Date | string | null,
  language: "en" | "zh"
) {
  if (!latestAt) return "";
  const locale = language === "zh" ? "zh-CN" : "en-US";
  return ` · ${new Date(latestAt).toLocaleString(locale)}`;
}

function maskEmail(email?: string | null) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${name.length > 2 ? "***" : "*"}@${domain}`;
}
