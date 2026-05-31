import { Component, ReactNode } from "react";
import { trackClientError } from "@/lib/analytics";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    reportErrorToAnalytics(error, info);
  }

  render() {
    if (this.state.hasError) {
      const showStack = shouldShowErrorStack(import.meta.env.DEV);

      return (
        <ErrorFallback error={this.state.error} showStack={showStack} />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

function ErrorFallback({
  error,
  showStack,
}: {
  error: Error | null;
  showStack: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-2xl flex-col items-center p-8">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full border border-destructive/35 text-xl font-semibold text-destructive">
          !
        </div>

        <h2 className="mb-4 text-xl">{t("common.errorBoundary.title")}</h2>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
          {t("common.errorBoundary.description")}
        </p>

        {showStack && (
          <div className="mb-6 w-full overflow-auto rounded bg-muted p-4">
            <pre className="whitespace-break-spaces text-sm text-muted-foreground">
              {error?.stack}
            </pre>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          {t("common.errorBoundary.reload")}
        </button>
      </div>
    </div>
  );
}

export function shouldShowErrorStack(isDev: boolean) {
  return isDev;
}

export function reportErrorToAnalytics(
  error: Error,
  info: { componentStack?: string } = {}
) {
  trackClientError({
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
  });
}
