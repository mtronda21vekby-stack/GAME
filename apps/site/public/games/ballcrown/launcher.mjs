const startButton = document.querySelector("#start-button");
const controlsButton = document.querySelector("#controls-button");
const backButton = document.querySelector("#back-button");
const closeControls = document.querySelector("#close-controls");
const controlsDialog = document.querySelector("#controls-dialog");
const releaseStatus = document.querySelector("#release-status");
const controllerStatus = document.querySelector("#controller-status");
const controllerDot = document.querySelector("#controller-dot");
const mainActions = [startButton, controlsButton, backButton];
let launchRequest = null;
let frame = 0;
let leaving = false;
let controllerIdentity = "";
let previousButtons = [];
let previousDirection = 0;
let nextDirectionAt = 0;

function reportRelease(message, state = "waiting") {
  releaseStatus.textContent = message;
  releaseStatus.parentElement.dataset.state = state;
}

function clearGamepadFocus() {
  document.querySelectorAll(".gamepad-focus").forEach((element) => element.classList.remove("gamepad-focus"));
}

function focusAction(element, gamepad = false) {
  clearGamepadFocus();
  element?.focus({ preventScroll: true });
  if (gamepad) element?.classList.add("gamepad-focus");
}

function shellActions() {
  return controlsDialog.open ? [closeControls] : mainActions.filter((element) => !element.disabled);
}

function moveFocus(direction, gamepad = false) {
  const actions = shellActions();
  const currentIndex = actions.indexOf(document.activeElement);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + actions.length) % actions.length;
  focusAction(actions[nextIndex], gamepad);
}

function closeControlPanel() {
  controlsDialog.close();
  focusAction(controlsButton);
}

function goBack() {
  if (controlsDialog.open) {
    closeControlPanel();
    return;
  }
  leaving = true;
  stopPolling();
  window.location.assign("/");
}

async function launchGame() {
  if (launchRequest || leaving) return;
  launchRequest = new AbortController();
  startButton.disabled = true;
  reportRelease("Проверяем готовность сборки…", "checking");
  try {
    const response = await fetch("./release.json", { cache: "no-store", signal: launchRequest.signal });
    if (!response.ok) throw new Error("Release unavailable");
    const release = await response.json();
    if (release.schemaVersion !== 1 || release.entry !== "./play/" || typeof release.available !== "boolean") {
      throw new Error("Invalid release metadata");
    }
    if (!release.available) {
      reportRelease("Сборка ещё подключается. Игровые файлы пока недоступны — попробуй позже.");
      return;
    }
    reportRelease("Открываем BALLCROWN…", "ready");
    leaving = true;
    stopPolling();
    window.location.assign("./play/");
  } catch (error) {
    if (error?.name === "AbortError") return;
    reportRelease(navigator.onLine
      ? "Не удалось проверить сборку. Нажми «Играть», чтобы повторить."
      : "Нет соединения. Вернись в сеть и повтори запуск.", "error");
  } finally {
    launchRequest = null;
    startButton.disabled = false;
  }
}

function stopPolling() {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
  previousButtons = [];
  previousDirection = 0;
  nextDirectionAt = 0;
}

function resetController(message) {
  if (!controllerIdentity && controllerStatus.textContent === message) return;
  controllerIdentity = "";
  controllerDot.classList.remove("is-connected");
  controllerStatus.textContent = message;
  previousButtons = [];
  previousDirection = 0;
  clearGamepadFocus();
}

function pollGamepad(time) {
  frame = 0;
  if (document.hidden || leaving) return;
  let controllers;
  try {
    controllers = Array.from(navigator.getGamepads() || []);
  } catch {
    resetController("Браузер ограничил доступ к геймпаду. Используй клавиатуру или сенсорное управление.");
    return;
  }
  const controller = controllers.find((item) => item?.connected && item.mapping === "standard");
  if (!controller) {
    resetController(controllers.some((item) => item?.connected)
      ? "Геймпад обнаружен, но его раскладка не стандартная. Используй кнопки на странице."
      : "Подключи геймпад и нажми любую кнопку.");
  } else {
    const identity = `${controller.index}:${controller.id}`;
    const buttons = controller.buttons.map((button) => button.pressed || button.value > .5);
    if (identity !== controllerIdentity) {
      controllerIdentity = identity;
      controllerDot.classList.add("is-connected");
      controllerStatus.textContent = "Геймпад подключён. D-pad / левый стик · A выбрать · B назад.";
      // A held while the browser exposes a controller must not start a game.
      previousButtons = buttons;
    }
    if (document.hasFocus()) {
      const direction = buttons[12] || buttons[14] || controller.axes[1] < -.6 || controller.axes[0] < -.6 ? -1
        : buttons[13] || buttons[15] || controller.axes[1] > .6 || controller.axes[0] > .6 ? 1 : 0;
      if (direction && (direction !== previousDirection || time >= nextDirectionAt)) {
        moveFocus(direction, true);
        nextDirectionAt = time + (direction !== previousDirection ? 420 : 170);
      }
      previousDirection = direction;
      if (buttons[0] && !previousButtons[0]) {
        const actions = shellActions();
        const active = actions.includes(document.activeElement) ? document.activeElement : actions[0];
        focusAction(active, true);
        active?.click();
      }
      if (buttons[1] && !previousButtons[1]) goBack();
    }
    previousButtons = buttons;
  }
  if (!leaving && !document.hidden) frame = window.requestAnimationFrame(pollGamepad);
}

function startPolling() {
  if (document.hidden || leaving || frame) return;
  if (!window.isSecureContext || typeof navigator.getGamepads !== "function") {
    resetController(window.isSecureContext
      ? "Этот браузер не предоставляет Gamepad API. Клавиатура и сенсорное управление доступны."
      : "Для геймпада открой сайт по HTTPS или localhost. Клавиатура и сенсорное управление доступны.");
    return;
  }
  frame = window.requestAnimationFrame(pollGamepad);
}

startButton.addEventListener("click", launchGame);
controlsButton.addEventListener("click", () => {
  clearGamepadFocus();
  controlsDialog.showModal();
  closeControls.focus();
});
closeControls.addEventListener("click", closeControlPanel);
controlsDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeControlPanel();
});
window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === "Escape") {
    event.preventDefault();
    if (!event.repeat) goBack();
  } else if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    moveFocus(event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1);
  } else if (event.key === "Tab") clearGamepadFocus();
});
window.addEventListener("pointerdown", clearGamepadFocus, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPolling();
  else startPolling();
});
window.addEventListener("pagehide", () => {
  leaving = true;
  stopPolling();
  launchRequest?.abort();
});
window.addEventListener("pageshow", () => {
  leaving = false;
  startPolling();
});

focusAction(startButton);
startPolling();
