import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AuthRequiredState,
  LoadingState,
  SpaceBackdrop,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isKnowledgeRefreshStale } from "@/lib/knowledgeRefresh";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  ArrowLeft,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Send,
  Eye,
  EyeOff,
  X,
  Loader2,
  Settings,
  Maximize2,
  Minimize2,
  Check,
  Clock,
  FileText,
  Hash,
  Type,
  AlignLeft,
  History,
  RotateCcw,
  Star,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link as RouterLink, useParams, useLocation } from "wouter";
import { toast } from "sonner";

const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));

// 工具栏按钮组件
function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  tooltip,
  shortcut,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip: string;
  shortcut?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={tooltip}
          onClick={onClick}
          disabled={disabled}
          className={`rounded-md p-2 transition-all duration-150 ${
            active
              ? "bg-primary/15 text-primary shadow-[0_0_18px_oklch(0.72_0.16_235_/_0.18)]"
              : "text-slate-400 hover:bg-primary/10 hover:text-white"
          } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{tooltip}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// 分隔符组件
function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-primary/10" />;
}

export default function Editor() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const params = useParams<{ slug?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.slug;
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: isEditing ? t("editor.editPost") : t("editor.newPost"),
      description: t("editor.authDescription"),
      path: params.slug ? `/write/${params.slug}` : "/write",
      noindex: true,
    })
  );

  // 编辑器状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [postId, setPostId] = useState<number | null>(null);
  const [seriesSlug, setSeriesSlug] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesOrder, setSeriesOrder] = useState("");
  const [featuredRank, setFeaturedRank] = useState("");
  const [pinnedTrack, setPinnedTrack] = useState<
    "none" | "algorithms" | "applications"
  >("none");

  // UI状态
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const seededFromBacklogRef = useRef(false);

  // 编辑器引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 数据查询
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: existingPost, isLoading: postLoading } =
    trpc.posts.getBySlug.useQuery(params.slug!, { enabled: isEditing });
  const utils = trpc.useUtils();
  const { data: versions } = trpc.posts.getVersions.useQuery(postId ?? 0, {
    enabled: Boolean(postId),
  });
  const notifyKnowledgeRefresh = useCallback(
    (result: unknown, silent = false) => {
      void utils.agent.adminKnowledgeStatus.invalidate();
      const isStale = isKnowledgeRefreshStale(result);

      if (isStale && !silent) {
        toast.warning(t("editor.toast.knowledgeRefreshStale"));
      }

      return isStale;
    },
    [t, utils]
  );

  // Mutations
  const createPost = trpc.posts.create.useMutation();
  const updatePost = trpc.posts.update.useMutation();
  const saveVersion = trpc.posts.saveVersion.useMutation();
  const restoreVersion = trpc.posts.restoreVersion.useMutation();

  // 字数统计
  const wordCount = useMemo(() => {
    const text = content.replace(/[#*`\[\]()>-_~|]/g, "").trim();
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = (text.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  }, [content]);

  // 预计阅读时间（假设每分钟阅读300字）
  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 300));
  }, [wordCount]);

  const equationCount = useMemo(() => {
    return (content.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || []).length;
  }, [content]);

  const codeBlockCount = useMemo(() => {
    return Math.floor((content.match(/```/g) || []).length / 2);
  }, [content]);

  // 加载现有文章
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setExcerpt(existingPost.excerpt || "");
      setCategoryId(existingPost.categoryId);
      setCoverImage(existingPost.coverImage || "");
      setPostId(existingPost.id);
      setSeriesSlug((existingPost as any).seriesSlug || "");
      setSeriesTitle((existingPost as any).seriesTitle || "");
      setSeriesOrder(
        (existingPost as any).seriesOrder == null
          ? ""
          : String((existingPost as any).seriesOrder)
      );
      setFeaturedRank(
        (existingPost as any).featuredRank == null
          ? ""
          : String((existingPost as any).featuredRank)
      );
      setPinnedTrack(
        ((existingPost as any).pinnedTrack as
          | "algorithms"
          | "applications"
          | null) || "none"
      );
      if ((existingPost as any).tags) {
        setSelectedTags(
          (existingPost as any).tags.map((t: { id: number }) => t.id)
        );
      }
    }
  }, [existingPost]);

  useEffect(() => {
    if (isEditing || seededFromBacklogRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const idea = params.get("idea")?.trim();
    if (!idea) return;

    const source = params.get("source")?.trim() || "backlog";
    seededFromBacklogRef.current = true;
    setTitle(current => current || idea.slice(0, 120));
    setContent(current => {
      if (current.trim()) return current;
      return [
        `# ${idea}`,
        "",
        `> ${t("editor.backlogSeed.source")}: ${source}`,
        "",
        `## ${t("editor.backlogSeed.readerQuestion")}`,
        "",
        idea,
        "",
        `## ${t("editor.backlogSeed.claim")}`,
        "",
        "",
        `## ${t("editor.backlogSeed.evidence")}`,
        "",
        "",
        `## ${t("editor.backlogSeed.caveats")}`,
        "",
      ].join("\n");
    });
    setExcerpt(current => current || idea.slice(0, 200));
  }, [isEditing, t]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const preferEditorOnMobile = () => {
      if (mobileQuery.matches) setShowPreview(false);
    };

    preferEditorOnMobile();
    mobileQuery.addEventListener("change", preferEditorOnMobile);
    return () => {
      mobileQuery.removeEventListener("change", preferEditorOnMobile);
    };
  }, []);

  const buildCurationPayload = useCallback(
    () => ({
      seriesSlug: seriesSlug.trim() || null,
      seriesTitle: seriesTitle.trim() || null,
      seriesOrder: seriesOrder.trim() ? Number(seriesOrder) : null,
      featuredRank: featuredRank.trim() ? Number(featuredRank) : null,
      pinnedTrack: pinnedTrack === "none" ? null : pinnedTrack,
    }),
    [featuredRank, pinnedTrack, seriesOrder, seriesSlug, seriesTitle]
  );

  // 自动保存（每30秒）
  useEffect(() => {
    if (!postId || !content) return;

    const timer = setInterval(() => {
      handleSaveDraft(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [postId, content, title]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            handleSaveDraft();
            break;
          case "b":
            e.preventDefault();
            insertFormat("**", "**");
            break;
          case "i":
            e.preventDefault();
            insertFormat("*", "*");
            break;
          case "k":
            e.preventDefault();
            setShowLinkDialog(true);
            break;
          case "e":
            e.preventDefault();
            setShowPreview(!showPreview);
            break;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "p":
            e.preventDefault();
            handlePublish();
            break;
        }
      }
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreview, isFullscreen, content, title]);

  // 插入格式
  const insertFormat = useCallback(
    (prefix: string, suffix: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newContent =
        content.substring(0, start) +
        prefix +
        textToInsert +
        suffix +
        content.substring(end);

      setContent(newContent);

      // 设置光标位置
      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length + textToInsert.length
          );
        } else {
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length + placeholder.length
          );
        }
      }, 0);
    },
    [content]
  );

  // 插入块级元素
  const insertBlock = useCallback(
    (prefix: string, placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const selectedText = content.substring(
        textarea.selectionStart,
        textarea.selectionEnd
      );
      const textToInsert = selectedText || placeholder;

      const newContent =
        content.substring(0, lineStart) +
        prefix +
        textToInsert +
        content.substring(textarea.selectionEnd);

      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const newStart = lineStart + prefix.length;
        textarea.setSelectionRange(newStart, newStart + textToInsert.length);
      }, 0);
    },
    [content]
  );

  // 插入代码块
  const insertCodeBlock = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = content.substring(start, textarea.selectionEnd);
    const codeBlock = `\n\`\`\`javascript\n${selectedText || t("editor.codeBlockPlaceholder")}\n\`\`\`\n`;

    const newContent =
      content.substring(0, start) +
      codeBlock +
      content.substring(textarea.selectionEnd);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const codeStart = start + 15; // 跳过 \n```javascript\n
      textarea.setSelectionRange(
        codeStart,
        codeStart +
          (selectedText.length || t("editor.codeBlockPlaceholder").length)
      );
    }, 0);
  }, [content, t]);

  const insertSnippet = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const nextContent =
        content.substring(0, start) +
        snippet +
        content.substring(textarea.selectionEnd);

      setContent(nextContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + snippet.length,
          start + snippet.length
        );
      }, 0);
    },
    [content]
  );

  const researchSnippets = useMemo(
    () => [
      {
        label: t("editor.snippet.claim"),
        hint: t("editor.snippet.claimHint"),
        value: "\n\n> **Claim.** \n>\n> **Evidence.** \n>\n> **Caveat.** \n",
      },
      {
        label: t("editor.snippet.theorem"),
        hint: t("editor.snippet.theoremHint"),
        value: "\n\n### Theorem\n\n**Statement.** \n\n**Proof sketch.** \n",
      },
      {
        label: t("editor.snippet.proposition"),
        hint: t("editor.snippet.propositionHint"),
        value:
          "\n\n### Proposition\n\n**Assumptions.** \n\n**Result.** \n\n**Why it matters.** \n",
      },
      {
        label: t("editor.snippet.experiment"),
        hint: t("editor.snippet.experimentHint"),
        value:
          "\n\n### Experiment\n\n- **Setup:** \n- **Metric:** \n- **Result:** \n- **Interpretation:** \n",
      },
      {
        label: t("editor.snippet.formula"),
        hint: t("editor.snippet.formulaHint"),
        value: "\n\n$$\n\n$$\n",
      },
      {
        label: t("editor.snippet.figure"),
        hint: t("editor.snippet.figureHint"),
        value: "\n\n![Figure description](https://)\n\n*Figure.* \n",
      },
    ],
    [t]
  );

  // 插入链接
  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    insertFormat(`[${text}](`, ")", linkUrl);
    setLinkUrl("");
    setLinkText("");
    setShowLinkDialog(false);
  }, [linkUrl, linkText, insertFormat]);

  // 插入图片
  const insertImage = useCallback(() => {
    if (!imageUrl) return;
    const alt = imageAlt || t("editor.imagePreview");
    const imageMarkdown = `\n![${alt}](${imageUrl})\n`;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent =
      content.substring(0, start) + imageMarkdown + content.substring(start);

    setContent(newContent);
    setImageUrl("");
    setImageAlt("");
    setShowImageDialog(false);
  }, [imageUrl, imageAlt, content, t]);

  // 保存草稿
  const handleSaveDraft = useCallback(
    async (silent = false) => {
      if (!title.trim()) {
        if (!silent) toast.error(t("editor.toast.titleRequired"));
        return;
      }

      setIsSaving(true);
      try {
        let saveResult: unknown;

        if (postId) {
          // 更新现有文章
          saveResult = await updatePost.mutateAsync({
            id: postId,
            title,
            content,
            excerpt: excerpt || content.substring(0, 200),
            categoryId: categoryId || undefined,
            tagIds: selectedTags,
            coverImage: coverImage || undefined,
            ...buildCurationPayload(),
          });
          // 保存版本
          await saveVersion.mutateAsync({
            postId,
            content,
          });
        } else {
          // 创建新文章
          const slug = title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "");

          const result = await createPost.mutateAsync({
            title,
            content,
            excerpt: excerpt || content.substring(0, 200),
            slug,
            categoryId: categoryId || undefined,
            tagIds: selectedTags,
            coverImage: coverImage || undefined,
            status: "draft",
            visibility: "admin",
            ...buildCurationPayload(),
          });
          if (result) {
            setPostId(result.id);
          }
          saveResult = result;
        }

        setLastSaved(new Date());
        const isStale = notifyKnowledgeRefresh(saveResult, silent);
        if (!silent && !isStale) toast.success(t("editor.toast.draftSaved"));
      } catch (error) {
        if (!silent) toast.error(t("editor.toast.saveFailed"));
      } finally {
        setIsSaving(false);
      }
    },
    [
      title,
      content,
      excerpt,
      categoryId,
      selectedTags,
      coverImage,
      postId,
      createPost,
      updatePost,
      saveVersion,
      buildCurationPayload,
      notifyKnowledgeRefresh,
      t,
    ]
  );

  // 发布文章
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      toast.error(t("editor.toast.titleRequired"));
      return;
    }
    if (!content.trim()) {
      toast.error(t("editor.toast.contentRequired"));
      return;
    }

    setIsPublishing(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");

      let publishResult: unknown;
      if (postId) {
        publishResult = await updatePost.mutateAsync({
          id: postId,
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          categoryId: categoryId || undefined,
          tagIds: selectedTags,
          coverImage: coverImage || undefined,
          status: "published",
          visibility: "public",
          ...buildCurationPayload(),
        });
      } else {
        publishResult = await createPost.mutateAsync({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          categoryId: categoryId || undefined,
          tagIds: selectedTags,
          coverImage: coverImage || undefined,
          status: "published",
          visibility: "public",
          ...buildCurationPayload(),
        });
      }

      const isStale = notifyKnowledgeRefresh(publishResult);
      if (!isStale) toast.success(t("editor.toast.published"));
      navigate("/");
    } catch (error) {
      toast.error(t("editor.toast.publishFailed"));
    } finally {
      setIsPublishing(false);
    }
  }, [
    title,
    content,
    excerpt,
    categoryId,
    selectedTags,
    coverImage,
    postId,
    createPost,
    updatePost,
    buildCurationPayload,
    navigate,
    notifyKnowledgeRefresh,
    t,
  ]);

  const handleRestoreVersion = useCallback(
    async (version: { id: number; title: string; content: string }) => {
      if (!postId) return;
      if (!window.confirm(t("editor.versionRestoreConfirm"))) return;

      try {
        const result = await restoreVersion.mutateAsync({
          postId,
          versionId: version.id,
          saveCurrent: true,
        });
        setTitle(version.title);
        setContent(version.content);
        await utils.posts.getVersions.invalidate(postId);
        const isStale = notifyKnowledgeRefresh(result);
        if (!isStale) toast.success(t("editor.toast.versionRestored"));
      } catch {
        toast.error(t("editor.toast.versionRestoreFailed"));
      }
    },
    [notifyKnowledgeRefresh, postId, restoreVersion, t, utils]
  );

  // 同步滚动
  const handleEditorScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current || !showPreview) return;

    const editor = textareaRef.current;
    const preview = previewRef.current;
    const scrollPercentage =
      editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop =
      scrollPercentage * (preview.scrollHeight - preview.clientHeight);
  }, [showPreview]);

  // 认证检查
  if (authLoading || postLoading) {
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

  if (!isAdmin) {
    return (
      <AuthRequiredState
        icon={<FileText className="h-4 w-4" />}
        title={t("editor.authRequired")}
        description={t("editor.authDescription")}
        loginLabel={t("editor.goToLogin")}
        homeLabel={t("nav.home")}
        backLabel={t("nav.back")}
      />
    );
  }

  return (
    <TooltipProvider>
      <div
        className={`owner-editor-shell owner-dark-scope relative flex min-h-screen flex-col overflow-hidden text-slate-100 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      >
        <SpaceBackdrop subtle />
        {/* 顶部工具栏 */}
        <header className="owner-toolbar relative z-10 flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-4">
            <RouterLink href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-300 hover:bg-primary/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("editor.back")}</span>
              </Button>
            </RouterLink>

            <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex">
              {lastSaved && (
                <>
                  <Check className="h-3.5 w-3.5 owner-icon-accent" />
                  <span>
                    {t("editor.savedAt")} {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              )}
              {isSaving && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("editor.saving")}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 字数统计 */}
            <div className="mr-2 hidden items-center gap-3 text-sm text-slate-400 sm:flex">
              <span className="flex items-center gap-1">
                <Type className="h-3.5 w-3.5" />
                {wordCount} {t("editor.wordCount")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("editor.readingTimeApprox", { time: readingTime })}
              </span>
              <span className="hidden items-center gap-1 lg:flex">
                <Hash className="h-3.5 w-3.5" />
                {equationCount} {t("editor.equationCount")}
              </span>
              <span className="hidden items-center gap-1 lg:flex">
                <Code className="h-3.5 w-3.5" />
                {codeBlockCount} {t("editor.codeBlockCount")}
              </span>
            </div>

            <ToolbarButton
              onClick={() => setShowPreview(!showPreview)}
              active={showPreview}
              tooltip={
                showPreview
                  ? t("editor.togglePreviewHide")
                  : t("editor.togglePreviewShow")
              }
              shortcut="Ctrl+E"
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              tooltip={
                isFullscreen
                  ? t("editor.exitFullscreen")
                  : t("editor.enterFullscreen")
              }
              shortcut="Esc"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </ToolbarButton>

            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("editor.settingsTitle")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] border-primary/15 bg-slate-950 text-slate-100 sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>{t("editor.settingsTitle")}</SheetTitle>
                  <SheetDescription>
                    {t("editor.settingsDescription")}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* 摘要 */}
                  <div className="space-y-2">
                    <Label>{t("editor.excerptLabel")}</Label>
                    <Textarea
                      value={excerpt}
                      onChange={e => setExcerpt(e.target.value)}
                      placeholder={t("editor.excerptPlaceholder")}
                      rows={3}
                    />
                  </div>

                  {/* 封面图 */}
                  <div className="space-y-2">
                    <Label>{t("editor.coverImageLabel")}</Label>
                    <Input
                      value={coverImage}
                      onChange={e => setCoverImage(e.target.value)}
                      placeholder={t("editor.coverImagePlaceholder")}
                    />
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={t("editor.coverPreview")}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 640px) 480px, calc(100vw - 48px)"
                        className="w-full h-32 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>

                  {/* 分类 */}
                  <div className="space-y-2">
                    <Label>{t("editor.categoryLabel")}</Label>
                    <Select
                      value={categoryId?.toString() || ""}
                      onValueChange={v => setCategoryId(v ? parseInt(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("editor.categoryPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 标签 */}
                  <div className="space-y-2">
                    <Label>{t("editor.tagsLabel")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags?.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.id)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedTags(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-primary/10 bg-slate-950/35 p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 owner-icon-accent" />
                      <Label>{t("editor.curationTitle")}</Label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={seriesSlug}
                        onChange={e => setSeriesSlug(e.target.value)}
                        placeholder={t("editor.seriesSlugPlaceholder")}
                      />
                      <Input
                        value={seriesTitle}
                        onChange={e => setSeriesTitle(e.target.value)}
                        placeholder={t("editor.seriesTitlePlaceholder")}
                      />
                      <Input
                        type="number"
                        value={seriesOrder}
                        onChange={e => setSeriesOrder(e.target.value)}
                        placeholder={t("editor.seriesOrderPlaceholder")}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={featuredRank}
                        onChange={e => setFeaturedRank(e.target.value)}
                        placeholder={t("editor.featuredRankPlaceholder")}
                      />
                    </div>
                    <Select
                      value={pinnedTrack}
                      onValueChange={value =>
                        setPinnedTrack(
                          value as "none" | "algorithms" | "applications"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("editor.pinnedTrackPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("editor.pinnedTrackNone")}
                        </SelectItem>
                        <SelectItem value="algorithms">
                          {t("home.algorithmsLabel")}
                        </SelectItem>
                        <SelectItem value="applications">
                          {t("home.applicationsLabel")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {postId && (
                    <div className="space-y-3 rounded-lg border border-primary/10 bg-slate-950/35 p-4">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 owner-icon-accent" />
                        <Label>{t("editor.versionHistoryTitle")}</Label>
                      </div>
                      {versions?.length ? (
                        <div className="grid gap-2">
                          {versions.slice(0, 8).map(version => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between gap-3 rounded-md border border-primary/10 bg-slate-950/40 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {version.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(version.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="owner-button shrink-0"
                                disabled={restoreVersion.isPending}
                                onClick={() => handleRestoreVersion(version)}
                              >
                                <RotateCcw className="h-4 w-4" />
                                {t("editor.versionRestore")}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {t("editor.versionHistoryEmpty")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveDraft()}
              disabled={isSaving}
              className="owner-button gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t("editor.saveDraft")}</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-2 owner-primary-action"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("editor.publish")}
            </Button>
          </div>
        </header>

        {/* 格式工具栏 */}
        <div className="owner-toolbar relative z-10 flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b px-4">
          <ToolbarButton
            onClick={() => insertBlock("# ", t("editor.placeholder.heading"))}
            tooltip={t("editor.toolbar.heading1")}
            shortcut="Ctrl+1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertBlock("## ", t("editor.placeholder.heading"))}
            tooltip={t("editor.toolbar.heading2")}
            shortcut="Ctrl+2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertBlock("### ", t("editor.placeholder.heading"))}
            tooltip={t("editor.toolbar.heading3")}
            shortcut="Ctrl+3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() =>
              insertFormat("**", "**", t("editor.placeholder.bold"))
            }
            tooltip={t("editor.toolbar.bold")}
            shortcut="Ctrl+B"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              insertFormat("*", "*", t("editor.placeholder.italic"))
            }
            tooltip={t("editor.toolbar.italic")}
            shortcut="Ctrl+I"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              insertFormat("~~", "~~", t("editor.placeholder.strikethrough"))
            }
            tooltip={t("editor.toolbar.strikethrough")}
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertFormat("`", "`", t("editor.placeholder.code"))}
            tooltip={t("editor.toolbar.inlineCode")}
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => insertBlock("- ", t("editor.placeholder.listItem"))}
            tooltip={t("editor.toolbar.bulletList")}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertBlock("1. ", t("editor.placeholder.listItem"))}
            tooltip={t("editor.toolbar.orderedList")}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertBlock("> ", t("editor.placeholder.quote"))}
            tooltip={t("editor.toolbar.quote")}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertFormat("\n---\n", "")}
            tooltip={t("editor.toolbar.divider")}
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => setShowLinkDialog(true)}
            tooltip={t("editor.toolbar.link")}
            shortcut="Ctrl+K"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowImageDialog(true)}
            tooltip={t("editor.toolbar.image")}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertCodeBlock}
            tooltip={t("editor.toolbar.codeBlock")}
          >
            <FileText className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => insertFormat("$", "$", "E=mc^2")}
            tooltip={t("editor.toolbar.inlineMath")}
          >
            <span className="text-xs font-mono">∑</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              insertFormat("\n$$\n", "\n$$\n", "\\int_0^\\infty f(x)dx")
            }
            tooltip={t("editor.toolbar.mathBlock")}
          >
            <span className="text-xs font-mono">∫</span>
          </ToolbarButton>
        </div>

        {/* 主编辑区域 */}
        <div className="owner-writer-workbench relative z-10 flex flex-1 overflow-hidden">
          <aside className="owner-editor-pane hidden w-64 shrink-0 border-r p-4 xl:block">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">
                {t("editor.snippetsTitle")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {t("editor.snippetsDescription")}
              </p>
            </div>
            <div className="space-y-2">
              {researchSnippets.map(snippet => (
                <button
                  key={snippet.label}
                  type="button"
                  onClick={() => insertSnippet(snippet.value)}
                  className="w-full rounded-lg border border-primary/10 bg-slate-950/45 px-3 py-2 text-left transition-colors hover:border-primary/45 hover:bg-primary/10"
                >
                  <span className="block text-sm font-medium text-white">
                    {snippet.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {snippet.hint}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-primary/10 pt-4 text-xs text-slate-400">
              <div className="flex items-center justify-between py-1">
                <span>{t("editor.statEquations")}</span>
                <span className="font-mono text-white">{equationCount}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>{t("editor.statCodeBlocks")}</span>
                <span className="font-mono text-white">{codeBlockCount}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>{t("editor.statReadingTime")}</span>
                <span className="font-mono text-white">
                  {readingTime} {t("editor.readingTime")}
                </span>
              </div>
            </div>
          </aside>

          {/* 编辑器 */}
          <div
            className={`owner-writer-source min-w-0 flex flex-col ${showPreview ? "flex-1 border-r border-primary/10" : "w-full"}`}
          >
            {/* 标题输入 */}
            <div className="owner-editor-pane border-b p-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t("editor.titlePlaceholder")}
                className="owner-editor-title-input w-full bg-transparent text-2xl font-semibold leading-tight outline-none placeholder:text-slate-500"
              />
            </div>

            {/* 内容编辑 */}
            <div className="owner-editor-content-shell flex-1 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder={t("editor.contentPlaceholder")}
                className="owner-editor-textarea h-full w-full resize-none border-none p-5 font-mono text-sm leading-7 outline-none placeholder:text-slate-600"
                style={{ minHeight: "100%" }}
              />
            </div>
          </div>

          {/* 预览区域 */}
          {showPreview && (
            <div
              ref={previewRef}
              className="owner-editor-preview owner-writer-preview min-w-0 flex-1 overflow-y-auto"
            >
              <div className="mx-auto max-w-3xl p-8">
                {title && (
                  <h1 className="mb-6 text-3xl font-semibold leading-tight text-white">
                    {title}
                  </h1>
                )}
                <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-primary">
                  <Suspense
                    fallback={
                      <div className="h-24 animate-pulse rounded-lg bg-slate-800/40" />
                    }
                  >
                    <MarkdownRenderer
                      content={content || `*${t("editor.previewPlaceholder")}*`}
                    />
                  </Suspense>
                </article>
              </div>
            </div>
          )}
        </div>

        {/* 链接对话框 */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="border-primary/15 bg-slate-950 text-slate-100">
            <DialogHeader>
              <DialogTitle>{t("editor.linkDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("editor.linkDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("editor.linkTextLabel")}</Label>
                <Input
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder={t("editor.linkTextPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("editor.linkUrlLabel")}</Label>
                <Input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder={t("editor.linkUrlPlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLinkDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={insertLink}>{t("editor.linkInsert")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 图片对话框 */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="border-primary/15 bg-slate-950 text-slate-100">
            <DialogHeader>
              <DialogTitle>{t("editor.imageDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("editor.imageDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("editor.imageUrlLabel")}</Label>
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder={t("editor.imageUrlPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("editor.imageAltLabel")}</Label>
                <Input
                  value={imageAlt}
                  onChange={e => setImageAlt(e.target.value)}
                  placeholder={t("editor.imageAltPlaceholder")}
                />
              </div>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={imageAlt || t("editor.imagePreview")}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 640px) 480px, calc(100vw - 48px)"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowImageDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={insertImage}>{t("editor.imageInsert")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
