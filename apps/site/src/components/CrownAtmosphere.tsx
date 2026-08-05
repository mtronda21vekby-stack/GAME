import React from "react";
import { Icons } from "@blackcrown/assets";

/**
 * Lightweight cinematic background for the BlackCrown shell.
 * The scene is CSS-driven so it remains responsive and inexpensive on mobile.
 */
export function CrownAtmosphere() {
  return (
    <div className="bcAtmosphere" aria-hidden="true">
      <div className="bcAtmosphere__base" />
      <div className="bcAtmosphere__cursor" />

      <div className="bcAtmosphere__beam bcAtmosphere__beam--one" />
      <div className="bcAtmosphere__beam bcAtmosphere__beam--two" />
      <div className="bcAtmosphere__grid" />

      <div className="bcAtmosphere__orbit bcAtmosphere__orbit--one" />
      <div className="bcAtmosphere__orbit bcAtmosphere__orbit--two" />
      <div className="bcAtmosphere__orbit bcAtmosphere__orbit--three" />

      <div className="bcAtmosphere__sigil">
        <span className="bcAtmosphere__sigilHalo" />
        <span className="bcAtmosphere__sigilRing" />
        <img src={Icons.crown} width="96" height="96" alt="" />
      </div>

      <div className="bcAtmosphere__scan" />
      <div className="bcAtmosphere__grain" />
      <div className="bcAtmosphere__vignette" />
    </div>
  );
}

export default CrownAtmosphere;
