import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { trackPageView } from "@/lib/analytics";
import { BlogAgentRoot } from "@/components/agent/BlogAgentRoot";

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

function RouteLoading() {
  return (
    <div className="space-page grid place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-300" />
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

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - The public blog intentionally stays dark-only to preserve the research console visual system.

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <LanguageProvider>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Toaster />
          </Suspense>
          <AnalyticsRouteTracker />
          <Router />
          <BlogAgentRoot />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
