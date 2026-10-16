export type PlatformGame = {
  id: string;
  title: string;
  genre: "Экшн" | "Исследование" | "Симуляторы";
  status: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  detail: string;
};

/** One catalog for the home page and /games/. Runtime paths are intentionally external to the site router. */
export const platformGames: readonly PlatformGame[] = [
  {
    id: "ballcrown", title: "Ballcrown", genre: "Экшн", status: "АРЕНА / КАМПАНИЯ",
    description: "Арена, кампания и свой персонаж. Выбирай снаряжение и вступай в бой.",
    image: "/media/platform/ballcrown-menu.webp", imageAlt: "Главное меню Ballcrown: боец в броне на космической станции",
    href: "/games/ballcrown/", detail: "Клавиатура · Touch · Геймпад",
  },
  {
    id: "evofish", title: "EvoFish Next", genre: "Исследование", status: "В БРАУЗЕРЕ",
    description: "Исследуй океан, развивай своё существо и открывай новые формы.",
    image: "/media/platform/evofish-next.webp", imageAlt: "Подводная станция из EvoFish Next",
    href: "/game/?mode=next", detail: "Океан · Эволюция",
  },
  {
    id: "quiet-valley", title: "Quiet Valley", genre: "Симуляторы", status: "АЛЬФА",
    description: "Своя долина в спокойном ритме. Выращивай растения, заботься о животных и знакомься с жителями.",
    image: "/media/platform/quiet-valley.jpg", imageAlt: "Игровой кадр Quiet Valley: ферма с грядками, домами и животными",
    href: "/games/quiet-valley/", detail: "3D-ферма · Своя долина",
  },
  {
    id: "crown-front", title: "CROWN//FRONT", genre: "Экшн", status: "ЗАКРЫТАЯ АЛЬФА",
    description: "Тактический фронт BLACKCROWN. Ранняя WebGL-сборка: управление и правила — на странице запуска.",
    image: "/media/platform/crown-front.webp", imageAlt: "Реальный игровой экран ранней версии CROWN FRONT",
    href: "/games/crown-front/", detail: "Ранняя сборка · WebGL",
  },
];
