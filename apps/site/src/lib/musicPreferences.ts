/** A missing preference is not a deliberate zero-volume choice. */
export const DEFAULT_MUSIC_VOLUME = 0.42;

export function parseMusicVolume(raw: string | null): number {
  if (raw === null || raw.trim() === "") return DEFAULT_MUSIC_VOLUME;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : DEFAULT_MUSIC_VOLUME;
}
