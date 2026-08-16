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
  "/account/telegram",
  "/admin",
] as const;

export type SitePath = (typeof SITE_PATHS)[number];

export function normalizePath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export type RouteChrome = {
  dock: boolean;
  footer: boolean;
  music: boolean;
};

export type RouteMetadataDefinition = {
  path: SitePath;
  metadata: {
    title: string;
    description: string;
    chrome: RouteChrome;
    noIndex?: boolean;
  };
};

const standardChrome: RouteChrome = { dock: true, footer: true, music: true };
const focusedChrome: RouteChrome = { dock: false, footer: false, music: false };

export const SITE_ROUTE_METADATA: readonly RouteMetadataDefinition[] = [
  {
    path: "/",
    metadata: {
      title: "BlackCrown — Interactive Worlds",
      description: "BlackCrown объединяет игровые миры, Store и профиль игрока в единой интерактивной сети.",
      chrome: standardChrome,
    },
  },
  {
    path: "/about",
    metadata: {
      title: "О платформе — BlackCrown",
      description: "Принципы, игровые направления и развитие платформы BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/support",
    metadata: {
      title: "Поддержка — BlackCrown",
      description: "Помощь с аккаунтом, покупками и игровыми продуктами BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/privacy",
    metadata: {
      title: "Privacy — BlackCrown",
      description: "Политика конфиденциальности BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/terms",
    metadata: {
      title: "Terms — BlackCrown",
      description: "Условия использования сервисов BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/store",
    metadata: {
      title: "Store — BlackCrown",
      description: "Каталог цифровых предметов и игровых миров BlackCrown.",
      chrome: standardChrome,
    },
  },
  {
    path: "/cart",
    metadata: {
      title: "Корзина — BlackCrown",
      description: "Корзина цифровых предметов BlackCrown.",
      chrome: standardChrome,
      noIndex: true,
    },
  },
  {
    path: "/checkout",
    metadata: {
      title: "Оформление заказа — BlackCrown",
      description: "Серверная проверка и тестовое оформление заказа BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
  {
    path: "/checkout/success",
    metadata: {
      title: "Заказ выполнен — BlackCrown",
      description: "Статус выполнения заказа BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
  {
    path: "/account",
    metadata: {
      title: "Аккаунт — BlackCrown",
      description: "Профиль, коллекция и доступы игрока BlackCrown.",
      chrome: standardChrome,
      noIndex: true,
    },
  },
  {
    path: "/account/telegram",
    metadata: {
      title: "Telegram Bridge — BlackCrown",
      description: "Защищённая привязка Telegram-бота к аккаунту BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
  {
    path: "/admin",
    metadata: {
      title: "Admin — BlackCrown",
      description: "Административная консоль BlackCrown.",
      chrome: focusedChrome,
      noIndex: true,
    },
  },
] as const;

const metadataByPath = new Map<string, RouteMetadataDefinition>(SITE_ROUTE_METADATA.map((route) => [route.path, route]));

export function getSiteRouteMetadata(path: string) {
  return metadataByPath.get(path);
}

export function isSitePath(path: string): path is SitePath {
  return metadataByPath.has(path);
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
