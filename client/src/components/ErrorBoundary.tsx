import { Component, ReactNode } from "react";
import { trackClientError } from "@/lib/analytics";

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
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-full border border-destructive/35 text-xl font-semibold text-destructive">
              !
            </div>

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              The page could not recover cleanly. Reload to try again, or return to the home page.
            </p>

            {showStack && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

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
