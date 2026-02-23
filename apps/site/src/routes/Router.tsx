import React from "react";
import { Home } from "./Home";
import { About } from "./pages/About";
import { Support } from "./pages/Support";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Store } from "./pages/Store";
import { Account } from "./pages/Account";
import { Admin } from "./pages/Admin";

function normPath(p: string) {
  const path = p.split("?")[0].split("#")[0];
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function isSiteRoute(path: string) {
  return (
    path === "/" ||
    path === "/about" ||
    path === "/support" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/store" ||
    path === "/account" ||
    path === "/admin"
  );
}

// IMPORTANT: эти пути НЕ сайт, а внешние приложения (apps/game, apps/lobby)
function isExternalApp(path: string) {
  return path === "/game" || path.startsWith("/game/") || path === "/lobby" || path.startsWith("/lobby/");
}

function sameOrigin(url: URL) {
  return url.origin === window.location.origin;
}

export function Router() {
  const [path, setPath] = React.useState(() => normPath(window.location.pathname));

  React.useEffect(() => {
    const onPop = () => setPath(normPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // only left click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      // target/download — не трогаем
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const href = a.getAttribute("href") || "";
      if (!href) return;

      // спец-схемы — не трогаем
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      // absolute URL
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const u = new URL(href);
        if (!sameOrigin(u)) return; // внешние домены не перехватываем

        const target = normPath(u.pathname);
        if (isExternalApp(target)) return; // /game и /lobby — наружу
        if (!isSiteRoute(target)) return; // неизвестные — не ломаем

        e.preventDefault();
        window.history.pushState(null, "", u.pathname + u.search + u.hash);
        setPath(normPath(window.location.pathname));
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      // internal absolute path
      if (!href.startsWith("/")) return;

      const target = normPath(href);

      // /game и /lobby — наружу (пусть браузер откроет)
      if (isExternalApp(target)) return;

      // перехватываем ТОЛЬКО страницы сайта
      if (!isSiteRoute(target)) return;

      e.preventDefault();
      window.history.pushState(null, "", href);
      setPath(normPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // неизвестный путь: показываем Home, без редиректа (ничего не ломаем)
  if (!isSiteRoute(path)) return <Home />;

  switch (path) {
    case "/":
      return <Home />;
    case "/about":
      return <About />;
    case "/support":
      return <Support />;
    case "/privacy":
      return <Privacy />;
    case "/terms":
      return <Terms />;
    case "/store":
      return <Store />;
    case "/account":
      return <Account />;
    case "/admin":
      return <Admin />;
    default:
      return <Home />;
  }
}
