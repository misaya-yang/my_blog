import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Editor from "./pages/Editor";
import Manage from "./pages/Manage";
import Login from "./pages/Login";
import { AlgorithmsPage, ApplicationsPage } from "./pages/Track";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/algorithms" component={AlgorithmsPage} />
      <Route path="/applications" component={ApplicationsPage} />
      <Route path="/post/:slug" component={PostDetail} />
      <Route path="/write" component={Editor} />
      <Route path="/write/:slug" component={Editor} />
      <Route path="/manage" component={Manage} />
      <Route path="/login" component={Login} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - The public blog intentionally stays dark-only to preserve the research console visual system.

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
