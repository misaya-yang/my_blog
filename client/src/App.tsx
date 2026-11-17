import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Route, Router as LocationRouter, Switch, useLocation } from "wouter";
import { useRouteDataPrefetch } from "@/lib/routeData";
import { useStagedLocation } from "@/lib/routeTransition";
import {
  About,
  AlgorithmsPage,
  ApplicationsPage,
  Archive,
  CategoryPage,
  Home,
  PostDetail,
  Search,
  TagPage,
} from "./routePages";
import { ScrollRestoration } from "./components/ScrollRestoration";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { trackPageView } from "@/lib/analytics";
import { Starfield } from "./components/starfield/Starfield";
import { BrandMark, SpaceBackdrop } from "@/components/ResearchShell";

const BlogAgentRoot = lazy(() =>
  import("@/components/agent/BlogAgentRoot").then(module => ({
    default: module.BlogAgentRoot,
  }))
);
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then(module => ({ default: module.Toaster }))
);
const Editor = lazy(() => import("./pages/Editor"));
const Manage = lazy(() => import("./pages/Manage"));
const ManageAgent = lazy(() => import("./pages/ManageAgent"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoading() {
  const { t } = useLanguage();

  return (
    <div className="space-page route-loading-page">
      <SpaceBackdrop subtle />
      <div className="route-loading-shell">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="technical-label">{t("common.loading")}</p>
            <h1>{t("common.loadingNotes")}</h1>
          </div>
        </div>
        <p>{t("common.loadingHint")}</p>
        <div className="route-loading-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path="/algorithms" component={AlgorithmsPage} />
        <Route path="/applications" component={ApplicationsPage} />
        <Route path="/archive" component={Archive} />
        <Route path="/search" component={Search} />
        <Route path="/tags/:slug" component={TagPage} />
        <Route path="/categories/:slug" component={CategoryPage} />
        <Route path="/about" component={About} />
        {/* Keyed by slug: going from one article to the next is a new page,
            with its own entrance, not the old one refilled in place. */}
        <Route path="/post/:slug">
          {params => <PostDetail key={params.slug} />}
        </Route>
        <Route path="/write" component={Editor} />
        <Route path="/write/:slug" component={Editor} />
        <Route path="/manage/agent" component={ManageAgent} />
        <Route path="/manage" component={Manage} />
        <Route path="/login" component={Login} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AnalyticsRouteTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return null;
}

function getRouteKind(location: string) {
  const pathname = location.split(/[?#]/)[0] || "/";

  if (pathname === "/") return "home";
  if (pathname.startsWith("/post/")) return "reader";
  if (pathname.startsWith("/write")) return "editor";
  if (pathname.startsWith("/manage")) return "owner";
  if (
    pathname === "/archive" ||
    pathname === "/search" ||
    pathname === "/about" ||
    pathname === "/algorithms" ||
    pathname === "/applications" ||
    pathname.startsWith("/tags/") ||
    pathname.startsWith("/categories/")
  ) {
    return "public";
  }

  return "system";
}

function PublicSurface() {
  const [location] = useLocation();
  const kind = getRouteKind(location);
  const publicPage = kind === "home" || kind === "reader" || kind === "public";
  if (!publicPage) return <Router />;
  return (
    <div className="public-universe">
      <Starfield />
      {kind !== "home" && (
        // Inner pages keep their figure in the right margin, clear of the text.
        <div
          className="rose-anchor rose-anchor--page"
          data-figure={
            kind === "reader"
              ? "reader"
              : location.startsWith("/about")
                ? "seal"
                : "list"
          }
          data-rose-anchor
          data-rose-follow="0.6"
          data-rose-presence={location.startsWith("/about") ? "0.92" : "0.84"}
          aria-hidden="true"
        />
      )}
      <Router />
    </div>
  );
}

function RouteEffectController() {
  const [location] = useLocation();
  const didMount = useRef(false);
  useRouteDataPrefetch();

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    root.dataset.routeKind = getRouteKind(location);
    root.dataset.viewTransitionSupport =
      "startViewTransition" in document ? "true" : "false";

    if (!didMount.current) {
      didMount.current = true;
      delete root.dataset.routeMotion;
      return;
    }

    if (reducedMotion) {
      delete root.dataset.routeMotion;
      return;
    }

    root.dataset.routeMotion = "enter";
    const timer = window.setTimeout(() => {
      if (root.dataset.routeMotion === "enter") {
        delete root.dataset.routeMotion;
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
    };
  }, [location]);

  return null;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - Public pages default to the canonical dark notebook but allow a manual
//   light/dark switch without changing routes or information architecture.

// The reading companion is not needed for first paint: mount it once the
// browser is idle or the reader first interacts, whichever comes first.
function DeferredAgent() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const start = () => setReady(true);
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach(name =>
      window.addEventListener(name, start, { once: true, passive: true })
    );
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(start, { timeout: 3000 })
        : undefined;
    const timer = idle === undefined ? setTimeout(start, 1500) : undefined;
    return () => {
      events.forEach(name => window.removeEventListener(name, start));
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, [ready]);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <BlogAgentRoot />
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" switchable>
      <LanguageProvider>
        <ErrorBoundary>
          <LocationRouter hook={useStagedLocation}>
            <Suspense fallback={null}>
              <Toaster />
            </Suspense>
            <AnalyticsRouteTracker />
            <RouteEffectController />
            <ScrollRestoration />
            <PublicSurface />
            <DeferredAgent />
          </LocationRouter>
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
