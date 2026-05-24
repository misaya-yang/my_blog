import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type PostVisibility = "hidden" | "admin" | "public";

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
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 获取文章列表
  const {
    data: postsData,
    isLoading,
    refetch,
  } = trpc.posts.list.useQuery({
    search: search || undefined,
    limit: 50,
    includeUnpublished: true,
  });

  // 删除文章
  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success(t("manage.toast.deleted"));
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || t("manage.toast.deleteFailed"));
    },
  });

  // 获取分类列表
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const categoriesMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);

  // 切换发布状态
  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success(t("manage.toast.statusUpdated"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || t("manage.toast.updateFailed"));
    },
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

  // 未登录提示
  if (!authLoading && !isAdmin) {
    return (
      <div className="space-page flex items-center justify-center">
        <SpaceBackdrop subtle />
        <div className="glass-panel relative z-10 space-y-4 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">{t("manage.pleaseLogin")}</h2>
          <p className="text-slate-400">{t("manage.loginRequired")}</p>
          <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
            <a href={"/login"}>{t("manage.loginBtn")}</a>
          </Button>
        </div>
      </div>
    );
  }

  // 加载中
  if (authLoading) {
    return (
      <div className="space-page flex items-center justify-center">
        <SpaceBackdrop subtle />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin text-sky-300" />
      </div>
    );
  }

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="write" backHref="/" backLabel={t("manage.backLabel")} compact />

      <main className="container relative z-10 px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="signal-chip mb-5">
              <FileText className="h-4 w-4" />
              {t("manage.cmsLabel")}
            </div>
            <h2 className="font-serif text-4xl font-semibold text-white">{t("manage.pageTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {t("manage.pageSubtitle")}
            </p>
          </div>

          <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
            <Link href="/write">
              <Plus className="mr-2 h-4 w-4" />
              {t("manage.writeArticle")}
            </Link>
          </Button>
        </div>

        <div className="glass-panel mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("manage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-sky-200/15 bg-slate-950/40 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="text-sm text-slate-400">
            {t("manage.articleCount", { count: postsData?.total || 0 })}
          </div>
        </div>

        {/* 文章列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
          </div>
        ) : postsData?.posts.length === 0 ? (
          <div className="glass-panel py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-sky-300" />
            <h3 className="mb-2 text-lg font-medium text-white">{t("manage.noArticles")}</h3>
            <p className="mb-4 text-slate-400">{t("manage.noArticlesHint")}</p>
            <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
              <Link href="/write">
                <Plus className="mr-2 h-4 w-4" />
                {t("manage.writeArticle")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-sky-200/10 hover:bg-transparent">
                  <TableHead className="w-[400px] text-slate-300">{t("manage.table.title")}</TableHead>
                  <TableHead className="text-slate-300">{t("manage.table.category")}</TableHead>
                  <TableHead className="text-slate-300">{t("manage.table.status")}</TableHead>
                  <TableHead className="min-w-[280px] text-slate-300">{t("manage.table.visibility")}</TableHead>
                  <TableHead className="text-slate-300">{t("manage.table.views")}</TableHead>
                  <TableHead className="text-slate-300">{t("manage.table.createdAt")}</TableHead>
                  <TableHead className="w-[70px] text-slate-300">{t("manage.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsData?.posts.map((post) => (
                  <TableRow key={post.id} className="border-sky-200/10 hover:bg-sky-400/5">
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/post/${post.slug}`}
                          className="line-clamp-1 font-medium text-white hover:text-sky-200"
                        >
                          {post.title}
                        </Link>
                        <div className="flex flex-wrap gap-1">
  
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categoriesMap.get(post.categoryId ?? 0) || (
                        <span className="text-slate-500">{t("common.uncategorized")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                      >
                        {post.status === "published" ? t("manage.status.published") : t("manage.status.draft")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="inline-grid grid-cols-3 rounded-md border border-sky-200/15 bg-slate-950/50 p-1">
                        {visibilityOptions.map((option) => {
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
                              className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded px-2 text-xs font-medium transition ${
                                active
                                  ? "bg-sky-400/20 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.18)]"
                                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:inline">{t(option.labelKey)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{post.viewCount}</TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                          <DropdownMenuItem onClick={() => togglePublish(post)}>
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
        )}
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
