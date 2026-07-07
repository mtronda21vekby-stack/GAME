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

function shouldUseAnimatedShowcase(form: EvoFishFormId) {
  return form === "fish";
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

function AnimatedSkinShowcase(props: { skin: EvoFishSkinDefinition; assetPath: string; onAssetError: () => void }) {
  const { skin, assetPath, onAssetError } = props;
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
      <div className="efSkinShaderDroplets">
        <span className="d1" />
        <span className="d2" />
        <span className="d3" />
        <span className="d4" />
        <span className="d5" />
        <span className="d6" />
      </div>
      <div className="efSkinShaderChromatic" />
      <div className="efSkinStars">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="efSkinDepthFish one" />
      <div className="efSkinDepthFish two" />
      <div className="efSkinBubbles">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
        <span className="b4" />
        <span className="b5" />
      </div>
      <div className="efSkinSphere">
        <div className="efSphereGlass" />
        <div className="efSphereCaustics" />
        <img className="efSphereFish" src={assetPath} alt="" draggable={false} onError={onAssetError} />
        <div className="efSphereHighlight" />
      </div>
      <div className="efSkinFloorGlow" />
    </div>
  );
}

const SKIN_PREVIEW_STYLE = `
.efSkinPreview{position:relative;width:100%;isolation:isolate}
.efSkinPreview.sprite{display:grid;place-items:center}
.efSkinSpriteImg{display:block;width:100%;height:auto;object-fit:contain;filter:drop-shadow(0 24px 34px rgba(0,0,0,.34)) drop-shadow(0 0 22px rgba(53,216,255,.18));user-select:none;-webkit-user-drag:none}
.efSkinSpriteSvg{display:block;width:100%;height:auto;filter:drop-shadow(0 24px 34px rgba(0,0,0,.34)) drop-shadow(0 0 22px rgba(53,216,255,.18))}
.efSkinPreview>svg{display:block;width:100%;height:auto;border-radius:28px}
.efSkinPreview.sm>svg{border-radius:15px}
.efSkinPreview.md{max-width:360px}
.efSkinPreview.lg{width:min(560px,100%)}
.efSkinShowcase{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:28px;background-image:linear-gradient(180deg,rgba(0,5,16,.03),rgba(0,7,18,.12)),var(--ef-showcase-bg);background-size:cover;background-position:center;background-repeat:no-repeat;border:1px solid rgba(151,229,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 18px 48px rgba(0,0,0,.30);transform:translateZ(0)}
.efSkinPreview.sm .efSkinShowcase{border-radius:15px}
.efSkinPreview.lg .efSkinShowcase{box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 26px 80px rgba(0,0,0,.38)}
.efSkinShowcase:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 1%,rgba(255,255,255,.35),rgba(125,235,255,.14) 17%,transparent 36%);opacity:.88;mix-blend-mode:screen;pointer-events:none}
.efSkinShowcase:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 76%,rgba(68,230,255,.16),transparent 30%),linear-gradient(90deg,rgba(0,0,0,.22),transparent 16%,transparent 84%,rgba(0,0,0,.22));pointer-events:none}
.efSkinLightCone{position:absolute;left:50%;top:-5%;width:36%;height:58%;transform:translateX(-50%);background:linear-gradient(180deg,rgba(190,252,255,.34),rgba(95,225,255,.13) 46%,transparent);clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);filter:blur(7px);mix-blend-mode:screen;animation:efLightSweep 5.8s ease-in-out infinite;opacity:.66}
.efSkinShaderBloom,.efSkinShaderFog,.efSkinShaderDroplets,.efSkinShaderChromatic{position:absolute;inset:0;pointer-events:none}
.efSkinShaderBloom{background:radial-gradient(circle at 50% 1%,rgba(255,255,255,.42),rgba(120,238,255,.20) 10%,transparent 28%),radial-gradient(ellipse at 50% 88%,rgba(61,231,255,.42),rgba(30,160,255,.13) 34%,transparent 62%);filter:blur(5px) saturate(1.3);mix-blend-mode:screen;opacity:.72;animation:efShaderBloom 5.6s ease-in-out infinite}
.efSkinShaderFog{inset:-8%;background:radial-gradient(ellipse at 24% 68%,rgba(140,234,255,.18),transparent 36%),radial-gradient(ellipse at 76% 62%,rgba(99,205,255,.16),transparent 34%),radial-gradient(ellipse at 50% 92%,rgba(76,231,255,.22),transparent 38%),radial-gradient(ellipse at 50% 28%,rgba(230,252,255,.10),transparent 42%);filter:blur(14px) saturate(1.18);mix-blend-mode:screen;opacity:.72;animation:efShaderFog 8.4s ease-in-out infinite}
.efSkinShaderDroplets span{position:absolute;border-radius:54% 46% 62% 38%;background:radial-gradient(circle at 34% 24%,rgba(255,255,255,.82),rgba(180,245,255,.20) 28%,rgba(70,205,255,.08) 62%,transparent 70%);border:1px solid rgba(180,245,255,.20);box-shadow:inset 0 1px 2px rgba(255,255,255,.28),0 0 10px rgba(95,220,255,.12);backdrop-filter:blur(1.5px);-webkit-backdrop-filter:blur(1.5px);opacity:.42;animation:efDropletDrift 7.6s ease-in-out infinite}
.efSkinShaderDroplets .d1{left:9%;top:13%;width:3.2%;height:5.6%;animation-delay:-.8s}.efSkinShaderDroplets .d2{left:15%;top:47%;width:2.2%;height:4.2%;animation-delay:-3.1s}.efSkinShaderDroplets .d3{right:11%;top:14%;width:3.6%;height:6.4%;animation-delay:-1.9s}.efSkinShaderDroplets .d4{right:18%;top:54%;width:2%;height:4%;animation-delay:-4.6s}.efSkinShaderDroplets .d5{left:49%;top:8%;width:2.1%;height:3.8%;animation-delay:-2.4s}.efSkinShaderDroplets .d6{right:42%;bottom:12%;width:2.5%;height:4.8%;animation-delay:-5.5s}
.efSkinShaderChromatic{background:radial-gradient(circle at 43% 45%,rgba(0,198,255,.15),transparent 28%),radial-gradient(circle at 57% 48%,rgba(92,122,255,.12),transparent 25%),linear-gradient(90deg,rgba(0,180,255,.08),transparent 36%,transparent 64%,rgba(115,241,255,.10));filter:blur(2px) saturate(1.5);mix-blend-mode:color-dodge;opacity:.48;animation:efShaderChromatic 7.2s ease-in-out infinite}
.efSkinSphere{position:absolute;left:50%;top:49%;width:48%;aspect-ratio:1;border-radius:999px;transform:translate(-50%,-50%);background:transparent;box-shadow:none;animation:efSphereBreath 4.8s ease-in-out infinite}
.efSkinPreview.sm .efSkinSphere{width:50%}
.efSkinPreview.lg .efSkinSphere{width:49%}
.efSphereGlass{position:absolute;inset:-1%;border-radius:inherit;background:radial-gradient(circle at 44% 8%,rgba(255,255,255,.20),rgba(255,255,255,.04) 20%,transparent 36%),linear-gradient(135deg,rgba(255,255,255,.08),transparent 40%,rgba(135,240,255,.08));box-shadow:inset 0 0 18px rgba(110,233,255,.16);mix-blend-mode:screen}
.efSphereCaustics{position:absolute;left:12%;right:12%;bottom:7%;height:34%;border-radius:50%;background:radial-gradient(ellipse at 48% 62%,rgba(118,240,255,.22),transparent 30%),radial-gradient(ellipse at 56% 76%,rgba(255,255,255,.16),transparent 18%),radial-gradient(ellipse at 38% 82%,rgba(58,220,255,.16),transparent 24%);filter:blur(1.6px) saturate(1.35);opacity:.46;mix-blend-mode:screen;animation:efCaustics 5.4s ease-in-out infinite}
.efSphereFish{position:absolute;left:50%;top:50%;width:56%;height:38%;object-fit:contain;transform:translate(-50%,-50%);filter:drop-shadow(0 14px 18px rgba(0,0,0,.42)) drop-shadow(0 0 14px color-mix(in srgb,var(--ef-skin-glow) 52%,transparent));animation:efFishFloat 3.8s ease-in-out infinite;user-select:none;-webkit-user-drag:none}
.efSkinPreview.sm .efSphereFish{width:69%;height:48%}
.efSphereHighlight{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,rgba(255,255,255,.12),transparent 31%,transparent 64%,rgba(126,235,255,.07));mix-blend-mode:screen;animation:efHighlight 6.4s ease-in-out infinite}
.efSkinFloorGlow{position:absolute;left:50%;bottom:8%;width:42%;height:7%;transform:translateX(-50%);border-radius:999px;background:radial-gradient(ellipse,rgba(92,236,255,.50),rgba(54,190,255,.18) 50%,transparent 74%);filter:blur(7px);mix-blend-mode:screen;animation:efFloorGlow 4.8s ease-in-out infinite}
.efSkinBubbles span{position:absolute;width:3.7%;aspect-ratio:1;border-radius:999px;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.85),rgba(119,235,255,.28) 36%,rgba(58,170,255,.10) 68%,transparent 72%);box-shadow:0 0 12px rgba(100,225,255,.22);animation:efBubbleRise 6.2s ease-in infinite}
.efSkinBubbles .b1{left:8%;bottom:17%;animation-delay:-1.4s}.efSkinBubbles .b2{right:8%;bottom:24%;width:4.6%;animation-delay:-3.3s}.efSkinBubbles .b3{right:15%;bottom:44%;width:2.6%;animation-delay:-.6s}.efSkinBubbles .b4{left:12%;bottom:58%;width:2.8%;animation-delay:-4.8s}.efSkinBubbles .b5{left:81%;bottom:67%;width:2.2%;animation-delay:-2.1s}
.efSkinStars i{position:absolute;width:3px;height:3px;border-radius:999px;background:rgba(111,234,255,.9);box-shadow:0 0 10px rgba(94,222,255,.85);animation:efStarPulse 3.4s ease-in-out infinite}
.efSkinStars i:nth-child(1){left:18%;top:30%;animation-delay:-1s}.efSkinStars i:nth-child(2){left:82%;top:25%;animation-delay:-2.1s}.efSkinStars i:nth-child(3){left:26%;top:70%;animation-delay:-.2s}.efSkinStars i:nth-child(4){left:70%;top:72%;animation-delay:-2.8s}.efSkinStars i:nth-child(5){left:44%;top:20%;animation-delay:-1.8s}.efSkinStars i:nth-child(6){left:58%;top:80%;animation-delay:-.7s}
.efSkinDepthFish{position:absolute;width:12%;height:6%;border-radius:60% 80% 80% 60%;background:linear-gradient(90deg,transparent,var(--ef-skin-secondary));opacity:.16;filter:blur(.5px);animation:efDepthDrift 9.4s ease-in-out infinite}
.efSkinDepthFish:before{content:"";position:absolute;left:-24%;top:18%;width:36%;height:64%;clip-path:polygon(100% 50%,0 0,22% 50%,0 100%);background:var(--ef-skin-secondary)}
.efSkinDepthFish.one{left:12%;top:31%}.efSkinDepthFish.two{right:11%;top:34%;transform:scaleX(-1);animation-delay:-4.2s}
@keyframes efFishFloat{0%,100%{transform:translate(-50%,-50%) rotate(-1.3deg) scale(1)}45%{transform:translate(-49%,-54%) rotate(1deg) scale(1.035)}70%{transform:translate(-51%,-48%) rotate(-.6deg) scale(.992)}}
@keyframes efSphereBreath{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 0 1px rgba(132,236,255,.34),inset -14px -20px 34px rgba(0,0,0,.32),inset 14px 12px 28px rgba(161,244,255,.12),0 0 42px rgba(60,210,255,.32)}50%{transform:translate(-50%,-51%) scale(1.025);box-shadow:0 0 0 1px rgba(166,245,255,.52),inset -14px -20px 34px rgba(0,0,0,.28),inset 14px 12px 32px rgba(161,244,255,.18),0 0 58px rgba(60,210,255,.44)}}
@keyframes efCaustics{0%,100%{transform:translate3d(-1%,1%,0) scale(1);opacity:.34}50%{transform:translate3d(1%,-1%,0) scale(1.08);opacity:.56}}
@keyframes efBubbleRise{0%{transform:translateY(22px) scale(.62);opacity:0}16%{opacity:.86}78%{opacity:.72}100%{transform:translateY(-118px) scale(1.12);opacity:0}}
@keyframes efLightSweep{0%,100%{transform:translateX(-52%) skewX(-2deg);opacity:.64}50%{transform:translateX(-48%) skewX(3deg);opacity:.95}}
@keyframes efHighlight{0%,100%{opacity:.66;transform:rotate(0deg)}50%{opacity:.92;transform:rotate(5deg)}}
@keyframes efFloorGlow{0%,100%{opacity:.55;transform:translateX(-50%) scaleX(1)}50%{opacity:.88;transform:translateX(-50%) scaleX(1.25)}}
@keyframes efStarPulse{0%,100%{opacity:.32;transform:scale(.72)}50%{opacity:1;transform:scale(1.22)}}
@keyframes efDepthDrift{0%,100%{transform:translateX(0);opacity:.10}50%{transform:translateX(18px);opacity:.20}}
@keyframes efShaderBloom{0%,100%{opacity:.62;transform:scale(1)}50%{opacity:.86;transform:scale(1.035)}}
@keyframes efShaderFog{0%,100%{transform:translate3d(-1.5%,.5%,0) scale(1);opacity:.58}50%{transform:translate3d(1.5%,-1%,0) scale(1.05);opacity:.82}}
@keyframes efDropletDrift{0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.30}45%{transform:translate3d(3px,6px,0) scale(1.08);opacity:.56}72%{transform:translate3d(-2px,10px,0) scale(.96);opacity:.38}}
@keyframes efShaderChromatic{0%,100%{opacity:.36;transform:translateX(-1.5%) scale(1.01)}50%{opacity:.58;transform:translateX(1.5%) scale(1.025)}}
@media(prefers-reduced-motion:reduce){.efSkinShowcase *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`;

