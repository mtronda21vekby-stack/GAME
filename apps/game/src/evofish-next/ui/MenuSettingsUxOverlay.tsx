import React, { useEffect } from "react";

type PanelKind = "menu" | "settings" | "shop" | "quests" | "mutations" | "craft" | "map";

type MenuKind = "map" | "craft" | "mutations" | "quests" | "shop" | "settings" | "lock" | "unknown";

type SettingKind = "language" | "control" | "stick" | "quality" | "zoom" | "tutorial" | "toggle" | "unknown";

const PANEL_CLASSES = ["efUxMenu", "efUxSettings", "efUxShop", "efUxQuests", "efUxMutations", "efUxCraft", "efUxMap"];

function textOf(element: Element | null) {
  return (element?.textContent || "").trim().toLowerCase();
}

function setAttr(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function classifyPanel(title: string): PanelKind {
  const value = title.toLowerCase();
  if (value.includes("settings") || value.includes("настрой")) return "settings";
  if (value.includes("shop") || value.includes("магаз")) return "shop";
  if (value.includes("quest") || value.includes("квест") || value.includes("задан")) return "quests";
  if (value.includes("mutation") || value.includes("мутац")) return "mutations";
  if (value.includes("craft") || value.includes("крафт")) return "craft";
  if (value.includes("map") || value.includes("карта")) return "map";
  return "menu";
}

function classifyMenuButton(value: string): MenuKind {
  if (value.includes("map") || value.includes("карта")) return "map";
  if (value.includes("craft") || value.includes("крафт")) return "craft";
  if (value.includes("mutation") || value.includes("мутац")) return "mutations";
  if (value.includes("quest") || value.includes("квест") || value.includes("задан")) return "quests";
  if (value.includes("shop") || value.includes("магаз") || value.includes("skin") || value.includes("скин")) return "shop";
  if (value.includes("settings") || value.includes("настрой")) return "settings";
  if (value.includes("lock") || value.includes("замок") || value.includes("блок")) return "lock";
  return "unknown";
}

function classifySettingBlock(value: string): SettingKind {
  if (value.includes("language") || value.includes("язык")) return "language";
  if (value.includes("control") || value.includes("управ") || value.includes("touch") || value.includes("stick") || value.includes("gamepad")) return "control";
  if (value.includes("stick") || value.includes("джой") || value.includes("стик")) return "stick";
  if (value.includes("quality") || value.includes("граф") || value.includes("качество") || value.includes("low") || value.includes("high")) return "quality";
  if (value.includes("zoom") || value.includes("камера") || value.includes("manual") || value.includes("wide") || value.includes("close")) return "zoom";
  if (value.includes("tutorial") || value.includes("обуч") || value.includes("тутор")) return "tutorial";
  if (value.includes("auto") || value.includes("on") || value.includes("off")) return "toggle";
  return "unknown";
}

function panelClass(kind: PanelKind) {
  return `efUx${kind[0].toUpperCase()}${kind.slice(1)}`;
}

function applyUxContract() {
  const root = document.querySelector<HTMLElement>(".efNextPlay");
  root?.classList.add("efUxPolishedReady");

  const panel = document.querySelector<HTMLElement>(".efGamePanel");
  if (panel) {
    const kind = classifyPanel(textOf(panel.querySelector(".efPanelHead b")));
    panel.classList.remove(...PANEL_CLASSES);
    panel.classList.add("efUxPanel", panelClass(kind));
    setAttr(panel, "data-ef-panel-kind", kind);
  }

  document.querySelectorAll<HTMLButtonElement>(".efMenuGrid button").forEach((button) => {
    const kind = classifyMenuButton(textOf(button));
    setAttr(button, "data-ef-menu-item", kind);
    if (kind !== "unknown") setAttr(button, "aria-label", kind);
    if (kind === "map" || kind === "craft") {
      button.style.display = "none";
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    }
  });

  document.querySelectorAll<HTMLElement>(".efSettingBlock,.efSettingRow,.efZoomControl").forEach((block) => {
    const kind = classifySettingBlock(textOf(block));
    setAttr(block, "data-ef-setting-kind", kind);
  });

  document.querySelectorAll<HTMLButtonElement>(".efControlModes button,.efShopTabs button,.efZoomPresets button,.efMenuGrid button").forEach((button) => {
    button.setAttribute("type", "button");
  });
}

export function MenuSettingsUxOverlay() {
  useEffect(() => {
    applyUxContract();
    const observer = new MutationObserver(applyUxContract);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    const tick = window.setInterval(applyUxContract, 300);
    return () => {
      observer.disconnect();
      window.clearInterval(tick);
    };
  }, []);

  return (
    <style>{`
      .efUxPanel .efPanelHead::after{content:"";display:block;position:absolute;left:16px;right:58px;bottom:6px;height:1px;background:linear-gradient(90deg,rgba(120,240,255,.48),rgba(255,255,255,0));opacity:.9;pointer-events:none}.efUxPanel .efPanelHead b{padding-bottom:7px!important}.efUxPanel .efPanelHead b::after{display:block;margin-top:3px;font-size:9px;line-height:1;color:rgba(231,242,255,.58);font-weight:850;letter-spacing:.08em;text-transform:uppercase}.efUxMenu .efPanelHead b::after{content:"systems"}.efUxSettings .efPanelHead b::after{content:"controls · graphics · camera"}.efUxShop .efPanelHead b::after{content:"skins · forms · economy"}.efUxQuests .efPanelHead b::after{content:"objectives · rewards"}.efUxMutations .efPanelHead b::after{content:"permanent upgrades"}.efUxCraft .efPanelHead b::after{content:"consumables · utility"}
      .efMenuGrid button[data-ef-menu-item="map"],.efMenuGrid button[data-ef-menu-item="craft"]{display:none!important}.efMenuGrid button[data-ef-menu-item="mutations"]::before{content:"🧬"!important}.efMenuGrid button[data-ef-menu-item="quests"]::before{content:"🎯"!important}.efMenuGrid button[data-ef-menu-item="shop"]::before{content:"🛒"!important}.efMenuGrid button[data-ef-menu-item="settings"]::before{content:"⚙"!important}.efMenuGrid button[data-ef-menu-item="lock"]::before{content:"🔒"!important}.efMenuGrid button[data-ef-menu-item="unknown"]::before{content:"◆"!important}.efMenuGrid button[data-ef-menu-item]{overflow:hidden!important}.efMenuGrid button[data-ef-menu-item]::after{content:attr(data-ef-menu-item);position:absolute;right:10px;top:10px;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:999px;padding:3px 7px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);color:rgba(231,242,255,.48);font-size:8px;font-weight:1000;text-transform:uppercase;letter-spacing:.06em}.efMenuGrid button[data-ef-menu-item="unknown"]::after{display:none!important}
      .efSettingBlock[data-ef-setting-kind="language"]>b::before{background:#fff3a0!important;box-shadow:0 0 14px rgba(255,243,160,.56)!important}.efSettingBlock[data-ef-setting-kind="control"]>b::before,.efSettingBlock[data-ef-setting-kind="stick"]>b::before{background:#80ffd8!important;box-shadow:0 0 14px rgba(128,255,216,.52)!important}.efSettingBlock[data-ef-setting-kind="quality"]>b::before{background:#aa8bff!important;box-shadow:0 0 14px rgba(170,139,255,.52)!important}.efSettingBlock[data-ef-setting-kind="tutorial"]>b::before{background:#ffd36a!important;box-shadow:0 0 14px rgba(255,211,106,.52)!important}.efZoomControl[data-ef-setting-kind="zoom"]{border-color:rgba(120,240,255,.16)!important;background:linear-gradient(180deg,rgba(120,240,255,.055),rgba(255,255,255,.03))!important}.efSettingRow[data-ef-setting-kind="toggle"]{border-color:rgba(110,255,180,.17)!important;background:linear-gradient(180deg,rgba(110,255,180,.055),rgba(255,255,255,.03))!important}
      .efControlModes button,.efShopTabs button,.efZoomPresets button{position:relative!important;overflow:hidden!important}.efControlModes button.active::after,.efShopTabs button.active::after,.efZoomPresets button:active::after{content:"";position:absolute;inset:auto 10px 4px;height:2px;border-radius:999px;background:linear-gradient(90deg,rgba(120,240,255,0),rgba(120,240,255,.92),rgba(255,243,160,.55),rgba(120,240,255,0));box-shadow:0 0 10px rgba(120,240,255,.44)}.efControlModes button::before,.efShopTabs button::before,.efZoomPresets button::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 0,rgba(255,255,255,.12),transparent 55%);opacity:0;transition:opacity .15s ease}.efControlModes button.active::before,.efShopTabs button.active::before{opacity:1}
      .efUxSettings .efSettingsPanel{scroll-padding-top:70px!important}.efUxShop .efShopPanel{scroll-padding-top:70px!important}.efUxPanel{isolation:isolate!important}.efUxPanel::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(120,240,255,.14),transparent 32%,transparent 70%,rgba(255,243,160,.08));mix-blend-mode:screen;opacity:.28;z-index:-1}.efUxPanel button:focus-visible,.efUxPanel a:focus-visible{outline:2px solid rgba(120,240,255,.72)!important;outline-offset:2px!important}
      @media(max-width:420px){.efMenuGrid button[data-ef-menu-item]::after{display:none!important}.efUxPanel .efPanelHead b::after{font-size:8px!important;letter-spacing:.055em!important}.efUxPanel .efPanelHead::after{right:54px!important}}
    `}</style>
  );
}
