import React from "react";
import { Button } from "@blackcrown/ui";
import { nav } from "../lib/nav";
import type { SitePath } from "../routes/routeMetadata";
import { PlatformHeader } from "./platform/PlatformHeader";

export type CommerceHeaderProps = {
  cartCount?: number;
  backHref?: SitePath;
  backLabel?: string;
  hideCart?: boolean;
};

export function CommerceHeader({
  cartCount = 0,
  backHref = "/store",
  backLabel = "Магазин",
  hideCart = false,
}: CommerceHeaderProps) {
  return (
    <PlatformHeader active="store">
      <div className="platCommerceActions">
        <Button variant="secondary" onClick={() => nav(backHref)}>
          {backLabel}
        </Button>
        {!hideCart ? (
          <Button variant="primary" onClick={() => nav("/cart")}>
            Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}
          </Button>
        ) : null}
      </div>
    </PlatformHeader>
  );
}

export default CommerceHeader;
