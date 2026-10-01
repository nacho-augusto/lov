"use client";

import { useEffect, useState } from "react";
import s from "./admin.module.css";

type Theme = "light" | "dark";
const KEY = "lov-admin-theme";

// Day (paper) or night (rock) mode. With no stored choice the OS preference applies via CSS.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    if (stored === "light" || stored === "dark") apply(stored);
    else setTheme(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function apply(next: Theme) {
    document.querySelector("[data-admin-root]")?.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      className={s.ghostButton}
      onClick={() => apply(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
    >
      {theme === "dark" ? "Modo día" : "Modo noche"}
    </button>
  );
}
