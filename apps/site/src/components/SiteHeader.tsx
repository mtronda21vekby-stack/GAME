import React from "react";
import { PlatformHeader } from "./platform/PlatformHeader";

type ActiveKey = "home" | "about" | "store" | "support" | "privacy" | "terms" | "account" | "telegram";
type SiteHeaderProps = {
  active?: ActiveKey;
  showLobby?: boolean;
  showStoreButton?: boolean;
  showAccountPill?: boolean;
};

export function SiteHeader({ active }: SiteHeaderProps) {
  const platformActive = active === "home" ? "games" : active === "telegram" ? "account" : active;
  const selected =
    platformActive === "games" ||
    platformActive === "store" ||
    platformActive === "about" ||
    platformActive === "account"
      ? platformActive
      : undefined;

  return <PlatformHeader active={selected} />;
}
