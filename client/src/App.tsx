import { lazy, Suspense, useEffect, useRef } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ScrollRestoration } from "./components/ScrollRestoration";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { trackPageView } from "@/lib/analytics";
import { BlogAgentRoot } from "@/components/agent/BlogAgentRoot";
import { BrandMark, SpaceBackdrop } from "@/components/ResearchShell";

const Home = lazy(() => import("./pages/Home"));
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then(module => ({ default: module.Toaster }))
);
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Editor = lazy(() => import("./pages/Editor"));
const Manage = lazy(() => import("./pages/Manage"));
const ManageAgent = lazy(() => import("./pages/ManageAgent"));
const Login = lazy(() => import("./pages/Login"));
const Archive = lazy(() => import("./pages/Archive"));
const Search = lazy(() => import("./pages/Search"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AlgorithmsPage = lazy(() =>
  import("./pages/Track").then(module => ({ default: module.AlgorithmsPage }))
);
const ApplicationsPage = lazy(() =>
  import("./pages/Track").then(module => ({ default: module.ApplicationsPage }))
);
const TagPage = lazy(() =>
  import("./pages/TaxonomyPage").then(module => ({ default: module.TagPage }))
);
const CategoryPage = lazy(() =>
  import("./pages/TaxonomyPage").then(module => ({
    default: module.CategoryPage,
  }))
);

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
        <Route path="/post/:slug" component={PostDetail} />
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

function RouteEffectController() {
  const [location] = useLocation();
  const didMount = useRef(false);

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

function App() {
  return (
    <ThemeProvider defaultTheme="dark" switchable>
      <LanguageProvider>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Toaster />
          </Suspense>
          <AnalyticsRouteTracker />
          <RouteEffectController />
          <ScrollRestoration />
          <Router />
          <BlogAgentRoot />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
