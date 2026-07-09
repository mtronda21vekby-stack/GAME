import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { HudPolishOverlay } from "./HudPolishOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { MenuSettingsUxOverlay } from "./MenuSettingsUxOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";
import { TrenchMapEntryOverlay } from "./TrenchMapEntryOverlay";
import { TrenchRewardSafetyOverlay } from "./TrenchRewardSafetyOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <MapShaderOverlay />
      <HudPolishOverlay />
      <MenuSettingsUxOverlay />
      <TrenchMapEntryOverlay />
      <TrenchRewardSafetyOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
