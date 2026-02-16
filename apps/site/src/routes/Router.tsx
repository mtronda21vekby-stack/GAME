import React from "react";
import { Home } from "./Home";
import { About } from "./pages/About";
import { Support } from "./pages/Support";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Store } from "./pages/Store";
import { Account } from "./pages/Account";

function normPath(p: string) {
  const path = p.split("?")[0].split("#")[0];
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function isSiteRoute(path: string) {
  // site SPA routes only
  return (
    path === "/" ||
    path === "/about" ||
    path === "/support" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/store" ||
    path === "/account"
  );
}

function isExternalApp(path: string) {
  // other apps on same domain
  return path === "/game" || path.startsWith("/game/") || path === "/lobby" || path.startsWith("/lobby/");
}

export function Router() {
  const [path, setPath] = React.useState(normPath(window.location.pathname));

  React.useEffect(() => {
    const onPop = () => setPath(normPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/")) return;

      const target = normPath(href);

      // game/lobby пусть грузятся как отдельные приложения
      if (isExternalApp(target)) return;

      // перехватываем только наши site-роуты
      if (!isSiteRoute(target)) return;

      e.preventDefault();
      window.history.pushState(null, "", href);
      setPath(normPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

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
    default:
      return <Home />;
  }
}
