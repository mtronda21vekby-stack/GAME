import type { SitePath } from "../routes/routeMetadata";
import { isPlainLinkActivation } from "./linkActivation";
import { pushSiteLocation } from "./siteNavigation";

export type SiteHref = SitePath | `${SitePath}?${string}` | `${SitePath}#${string}`;

export function nav(path: SiteHref) {
  pushSiteLocation(new URL(path, window.location.href));
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

export function navLink(e: LinkClickLikeEvent, path: SiteHref) {
  if (!isPlainLinkActivation(e)) return;
  e.preventDefault();
  nav(path);
}
