export const EXPERIENCE_WORLD_LINKS = [
  ["EVOFISH", "/game/", "primary"],
  ["CROWN//FRONT", "/games/crown-front/", "primary"],
  ["STORE", "/store", "primary"],
  ["LOBBY", "/lobby/", "primary"],
  ["ACCOUNT", "/account", "secondary"],
] as const;

export function WorldIndex({ active }: { active: boolean }) {
  return (
    <nav className="bcExperienceWorldIndex" aria-label="BlackCrown worlds">
      {EXPERIENCE_WORLD_LINKS.map(([label, href, priority]) => (
        <a key={label} href={href} data-priority={priority} tabIndex={active ? undefined : -1}>
          {label}
        </a>
      ))}
    </nav>
  );
}
