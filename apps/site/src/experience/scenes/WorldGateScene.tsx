import React from "react";
import { SceneCopy } from "../components/SceneCopy";
import { SceneLayer } from "../components/SceneLayer";
import type { SceneRuntimeProps } from "../types";

export function WorldGateScene({ active, reducedMotion }: SceneRuntimeProps) {
  return (
    <SceneLayer id="gate" active={active} reducedMotion={reducedMotion} tone="portal">
      <div className="bcCinematic__visual bcCinematic__visual--gate" aria-hidden="true">
        <div className="bcCinematic__tunnel">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </div>
        <div className="bcCinematic__gateRing bcCinematic__gateRing--outer" />
        <div className="bcCinematic__gateRing bcCinematic__gateRing--middle" />
        <div className="bcCinematic__gateRing bcCinematic__gateRing--inner" />
        <div className="bcCinematic__gateCore" />
        <div className="bcCinematic__gateOcclusion bcCinematic__gateOcclusion--left" />
        <div className="bcCinematic__gateOcclusion bcCinematic__gateOcclusion--right" />
      </div>
      <SceneCopy
        scene="gate"
        eyebrow="WORLD GATE / TRANSIT 01"
        title="ПРОЙТИ СКВОЗЬ КОРОНУ"
        body="Центральный core раскрывается, и камера входит в сеть миров BlackCrown."
      />
    </SceneLayer>
  );
}
