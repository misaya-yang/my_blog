import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

type InputProps = React.ComponentProps<"input"> & {
  icon?: React.ReactNode;
  iconClassName?: string;
  wrapperClassName?: string;
};

function Input({
  className,
  icon,
  iconClassName,
  wrapperClassName,
  type,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: InputProps) {
  // Get dialog composition context if available (will be no-op if not inside Dialog)
  const dialogComposition = useDialogComposition();

  // Add composition event handlers to support input method editor (IME) for CJK languages.
  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLInputElement>({
    onKeyDown: (e) => {
      // Check if this is an Enter key that should be blocked
      const isComposing = (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // If Enter key is pressed while composing or just after composition ended,
      // don't call the user's onKeyDown (this blocks the business logic)
      if (e.key === "Enter" && isComposing) {
        return;
      }

      // Otherwise, call the user's onKeyDown
      onKeyDown?.(e);
    },
    onCompositionStart: e => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: e => {
      // Mark that composition just ended - this helps handle the Enter key that confirms input
      dialogComposition.markCompositionEnd();
      // Delay setting composing to false to handle Safari's event order
      // In Safari, compositionEnd fires before the ESC keydown event
      setTimeout(() => {
        dialogComposition.setComposing(false);
      }, 100);
      onCompositionEnd?.(e);
    },
  });

  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-11 w-full min-w-0 rounded-[var(--radius-card)] border bg-transparent px-3.5 py-2 text-base shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,color] duration-[var(--dur-fast)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.94rem]",
        "dark:border-[color:var(--border-faint)] dark:bg-[oklch(0.07_0.018_252_/_64%)]",
        "focus-visible:border-[color:var(--border-strong)] focus-visible:ring-ring/35 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        icon && "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        "flex h-11 w-full min-w-0 items-center gap-2.5 rounded-[var(--radius-card)] border border-input bg-transparent px-3.5 shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus-within:border-[color:var(--border-strong)] focus-within:ring-ring/35 focus-within:ring-[3px] dark:border-[color:var(--border-faint)] dark:bg-[oklch(0.07_0.018_252_/_64%)]",
        wrapperClassName
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 text-muted-foreground [&_svg]:size-4",
          iconClassName
        )}
      >
        {icon}
      </span>
      {input}
    </div>
  );
}

export { Input };
