import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export type SeriesProgressLink = {
  href: string;
  label: string;
  direction?: "previous" | "next" | "start" | "track";
  primary?: boolean;
};

type SeriesProgressProps = {
  variant?: "compact" | "card" | "footer";
  label: string;
  title: string;
  meta?: string;
  promise?: string;
  links?: SeriesProgressLink[];
  className?: string;
};

export function SeriesProgress({
  variant = "compact",
  label,
  title,
  meta,
  promise,
  links = [],
  className,
}: SeriesProgressProps) {
  return (
    <section
      className={cn("series-progress", `series-progress-${variant}`, className)}
      aria-label={label}
    >
      <div className="series-progress-copy">
        <span className="series-progress-label">{label}</span>
        <h3 className="series-progress-title">{title}</h3>
        {(meta || promise) && (
          <p className="series-progress-meta">
            {[meta, promise].filter(Boolean).join(" / ")}
          </p>
        )}
      </div>

      {links.length > 0 && (
        <div className="series-progress-actions">
          {links.map(link => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={cn(
                "series-progress-action",
                link.primary && "series-progress-action-primary"
              )}
            >
              {link.direction === "previous" && (
                <ArrowLeft className="h-3.5 w-3.5" />
              )}
              {link.label}
              {(link.direction === "next" ||
                link.direction === "track" ||
                link.direction === "start") && (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
