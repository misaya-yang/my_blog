import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Edit,
  GraduationCap,
  LogOut,
  Mail,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type React from "react";

type SiteHeaderProps = {
  active?: "home" | "algorithms" | "applications" | "archive" | "search" | "about" | "write" | "login";
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

export function SpaceBackdrop({ subtle = false }: { subtle?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("space-backdrop", subtle && "space-backdrop-subtle")}>
      <div className="space-grid" />
      <div className="space-stars" />
      <div className="planet-horizon" />
    </div>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-mark", className)}>
      <BookOpen className="h-5 w-5" />
    </span>
  );
}

export function SiteHeader({ active = "home", backHref, backLabel, compact }: SiteHeaderProps) {
  const { isAdmin, isAuthenticated, displayName, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const primaryLinks: Array<{
    href: string;
    key: NonNullable<SiteHeaderProps["active"]>;
    label: string;
  }> = [
    { href: "/", key: "home", label: t("nav.home") },
    { href: "/algorithms", key: "algorithms", label: t("nav.algorithms") },
    { href: "/applications", key: "applications", label: t("nav.applications") },
    { href: "/archive", key: "archive", label: t("nav.archive") },
    { href: "/search", key: "search", label: t("nav.search") },
    { href: "/about", key: "about", label: t("nav.about") },
  ];

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(t("common.emailCopied"));
  };

  const navLink = (href: string, key: SiteHeaderProps["active"], label: string) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "nav-ink",
        active === key && "nav-ink-active"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="site-header">
      <div className="container flex h-[68px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link href={backHref} className="nav-ink gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel || t("nav.back")}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-3">
              <BrandMark />
              <span className="text-base font-semibold tracking-normal text-white sm:text-lg">
                {t("nav.brand")}
              </span>
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {!compact && (
            <div className="hidden items-center gap-1.5 lg:flex">
              {primaryLinks
                .filter((link) => link.key !== "search")
                .map((link) => navLink(link.href, link.key, link.label))}
            </div>
          )}
          <a
            href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-ink hidden gap-2 sm:inline-flex"
          >
            <GraduationCap className="h-4 w-4" />
            {t("nav.scholar")}
          </a>
          <button type="button" className="nav-ink hidden gap-2 sm:inline-flex" onClick={copyEmail}>
            <Mail className="h-4 w-4" />
            {t("nav.email")}
          </button>
          {isAdmin && (
            <Link href="/write" className={cn("nav-ink gap-2", active === "write" && "nav-ink-active")}>
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.write")}</span>
            </Link>
          )}
          <button type="button" className="nav-ink px-3" onClick={toggleLanguage}>
            {language === "en" ? t("nav.switchToZh") : t("nav.switchToEn")}
          </button>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" className="glass-button hidden gap-2 sm:inline-flex" onClick={logout}>
              <UserRound className="h-4 w-4" />
              <span className="max-w-24 truncate">{isAdmin ? "Misaya" : displayName}</span>
              <LogOut className="h-3.5 w-3.5 opacity-70" />
            </Button>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                variant="outline"
                className={cn("glass-button", active === "login" && "border-primary/70 text-white")}
              >
                {t("nav.login")}
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="glass-button lg:hidden"
                aria-label={t("nav.menu")}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[20rem] border-sky-200/15 bg-slate-950/95 p-0 text-white">
              <SheetHeader className="border-b border-sky-200/10 p-5">
                <SheetTitle className="flex items-center gap-3 text-white">
                  <BrandMark />
                  {t("nav.brand")}
                </SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 px-4 py-5">
                {primaryLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex h-11 items-center gap-2 rounded-md px-3 text-sm text-slate-300 transition-colors hover:bg-sky-400/10 hover:text-white",
                        active === link.key && "bg-sky-400/10 text-white"
                      )}
                    >
                      {link.key === "search" && <Search className="h-4 w-4" />}
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="grid gap-2 border-t border-sky-200/10 px-4 py-5">
                <SheetClose asChild>
                  <a
                    href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-ink h-11 justify-start gap-2"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {t("nav.scholar")}
                  </a>
                </SheetClose>
                <button type="button" className="nav-ink h-11 justify-start gap-2" onClick={copyEmail}>
                  <Mail className="h-4 w-4" />
                  {t("nav.email")}
                </button>
                <button type="button" className="nav-ink h-11 justify-start" onClick={toggleLanguage}>
                  {language === "en" ? t("nav.switchToZh") : t("nav.switchToEn")}
                </button>
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <button type="button" className="nav-ink h-11 justify-start gap-2" onClick={logout}>
                      <UserRound className="h-4 w-4" />
                      <span className="truncate">{isAdmin ? "Misaya" : displayName}</span>
                      <LogOut className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Link href="/login" className="nav-ink h-11 justify-start">
                      {t("nav.login")}
                    </Link>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}

export function ResearchWaveVisual({
  variant = "wave",
  className,
}: {
  variant?: "wave" | "orbit" | "matrix";
  className?: string;
}) {
  return (
    <div className={cn("research-visual", `research-visual-${variant}`, className)}>
      <div className="visual-grid" />
      <svg viewBox="0 0 640 300" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`line-${variant}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity=".1" />
            <stop offset="45%" stopColor="#60a5fa" stopOpacity=".95" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity=".15" />
          </linearGradient>
          <filter id={`glow-${variant}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {Array.from({ length: 7 }).map((_, index) => {
          const offset = index * 18;
          const amplitude = variant === "orbit" ? 44 : 32 + index * 3;
          return (
            <path
              key={index}
              d={`M -20 ${165 + offset / 2} C 95 ${80 + offset}, 165 ${250 - offset}, 260 ${150 + offset / 3} S 435 ${70 + offset}, 660 ${145 - offset / 2}`}
              fill="none"
              stroke={`url(#line-${variant})`}
              strokeWidth={index === 3 ? 3 : 1.2}
              opacity={0.18 + index * 0.08}
              filter={index === 3 ? `url(#glow-${variant})` : undefined}
              transform={`translate(0 ${Math.sin(index) * amplitude * 0.12})`}
            />
          );
        })}
        {Array.from({ length: 34 }).map((_, index) => (
          <circle
            key={`dot-${index}`}
            cx={(index * 47) % 640}
            cy={40 + ((index * 71) % 220)}
            r={index % 5 === 0 ? 2.8 : 1.4}
            fill={index % 3 === 0 ? "#67e8f9" : "#60a5fa"}
            opacity={0.22 + (index % 5) * 0.12}
          />
        ))}
      </svg>
    </div>
  );
}

export function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="stat-tile">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
