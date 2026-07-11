import React from "react";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";

const DEFAULT_SHOWCASE_BACKGROUND = new URL("../assets/skins/default-showcase-bg.jpg", import.meta.url).href;

type SkinPreviewProps = {
  skin: EvoFishSkinDefinition;
  form?: EvoFishFormId;
  size?: "sm" | "md" | "lg";
  variant?: "showcase" | "sprite";
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

function FallbackFish(props: { skin: EvoFishSkinDefinition; form: EvoFishFormId }) {
  const { skin, form } = props;
  if (form === "shark") return <Shark skin={skin} />;
  if (form === "megalodon") return <Mega skin={skin} />;
  return <Fish skin={skin} />;
}

function PreviewDefs({ skin }: { skin: EvoFishSkinDefinition }) {
  return (
    <defs>
      <linearGradient id="body" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={skin.palette.primary} />
        <stop offset="0.62" stopColor={skin.palette.secondary} />
        <stop offset="1" stopColor={skin.palette.shadow || skin.palette.accent} />
      </linearGradient>
    </defs>
  );
}

function staticAssetBox(form: EvoFishFormId) {
  if (form === "shark") return { w: 178, h: 86 };
  if (form === "megalodon") return { w: 186, h: 92 };
  return { w: 168, h: 84 };
}

function StaticPreview(props: { skin: EvoFishSkinDefinition; form: EvoFishFormId; assetPath?: string; showAsset: boolean; onAssetError: () => void }) {
  const { skin, form, assetPath, showAsset, onAssetError } = props;
  const box = staticAssetBox(form);

  return (
    <svg viewBox="0 0 256 144" role="img">
      <PreviewDefs skin={skin} />
      <rect width="256" height="144" rx="28" fill="#031827" />
      <circle cx="128" cy="72" r="64" fill={skin.palette.glow || skin.palette.accent} opacity="0.14" />
      <circle cx="128" cy="72" r="60" fill="none" stroke="rgba(129,229,255,.16)" strokeWidth="2" />
      {showAsset && assetPath ? (
        <g transform="translate(128 72)">
          <image href={assetPath} x={-box.w / 2} y={-box.h / 2} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" onError={onAssetError} />
        </g>
      ) : (
        <FallbackFish skin={skin} form={form} />
      )}
      <circle cx="40" cy="98" r="3.5" fill="rgba(190,245,255,.45)" />
      <circle cx="48" cy="95" r="5.5" fill="rgba(190,245,255,.18)" />
    </svg>
  );
}

function AnimatedSkinShowcase(props: { skin: EvoFishSkinDefinition; assetPath: string; form: EvoFishFormId; onAssetError: () => void }) {
  const { skin, assetPath, form, onAssetError } = props;
  const sceneStyle = {
    "--ef-skin-primary": skin.palette.primary,
    "--ef-skin-secondary": skin.palette.secondary,
    "--ef-skin-accent": skin.palette.accent,
    "--ef-skin-glow": skin.palette.glow || skin.palette.accent,
    "--ef-showcase-bg": `url("${DEFAULT_SHOWCASE_BACKGROUND}")`
  } as React.CSSProperties;

  return (
    <div className="efSkinShowcase" style={sceneStyle}>
      <div className="efSkinLightCone" />
      <div className="efSkinShaderBloom" />
      <div className="efSkinShaderFog" />
      <div className="efSkinBubbles"><span className="b1" /><span className="b2" /><span className="b3" /><span className="b4" /><span className="b5" /></div>
      <div className="efSkinSphere">
        <div className="efSphereGlass" />
        <div className="efSphereCaustics" />
        <div className="efSphereFishWrap"><img className={`efSphereFish ${form}`} src={assetPath} alt="" draggable={false} onError={onAssetError} /></div>
        <div className="efSphereHighlight" />
      </div>
      <div className="efSkinFloorGlow" />
    </div>
  );
}

const SKIN_PREVIEW_STYLE = `
.efSkinPreview{position:relative;width:100%;isolation:isolate}.efSkinPreview.sprite{display:grid;place-items:center;overflow:hidden}.efSkinPreview>svg{display:block;width:100%;height:auto;border-radius:28px}.efSkinPreview.sm>svg{border-radius:15px}.efSkinPreview.md{max-width:360px}.efSkinPreview.lg{width:min(560px,100%)}
.efSkinSpriteBox{width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;overflow:hidden}.efSkinSpriteImg{display:block;max-width:72%;max-height:54%;width:auto;height:auto;object-fit:contain;object-position:center center;margin:auto;filter:drop-shadow(0 18px 26px rgba(0,0,0,.32)) drop-shadow(0 0 16px rgba(53,216,255,.16));user-select:none;-webkit-user-drag:none}.efSkinPreview.form-shark .efSkinSpriteImg{max-width:94%;max-height:68%}.efSkinPreview.form-megalodon .efSkinSpriteImg{max-width:98%;max-height:72%}.efSkinSpriteSvg{display:block;width:100%;height:auto;filter:drop-shadow(0 18px 26px rgba(0,0,0,.32)) drop-shadow(0 0 16px rgba(53,216,255,.16))}
.efSkinShowcase{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:28px;background-image:linear-gradient(180deg,rgba(0,5,16,.03),rgba(0,7,18,.14)),var(--ef-showcase-bg);background-size:cover;background-position:center;background-repeat:no-repeat;border:1px solid rgba(151,229,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 14px 34px rgba(0,0,0,.26);contain:layout paint}.efSkinPreview.sm .efSkinShowcase{border-radius:15px}.efSkinShowcase:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 76%,rgba(68,230,255,.14),transparent 30%),linear-gradient(90deg,rgba(0,0,0,.18),transparent 16%,transparent 84%,rgba(0,0,0,.18));pointer-events:none}
.efSkinLightCone{position:absolute;left:50%;top:-4%;width:34%;height:58%;transform:translateX(-50%);background:linear-gradient(180deg,rgba(190,252,255,.28),rgba(95,225,255,.10) 52%,transparent);clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);opacity:.62;filter:blur(6px);pointer-events:none;animation:efLightSweep 5.6s ease-in-out infinite}.efSkinShaderBloom,.efSkinShaderFog{position:absolute;inset:0;pointer-events:none}.efSkinShaderBloom{background:radial-gradient(circle at 50% 6%,rgba(255,255,255,.24),rgba(120,238,255,.14) 14%,transparent 28%),radial-gradient(ellipse at 50% 88%,rgba(61,231,255,.24),rgba(30,160,255,.09) 34%,transparent 62%);filter:blur(4px) saturate(1.2);mix-blend-mode:screen;opacity:.7;animation:efShaderBloom 5.2s ease-in-out infinite}.efSkinShaderFog{inset:-6%;background:radial-gradient(ellipse at 24% 68%,rgba(140,234,255,.14),transparent 36%),radial-gradient(ellipse at 76% 62%,rgba(99,205,255,.14),transparent 34%),radial-gradient(ellipse at 50% 92%,rgba(76,231,255,.18),transparent 38%);filter:blur(12px);mix-blend-mode:screen;opacity:.62;animation:efShaderFog 8s ease-in-out infinite}
.efSkinSphere{position:absolute;left:50%;top:50%;width:52%;aspect-ratio:1;border-radius:999px;transform:translate(-50%,-50%);pointer-events:none}.efSkinPreview.sm .efSkinSphere{width:54%}.efSphereGlass{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 44% 8%,rgba(255,255,255,.18),rgba(255,255,255,.04) 20%,transparent 36%),linear-gradient(135deg,rgba(255,255,255,.05),transparent 42%,rgba(135,240,255,.06));box-shadow:0 0 0 1px rgba(132,236,255,.25),inset -12px -18px 30px rgba(0,0,0,.22),inset 10px 10px 18px rgba(161,244,255,.06),0 0 28px rgba(60,210,255,.18)}.efSphereCaustics{position:absolute;left:14%;right:14%;bottom:8%;height:34%;border-radius:50%;background:radial-gradient(ellipse at 48% 62%,rgba(118,240,255,.18),transparent 32%),radial-gradient(ellipse at 56% 76%,rgba(255,255,255,.12),transparent 18%);filter:blur(1.6px);opacity:.5;mix-blend-mode:screen;animation:efCaustics 5.2s ease-in-out infinite}
.efSphereFishWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2}.efSphereFish{display:block;width:auto;height:auto;max-width:72%;max-height:54%;object-fit:contain;object-position:center center;margin:auto;filter:drop-shadow(0 12px 16px rgba(0,0,0,.40)) drop-shadow(0 0 12px color-mix(in srgb,var(--ef-skin-glow) 46%,transparent));user-select:none;-webkit-user-drag:none;animation:efFishFloat 3.8s ease-in-out infinite}.efSphereFish.shark{max-width:132%;max-height:76%}.efSkinPreview.sm .efSphereFish.shark{max-width:150%;max-height:82%}.efSkinPreview.lg .efSphereFish.shark{max-width:136%;max-height:78%}.efSphereFish.megalodon{max-width:142%;max-height:80%}.efSkinPreview.sm .efSphereFish.megalodon{max-width:158%;max-height:86%}.efSphereHighlight{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,rgba(255,255,255,.08),transparent 31%,transparent 64%,rgba(126,235,255,.05));mix-blend-mode:screen;pointer-events:none}
.efSkinFloorGlow{position:absolute;left:50%;bottom:8%;width:42%;height:7%;transform:translateX(-50%);border-radius:999px;background:radial-gradient(ellipse,rgba(92,236,255,.38),rgba(54,190,255,.14) 50%,transparent 74%);filter:blur(7px);mix-blend-mode:screen;animation:efFloorGlow 4.8s ease-in-out infinite}.efSkinBubbles span{position:absolute;border-radius:999px;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.82),rgba(119,235,255,.24) 38%,transparent 72%);box-shadow:0 0 10px rgba(100,225,255,.18);animation:efBubbleRise 6.2s ease-in infinite}.efSkinBubbles .b1{left:8%;bottom:17%;width:3.6%;aspect-ratio:1;animation-delay:-1.4s}.efSkinBubbles .b2{right:8%;bottom:24%;width:4.4%;aspect-ratio:1;animation-delay:-3.3s}.efSkinBubbles .b3{right:15%;bottom:44%;width:2.5%;aspect-ratio:1;animation-delay:-.6s}.efSkinBubbles .b4{left:12%;bottom:58%;width:2.8%;aspect-ratio:1;animation-delay:-4.8s}.efSkinBubbles .b5{left:80%;bottom:67%;width:2.2%;aspect-ratio:1;animation-delay:-2.1s}
@keyframes efFishFloat{0%,100%{transform:translateY(0) rotate(-1deg) scale(1)}45%{transform:translateY(-3px) rotate(1deg) scale(1.02)}70%{transform:translateY(1px) rotate(-.5deg) scale(.995)}}@keyframes efCaustics{0%,100%{transform:translate3d(-1%,1%,0) scale(1);opacity:.36}50%{transform:translate3d(1%,-1%,0) scale(1.06);opacity:.56}}@keyframes efBubbleRise{0%{transform:translateY(22px) scale(.62);opacity:0}16%{opacity:.86}78%{opacity:.72}100%{transform:translateY(-118px) scale(1.12);opacity:0}}@keyframes efLightSweep{0%,100%{transform:translateX(-52%) skewX(-2deg);opacity:.64}50%{transform:translateX(-48%) skewX(3deg);opacity:.92}}@keyframes efFloorGlow{0%,100%{opacity:.55;transform:translateX(-50%) scaleX(1)}50%{opacity:.82;transform:translateX(-50%) scaleX(1.18)}}@keyframes efShaderBloom{0%,100%{opacity:.62;transform:scale(1)}50%{opacity:.84;transform:scale(1.03)}}@keyframes efShaderFog{0%,100%{transform:translate3d(-1%,.5%,0) scale(1);opacity:.56}50%{transform:translate3d(1.2%,-.8%,0) scale(1.04);opacity:.76}}
@media(prefers-reduced-motion:reduce){.efSkinShowcase *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`;

export function SkinPreview({ skin, form, size = "md", variant = "showcase", className }: SkinPreviewProps) {
  const resolvedForm = resolveForm(skin, form);
  const cls = ["efSkinPreview", `form-${resolvedForm}`, size, variant === "sprite" ? "sprite" : "", className].filter(Boolean).join(" ");
  const assetPath = skin.assetPath || skin.image;
  const [assetFailed, setAssetFailed] = React.useState(false);
  const showAsset = Boolean(assetPath && !assetFailed);

  React.useEffect(() => {
    setAssetFailed(false);
  }, [assetPath]);

  const onAssetError = () => setAssetFailed(true);

  if (variant === "sprite") {
    return (
      <div className={cls} aria-label={skin.name}>
        {showAsset && assetPath ? <div className="efSkinSpriteBox"><img className="efSkinSpriteImg" src={assetPath} alt="" draggable={false} onError={onAssetError} /></div> : <StaticPreview skin={skin} form={resolvedForm} showAsset={false} onAssetError={onAssetError} />}
        <style>{SKIN_PREVIEW_STYLE}</style>
      </div>
    );
  }

  return (
    <div className={cls} aria-label={skin.name}>
      {showAsset && assetPath ? <AnimatedSkinShowcase skin={skin} form={resolvedForm} assetPath={assetPath} onAssetError={onAssetError} /> : <StaticPreview skin={skin} form={resolvedForm} assetPath={assetPath || undefined} showAsset={showAsset} onAssetError={onAssetError} />}
      <style>{SKIN_PREVIEW_STYLE}</style>
    </div>
  );
}
