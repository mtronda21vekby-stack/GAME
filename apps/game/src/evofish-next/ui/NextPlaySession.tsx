import React from "react";
import { installFishOrientationPatch } from "../render/fishOrientationPatch";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { HudPolishOverlay } from "./HudPolishOverlay";
import { MapModalFixOverlay } from "./MapModalFixOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";

installFishOrientationPatch();

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <MapShaderOverlay />
      <MapModalFixOverlay />
      <HudPolishOverlay />
      <CraftQuickOverlay />
      <FpsCounterOverlay />
      <RunCompleteOverlay />
    </>
  );
}
