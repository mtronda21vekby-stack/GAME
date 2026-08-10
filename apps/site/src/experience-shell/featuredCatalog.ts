import { COMMERCE_CATALOG, type CommerceCatalogItem, type CommerceCategory } from "@blackcrown/commerce";

const CATEGORY_ORDER: readonly CommerceCategory[] = ["skins", "badges", "bundles"];

export type CollectionHousingKind = "armor-display" | "medallion" | "multi-cell-vault";

export function getCollectionHousingKind(category: CommerceCategory): CollectionHousingKind {
  if (category === "badges") return "medallion";
  if (category === "bundles") return "multi-cell-vault";
  return "armor-display";
}

export function getFeaturedCollectionItems(limit = 3): readonly CommerceCatalogItem[] {
  const selected: CommerceCatalogItem[] = [];
  for (const category of CATEGORY_ORDER) {
    const item = COMMERCE_CATALOG.find((candidate) => candidate.category === category);
    if (item) selected.push(item);
  }
  return selected.slice(0, Math.max(0, Math.min(limit, CATEGORY_ORDER.length)));
}
