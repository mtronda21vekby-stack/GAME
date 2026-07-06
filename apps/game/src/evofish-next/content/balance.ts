export const NEXT_BETA_BALANCE_VERSION = "beta-balance-post-21-v2";

export type NextBalanceTarget = {
  id: string;
  label: string;
  target: string;
  tuning: string;
};

export const NEXT_BETA_BALANCE_TARGETS: NextBalanceTarget[] = [
  {
    id: "first_skin",
    label: "Первый premium skin",
    target: "8–12 минут",
    tuning: "Жемчуг на карте стал стабильнее, ранние цены подняты мягко без pay-to-win."
  },
  {
    id: "first_mutation",
    label: "Первая платная мутация",
    target: "10–15 минут",
    tuning: "Кристаллы остаются редкими: основной путь — редкие pickups, боссы и задания."
  },
  {
    id: "post_21_enemy_ramp",
    label: "Баланс после 21 уровня",
    target: "NPC выше уровнем, награда заметно выше",
    tuning: "После LV 21 enemy threat, NPC level, HP и масса растут плавно; over-level рыбы дают усиленный XP, жемчуг и выше шанс коралла."
  },
  {
    id: "shark_unlock",
    label: "Открытие акулы",
    target: "20–30 минут активной игры",
    tuning: "Shark unlock перенесён в midgame, чтобы игрок быстрее увидел новую форму."
  },
  {
    id: "megalodon_unlock",
    label: "Открытие мегалодона",
    target: "60–90 минут накопленного прогресса",
    tuning: "Megalodon остаётся beta-endgame целью, не открывается слишком рано."
  },
  {
    id: "daily",
    label: "Daily quest",
    target: "5–12 минут",
    tuning: "Daily награды стали полезными, но не ломают кристальную экономику."
  },
  {
    id: "weekly",
    label: "Weekly quest",
    target: "3–5 игровых сессий",
    tuning: "Weekly цели снижены по кристаллам/артефактам, награды убраны из режима разгона экономики."
  }
];

export const NEXT_BETA_ECONOMY_TARGETS = {
  pearlsPerTenMinutes: "900–1 550",
  coralsPerTenMinutes: "1–4",
  artifactPerTenMinutes: "0–1",
  perkPerTenMinutes: "6–12"
} as const;
