import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Edit,
  GraduationCap,
  LogOut,
  Mail,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type React from "react";

type SiteHeaderProps = {
  active?: "home" | "algorithms" | "applications" | "archive" | "write" | "login";
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

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(t("common.emailCopied"));
  };

  const navLink = (href: string, key: SiteHeaderProps["active"], label: string) => (
    <Link
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
            <div className="hidden items-center gap-1.5 md:flex">
              {navLink("/", "home", t("nav.home"))}
              {navLink("/algorithms", "algorithms", t("nav.algorithms"))}
              {navLink("/applications", "applications", t("nav.applications"))}
              <a href="/#research-index" className={cn("nav-ink", active === "archive" && "nav-ink-active")}>
                {t("nav.archive")}
              </a>
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
            {language === "en" ? "中文" : "EN"}
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
      <svg viewBox="0 0 640 300" role="img" aria-label="Abstract blue research visualization">
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
