import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { HudPolishOverlay } from "./HudPolishOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <MapShaderOverlay />
      <HudPolishOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
