const WORLD_LINKS = [
  ["EVOFISH", "/game/", "primary"],
  ["CROWN//FRONT", "/games/crown-front/", "primary"],
  ["LOBBY", "/lobby/", "primary"],
  ["STORE", "/store", "primary"],
  ["ACCOUNT", "/account", "secondary"],
  ["ARSENAL", "/store", "secondary"],
  ["COSMETICS", "/store", "secondary"],
  ["ROADMAP", "/about", "tertiary"],
  ["NETWORK", "/about", "tertiary"],
] as const;

export function WorldIndex({ active }: { active: boolean }) {
  return (
    <nav className="bcExperienceWorldIndex" aria-label="BlackCrown worlds">
      {WORLD_LINKS.map(([label, href, priority], index) => (
        <a key={label} href={href} data-priority={priority} data-mobile-hidden={index > 4 ? "true" : undefined} tabIndex={active ? undefined : -1}>
          {label}
        </a>
      ))}
    </nav>
  );
}

