const CLIENT_ID_KEY = "bc.clientId.v1";

const elements = {
  statusCard: document.querySelector("#status-card"),
  statusTitle: document.querySelector("#status-title"),
  statusCopy: document.querySelector("#status-copy"),
  codeZone: document.querySelector("#code-zone"),
  codeValue: document.querySelector("#code-value"),
  copyCode: document.querySelector("#copy-code"),
  expiresCopy: document.querySelector("#expires-copy"),
  openTelegram: document.querySelector("#open-telegram"),
  issueCode: document.querySelector("#issue-code"),
  refreshStatus: document.querySelector("#refresh-status"),
  unlink: document.querySelector("#unlink"),
  errorCopy: document.querySelector("#error-copy"),
};

let activeCode = "";
let activeExpiry = 0;
let countdownTimer = 0;
let statusTimer = 0;
let busy = false;

function secureClientId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  if (!crypto.getRandomValues) throw new Error("secure_random_unavailable");
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `client_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function getClientId() {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing && existing.length >= 20) return existing;
    const created = secureClientId();
    localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return secureClientId();
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function reasonMessage(reason) {
  const messages = {
    auth_required: "Сессия сайта недоступна. Обнови страницу.",
    session_unavailable: "Защищённая сессия временно недоступна.",
    identity_storage_unavailable: "Сервер привязки ещё не активирован.",
    identity_storage_timeout: "Supabase отвечает слишком долго. Повтори попытку.",
    identity_storage_error: "Не удалось связаться с сервером привязки.",
    link_rate_limited: "Новый код можно создать через несколько секунд.",
    secure_random_unavailable: "Браузер не поддерживает безопасную генерацию кода.",
    telegram_link_code_failed: "Не удалось создать одноразовый код.",
    telegram_unlink_failed: "Не удалось отвязать Telegram.",
  };
  return messages[reason] || "Операция не выполнена. Повтори попытку.";
}

function showError(message) {
  elements.errorCopy.textContent = message;
  elements.errorCopy.hidden = false;
}

function clearError() {
  elements.errorCopy.textContent = "";
  elements.errorCopy.hidden = true;
}

function setBusy(next) {
  busy = next;
  elements.issueCode.disabled = next;
  elements.refreshStatus.disabled = next;
  elements.unlink.disabled = next;
}

function setStatus(state, title, copy) {
  elements.statusCard.dataset.state = state;
  elements.statusTitle.textContent = title;
  elements.statusCopy.textContent = copy;
}

async function ensureSession() {
  const response = await fetch("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ clientId: getClientId() }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok !== true) {
    throw new Error(typeof payload.reason === "string" ? payload.reason : "session_unavailable");
  }
}

function clearCode() {
  activeCode = "";
  activeExpiry = 0;
  elements.codeZone.hidden = true;
  elements.codeValue.textContent = "BC-••••-••••-••••";
  elements.expiresCopy.textContent = "";
  elements.openTelegram.href = "#";
  if (countdownTimer) window.clearInterval(countdownTimer);
  countdownTimer = 0;
}

function updateCountdown() {
  if (!activeExpiry) return;
  const remaining = Math.max(0, activeExpiry - Date.now());
  if (remaining <= 0) {
    elements.expiresCopy.textContent = "Код истёк. Создай новый.";
    elements.openTelegram.setAttribute("aria-disabled", "true");
    if (countdownTimer) window.clearInterval(countdownTimer);
    countdownTimer = 0;
    return;
  }
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  elements.expiresCopy.textContent = `Код истечёт через ${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function refreshStatus({ silent = false } = {}) {
  if (busy && !silent) return;
  if (!silent) {
    setBusy(true);
    clearError();
    setStatus("loading", "Проверяем аккаунт…", "Запрашиваем серверный статус.");
  }

  try {
    await ensureSession();
    const response = await fetch("/api/account/telegram/status", {
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok !== true) {
      throw new Error(typeof payload.reason === "string" ? payload.reason : "identity_storage_error");
    }

    if (payload.linked === true) {
      const username = typeof payload.telegramUsername === "string" && payload.telegramUsername
        ? `@${payload.telegramUsername}`
        : "Telegram аккаунт";
      const premium = payload.premiumActive === true ? "Premium активен" : "Premium не активен";
      setStatus("linked", "Telegram привязан", `${username} · ${premium}`);
      elements.issueCode.hidden = true;
      elements.unlink.hidden = false;
      clearCode();
      if (statusTimer) window.clearInterval(statusTimer);
      statusTimer = 0;
    } else {
      setStatus("idle", "Telegram не привязан", "Создай одноразовый код и подтверди его в боте.");
      elements.issueCode.hidden = false;
      elements.unlink.hidden = true;
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "identity_storage_error";
    if (!silent) {
      setStatus("error", "Сервер привязки недоступен", reasonMessage(reason));
      showError(reasonMessage(reason));
    }
  } finally {
    if (!silent) setBusy(false);
  }
}

async function issueCode() {
  if (busy) return;
  setBusy(true);
  clearError();
  try {
    await ensureSession();
    const response = await fetch("/api/account/telegram/link-code", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      credentials: "include",
      cache: "no-store",
      body: "{}",
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok !== true) {
      throw new Error(typeof payload.reason === "string" ? payload.reason : "telegram_link_code_failed");
    }
    if (
      typeof payload.code !== "string" ||
      typeof payload.expiresAt !== "string" ||
      typeof payload.telegramUrl !== "string"
    ) {
      throw new Error("telegram_link_code_failed");
    }

    activeCode = payload.code;
    activeExpiry = Date.parse(payload.expiresAt);
    elements.codeValue.textContent = activeCode;
    elements.openTelegram.href = payload.telegramUrl;
    elements.openTelegram.removeAttribute("aria-disabled");
    elements.codeZone.hidden = false;
    updateCountdown();
    if (countdownTimer) window.clearInterval(countdownTimer);
    countdownTimer = window.setInterval(updateCountdown, 1000);
    if (statusTimer) window.clearInterval(statusTimer);
    statusTimer = window.setInterval(() => refreshStatus({ silent: true }), 5000);
    setStatus("idle", "Код создан", "Подтверди привязку в BLACK CROWN OPS.");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "telegram_link_code_failed";
    showError(reasonMessage(reason));
  } finally {
    setBusy(false);
  }
}

async function copyCode() {
  if (!activeCode) return;
  try {
    await navigator.clipboard.writeText(activeCode);
    elements.copyCode.querySelector("small").textContent = "СКОПИРОВАНО";
    window.setTimeout(() => {
      elements.copyCode.querySelector("small").textContent = "НАЖМИ, ЧТОБЫ СКОПИРОВАТЬ";
    }, 1500);
  } catch {
    showError("Не удалось скопировать. Зажми код и скопируй вручную.");
  }
}

async function unlink() {
  if (busy) return;
  if (!window.confirm("Отвязать Telegram от BLACK CROWN аккаунта?")) return;
  setBusy(true);
  clearError();
  try {
    await ensureSession();
    const response = await fetch("/api/account/telegram/link", {
      method: "DELETE",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok !== true) {
      throw new Error(typeof payload.reason === "string" ? payload.reason : "telegram_unlink_failed");
    }
    clearCode();
    await refreshStatus({ silent: true });
    setStatus("idle", "Telegram отвязан", "Можно привязать другой аккаунт новым кодом.");
    elements.issueCode.hidden = false;
    elements.unlink.hidden = true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "telegram_unlink_failed";
    showError(reasonMessage(reason));
  } finally {
    setBusy(false);
  }
}

elements.issueCode.addEventListener("click", issueCode);
elements.refreshStatus.addEventListener("click", () => refreshStatus());
elements.copyCode.addEventListener("click", copyCode);
elements.unlink.addEventListener("click", unlink);
elements.openTelegram.addEventListener("click", (event) => {
  if (!activeCode || activeExpiry <= Date.now()) event.preventDefault();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshStatus({ silent: true });
});

refreshStatus();
