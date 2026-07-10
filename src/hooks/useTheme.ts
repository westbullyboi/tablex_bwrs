import { useState, useEffect } from "react";

/**
 * Reflects the theme that is actually applied to the document, by observing the
 * `dark` class on the root element (set from `uiStore` in App). This keeps
 * consumers such as the Monaco editor and the ER diagram in sync with the
 * explicit theme toggle, not just the OS preference.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return { isDark };
}
