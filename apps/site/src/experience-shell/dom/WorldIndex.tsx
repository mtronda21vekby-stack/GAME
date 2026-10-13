import { BALLCROWN_GAME_PATH, EVOFISH_GAME_PATH } from "../../lib/gameRoutes";

const WORLD_LINKS = [
  ["BALLCROWN", BALLCROWN_GAME_PATH, "primary"],
  ["EVOFISH", EVOFISH_GAME_PATH, "primary"],
  ["CROWN//FRONT", "/games/crown-front/", "primary"],
  ["LOBBY", "/lobby/", "primary"],
  ["STORE", "/store", "primary"],
  ["ACCOUNT", "/account", "secondary"],
] as const;

export function WorldIndex({ active }: { active: boolean }) {
  return (
    <nav className="bcExperienceWorldIndex" aria-label="BlackCrown worlds">
      {WORLD_LINKS.map(([label, href, priority]) => (
        <a key={label} href={href} data-priority={priority} tabIndex={active ? undefined : -1}>
          {label}
        </a>
      ))}
    </nav>
  );
}