export function SkinPreview({ skin, form, size = "md", variant = "showcase", className }: SkinPreviewProps) {
  const resolvedForm = resolveForm(skin, form);
  const cls = ["efSkinPreview", size, variant === "sprite" ? "sprite" : "", className].filter(Boolean).join(" ");
  const assetPath = skin.assetPath || skin.image;
  const [assetFailed, setAssetFailed] = React.useState(false);
  const showAsset = Boolean(assetPath && !assetFailed);
  const showAnimatedShowcase = Boolean(variant !== "sprite" && showAsset && assetPath && shouldUseAnimatedShowcase(resolvedForm));

  React.useEffect(() => {
    setAssetFailed(false);
  }, [assetPath]);

  if (variant === "sprite") {
    return (
      <div className={cls} aria-label={skin.name}>
        {showAsset && assetPath ? (
          <img className="efSkinSpriteImg" src={assetPath} alt="" draggable={false} onError={() => setAssetFailed(true)} />
        ) : (
          <svg className="efSkinSpriteSvg" viewBox="0 0 256 144" role="img">
            <defs>
              <linearGradient id="body" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor={skin.palette.primary} />
                <stop offset="0.62" stopColor={skin.palette.secondary} />
                <stop offset="1" stopColor={skin.palette.shadow || skin.palette.accent} />
              </linearGradient>
            </defs>
            {!showAsset && resolvedForm === "fish" ? <Fish skin={skin} /> : null}
            {!showAsset && resolvedForm === "shark" ? <Shark skin={skin} /> : null}
            {!showAsset && resolvedForm === "megalodon" ? <Mega skin={skin} /> : null}
          </svg>
        )}
        <style>{SKIN_PREVIEW_STYLE}</style>
      </div>
    );
  }

  return (
    <div className={cls} aria-label={skin.name}>
      {showAnimatedShowcase && assetPath ? (
        <AnimatedSkinShowcase skin={skin} assetPath={assetPath} onAssetError={() => setAssetFailed(true)} />
      ) : (
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
          {showAsset ? <image href={assetPath} x="28" y="26" width="200" height="92" preserveAspectRatio="xMidYMid meet" onError={() => setAssetFailed(true)} /> : null}
          {!showAsset && resolvedForm === "fish" ? <Fish skin={skin} /> : null}
          {!showAsset && resolvedForm === "shark" ? <Shark skin={skin} /> : null}
          {!showAsset && resolvedForm === "megalodon" ? <Mega skin={skin} /> : null}
        </svg>
      )}
      <style>{SKIN_PREVIEW_STYLE}</style>
    </div>
  );
}
