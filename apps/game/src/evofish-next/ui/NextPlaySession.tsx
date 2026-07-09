import React from "react";
import { installFishMaterialPatch } from "../render/fishMaterialPatch";
import { installFishOrientationPatch } from "../render/fishOrientationPatch";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { FpsCounterOverlay } from "./FpsCounterOverlay";
import { HudPolishOverlay } from "./HudPolishOverlay";
import { MapShaderOverlay } from "./MapShaderOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";

installFishOrientationPatch();
installFishMaterialPatch();

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
