import { useAuth } from "@/_core/hooks/useAuth";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link as RouterLink, useParams, useLocation } from "wouter";
import { toast } from "sonner";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css";

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
          onClick={onClick}
          disabled={disabled}
          className={`p-2 rounded-md transition-all duration-150 ${
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
  return <div className="w-px h-6 bg-border mx-1" />;
}

export default function Editor() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ slug?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.slug;

  // 编辑器状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [postId, setPostId] = useState<number | null>(null);

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

  // 编辑器引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 数据查询
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: existingPost, isLoading: postLoading } = trpc.posts.getBySlug.useQuery(
    params.slug!,
    { enabled: isEditing }
  );

  // Mutations
  const createPost = trpc.posts.create.useMutation();
  const updatePost = trpc.posts.update.useMutation();
  const saveVersion = trpc.posts.saveVersion.useMutation();

  // 字数统计
  const wordCount = useMemo(() => {
    const text = content.replace(/[#*`\[\]()>\-_~|]/g, "").trim();
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = (text.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  }, [content]);

  // 预计阅读时间（假设每分钟阅读300字）
  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 300));
  }, [wordCount]);

  // 加载现有文章
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setExcerpt(existingPost.excerpt || "");
      setCategoryId(existingPost.categoryId);
      setCoverImage(existingPost.coverImage || "");
      setPostId(existingPost.id);
      if ((existingPost as any).tags) {
        setSelectedTags((existingPost as any).tags.map((t: { id: number }) => t.id));
      }
    }
  }, [existingPost]);

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
  const insertFormat = useCallback((prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      prefix + textToInsert + suffix + 
      content.substring(end);
    
    setContent(newContent);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 0);
  }, [content]);

  // 插入块级元素
  const insertBlock = useCallback((prefix: string, placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, lineStart) + 
      prefix + textToInsert + 
      content.substring(textarea.selectionEnd);
    
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newStart = lineStart + prefix.length;
      textarea.setSelectionRange(newStart, newStart + textToInsert.length);
    }, 0);
  }, [content]);

  // 插入代码块
  const insertCodeBlock = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = content.substring(start, textarea.selectionEnd);
    const codeBlock = `\n\`\`\`javascript\n${selectedText || "// 在此输入代码"}\n\`\`\`\n`;
    
    const newContent = 
      content.substring(0, start) + 
      codeBlock + 
      content.substring(textarea.selectionEnd);
    
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const codeStart = start + 15; // 跳过 \n```javascript\n
      textarea.setSelectionRange(codeStart, codeStart + (selectedText.length || 12));
    }, 0);
  }, [content]);

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
    const alt = imageAlt || "图片";
    const imageMarkdown = `\n![${alt}](${imageUrl})\n`;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = 
      content.substring(0, start) + 
      imageMarkdown + 
      content.substring(start);
    
    setContent(newContent);
    setImageUrl("");
    setImageAlt("");
    setShowImageDialog(false);
  }, [imageUrl, imageAlt, content]);

  // 保存草稿
  const handleSaveDraft = useCallback(async (silent = false) => {
    if (!title.trim()) {
      if (!silent) toast.error("请输入文章标题");
      return;
    }

    setIsSaving(true);
    try {
      if (postId) {
        // 更新现有文章
        await updatePost.mutateAsync({
          id: postId,
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          categoryId: categoryId || undefined,
          tagIds: selectedTags,
          coverImage: coverImage || undefined,
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
        });
        if (result) {
          setPostId(result.id);
        }
      }
      
      setLastSaved(new Date());
      if (!silent) toast.success("草稿已保存");
    } catch (error) {
      if (!silent) toast.error("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  }, [title, content, excerpt, categoryId, selectedTags, coverImage, postId, createPost, updatePost, saveVersion]);

  // 发布文章
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      toast.error("请输入文章标题");
      return;
    }
    if (!content.trim()) {
      toast.error("请输入文章内容");
      return;
    }

    setIsPublishing(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (postId) {
        await updatePost.mutateAsync({
          id: postId,
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          categoryId: categoryId || undefined,
          tagIds: selectedTags,
          coverImage: coverImage || undefined,
          status: "published",
        });
      } else {
        await createPost.mutateAsync({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          categoryId: categoryId || undefined,
          tagIds: selectedTags,
          coverImage: coverImage || undefined,
          status: "published",
        });
      }

      toast.success("文章已发布！");
      navigate("/");
    } catch (error) {
      toast.error("发布失败，请重试");
    } finally {
      setIsPublishing(false);
    }
  }, [title, content, excerpt, categoryId, selectedTags, coverImage, postId, createPost, updatePost, navigate]);

  // 同步滚动
  const handleEditorScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current || !showPreview) return;
    
    const editor = textareaRef.current;
    const preview = previewRef.current;
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
  }, [showPreview]);

  // 认证检查
  if (authLoading || postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先登录</h2>
          <p className="text-muted-foreground">登录后即可开始撰写文章</p>
          <a href={"/login"}>
            <Button>立即登录</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* 顶部工具栏 */}
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <RouterLink href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">返回</span>
            </Button>
          </RouterLink>
          
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            {lastSaved && (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span>已保存于 {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
            {isSaving && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>保存中...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 字数统计 */}
          <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground mr-2">
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              {wordCount} 字
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              约 {readingTime} 分钟
            </span>
          </div>

          <ToolbarButton
            onClick={() => setShowPreview(!showPreview)}
            active={showPreview}
            tooltip={showPreview ? "隐藏预览" : "显示预览"}
            shortcut="Ctrl+E"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            tooltip={isFullscreen ? "退出全屏" : "全屏模式"}
            shortcut="Esc"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolbarButton>

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>文章设置</SheetTitle>
                <SheetDescription>设置文章的分类、标签和其他属性</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* 摘要 */}
                <div className="space-y-2">
                  <Label>文章摘要</Label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="输入文章摘要，留空将自动截取正文前200字"
                    rows={3}
                  />
                </div>

                {/* 封面图 */}
                <div className="space-y-2">
                  <Label>封面图片</Label>
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="输入图片URL"
                  />
                  {coverImage && (
                    <img 
                      src={coverImage} 
                      alt="封面预览" 
                      className="w-full h-32 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                {/* 分类 */}
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={categoryId?.toString() || ""}
                    onValueChange={(v) => setCategoryId(v ? parseInt(v) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 标签 */}
                <div className="space-y-2">
                  <Label>标签</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedTags((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveDraft()}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">保存草稿</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发布
          </Button>
        </div>
      </header>

      {/* 格式工具栏 */}
      <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-1 overflow-x-auto shrink-0">
        <ToolbarButton onClick={() => insertBlock("# ", "标题")} tooltip="一级标题" shortcut="Ctrl+1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock("## ", "标题")} tooltip="二级标题" shortcut="Ctrl+2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock("### ", "标题")} tooltip="三级标题" shortcut="Ctrl+3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => insertFormat("**", "**", "粗体文本")} tooltip="粗体" shortcut="Ctrl+B">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("*", "*", "斜体文本")} tooltip="斜体" shortcut="Ctrl+I">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("~~", "~~", "删除文本")} tooltip="删除线">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("`", "`", "代码")} tooltip="行内代码">
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => insertBlock("- ", "列表项")} tooltip="无序列表">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock("1. ", "列表项")} tooltip="有序列表">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock("> ", "引用内容")} tooltip="引用">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("\n---\n", "")} tooltip="分隔线">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => setShowLinkDialog(true)} tooltip="插入链接" shortcut="Ctrl+K">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowImageDialog(true)} tooltip="插入图片">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertCodeBlock} tooltip="代码块">
          <FileText className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("$", "$", "E=mc^2")} tooltip="行内公式">
          <span className="text-xs font-mono">∑</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat("\n$$\n", "\n$$\n", "\\int_0^\\infty f(x)dx")} tooltip="公式块">
          <span className="text-xs font-mono">∫</span>
        </ToolbarButton>
      </div>

      {/* 主编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 编辑器 */}
        <div className={`flex flex-col ${showPreview ? "w-1/2 border-r border-border" : "w-full"}`}>
          {/* 标题输入 */}
          <div className="p-4 border-b border-border">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* 内容编辑 */}
          <div className="flex-1 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={handleEditorScroll}
              placeholder="开始撰写你的文章...

