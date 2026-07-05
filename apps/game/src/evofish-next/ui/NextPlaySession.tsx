import React from "react";
import { NextPlaytest } from "./NextPlaytest";
import { RunCompleteOverlay } from "./RunCompleteOverlay";

export function NextPlaySession() {
  return (
    <>
      <NextPlaytest />
      <RunCompleteOverlay />
    </>
  );
}
