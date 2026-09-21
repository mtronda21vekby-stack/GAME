export type LinkActivation = {
  defaultPrevented?: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

/** Preserve new-tab, download and other browser-owned gestures. */
export function isPlainLinkActivation(event: LinkActivation): boolean {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
