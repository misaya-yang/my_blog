import { useAuth } from "@/_core/hooks/useAuth";
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
  ArrowLeft,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">请先登录</h2>
          <p className="text-muted-foreground">你需要登录后才能管理文章</p>
          <Button asChild>
            <a href={"/login"}>登录</a>
          </Button>
        </div>
      </div>
    );
  }

  // 加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>返回研究索引</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold">Research CMS</h1>
          </div>

          <Button asChild>
            <Link href="/write">
              <Plus className="w-4 h-4 mr-2" />
              撰写文章
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-7 max-w-2xl">
          <h2 className="text-2xl font-semibold">文章后台</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            用来快速检查草稿、发布状态、阅读量和需要继续打磨的研究笔记。
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            共 {postsData?.total || 0} 篇文章
          </div>
        </div>

        {/* 文章列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : postsData?.posts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无文章</h3>
            <p className="text-muted-foreground mb-4">开始撰写你的第一篇文章吧</p>
            <Button asChild>
              <Link href="/write">
                <Plus className="w-4 h-4 mr-2" />
                撰写文章
              </Link>
            </Button>
          </div>
        ) : (
          <div className="border border-border/70 bg-card/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>浏览量</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[70px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsData?.posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/post/${post.slug}`}
                          className="font-medium hover:text-primary line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <div className="flex flex-wrap gap-1">
  
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categoriesMap.get(post.categoryId ?? 0) || (
                        <span className="text-muted-foreground">未分类</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                      >
                        {post.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.viewCount}</TableCell>
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
