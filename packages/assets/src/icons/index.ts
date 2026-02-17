// packages/assets/src/icons/index.ts
const u = (rel: string) => new URL(rel, import.meta.url).href;

export const Icons = {
  // Brand
  crown: u("./brand/crown.svg"),

  // UI
  play: u("./ui/play.svg"),
  arrowLeft: u("./ui/arrowLeft.svg"),
  arrowRight: u("./ui/arrowRight.svg"),
  user: u("./ui/user.svg"),
  cart: u("./ui/cart.svg"),
  heart: u("./ui/heart.svg"),
  chat: u("./ui/chat.svg"),
  settings: u("./ui/settings.svg"),
  soundOff: u("./ui/soundOff.svg"),
  soundOn: u("./ui/soundOn.svg"),
  close: u("./ui/close.svg"),
  chevronDown: u("./ui/chevronDown.svg"),

  // Fallback (на случай если где-то нужно)
  fallback: u("./ui/fallback.svg"),
} as const;
