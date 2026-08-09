import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export type CommerceHeaderProps = {
  cartCount?: number;
  backHref?: string;
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
      <button type="button" className="bcCommerceBrand" onClick={() => navigate("/")} aria-label="BlackCrown Home">
        <img src={Icons.crown} alt="" width="25" height="25" />
        <span>BLACKCROWN</span>
      </button>

      <div className="bcCommerceHeader__actions">
        <Button variant="secondary" onClick={() => navigate(backHref)}>
          {backLabel}
        </Button>
        {!hideCart ? (
          <Button variant="primary" onClick={() => navigate("/cart")}>
            Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

export default CommerceHeader;
