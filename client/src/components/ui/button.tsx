import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-[650] leading-none transition-[background,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] active:translate-y-px aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-xs)] hover:bg-[var(--primary-hover)]",
        destructive:
          "border border-transparent bg-destructive text-white shadow-[var(--shadow-xs)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-transparent text-foreground shadow-[var(--shadow-xs)] hover:border-[color:var(--border-strong)] hover:bg-[var(--surface-inline)]",
        secondary:
          "border border-[color:var(--border-faint)] bg-[var(--surface-card-strong)] text-foreground shadow-[var(--shadow-xs)] hover:border-[color:var(--border-strong)] hover:bg-[var(--surface-inline)]",
        ghost:
          "text-muted-foreground hover:bg-[var(--surface-inline)] hover:text-foreground",
        glass:
          "border border-[color:var(--glass-border)] bg-[image:var(--glass-bg)] text-foreground shadow-[var(--shadow-xs)] hover:border-[color:var(--glass-border-strong)] hover:bg-[var(--surface-card-strong)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2 text-[0.9rem] sm:h-10 has-[>svg]:px-3",
        sm: "h-10 gap-1.5 px-3 text-[0.86rem] sm:h-9 has-[>svg]:px-2.5",
        lg: "h-11 px-6 text-[0.96rem] has-[>svg]:px-4",
        icon: "size-11 sm:size-10",
        "icon-sm": "size-10 sm:size-8",
        "icon-lg": "size-11 sm:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
