import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { trackPageView } from "@/lib/analytics";
import { usePublicRouteScrollRestoration } from "@/lib/routeScrollRestoration";
import { BlogAgentRoot } from "@/components/agent/BlogAgentRoot";
import {
  BrandMark,
  SiteHeader,
  SpaceBackdrop,
} from "@/components/ResearchShell";
import { classifyProductRoute } from "@shared/route-contract";

const Home = lazy(() => import("./pages/Home"));
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((module) => ({ default: module.Toaster }))
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
  import("./pages/Track").then((module) => ({ default: module.AlgorithmsPage }))
);
const ApplicationsPage = lazy(() =>
  import("./pages/Track").then((module) => ({ default: module.ApplicationsPage }))
);
const TagPage = lazy(() =>
  import("./pages/TaxonomyPage").then((module) => ({ default: module.TagPage }))
);
const CategoryPage = lazy(() =>
  import("./pages/TaxonomyPage").then((module) => ({ default: module.CategoryPage }))
);

function getLoadingHeaderActive(pathname: string) {
  switch (pathname) {
    case "/":
      return "home";
    case "/algorithms":
      return "algorithms";
    case "/applications":
      return "applications";
    case "/archive":
      return "archive";
    case "/search":
      return "search";
    case "/about":
      return "about";
    default:
      return undefined;
  }
}

function RouteLoading() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const route = classifyProductRoute(location);
  const isPublicRoute =
    route.kind === "home" || route.kind === "public" || route.kind === "reader";
  const active = getLoadingHeaderActive(route.pathname);

  return (
    <div
      className={`space-page route-loading-page${
        isPublicRoute ? " route-loading-page-public" : ""
      }`}
    >
      <SpaceBackdrop subtle />
      {isPublicRoute ? (
        <SiteHeader
          active={active}
          compact={route.kind === "reader"}
          backHref={route.kind === "reader" ? "/" : undefined}
          backLabel={route.kind === "reader" ? t("nav.back") : undefined}
        />
      ) : null}
      <main className="route-loading-main">
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
      </main>
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
  return classifyProductRoute(location).kind;
}

function RouteEffectController() {
  const [location] = useLocation();
  usePublicRouteScrollRestoration(location);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.routeKind = getRouteKind(location);
    root.dataset.viewTransitionSupport =
      "startViewTransition" in document ? "true" : "false";
    delete root.dataset.routeMotion;
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
          <Router />
          <BlogAgentRoot />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
