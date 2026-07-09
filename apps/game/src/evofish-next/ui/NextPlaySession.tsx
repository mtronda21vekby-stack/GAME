import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { NoMapQuickBarOverlay } from "./NoMapQuickBarOverlay";
import { PanelHardLayoutOverlay } from "./PanelHardLayoutOverlay";
import { RunCompleteOverlay } from "./RunCompleteOverlay";
import { SettingsPanelCompactOverlay } from "./SettingsPanelCompactOverlay";
import { TrenchMapEntryOverlay } from "./TrenchMapEntryOverlay";
import { TrenchRewardSafetyOverlay } from "./TrenchRewardSafetyOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <MapShaderOverlay />
      <NoMapQuickBarOverlay />
      <SettingsPanelCompactOverlay />
      <PanelHardLayoutOverlay />
      <TrenchMapEntryOverlay />
      <TrenchRewardSafetyOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
