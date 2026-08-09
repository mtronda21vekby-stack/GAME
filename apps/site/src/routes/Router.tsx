import React from "react";
import { DockV2 } from "../components/DockV2";
import { SiteFooter } from "../components/SiteFooter";
import { HomeV3 } from "./HomeV3";
import { About } from "./pages/About";
import { Support } from "./pages/Support";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Store } from "./pages/Store";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { CheckoutSuccess } from "./pages/CheckoutSuccess";
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
    path === "/cart" ||
    path === "/checkout" ||
    path === "/checkout/success" ||
    path === "/account" ||
    path === "/admin"
  );
}

function isExternalApp(path: string) {
  return (
    path === "/game" ||
    path.startsWith("/game/") ||
    path === "/lobby" ||
    path.startsWith("/lobby/") ||
    path === "/games" ||
    path.startsWith("/games/")
  );
}

function sameOrigin(url: URL) {
  return url.origin === window.location.origin;
}

const routeTitles: Record<string, string> = {
  "/": "BlackCrown — Interactive Worlds",
  "/about": "О платформе — BlackCrown",
  "/support": "Поддержка — BlackCrown",
  "/privacy": "Privacy — BlackCrown",
  "/terms": "Terms — BlackCrown",
  "/store": "Store — BlackCrown",
  "/cart": "Корзина — BlackCrown",
  "/checkout": "Оформление заказа — BlackCrown",
  "/checkout/success": "Заказ выполнен — BlackCrown",
  "/account": "Аккаунт — BlackCrown",
  "/admin": "Admin — BlackCrown",
};

function renderRoute(path: string) {
  switch (path) {
    case "/":
      return <HomeV3 />;
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
    case "/cart":
      return <Cart />;
    case "/checkout":
      return <Checkout />;
    case "/checkout/success":
      return <CheckoutSuccess />;
    case "/account":
      return <Account />;
    case "/admin":
      return <Admin />;
    default:
      return <HomeV3 />;
  }
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
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const href = a.getAttribute("href") || "";
      if (!href) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      if (href.startsWith("http://") || href.startsWith("https://")) {
        const u = new URL(href);
        if (!sameOrigin(u)) return;

        const target = normPath(u.pathname);
        if (isExternalApp(target)) return;
        if (!isSiteRoute(target)) return;

        e.preventDefault();
        window.history.pushState(null, "", u.pathname + u.search + u.hash);
        setPath(normPath(window.location.pathname));
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      if (!href.startsWith("/")) return;

      const url = new URL(href, window.location.origin);
      const target = normPath(url.pathname);
      if (isExternalApp(target)) return;
      if (!isSiteRoute(target)) return;

      e.preventDefault();
      window.history.pushState(null, "", url.pathname + url.search + url.hash);
      setPath(normPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const routePath = isSiteRoute(path) ? path : "/";
  const checkoutRoute = routePath === "/checkout" || routePath === "/checkout/success";
  const showFooter = routePath !== "/admin" && !checkoutRoute;
  const showDock = routePath !== "/admin" && !checkoutRoute;

  React.useEffect(() => {
    document.title = routeTitles[routePath] ?? routeTitles["/"];
    document.documentElement.dataset.bcRoute = routePath;
    return () => {
      delete document.documentElement.dataset.bcRoute;
    };
  }, [routePath]);

  return (
    <>
      <div key={routePath} className="bcRouteView" data-route={routePath}>
        {renderRoute(routePath)}
      </div>

      {showFooter ? <SiteFooter /> : null}
      {showDock ? <DockV2 activePath={routePath} /> : null}
    </>
  );
}
