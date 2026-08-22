import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "theme";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function readSystemTheme(): Theme | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;

  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return null;
}

function writeStoredTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // Precedence: the reader's own stored choice, then the operating system
  // preference, then the site's canonical theme. Before this the app ignored
  // prefers-color-scheme entirely, so the light theme only ever appeared if
  // someone found the toggle -- which is also why it had gone unverified.
  const [theme, setTheme] = useState<Theme>(() => {
    if (!switchable) return defaultTheme;
    return readStoredTheme() ?? readSystemTheme() ?? defaultTheme;
  });

  // Follow the OS while the reader has not expressed a preference of their own.
  useEffect(() => {
    if (!switchable) return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (readStoredTheme()) return;

    const query = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (readStoredTheme()) return;
      // Re-derive rather than reading `event.matches`: a move to
      // `no-preference` also fires this with matches === false, and that is
      // not the same thing as an explicit dark preference. Resolving through
      // readSystemTheme keeps change and mount on the same rule.
      setTheme(readSystemTheme() ?? defaultTheme);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [switchable, defaultTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      // Persist only on an explicit toggle. Writing on every render would pin
      // the first computed theme forever and silently disable the OS link.
      writeStoredTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: switchable ? toggleTheme : undefined,
        switchable,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
