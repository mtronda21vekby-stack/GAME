/** Bind focus and scroll ownership for one modal; return an idempotent cleanup. */
export function activateModal(panel: HTMLElement, onClose: () => void, trigger: HTMLElement | null): () => void {
  const roots = [document.documentElement, document.body];
  const previous = roots.map((root) => [root.style.getPropertyValue("overflow"), root.style.getPropertyPriority("overflow")] as const);
  roots.forEach((root) => root.style.setProperty("overflow", "hidden"));
  const items = () => Array.from(panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
  )).filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'));
  const focusFirst = () => (items()[0] ?? panel).focus({ preventScroll: true });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      const list = items();
      const first = list[0] ?? panel;
      const last = list[list.length - 1] ?? panel;
      if (!panel.contains(document.activeElement) || !list.length ||
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    }
  };
  const onFocusIn = (event: FocusEvent) => {
    if (event.target instanceof Node && !panel.contains(event.target)) focusFirst();
  };
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("focusin", onFocusIn);
  focusFirst();
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("focusin", onFocusIn);
    roots.forEach((root, i) => {
      const [value, priority] = previous[i];
      if (value) root.style.setProperty("overflow", value, priority);
      else root.style.removeProperty("overflow");
    });
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
}
