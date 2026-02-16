export function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function navExternal(url: string) {
  window.location.assign(url);
}

type LinkClickLikeEvent = {
  defaultPrevented?: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
};

export function navLink(e: LinkClickLikeEvent, path: string) {
  if (e.defaultPrevented) return;
  // только левый клик без модификаторов
  if (e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  nav(path);
}
