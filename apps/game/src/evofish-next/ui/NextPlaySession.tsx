import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { NoMapQuickBarOverlay } from "./NoMapQuickBarOverlay";
import { PanelCanvasThrottleOverlay } from "./PanelCanvasThrottleOverlay";
import { PanelPerformanceOverlay } from "./PanelPerformanceOverlay";
import { RunCompleteOverlay } from "./RunCompleteOverlay";
import { TrenchMapEntryOverlay } from "./TrenchMapEntryOverlay";
import { TrenchRewardSafetyOverlay } from "./TrenchRewardSafetyOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <MapShaderOverlay />
      <NoMapQuickBarOverlay />
      <PanelPerformanceOverlay />
      <PanelCanvasThrottleOverlay />
      <TrenchMapEntryOverlay />
      <TrenchRewardSafetyOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
