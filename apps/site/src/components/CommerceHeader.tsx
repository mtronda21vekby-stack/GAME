import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { nav } from "../lib/nav";
import type { SitePath } from "../routes/siteRoutes";

export type CommerceHeaderProps = {
  cartCount?: number;
  backHref?: SitePath;
  backLabel?: string;
  hideCart?: boolean;
};

export function CommerceHeader({
  cartCount = 0,
  backHref = "/store",
  backLabel = "Store",
  hideCart = false,
}: CommerceHeaderProps) {
  return (
    <header className="bcCommerceHeader">
      <button type="button" className="bcCommerceBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
        <img src={Icons.crown} alt="" width="25" height="25" />
        <span>BLACKCROWN</span>
      </button>

      <div className="bcCommerceHeader__actions">
        <Button variant="secondary" onClick={() => nav(backHref)}>
          {backLabel}
        </Button>
        {!hideCart ? (
          <Button variant="primary" onClick={() => nav("/cart")}>
            Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

export default CommerceHeader;
