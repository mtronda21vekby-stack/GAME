import React from "react";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";

type SkinPreviewProps = {
  skin: EvoFishSkinDefinition;
  form?: EvoFishFormId;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function resolveForm(skin: EvoFishSkinDefinition, form?: EvoFishFormId): EvoFishFormId {
  if (form) return form;
  return skin.form === "any" ? "fish" : skin.form;
}

function Pattern(props: { skin: EvoFishSkinDefinition; form: EvoFishFormId }) {
  const { skin, form } = props;
  const accent = skin.palette.accent;

  if (skin.pattern === "none") return null;

  if (["stripes", "tiger"].includes(skin.pattern)) {
    return (
      <g opacity="0.42" stroke={accent} strokeWidth="6" strokeLinecap="round">
        <path d="M82 42 L68 96" />
        <path d="M112 36 L98 104" />
        <path d="M144 42 L130 100" />
        {form !== "fish" ? <path d="M176 52 L160 96" /> : null}
      </g>
    );
  }

  if (["koi", "royal", "stars"].includes(skin.pattern)) {
    return (
      <g opacity="0.68" fill={accent}>
        <circle cx="92" cy="62" r="8" />
        <circle cx="126" cy="80" r="10" opacity="0.75" />
        <circle cx="160" cy="58" r="5" />
        <path d="M102 96 C124 84 146 98 170 84" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }

  if (["scales", "circuit"].includes(skin.pattern)) {
    return (
      <g opacity="0.45" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M82 58 H120 L136 72 H174" />
        <path d="M92 88 H132 L150 78" />
        <circle cx="120" cy="58" r="4" fill={accent} />
        <circle cx="174" cy="72" r="4" fill={accent} />
      </g>
    );
  }

  if (["bone", "plates", "cracks"].includes(skin.pattern)) {
    return (
      <g opacity="0.56" stroke={accent} strokeWidth="5" strokeLinecap="round">
        <path d="M78 60 C112 48 144 52 176 64" />
        <path d="M88 88 C118 76 148 78 176 92" />
        <path d="M112 50 L100 98" />
        <path d="M148 54 L136 102" />
      </g>
    );
  }

  if (["glowdot", "glow"].includes(skin.pattern)) {
    return (
      <g fill={accent} opacity="0.88">
        <circle cx="76" cy="40" r="8" />
        <circle cx="106" cy="54" r="4" />
        <circle cx="138" cy="48" r="3" />
      </g>
    );
  }

  if (skin.pattern === "pirate") {
    return (
      <g stroke={accent} strokeLinecap="round">
        <circle cx="166" cy="58" r="8" fill="#111827" stroke="none" />
        <path d="M102 94 C126 106 150 104 170 90" strokeWidth="4" fill="none" opacity="0.68" />
      </g>
    );
  }

  return null;
}

function Fish({ skin }: { skin: EvoFishSkinDefinition }) {
  return (
    <g>
      <path d="M62 72 L28 48 L36 72 L28 96 Z" fill={skin.palette.secondary} />
      <path d="M58 72 C88 30 154 30 202 72 C154 114 88 114 58 72Z" fill="url(#body)" />
      <path d="M88 48 C118 36 158 42 184 66" stroke="rgba(255,255,255,.28)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Pattern skin={skin} form="fish" />
      <circle cx="166" cy="62" r="10" fill="#f8fbff" />
      <circle cx="171" cy="63" r="4" fill="#07131f" />
    </g>
  );
}

function Shark({ skin }: { skin: EvoFishSkinDefinition }) {
  return (
    <g>
      <path d="M66 74 L24 48 L36 74 L24 100 Z" fill={skin.palette.secondary} />
      <path d="M72 76 C108 28 182 34 224 70 C184 110 112 118 72 76Z" fill="url(#body)" />
      <path d="M112 48 L138 14 L152 58 Z" fill={skin.palette.secondary} opacity="0.78" />
      <path d="M126 96 L104 126 L156 104 Z" fill={skin.palette.secondary} opacity="0.52" />
      <Pattern skin={skin} form="shark" />
      <path d="M186 80 C204 78 216 76 224 72 C214 92 198 98 184 94" fill="rgba(5,10,14,.48)" />
      <circle cx="180" cy="62" r="8" fill="#f8fbff" />
      <circle cx="184" cy="63" r="3.5" fill="#07131f" />
    </g>
  );
}

function Mega({ skin }: { skin: EvoFishSkinDefinition }) {
  return (
    <g>
      <path d="M60 78 L18 44 L30 78 L18 112 Z" fill={skin.palette.secondary} />
      <path d="M64 78 C110 18 198 26 232 70 C202 120 110 132 64 78Z" fill="url(#body)" />
      <path d="M112 48 L142 6 L160 62 Z" fill={skin.palette.secondary} opacity="0.82" />
      <path d="M124 102 L96 136 L170 108 Z" fill={skin.palette.secondary} opacity="0.56" />
      <Pattern skin={skin} form="megalodon" />
      <path d="M188 82 C208 80 224 76 236 70 C224 98 204 108 184 100" fill="rgba(5,10,14,.58)" />
      <circle cx="178" cy="58" r="8" fill="#f8fbff" />
      <circle cx="183" cy="59" r="3.5" fill="#07131f" />
    </g>
  );
}

export function SkinPreview({ skin, form, size = "md", className }: SkinPreviewProps) {
  const resolvedForm = resolveForm(skin, form);
  const cls = ["efSkinPreview", size, className].filter(Boolean).join(" ");

  return (
    <div className={cls} aria-label={skin.name}>
      <svg viewBox="0 0 256 144" role="img">
        <defs>
          <linearGradient id="body" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={skin.palette.primary} />
            <stop offset="0.62" stopColor={skin.palette.secondary} />
            <stop offset="1" stopColor={skin.palette.shadow || skin.palette.accent} />
          </linearGradient>
        </defs>
        <rect width="256" height="144" rx="28" fill="#031827" />
        <circle cx="128" cy="72" r="66" fill={skin.palette.glow || skin.palette.accent} opacity="0.14" />
        {resolvedForm === "fish" ? <Fish skin={skin} /> : null}
        {resolvedForm === "shark" ? <Shark skin={skin} /> : null}
        {resolvedForm === "megalodon" ? <Mega skin={skin} /> : null}
      </svg>
    </div>
  );
}
