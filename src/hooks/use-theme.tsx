import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "easyclaim-theme";

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial: Theme = stored ?? "light";
    setThemeState(initial);
    apply(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(KEY, next);
    apply(next);
  }, []);

  return { theme, setTheme };
}