import React from "react";
import { DockV2 } from "../components/DockV2";
import { SiteFooter } from "../components/SiteFooter";
import SiteMusic from "../components/SiteMusic";
import { NotFound } from "./NotFound";
import { getRouteDefinition, isExternalAppPath } from "./siteRoutes";

export function normalizePath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function sameOrigin(url: URL) {
  return url.origin === window.location.origin;
}

function RouteFallback() {
  return (
    <div className="bcRouteFallback" role="status" aria-label="Загрузка страницы">
      <span className="bcRouteFallback__signal" aria-hidden="true" />
    </div>
  );
}

function updateRouteHead(title: string, description: string, noIndex: boolean) {
  document.title = title;

  let descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!descriptionMeta) {
    descriptionMeta = document.createElement("meta");
    descriptionMeta.name = "description";
    document.head.append(descriptionMeta);
  }
  descriptionMeta.content = description;

  let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    document.head.append(robotsMeta);
  }
  robotsMeta.content = noIndex ? "noindex, nofollow" : "index, follow";
}

export function Router() {
  const [path, setPath] = React.useState(() => normalizePath(window.location.pathname));

  React.useEffect(() => {
    const onPop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const element = event.target as HTMLElement | null;
      const anchor = element?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(href, window.location.origin);
      if (!sameOrigin(url) || isExternalAppPath(normalizePath(url.pathname))) return;

      event.preventDefault();
      window.history.pushState(null, "", url.pathname + url.search + url.hash);
      setPath(normalizePath(url.pathname));
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const route = getRouteDefinition(path);
  const metadata = route?.metadata ?? {
    title: "Страница не найдена — BlackCrown",
    description: `Маршрут ${path} не существует в BlackCrown.`,
    chrome: { dock: false, footer: true, music: false },
    noIndex: true,
  };
  const RouteComponent = route?.component;

  React.useEffect(() => {
    updateRouteHead(metadata.title, metadata.description, Boolean(metadata.noIndex));
    document.documentElement.dataset.bcRoute = route?.path ?? "not-found";
    return () => {
      delete document.documentElement.dataset.bcRoute;
    };
  }, [metadata.description, metadata.noIndex, metadata.title, route?.path]);

  return (
    <>
      {metadata.chrome.music ? <SiteMusic /> : null}

      <div key={path} className="bcRouteView" data-route={route?.path ?? "not-found"}>
        <React.Suspense fallback={<RouteFallback />}>
          {RouteComponent ? <RouteComponent /> : <NotFound requestedPath={path} />}
        </React.Suspense>
      </div>

      {metadata.chrome.footer ? <SiteFooter /> : null}
      {metadata.chrome.dock ? <DockV2 activePath={route?.path ?? path} /> : null}
    </>
  );
}
