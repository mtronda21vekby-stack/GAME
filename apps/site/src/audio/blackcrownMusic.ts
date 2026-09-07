export const BLACKCROWN_MUSIC_SRC = "https://cdn1.suno.ai/9ffd5c5a-9995-47da-bf04-c212a6b02804.mp3";

export const BLACKCROWN_MUSIC_COMMAND = "blackcrown:music-command";

export type BlackCrownMusicCommand = { enabled: boolean };

/** Keeps the canonical music player separate from scroll-driven ambience. */
export function setBlackCrownMusicEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<BlackCrownMusicCommand>(BLACKCROWN_MUSIC_COMMAND, {
    detail: { enabled },
  }));
}
