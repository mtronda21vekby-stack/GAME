import React, { useEffect, useMemo } from "react";
import { Icons } from "@blackcrown/assets";
import { Button } from "./Button";

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  ariaDescription?: string;
}) {
  const id = useMemo(() => `m_${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}_t`}
      aria-describedby={props.ariaDescription ? `${id}_d` : undefined}
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.50)",
        zIndex: 50
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="glassStrong bc-motion" style={{ width: "min(560px, 100%)", padding: "18px 18px 16px" }}>
        <div className="bc-row" style={{ justifyContent: "space-between" }}>
          <div className="bc-col" style={{ gap: 6 }}>
            <div id={`${id}_t`} className="bc-h2">{props.title}</div>
            {props.ariaDescription ? <div id={`${id}_d`} className="bc-p">{props.ariaDescription}</div> : null}
          </div>
          <Button
            variant="ghost"
            ariaLabel="Close"
            leftIconSrc={Icons.close}
            onClick={props.onClose}
          >
            Close
          </Button>
        </div>

        <div style={{ marginTop: 14 }} />
        {props.children}

        {props.footer ? (
          <>
            <div style={{ marginTop: 16 }} className="bc-divider" />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {props.footer}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
