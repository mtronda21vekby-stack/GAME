import React from "react";
import { setBlackCrownMusicEnabled } from "../audio/blackcrownMusic";
import { experienceConfig, type BlackCrownCrownReviewSelection, type BlackCrownExperienceQuality } from "./experienceConfig";
import { ExperienceContext, type ExperienceRuntimeControl } from "./ExperienceContext";
import { INITIAL_EXPERIENCE_METRICS, INITIAL_SCROLL_SNAPSHOT, type ExperienceBootStage } from "./types";

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const canvasHostRef = React.useRef<HTMLDivElement>(null);
  const storyRef = React.useRef<HTMLElement>(null);
  const runtimeRef = React.useRef<ExperienceRuntimeControl | null>(null);
  const [snapshot, setSnapshot] = React.useState(INITIAL_SCROLL_SNAPSHOT);
  const [metrics, setMetrics] = React.useState(INITIAL_EXPERIENCE_METRICS);
  const [bootStage, setBootStage] = React.useState<ExperienceBootStage>("idle");
  const [entered, setEntered] = React.useState(false);
  const [soundEnabledState, setSoundEnabledState] = React.useState(false);
  const [requestedQuality, setRequestedQualityState] = React.useState<BlackCrownExperienceQuality>(experienceConfig.quality);
  const [webglAvailable, setWebglAvailable] = React.useState(true);
  const soundEnabledRef = React.useRef(soundEnabledState);
  const requestedQualityRef = React.useRef(requestedQuality);
  soundEnabledRef.current = soundEnabledState;
  requestedQualityRef.current = requestedQuality;

  const setRuntime = React.useCallback((runtime: ExperienceRuntimeControl | null) => {
    runtimeRef.current = runtime;
    if (runtime) {
      runtime.setQuality(requestedQualityRef.current);
      runtime.setSoundEnabled(soundEnabledRef.current);
    }
  }, []);

  const enter = React.useCallback(() => {
    setEntered(true);
    try { sessionStorage.setItem("bc.nexus.entered.v1", "1"); } catch { /* private storage */ }
  }, []);

  const setSoundEnabled = React.useCallback((enabled: boolean) => {
    setBlackCrownMusicEnabled(enabled);
    setSoundEnabledState(enabled);
    runtimeRef.current?.setSoundEnabled(enabled);
  }, []);

  const setRequestedQuality = React.useCallback((quality: BlackCrownExperienceQuality) => {
    setRequestedQualityState(quality);
    runtimeRef.current?.setQuality(quality);
  }, []);

  const resetPerformanceSample = React.useCallback(() => {
    runtimeRef.current?.resetPerformanceSample();
  }, []);

  const setCrownAsset = React.useCallback((asset: BlackCrownCrownReviewSelection) => {
    runtimeRef.current?.setCrownAsset(asset);
  }, []);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem("bc.nexus.entered.v1") === "1") setEntered(true);
    } catch {
      // Keep the explicit boot action when session storage is unavailable.
    }
  }, []);

  const value = React.useMemo(() => ({
    canvasHostRef,
    storyRef,
    snapshot,
    metrics,
    bootStage,
    entered,
    soundEnabled: soundEnabledState,
    requestedQuality,
    webglAvailable,
    setRuntime,
    setSnapshot,
    setMetrics,
    setBootStage,
    setWebglAvailable,
    enter,
    setSoundEnabled,
    setRequestedQuality,
    resetPerformanceSample,
    setCrownAsset,
  }), [
    bootStage,
    enter,
    entered,
    metrics,
    requestedQuality,
    resetPerformanceSample,
    setCrownAsset,
    setRequestedQuality,
    setRuntime,
    setSoundEnabled,
    snapshot,
    soundEnabledState,
    webglAvailable,
  ]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}