支持 Markdown 语法：
- # 一级标题
- ## 二级标题
- **粗体** 和 *斜体*
- `行内代码` 和 ```代码块```
- $行内公式$ 和 $$公式块$$
- [链接](url) 和 ![图片](url)
- > 引用
- - 列表"
              className="w-full h-full p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40"
              style={{ minHeight: "100%" }}
            />
          </div>
        </div>

        {/* 预览区域 */}
        {showPreview && (
          <div 
            ref={previewRef}
            className="w-1/2 overflow-y-auto bg-muted/20"
          >
            <div className="p-8 max-w-3xl mx-auto">
              {title && (
                <h1 className="text-3xl font-bold mb-6">{title}</h1>
              )}
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={{
                    pre: ({ children, ...props }) => (
                      <pre className="relative group" {...props}>
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content || "*开始撰写后，预览将显示在这里...*"}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        )}
      </div>

      {/* 链接对话框 */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
            <DialogDescription>输入链接地址和显示文本</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>链接文本</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="显示的文本"
              />
            </div>
            <div className="space-y-2">
              <Label>链接地址</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              取消
            </Button>
            <Button onClick={insertLink}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片对话框 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入图片</DialogTitle>
            <DialogDescription>输入图片地址</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>图片地址</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>替代文本</Label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="图片描述"
              />
            </div>
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={imageAlt || "预览"} 
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              取消
            </Button>
            <Button onClick={insertImage}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
