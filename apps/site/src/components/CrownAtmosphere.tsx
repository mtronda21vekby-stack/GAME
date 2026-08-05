import React from "react";
import MatrixBackground from "./MatrixBackground";

/**
 * Keeps the original BlackCrown Matrix identity while adding a lightweight
 * premium lighting/depth pass around the existing canvas animation.
 */
export function CrownAtmosphere() {
  return (
    <div className="bcMatrixLayer bcMatrixRebirth" aria-hidden="true">
      <MatrixBackground className="bcMatrixRebirth__canvas" intensity={1.06} />

      <div className="bcMatrixRebirth__depth" />
      <div className="bcMatrixRebirth__cursor" />
      <div className="bcMatrixRebirth__beam bcMatrixRebirth__beam--top" />
      <div className="bcMatrixRebirth__beam bcMatrixRebirth__beam--bottom" />
      <div className="bcMatrixRebirth__scan" />
      <div className="bcMatrixRebirth__grain" />
      <div className="bcMatrixRebirth__vignette" />
    </div>
  );
}

export default CrownAtmosphere;
