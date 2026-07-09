(() => {
  const TOP_ITEM_CLASS = "hubLeaderboardMenuItem";

  function go(path) {
    window.location.assign(path);
  }

  function createTopButton() {
    const button = document.createElement("button");
    button.className = `hubSectionMenuItem ${TOP_ITEM_CLASS}`;
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.setAttribute("aria-label", "Открыть топ игроков");
    button.innerHTML = '<span aria-hidden="true">#</span><strong>Топ игроков</strong><i aria-hidden="true"></i>';
    button.addEventListener("click", () => go("/leaderboard"));
    return button;
  }

  function injectTopItem() {
    const panels = document.querySelectorAll(".hubSectionMenuPanel");
    for (const panel of panels) {
      if (panel.querySelector(`.${TOP_ITEM_CLASS}`)) continue;
      panel.appendChild(createTopButton());
    }
  }

  function patchBottomAchievementsLabel() {
    const labels = document.querySelectorAll(".hubBottomNavButton em");
    for (const label of labels) {
      if ((label.textContent || "").trim() === "Достижения") {
        label.textContent = "Топ";
      }
    }
  }

  function protectFishImages(event) {
    const target = event.target;
    if (!target || !target.closest) return;
    const inLobbyFish = target.closest(".hubHero,.hubSphere,.hubFish");
    const isFishImage = target.matches && target.matches('img[src*="/lobby/assets/fish/"]');
    if (!inLobbyFish && !isFishImage) return;
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  function tick() {
    injectTopItem();
    patchBottomAchievementsLabel();
  }

  window.addEventListener("DOMContentLoaded", () => {
    tick();
    const observer = new MutationObserver(tick);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener("contextmenu", protectFishImages, true);
    document.addEventListener("dragstart", protectFishImages, true);
    document.addEventListener("selectstart", protectFishImages, true);
  }, { once: true });
})();
