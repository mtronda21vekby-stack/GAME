import type { Inventory, ItemDefinition, ItemId } from "../domain";

export const ITEM_DEFINITIONS: Record<ItemId, ItemDefinition> = {
  toothbrush: { id: "toothbrush", name: "Зубная щётка", icon: "▱", contraband: false, price: 3, description: "Обычная щётка. Пластик пригодится для слепка ключа." },
  lighter: { id: "lighter", name: "Зажигалка", icon: "♨", contraband: true, price: 20, description: "Контрабанда. Нужна для размягчения пластика." },
  file: { id: "file", name: "Напильник", icon: "⌁", contraband: true, price: 28, description: "Инструмент для металла. Охрана конфискует при обыске." },
  ductTape: { id: "ductTape", name: "Изолента", icon: "◉", contraband: true, price: 24, description: "Универсальная контрабанда для усиления инструментов." },
  sheet: { id: "sheet", name: "Простыня", icon: "▤", contraband: false, price: 8, description: "Легальная вещь. Две простыни можно связать в верёвку." },
  spoon: { id: "spoon", name: "Ложка", icon: "◐", contraband: false, price: 4, description: "Плохая лопата, но лучше, чем ничего." },
  screwdriver: { id: "screwdriver", name: "Отвёртка", icon: "↯", contraband: true, price: 30, description: "Откручивает технические панели и вентиляцию." },
  plasticKey: { id: "plasticKey", name: "Пластиковый ключ", icon: "⌘", contraband: true, price: 0, description: "Самодельный ключ от служебной двери." },
  cutters: { id: "cutters", name: "Усиленный резак", icon: "✂", contraband: true, price: 0, description: "Может перекусить сетку на крыше." },
  rope: { id: "rope", name: "Верёвка", icon: "∞", contraband: true, price: 0, description: "Скрученные простыни. Нужна для спуска в тоннель." },
  guardUniform: { id: "guardUniform", name: "Форма охраны", icon: "♜", contraband: true, price: 60, description: "Снижает подозрение в служебных зонах, но не делает вас невидимым." },
  keycard: { id: "keycard", name: "Пропуск", icon: "▣", contraband: true, price: 50, description: "Служебный пропуск низкого уровня." },
};

export function emptyInventory(): Inventory {
  return Object.fromEntries(Object.keys(ITEM_DEFINITIONS).map((key) => [key, 0])) as Inventory;
}

export function countItems(inventory: Inventory) {
  return Object.values(inventory).reduce((sum, quantity) => sum + quantity, 0);
}

export function contrabandCount(inventory: Inventory) {
  return (Object.entries(inventory) as [ItemId, number][]).reduce(
    (sum, [id, quantity]) => sum + (ITEM_DEFINITIONS[id].contraband ? quantity : 0),
    0,
  );
}

export function removeContraband(inventory: Inventory) {
  const removed: ItemId[] = [];
  for (const id of Object.keys(ITEM_DEFINITIONS) as ItemId[]) {
    if (ITEM_DEFINITIONS[id].contraband && inventory[id] > 0) {
      removed.push(id);
      inventory[id] = 0;
    }
  }
  return removed;
}
