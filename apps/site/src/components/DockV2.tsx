import React from "react";
import { GAMES_HUB_PATH } from "../lib/gameRoutes";
import { SiteIcons } from "./siteIcons";

export type DockV2Tone = "cyan" | "violet" | "green";

export type DockV2Item = {
  href: string;
  label: string;
  icon: string;
  tone?: DockV2Tone;
  external?: boolean;
  isActive?: (path: string) => boolean;
};

export type DockV2Props = {
  activePath: string;
  items?: DockV2Item[];
  className?: string;
  ariaLabel?: string;
};

type DockStyle = React.CSSProperties & {
  "--bc-dock-active-index"?: number;
  "--bc-dock-item-count"?: number;
};

const DEFAULT_ITEMS: DockV2Item[] = [
  {
    href: "/",
    label: "Главная",
    icon: SiteIcons.home,
    tone: "cyan",
    isActive: (path) => path === "/",
  },
  {
    href: GAMES_HUB_PATH,
    label: "Играть",
    icon: SiteIcons.games,
    tone: "green",
    external: true,
    isActive: () => false,
  },
  {
    href: "/store",
    label: "Store",
    icon: SiteIcons.cart,
    tone: "violet",
    isActive: (path) => path === "/store" || path === "/cart" || path === "/checkout" || path.startsWith("/checkout/"),
  },
  {
    href: "/account",
    label: "Профиль",
    icon: SiteIcons.user,
    tone: "cyan",
    isActive: (path) => path === "/account",
  },
];

function normalizePath(path: string) {
  const clean = path.split("?")[0].split("#")[0] || "/";
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

function defaultActive(item: DockV2Item, path: string) {
  const target = normalizePath(item.href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}

export function DockV2({
  activePath,
  items = DEFAULT_ITEMS,
  className,
  ariaLabel = "Мобильная навигация",
}: DockV2Props) {
  const normalizedPath = normalizePath(activePath);
  const activeIndex = items.findIndex((item) =>
    item.isActive ? item.isActive(normalizedPath) : defaultActive(item, normalizedPath)
  );
  const visualActiveIndex = Math.max(0, activeIndex);

  const style: DockStyle = {
    "--bc-dock-active-index": visualActiveIndex,
    "--bc-dock-item-count": Math.max(1, items.length),
  };

  const classes = ["bcMobileDock", "bcDock", "bcDockV2", className].filter(Boolean).join(" ");

  return (
    <nav
      className={classes}
      style={style}
      aria-label={ariaLabel}
      data-active-index={activeIndex}
      data-has-active={activeIndex >= 0 ? "true" : "false"}
    >
      <div className="bcDockV2__ambient" aria-hidden="true" />

      <div className="bcMobileDock__frame bcDockV2__frame">
        {activeIndex >= 0 ? <span className="bcDockV2__activeRail" aria-hidden="true" /> : null}

        {items.map((item, index) => {
          const active = item.isActive
            ? item.isActive(normalizedPath)
            : defaultActive(item, normalizedPath);
          const tone = item.tone ?? "cyan";

          return (
            <a
              key={`${item.href}-${item.label}`}
              className={[
                "bcMobileDock__item",
                "bcDockV2__item",
                active ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              href={item.href}
              data-index={index}
              data-tone={tone}
              data-external={item.external ? "true" : "false"}
              aria-current={active ? "page" : undefined}
            >
              <span className="bcDockV2__touch" aria-hidden="true" />
              <span className="bcMobileDock__icon bcDockV2__icon" aria-hidden="true">
                <span className="bcDockV2__iconGlow" />
                <img src={item.icon} width="21" height="21" alt="" />
              </span>
              <span className="bcDockV2__label">{item.label}</span>
              <span className="bcDockV2__signal" aria-hidden="true" />
            </a>
          );
        })}
      </div>

      <span className="bcDockV2__edge bcDockV2__edge--left" aria-hidden="true" />
      <span className="bcDockV2__edge bcDockV2__edge--right" aria-hidden="true" />
    </nav>
  );
}

export default DockV2;
