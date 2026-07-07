import React from "react";
import { CraftQuickOverlay } from "./CraftQuickOverlay";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <CraftQuickOverlay />
      <RunCompleteOverlay />
    </>
  );
}
