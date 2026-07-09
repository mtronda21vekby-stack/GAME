import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { HudPolishOverlay } from "./HudPolishOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
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
      <TrenchMapEntryOverlay />
      <TrenchRewardSafetyOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
