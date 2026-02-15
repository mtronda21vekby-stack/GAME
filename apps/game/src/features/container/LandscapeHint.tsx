import React, { useEffect, useMemo, useState } from "react";

function isMobileLikely(): boolean {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod|Android/i.test(ua);
}

function getPortrait(): boolean {
  // Prefer screen.orientation where available
  const anyScreen: any = window.screen as any;
  const type = anyScreen?.orientation?.type as string | undefined;
  if (type) return type.includes("portrait");
  // Fallback: compare viewport
  return window.innerHeight > window.innerWidth;
}

export function LandscapeHint(props: { enabled?: boolean }) {
  const enabled = props.enabled ?? true;
  const [dismissed, setDismissed] = useState(false);
  const [portrait, setPortrait] = useState(false);

  const shouldShow = useMemo(() => {
    if (!enabled) return false;
    if (dismissed) return false;
    if (!isMobileLikely()) return false;
    return portrait;
  }, [enabled, dismissed, portrait]);

  useEffect(() => {
    const update = () => setPortrait(getPortrait());
    update();

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update as any, { passive: true });

    // Some browsers support orientationchange via screen.orientation
    const anyScreen: any = window.screen as any;
    const so = anyScreen?.orientation;
    if (so?.addEventListener) so.addEventListener("change", update, { passive: true });

    return () => {
      window.removeEventListener("resize", update as any);
      window.removeEventListener("orientationchange", update as any);
      if (so?.removeEventListener) so.removeEventListener("change", update as any);
    };
  }, []);

  if (!shouldShow) return null;

  return (
    <div className="bcLsHint">
      <div className="bcLsCard">
        <div className="bcLsIcon" aria-hidden="true">
          <div className="bcPhone" />
          <div className="bcArrow" />
        </div>

        <div className="bcLsText">
          <div className="bcLsTitle">Лучше в горизонтали</div>
          <div className="bcLsBody">
            Поверни телефон в <b>Landscape</b> — будет больше обзора и комфортнее управление.
          </div>
        </div>

        <button className="bcLsBtn" onClick={() => setDismissed(true)}>
          Понял
        </button>
      </div>

      <style>{`
        .bcLsHint{
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          z-index: 10000;
          pointer-events: none;
        }
        .bcLsCard{
          pointer-events: auto;
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid var(--stroke);
          background: rgba(0,0,0,0.28);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: var(--text);
          box-shadow: 0 18px 60px rgba(0,0,0,0.35);
        }

        .bcLsIcon{
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid var(--stroke);
          background: rgba(255,255,255,0.06);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .bcPhone{
          width: 16px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.20);
          background: rgba(255,255,255,0.06);
          transform: rotate(0deg);
          transform-origin: center;
          will-change: transform;
          animation: bcRotatePhone 1.7s ease-in-out infinite;
        }
        @keyframes bcRotatePhone{
          0%{ transform: rotate(0deg); opacity: 0.9; }
          50%{ transform: rotate(90deg); opacity: 1; }
          100%{ transform: rotate(0deg); opacity: 0.9; }
        }

        .bcArrow{
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid rgba(120,160,255,0.28);
          background: linear-gradient(180deg, rgba(120,160,255,0.40), rgba(120,160,255,0.18));
          right: 6px;
          bottom: 6px;
          opacity: 0.9;
        }

        .bcLsText{ flex: 1 1 auto; min-width: 0; }
        .bcLsTitle{ font-weight: 900; letter-spacing: -0.01em; }
        .bcLsBody{
          margin-top: 2px;
          font-size: 13px;
          opacity: 0.86;
          line-height: 1.35;
        }

        .bcLsBtn{
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: var(--text);
          font-weight: 850;
          cursor: pointer;
          flex: 0 0 auto;
        }
      `}</style>
    </div>
  );
}
