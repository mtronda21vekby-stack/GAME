import React from "react";
import MatrixBackground from "./MatrixBackground";

/**
 * Global BlackCrown atmosphere. The original Matrix remains the persistent
 * identity; brand-specific depth now lives in the homepage Crown Core instead
 * of an additional full-screen WebGL pass.
 */
export function CrownAtmosphere() {
  return (
    <div className="bcMatrixLayer bcMatrixRebirth" aria-hidden="true">
      <MatrixBackground className="bcMatrixRebirth__canvas" intensity={0.94} />

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
