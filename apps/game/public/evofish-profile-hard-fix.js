(() => {
  const STYLE_ID = "evofish-profile-hard-fix-style";

  const css = `
    body:has(.efProfilesPage) {
      overflow-x: hidden !important;
      background: #020915 !important;
    }

    .efProfilesPage {
      min-height: 100dvh !important;
      overflow-x: hidden !important;
      color: #eaf7ff !important;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(53,216,255,.20), transparent 42%),
        linear-gradient(180deg, rgba(2,9,21,.22), rgba(2,9,21,.84)),
        url('/game/assets/lobby/lobby-bg-station-16x9.png') center / cover fixed,
        #020915 !important;
    }

    .efProfilesShell {
      width: min(100%, calc(100vw - 18px)) !important;
      max-width: 940px !important;
      gap: 10px !important;
      padding-top: max(12px, env(safe-area-inset-top, 0px)) !important;
      padding-bottom: calc(128px + env(safe-area-inset-bottom, 0px)) !important;
    }

    .efProfilesTop {
      grid-template-columns: 44px minmax(0, 1fr) 44px !important;
      gap: 8px !important;
      align-items: center !important;
      min-height: 48px !important;
    }

    .efProfilesBack {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
      max-width: 44px !important;
      padding: 0 !important;
      border-radius: 999px !important;
      display: grid !important;
      place-items: center !important;
      overflow: hidden !important;
      font-size: 0 !important;
      line-height: 0 !important;
      color: transparent !important;
      text-indent: -9999px !important;
      white-space: nowrap !important;
    }

    .efProfilesBack::before {
      content: '‹' !important;
      text-indent: 0 !important;
      color: #eaf7ff !important;
      font-size: 26px !important;
      line-height: 1 !important;
      display: grid !important;
      place-items: center !important;
      width: 100% !important;
      height: 100% !important;
    }

    .efProfilesGear {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
      padding: 0 !important;
      border-radius: 999px !important;
      display: grid !important;
      place-items: center !important;
      font-size: 18px !important;
    }

    .efProfilesTitle {
      text-align: center !important;
      min-width: 0 !important;
    }

    .efProfilesTitle span {
      font-size: 9px !important;
      letter-spacing: .20em !important;
    }

    .efProfilesTitle h1 {
      margin: 0 !important;
      font-size: clamp(26px, 7vw, 42px) !important;
      line-height: 1 !important;
    }

    .efProfilesHero {
      min-height: 150px !important;
      max-height: 190px !important;
      border-radius: 22px !important;
      padding: 14px !important;
      display: grid !important;
      grid-template-columns: 64px minmax(0, 1fr) 118px !important;
      align-items: center !important;
      gap: 12px !important;
      overflow: hidden !important;
      background:
        radial-gradient(circle at 82% 46%, rgba(53,216,255,.16), transparent 35%),
        linear-gradient(180deg, rgba(255,255,255,.072), rgba(255,255,255,.024)),
        rgba(5,18,32,.66) !important;
      border-radius: 24px !important;
    }

    .efProfilesHero::before {
      opacity: .45 !important;
    }

    .efProfilesAvatar {
      width: 64px !important;
      height: 64px !important;
      font-size: 26px !important;
      flex: 0 0 auto !important;
    }

    .efProfilesIdentity {
      min-width: 0 !important;
      gap: 5px !important;
      align-self: center !important;
    }

    .efProfilesIdentity span {
      font-size: 9px !important;
      letter-spacing: .18em !important;
    }

    .efProfilesIdentity h2 {
      font-size: clamp(28px, 7vw, 44px) !important;
      line-height: 1 !important;
      margin: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .efProfilesIdentity p {
      margin: 0 !important;
      font-size: 13px !important;
      font-weight: 850 !important;
      color: rgba(234,247,255,.72) !important;
    }

    .efProfilesIdentity i {
      height: 7px !important;
      max-width: 100% !important;
      border-radius: 999px !important;
      background: rgba(234,247,255,.12) !important;
      overflow: hidden !important;
    }

    .efProfilesHeroLinks {
      display: none !important;
    }

    .efProfilesFishSphere {
      width: 112px !important;
      max-width: 112px !important;
      aspect-ratio: 1 / 1 !important;
      justify-self: end !important;
      align-self: center !important;
      opacity: .72 !important;
      pointer-events: none !important;
      transform: none !important;
    }

    .efProfilesFishSphere .efSkinPreview,
    .efProfilesFishSphere .efSkinPreview.sprite {
      width: 96px !important;
      max-width: 96px !important;
      transform: none !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .efProfilesFishSphere img,
    .efProfilesFishSphere svg,
    .efProfilesFishSphere .efSkinSpriteImg,
    .efProfilesFishSphere .efSkinSpriteSvg {
      max-width: 96px !important;
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-drag: none !important;
      -webkit-touch-callout: none !important;
    }

    .efProfilesStats {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .efProfilesStats article {
      min-height: 74px !important;
      border-radius: 18px !important;
      padding: 11px 12px !important;
      display: grid !important;
      align-content: center !important;
      gap: 6px !important;
    }

    .efProfilesStats span {
      font-size: 10px !important;
      letter-spacing: .16em !important;
      line-height: 1 !important;
    }

    .efProfilesStats b {
      font-size: clamp(22px, 6vw, 34px) !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .efProfilesTabs {
      width: min(100%, 330px) !important;
      padding: 5px !important;
      gap: 5px !important;
      justify-self: center !important;
    }

    .efProfilesTabs button {
      min-height: 38px !important;
      font-size: 12px !important;
    }

    .efProfilesPanel {
      gap: 8px !important;
    }

    .efProfilesEditor,
    .efProfilesCreate {
      border-radius: 20px !important;
      padding: 12px !important;
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 10px !important;
      min-width: 0 !important;
    }

    .efProfilesEditor > div b,
    .efProfilesCreate > div b {
      display: block !important;
      max-width: 100% !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-size: 18px !important;
    }

    .efProfilesEditor input,
    .efProfilesCreate input {
      width: 100% !important;
      min-height: 48px !important;
      border-radius: 16px !important;
      padding: 0 14px !important;
      border: 1px solid rgba(88,210,255,.18) !important;
      background: rgba(2,9,21,.50) !important;
      color: #eaf7ff !important;
      font-size: 16px !important;
      font-weight: 900 !important;
    }

    .efProfilesEditor button,
    .efProfilesCreate button,
    .efProfileCardActions button {
      min-height: 48px !important;
      width: 100% !important;
      border-radius: 999px !important;
      border: 1px solid rgba(88,210,255,.28) !important;
      background: linear-gradient(90deg, rgba(53,216,255,.24), rgba(120,255,216,.14)) !important;
      color: #eaf7ff !important;
      font-weight: 1000 !important;
    }

    .efProfilesBottomNav {
      position: fixed !important;
      left: 50% !important;
      right: auto !important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px)) !important;
      transform: translateX(-50%) !important;
      width: min(560px, calc(100vw - 20px)) !important;
      max-width: calc(100vw - 20px) !important;
      margin: 0 !important;
      z-index: 80 !important;
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 6px !important;
      padding: 6px !important;
      border-radius: 999px !important;
      overflow: hidden !important;
    }

    .efProfilesBottomNav a {
      min-width: 0 !important;
      min-height: 48px !important;
      border-radius: 999px !important;
      padding: 0 6px !important;
    }

    .efProfilesBottomNav a span {
      font-size: 16px !important;
    }

    .efProfilesBottomNav a b {
      font-size: 11px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    @media (min-width: 820px) {
      .efProfilesShell {
        max-width: 1040px !important;
      }
      .efProfilesStats {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      .efProfilesEditor {
        grid-template-columns: minmax(150px, .7fr) minmax(250px, 1fr) 150px !important;
      }
    }

    @media (max-width: 520px) {
      .efProfilesShell {
        width: min(100%, calc(100vw - 14px)) !important;
      }
      .efProfilesHero {
        grid-template-columns: 58px minmax(0, 1fr) !important;
        min-height: 142px !important;
      }
      .efProfilesFishSphere {
        display: none !important;
      }
      .efProfilesIdentity h2 {
        font-size: 34px !important;
      }
      .efProfilesStats article {
        min-height: 70px !important;
        padding: 10px !important;
      }
      .efProfilesBottomNav a {
        min-height: 44px !important;
      }
    }
  `;

  function install() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    style.textContent = css;
  }

  function patch() {
    if (!document.querySelector(".efProfilesPage")) return;
    install();
    const back = document.querySelector(".efProfilesBack");
    if (back) back.setAttribute("aria-label", "Назад в лобби");
  }

  window.addEventListener("DOMContentLoaded", () => {
    patch();
    requestAnimationFrame(patch);
    window.setTimeout(patch, 120);
    window.setTimeout(patch, 600);
    const observer = new MutationObserver(patch);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, { once: true });
})();
