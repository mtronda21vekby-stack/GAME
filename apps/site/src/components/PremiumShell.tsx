import React from "react";

type Props = {
  background?: React.ReactNode; // сюда можно передать MatrixBackground
  children: React.ReactNode;
};

/**
 * Premium app shell:
 * - safe-area aware
 * - stable iOS scroll / no white gaps
 * - layered glass with vignette + subtle noise
 * - minimal JS, compositor-friendly
 */
export function PremiumShell({ background, children }: Props) {
  return (
    <div className="bcShell">
      <div className="bcShellBg" aria-hidden="true">
        {background}
      </div>

      <div className="bcShellFx" aria-hidden="true">
        <div className="bcShellVignette" />
        <div className="bcShellNoise" />
      </div>

      <div className="bcShellContent">{children}</div>
    </div>
  );
}

export default PremiumShell;
