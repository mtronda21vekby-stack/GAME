import React from "react";
import { experienceConfig, isNexusRouteEnabled } from "../experience/experienceConfig";
import { HomeV3 } from "./HomeV3";

const About = React.lazy(() => import("./pages/About").then((module) => ({ default: module.About })));
const Support = React.lazy(() => import("./pages/Support").then((module) => ({ default: module.Support })));
const Privacy = React.lazy(() => import("./pages/Privacy").then((module) => ({ default: module.Privacy })));
const Terms = React.lazy(() => import("./pages/Terms").then((module) => ({ default: module.Terms })));
const Store = React.lazy(() => import("./pages/Store").then((module) => ({ default: module.Store })));
const Cart = React.lazy(() => import("./pages/Cart").then((module) => ({ default: module.Cart })));
const Checkout = React.lazy(() => import("./pages/Checkout").then((module) => ({ default: module.Checkout })));
const CheckoutSuccess = React.lazy(() =>
  import("./pages/CheckoutSuccess").then((module) => ({ default: module.CheckoutSuccess })),
);
const Account = React.lazy(() => import("./pages/Account").then((module) => ({ default: module.Account })));
const Admin = React.lazy(() => import("./pages/Admin").then((module) => ({ default: module.Admin })));
const NexusLab = React.lazy(() =>
  import("../components/nexus/NexusLabPage").then((module) => ({ default: module.NexusLabPage })),
);

export const SITE_PATHS = [
  "/",
  "/about",
  "/support",
  "/privacy",
  "/terms",
  "/store",
  "/cart",
  "/checkout",
  "/checkout/success",
  "/account",
  "/admin",
  "/nexus-lab",
] as const;

export type SitePath = (typeof SITE_PATHS)[number];

type RouteChrome = {
  dock: boolean;
  footer: boolean;
  music: boolean;
};

export type RouteDefinition = {
  path: SitePath;
  component: React.ComponentType;
  metadata: {
    title: string;
    description: string;
    chrome: RouteChrome;
    noIndex?: boolean;
  };
};

const standardChrome: RouteChrome = { dock: true, footer: true, music: true };
const focusedChrome: RouteChrome = { dock: false, footer: false, music: false };

const coreRoutes: RouteDefinition[] = [
  {
    path: "/",
    component: experienceConfig.mode === "home" ? NexusLab : HomeV3,
    metadata: {
      title: "BlackCrown — Interactive Worlds",
      description: "BlackCrown объединяет игровые миры, Store и профиль игрока в единой интерактивной сети.",
      chrome: standardChrome,
    },
  },
  {
    path: "/about",
    component: About,
    metadata: {
      title: "О платформе — BlackCrown",
      description: "Принципы, игровые направления и развитие платформы BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/support",
    component: Support,
    metadata: {
      title: "Поддержка — BlackCrown",
      description: "Помощь с аккаунтом, покупками и игровыми продуктами BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/privacy",
    component: Privacy,
    metadata: {
      title: "Privacy — BlackCrown",
      description: "Политика конфиденциальности BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/terms",
    component: Terms,
    metadata: {
      title: "Terms — BlackCrown",
      description: "Условия использования сервисов BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/store",
    component: Store,
    metadata: {
      title: "Store — BlackCrown",
      description: "Каталог цифровых предметов и игровых миров BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/cart",
    component: Cart,
    metadata: {
      title: "Корзина — BlackCrown",
      description: "Корзина цифровых предметов BlackCrown.",
      chrome: standardChrome,
      noIndex: true,
    },
  },
  {
    path: "/checkout",
    component: Checkout,
    metadata: {
      title: "Оформление заказа — BlackCrown",
      description: "Серверная проверка и тестовое оформление заказа BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
  {
    path: "/checkout/success",
    component: CheckoutSuccess,
    metadata: {
      title: "Заказ выполнен — BlackCrown",
      description: "Статус выполнения заказа BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
  {
    path: "/account",
    component: Account,
    metadata: {
      title: "Аккаунт — BlackCrown",
      description: "Профиль, коллекция и доступы игрока BlackCrown.",
      chrome: standardChrome,
      noIndex: true,
    },
  },
  {
    path: "/admin",
    component: Admin,
    metadata: {
      title: "Admin — BlackCrown",
      description: "Административная консоль BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
] as const;

export const SITE_ROUTES: readonly RouteDefinition[] = isNexusRouteEnabled()
  ? [
      ...coreRoutes,
      {
        path: "/nexus-lab",
        component: NexusLab,
        metadata: {
          title: "Digital Crown Nexus Lab — BlackCrown",
          description: "Локальный WebGL-прототип BlackCrown Digital Crown Nexus.",
          chrome: focusedChrome,
          noIndex: true,
        },
      },
    ]
  : coreRoutes;

const routeByPath = new Map<string, RouteDefinition>(SITE_ROUTES.map((route) => [route.path, route]));

export function getRouteDefinition(path: string) {
  return routeByPath.get(path);
}

export function isSitePath(path: string): path is SitePath {
  return routeByPath.has(path);
}

export function isExternalAppPath(path: string) {
  return (
    path === "/game" ||
    path.startsWith("/game/") ||
    path === "/lobby" ||
    path.startsWith("/lobby/") ||
    path === "/games" ||
    path.startsWith("/games/")
  );
}
