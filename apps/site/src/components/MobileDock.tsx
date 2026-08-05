import React from "react";
import { SiteIcons } from "./siteIcons";

type DockItem = {
  href: string;
  label: string;
  icon: string;
  active: (path: string) => boolean;
  emphasis?: boolean;
};

const items: DockItem[] = [
  {
    href: "/",
    label: "Главная",
    icon: SiteIcons.home,
    active: (path) => path === "/",
  },
  {
    href: "/game/",
    label: "Играть",
    icon: SiteIcons.games,
    active: () => false,
    emphasis: true,
  },
  {
    href: "/store",
    label: "Store",
    icon: SiteIcons.cart,
    active: (path) => path === "/store",
  },
  {
    href: "/account",
    label: "Профиль",
    icon: SiteIcons.user,
    active: (path) => path === "/account",
  },
];

export function MobileDock(props: { activePath: string }) {
  return (
    <nav className="bcMobileDock" aria-label="Быстрая навигация">
      <div className="bcMobileDock__frame">
        {items.map((item) => {
          const active = item.active(props.activePath);

          return (
            <a
              key={item.href}
              className={[
                "bcMobileDock__item",
                active ? "is-active" : "",
                item.emphasis ? "is-emphasis" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              href={item.href}
              aria-current={active ? "page" : undefined}
            >
              <span className="bcMobileDock__icon">
                <img src={item.icon} width="20" height="20" alt="" />
              </span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileDock;
