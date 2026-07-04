import { currentSeasonId, json, seasonEndsAt } from "./_shared";

export const onRequestOptions = async () => json({ ok: true });

export const onRequestGet = async () => {
  const now = new Date();
  const seasonId = currentSeasonId(now);
  const endsAt = seasonEndsAt(now);
  return json({
    ok: true,
    season: {
      id: seasonId,
      title: seasonId.replace("season_", "Season ").replace("_w", " · Week "),
      endsAt,
      refreshSeconds: 25
    }
  });
};
