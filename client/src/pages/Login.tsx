import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { KeyRound, Library, LockKeyhole, Network, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
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
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      <SiteHeader active="login" backHref="/" backLabel="返回首页" compact />

      <main className="container relative z-10 grid min-h-[calc(100vh-68px)] grid-cols-1 items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-center lg:py-12">
        <section className="max-w-2xl">
          <div className="signal-chip mb-7">
            <Library className="h-3.5 w-3.5" />
            Personal research identity
          </div>
          <h1 className="max-w-xl font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
            写作入口给作者，阅读身份留给同行。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            管理员模式用于发布和维护文章；访客模式只创建一个本地 JWT 身份，
            暂时不接邮箱，后续可以自然接到评论、收藏或订阅。
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="glass-panel p-4">
              <Network className="mb-3 h-5 w-5 text-sky-300" />
              <p className="text-sm font-medium text-white">Visitor JWT</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">用于识别阅读身份，不绑定邮箱。</p>
            </div>
            <div className="glass-panel p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-blue-300" />
              <p className="text-sm font-medium text-white">Owner Console</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">发布、维护和管理研究文章。</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-5">
          <Tabs defaultValue="visitor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 border border-sky-200/10 bg-slate-950/45">
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
                  <h2 className="text-xl font-semibold text-white">访客登录</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    输入一个昵称即可。不会发送邮箱，不会创建第三方账号。
                  </p>
                </div>
                <Input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="例如：一位读 RoPE 的同学"
                  minLength={2}
                  maxLength={40}
                  className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-500 text-white hover:bg-blue-400"
                  disabled={visitorLogin.isPending}
                >
                  {visitorLogin.isPending ? "创建中..." : "以访客身份进入"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">作者后台</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    仅博客所有者可进入写作、发布和管理流程。
                  </p>
                </div>
                <Input
                  type="password"
                  placeholder="管理员密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-500 text-white hover:bg-blue-400"
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
