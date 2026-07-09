import React from "react";
import { DeepTreasuresHub as DeepTreasuresHubV2 } from "./DeepTreasuresHubV2";

export function DeepTreasuresHub() {
  return (
    <>
      <DeepTreasuresHubV2 />
      <style>{`
        .efCaseTrack{left:50%!important;transform:translate3d(0,0,0)!important}.efCaseTrack.spin{transition:transform 3.45s cubic-bezier(.08,.82,.12,1)!important;transform:translate3d(calc(-1 * var(--target)),0,0)!important}.efCaseTrack.done{transform:translate3d(calc(-1 * var(--target)),0,0)!important}
      `}</style>
    </>
  );
}

export default DeepTreasuresHub;
