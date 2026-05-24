import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Library, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const adminLogin = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.session.invalidate();
      toast.success("欢迎回来，Misaya");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "管理员登录失败");
    },
  });

  const visitorLogin = trpc.auth.visitorLogin.useMutation({
    onSuccess: async (data) => {
      utils.auth.session.setData(undefined, data.session);
      await utils.auth.session.invalidate();
      toast.success("已创建访客身份");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "访客登录失败");
    },
  });

  const handleAdminSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    adminLogin.mutate({ password });
  };

  const handleVisitorSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    visitorLogin.mutate({ nickname: nickname.trim() });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center justify-between px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回研究札记
          </Link>
          <div className="text-xs uppercase text-muted-foreground">
            Identity
          </div>
        </div>
      </header>

      <main className="container grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_440px]">
        <section className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 border border-border/70 px-3 py-1 text-xs uppercase text-muted-foreground">
            <Library className="h-3.5 w-3.5" />
            Personal research archive
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            写作入口给作者，阅读身份留给同行。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
            管理员模式用于发布和维护文章；访客模式只创建一个本地 JWT 身份，
            暂时不接邮箱，后续可以自然接到评论、收藏或订阅。
          </p>
        </section>

        <section className="border border-border/70 bg-card/80 p-5 shadow-sm">
          <Tabs defaultValue="visitor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visitor" className="gap-2">
                <UserRound className="h-4 w-4" />
                访客
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <KeyRound className="h-4 w-4" />
                作者
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visitor" className="mt-6">
              <form onSubmit={handleVisitorSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">访客登录</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    输入一个昵称即可。不会发送邮箱，不会创建第三方账号。
                  </p>
                </div>
                <Input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="例如：一位读 RoPE 的同学"
                  minLength={2}
                  maxLength={40}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={visitorLogin.isPending}
                >
                  {visitorLogin.isPending ? "创建中..." : "以访客身份进入"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">作者后台</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    仅博客所有者可进入写作、发布和管理流程。
                  </p>
                </div>
                <Input
                  type="password"
                  placeholder="管理员密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={adminLogin.isPending}
                >
                  {adminLogin.isPending ? "验证中..." : "进入写作台"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
