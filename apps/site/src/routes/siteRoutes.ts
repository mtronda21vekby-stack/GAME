import React from "react";
import { experienceConfig, isNexusRouteEnabled } from "../experience/experienceConfig";
import { HomeV3 } from "./HomeV3";
import { SITE_ROUTE_METADATA, type SitePath } from "./routeMetadata";

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

const components: Record<SitePath, React.ComponentType> = {
  "/": experienceConfig.mode === "home" ? NexusLab : HomeV3,
  "/about": About,
  "/support": Support,
  "/privacy": Privacy,
  "/terms": Terms,
  "/store": Store,
  "/cart": Cart,
  "/checkout": Checkout,
  "/checkout/success": CheckoutSuccess,
  "/account": Account,
  "/admin": Admin,
};

const coreRoutes = SITE_ROUTE_METADATA.map((route) => ({ ...route, component: components[route.path] }));

export const SITE_ROUTES = isNexusRouteEnabled()
  ? [
      ...coreRoutes,
      {
        path: "/nexus-lab" as const,
        component: NexusLab,
        metadata: {
          title: "Digital Crown Nexus Lab — BlackCrown",
          description: "Локальный WebGL-прототип BlackCrown Digital Crown Nexus.",
          chrome: { dock: false, footer: false, music: false },
          noIndex: true,
        },
      },
    ]
  : coreRoutes;
const routeByPath = new Map<string, (typeof SITE_ROUTES)[number]>(SITE_ROUTES.map((route) => [route.path, route]));

export function getRouteDefinition(path: string) {
  return routeByPath.get(path);
}

export { isExternalAppPath, isSitePath, SITE_PATHS } from "./routeMetadata";
export type { SitePath } from "./routeMetadata";
