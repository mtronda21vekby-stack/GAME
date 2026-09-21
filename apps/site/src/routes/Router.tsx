import React from "react";
import { DockV2 } from "../components/DockV2";
import { SiteFooter } from "../components/SiteFooter";
import SiteMusic from "../components/SiteMusic";
import { NotFound } from "./NotFound";
import { getRouteDefinition } from "./siteRoutes";
import { updateRouteHead } from "./routeHead";
import { isPlainLinkActivation } from "../lib/linkActivation";
import { followRouteHash, pushSiteLocation, resolveSiteLink, routeLocation } from "../lib/siteNavigation";

function RouteFallback() {
  return (
    <div className="bcRouteFallback" role="status" aria-label="Загрузка страницы">
      <span className="bcRouteFallback__signal" aria-hidden="true" />
    </div>
  );
}

export function Router() {
  const [location, setLocation] = React.useState(() => routeLocation(window.location));
  const { path } = location;
  const routeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (routeRef.current) return followRouteHash(routeRef.current, window.location.hash);
  }, [location.key]);

  React.useEffect(() => {
    const onPop = () => {
      const next = routeLocation(window.location);
      setLocation((current) => current.key === next.key ? current : next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isPlainLinkActivation(event)) return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const url = resolveSiteLink(anchor.getAttribute("href") || "", window.location.href,
        (candidate) => Boolean(getRouteDefinition(candidate)), {
          target: anchor.target,
          download: anchor.hasAttribute("download"),
          external: anchor.dataset.external === "true" || anchor.relList.contains("external"),
          spatial: anchor.hasAttribute("data-bc-spatial-chapter"),
        });
      if (!url) return;
      event.preventDefault();
      pushSiteLocation(url);
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
    updateRouteHead(metadata.title, metadata.description, Boolean(metadata.noIndex), path);
    document.documentElement.dataset.bcRoute = route?.path ?? "not-found";
    return () => {
      delete document.documentElement.dataset.bcRoute;
    };
  }, [metadata.description, metadata.noIndex, metadata.title, route?.path, path]);

  return (
    <>
      {metadata.chrome.music ? <SiteMusic /> : null}

      <div ref={routeRef} key={location.key} className="bcRouteView" data-route={route?.path ?? "not-found"}>
        <React.Suspense fallback={<RouteFallback />}>
          {RouteComponent ? <RouteComponent /> : <NotFound requestedPath={path} />}
        </React.Suspense>
      </div>

      {metadata.chrome.footer ? <SiteFooter /> : null}
      {metadata.chrome.dock ? <DockV2 activePath={route?.path ?? path} /> : null}
    </>
  );
}
