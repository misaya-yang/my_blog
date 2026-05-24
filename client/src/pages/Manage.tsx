import { useAuth } from "@/_core/hooks/useAuth";
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
  Loader2,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";


export default function Manage() {
  const { isAdmin, loading: authLoading } = useAuth();
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
      toast.success("文章已删除");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  // 获取分类列表
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const categoriesMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);

  // 切换发布状态
  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("状态已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
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

  // 未登录提示
  if (!authLoading && !isAdmin) {
    return (
      <div className="space-page flex items-center justify-center">
        <SpaceBackdrop subtle />
        <div className="glass-panel relative z-10 space-y-4 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">请先登录</h2>
          <p className="text-slate-400">你需要登录后才能管理文章</p>
          <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
            <a href={"/login"}>登录</a>
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
      <SiteHeader active="write" backHref="/" backLabel="返回研究索引" compact />

      <main className="container relative z-10 px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="signal-chip mb-5">
              <FileText className="h-4 w-4" />
              Research CMS
            </div>
            <h2 className="font-serif text-4xl font-semibold text-white">文章后台</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              用来快速检查草稿、发布状态、阅读量和需要继续打磨的研究笔记。
            </p>
          </div>

          <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
            <Link href="/write">
              <Plus className="mr-2 h-4 w-4" />
              撰写文章
            </Link>
          </Button>
        </div>

        <div className="glass-panel mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索文章..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-sky-200/15 bg-slate-950/40 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="text-sm text-slate-400">
            共 {postsData?.total || 0} 篇文章
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
            <h3 className="mb-2 text-lg font-medium text-white">暂无文章</h3>
            <p className="mb-4 text-slate-400">开始撰写你的第一篇文章吧</p>
            <Button asChild className="bg-blue-500 text-white hover:bg-blue-400">
              <Link href="/write">
                <Plus className="mr-2 h-4 w-4" />
                撰写文章
              </Link>
            </Button>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-sky-200/10 hover:bg-transparent">
                  <TableHead className="w-[400px] text-slate-300">标题</TableHead>
                  <TableHead className="text-slate-300">分类</TableHead>
                  <TableHead className="text-slate-300">状态</TableHead>
                  <TableHead className="text-slate-300">浏览量</TableHead>
                  <TableHead className="text-slate-300">创建时间</TableHead>
                  <TableHead className="w-[70px] text-slate-300">操作</TableHead>
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
                        <span className="text-slate-500">未分类</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                      >
                        {post.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{post.viewCount}</TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString("zh-CN")}
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
                              查看
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/write/${post.slug}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              编辑
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublish(post)}>
                            {post.status === "published" ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                取消发布
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                发布
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
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
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，文章将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
