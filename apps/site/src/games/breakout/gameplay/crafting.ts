import type { Inventory, ItemId } from "../domain";

export type Recipe = {
  id: string;
  name: string;
  result: ItemId;
  ingredients: Partial<Record<ItemId, number>>;
  intelligence: number;
  description: string;
};

export const RECIPES: Recipe[] = [
  {
    id: "plastic-key",
    name: "Пластиковый ключ",
    result: "plasticKey",
    ingredients: { toothbrush: 1, lighter: 1 },
    intelligence: 12,
    description: "Размягчить пластик и снять слепок со служебного ключа.",
  },
  {
    id: "cutters",
    name: "Усиленный резак",
    result: "cutters",
    ingredients: { file: 1, ductTape: 1 },
    intelligence: 18,
    description: "Связать рабочие губки напильника в импровизированный резак.",
  },
  {
    id: "rope",
    name: "Верёвка из простыней",
    result: "rope",
    ingredients: { sheet: 2 },
    intelligence: 8,
    description: "Связать две простыни прочными узлами.",
  },
];

export function canCraft(recipe: Recipe, inventory: Inventory, intelligence: number) {
  if (intelligence < recipe.intelligence) return false;
  return (Object.entries(recipe.ingredients) as [ItemId, number][]).every(
    ([id, amount]) => inventory[id] >= amount,
  );
}

export function applyCraft(recipe: Recipe, inventory: Inventory) {
  for (const [id, amount] of Object.entries(recipe.ingredients) as [ItemId, number][]) {
    inventory[id] -= amount;
  }
  inventory[recipe.result] += 1;
}
