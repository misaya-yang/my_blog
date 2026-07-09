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
import { useTheme } from "@/contexts/ThemeContext";
import {
  buildAdminLoginHref,
  getCurrentAdminReturnPath,
} from "@/lib/adminReturnTo";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  FileText,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";
import React from "react";

type SiteHeaderProps = {
  active?:
    | "home"
    | "algorithms"
    | "applications"
    | "archive"
    | "search"
    | "about"
    | "write"
    | "manage"
    | "agent"
    | "login";
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

export function SpaceBackdrop({ subtle = false }: { subtle?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("space-backdrop", subtle && "space-backdrop-subtle")}
    >
      <div className="space-grid" />
      <div className="space-stars" />
      {!subtle && <div className="planet-horizon" />}
    </div>
  );
}

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | number;
  withWordmark?: boolean;
};

function getBrandMarkSize(size: BrandMarkProps["size"]) {
  if (typeof size === "number") return `${size}px`;
  if (size === "sm") return "2.25rem";
  if (size === "lg") return "3rem";
  return "2.65rem";
}

export function BrandMark({
  className,
  size = "md",
  withWordmark = false,
}: BrandMarkProps) {
  const markSize = getBrandMarkSize(size);
  const glyph = (
    <span
      className={cn("brand-mark", className)}
      style={
        {
          "--brand-mark-size": markSize,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-[58%] w-[58%]">
        <path
          d="M18 18h19a9 9 0 0 1 9 9v19H27a9 9 0 0 1-9-9V18Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M25 27h14M25 34h14M25 41h9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
      </svg>
    </span>
  );

  if (!withWordmark) return glyph;

  return (
    <span className="inline-flex min-h-11 items-center gap-3">
      {glyph}
      <span className="text-base font-[650] tracking-normal text-white sm:text-lg">
        Misaya Notes
      </span>
    </span>
  );
}

export function SiteHeader({
  active = "home",
  backHref,
  backLabel,
  compact,
}: SiteHeaderProps) {
  const { isAdmin, isAuthenticated, displayName, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme, switchable } = useTheme();
  const ownerThemeLocked = active === "manage" || active === "agent";
  const canToggleTheme = switchable && toggleTheme && !ownerThemeLocked;
  const themeToggleLabel =
    theme === "dark" ? t("nav.switchToLight") : t("nav.switchToDark");
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const primaryLinks: Array<{
    href: string;
    key: NonNullable<SiteHeaderProps["active"]>;
    label: string;
  }> = [
    { href: "/", key: "home", label: t("nav.home") },
    { href: "/algorithms", key: "algorithms", label: t("nav.algorithms") },
    {
      href: "/applications",
      key: "applications",
      label: t("nav.applications"),
    },
    { href: "/archive", key: "archive", label: t("nav.archive") },
    { href: "/search", key: "search", label: t("nav.search") },
    { href: "/about", key: "about", label: t("nav.about") },
  ];

  const navLink = (
    href: string,
    key: SiteHeaderProps["active"],
    label: string
  ) => (
    <Link
      key={href}
      href={href}
      className={cn("nav-ink", active === key && "nav-ink-active")}
      aria-current={active === key ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <header className="site-header liquid-nav glass-dock">
      <div className="container flex h-[68px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link href={backHref} className="nav-ink gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {backLabel || t("nav.back")}
              </span>
            </Link>
          ) : (
            <Link href="/" className="flex min-h-11 items-center gap-3">
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
                .filter(link => link.key !== "search")
                .map(link => navLink(link.href, link.key, link.label))}
            </div>
          )}
          {isAdmin && (
            <Link
              href="/write"
              className={cn(
                "nav-ink gap-2",
                active === "write" && "nav-ink-active"
              )}
              aria-current={active === "write" ? "page" : undefined}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.write")}</span>
            </Link>
          )}
          <Link
            href="/search"
            className={cn(
              "nav-icon-button",
              active === "search" && "nav-icon-button-active"
            )}
            aria-current={active === "search" ? "page" : undefined}
            aria-label={t("nav.search")}
            title={t("nav.search")}
          >
            <Search className="h-4 w-4" />
          </Link>
          {canToggleTheme ? (
            <button
              type="button"
              className="nav-icon-button nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={themeToggleLabel}
              aria-pressed={theme === "dark"}
              title={themeToggleLabel}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
          ) : null}
          <span
            className="site-header-divider mx-1 hidden h-5 w-px sm:block"
            aria-hidden="true"
          />
          <button
            type="button"
            className="nav-ink px-3 glass-control"
            onClick={toggleLanguage}
          >
            {language === "en" ? t("nav.switchToZh") : t("nav.switchToEn")}
          </button>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="glass-button glass-control hidden gap-2 sm:inline-flex"
              onClick={logout}
            >
              <UserRound className="h-4 w-4" />
              <span className="max-w-24 truncate">
                {isAdmin ? "Misaya" : displayName}
              </span>
              <LogOut className="h-3.5 w-3.5 opacity-70" />
            </Button>
          ) : null}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="glass-button glass-control lg:hidden"
                aria-label={t("nav.menu")}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="site-mobile-sheet glass-popover w-[20rem] p-0">
              <SheetHeader className="site-mobile-sheet-header p-5">
                <SheetTitle className="site-mobile-sheet-title flex items-center gap-3">
                  <BrandMark />
                  {t("nav.brand")}
                </SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 px-4 py-5">
                {primaryLinks.map(link => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "site-mobile-sheet-link flex h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                        active === link.key && "site-mobile-sheet-link-active"
                      )}
                    >
                      {link.key === "search" && <Search className="h-4 w-4" />}
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="site-mobile-sheet-actions grid gap-2 px-4 py-5">
                {canToggleTheme ? (
                  <button
                    type="button"
                    className="nav-ink glass-control h-11 justify-start gap-2"
                    onClick={toggleTheme}
                    aria-pressed={theme === "dark"}
                  >
                    <ThemeIcon className="h-4 w-4" />
                    {themeToggleLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="nav-ink glass-control h-11 justify-start"
                  onClick={toggleLanguage}
                >
                  {language === "en"
                    ? t("nav.switchToZh")
                    : t("nav.switchToEn")}
                </button>
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="nav-ink glass-control h-11 justify-start gap-2"
                      onClick={logout}
                    >
                      <UserRound className="h-4 w-4" />
                      <span className="truncate">
                        {isAdmin ? "Misaya" : displayName}
                      </span>
                      <LogOut className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </SheetClose>
                ) : null}
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
    <div
      className={cn("research-visual", `research-visual-${variant}`, className)}
      aria-hidden="true"
    >
      <div className="visual-grid" />
      <svg viewBox="0 0 640 300" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`line-${variant}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#5eead4" stopOpacity=".08" />
            <stop offset="48%" stopColor="#2dd4bf" stopOpacity=".82" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity=".2" />
          </linearGradient>
          <filter
            id={`glow-${variant}`}
            x="-20%"
            y="-50%"
            width="140%"
            height="200%"
          >
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
            fill={index % 3 === 0 ? "#5eead4" : "#94a3b8"}
            opacity={0.22 + (index % 5) * 0.12}
          />
        ))}
      </svg>
    </div>
  );
}

export function Surface({
  as: Component = "section",
  className,
  density = "normal",
  variant = "open",
  children,
}: {
  as?: "section" | "article" | "aside" | "div";
  className?: string;
  density?: "normal" | "compact";
  variant?: "open" | "floating" | "popover" | "data" | "reading";
  children: React.ReactNode;
}) {
  return (
    <Component
      className={cn(
        "research-surface",
        variant === "open" && "surface-open open-group",
        variant === "floating" && "glass-dock",
        variant === "popover" && "glass-popover",
        variant === "data" && "solid-data",
        variant === "reading" && "solid-reading",
        density === "compact" && "research-surface-compact",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("section-header", className)}>
      <div className="min-w-0">
        <div className="section-heading-row">
          {icon && <span className="section-heading-icon">{icon}</span>}
          <h2 className="section-heading-title">{title}</h2>
        </div>
        {description && <p className="section-heading-copy">{description}</p>}
      </div>
      {action && <div className="section-heading-action">{action}</div>}
    </div>
  );
}

export function MetricTile({
  icon,
  value,
  label,
  tone = "neutral",
}: {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <div
      className={cn(
        "metric-tile",
        `metric-tile-${tone}`,
        !icon && "metric-tile-plain"
      )}
    >
      {icon && <span className="metric-icon">{icon}</span>}
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

export function LoadingState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Surface as="div" className={cn("state-surface", className)}>
      <div className="state-icon" aria-hidden="true">
        <FileText className="h-4 w-4" />
      </div>
      <div className="state-copy">
        <p className="state-title">{title}</p>
        {description && <p className="state-description">{description}</p>}
      </div>
      <div className="route-loading-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </Surface>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Surface as="div" className={cn("state-surface", className)}>
      <div className="state-icon" aria-hidden="true">
        {icon ?? <FileText className="h-4 w-4" />}
      </div>
      <div className="state-copy">
        <p className="state-title">{title}</p>
        {description && <p className="state-description">{description}</p>}
      </div>
      {action && <div className="state-action">{action}</div>}
    </Surface>
  );
}

export function AuthRequiredState({
  icon,
  title,
  description,
  loginLabel,
  homeLabel,
  backLabel,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  loginLabel: string;
  homeLabel: string;
  backLabel: string;
}) {
  const loginHref = buildAdminLoginHref(getCurrentAdminReturnPath());

  return (
    <div className="space-page owner-dark-scope min-h-screen">
      <SpaceBackdrop subtle />
      <SiteHeader active="login" backHref="/" backLabel={backLabel} compact />
      <main className="auth-required-shell container relative z-10 px-4 sm:px-6">
        <h1 className="sr-only">{title}</h1>
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={
            <div className="auth-required-actions">
              <Button asChild className="owner-primary-action">
                <Link href={loginHref}>{loginLabel}</Link>
              </Button>
              <Button asChild variant="outline" className="glass-button">
                <Link href="/">{homeLabel}</Link>
              </Button>
            </div>
          }
          className="auth-required-card"
        />
      </main>
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
