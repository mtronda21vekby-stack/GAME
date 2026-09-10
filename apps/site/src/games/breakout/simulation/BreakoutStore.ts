import type { EscapeRouteId, GameSnapshot, Inventory, ItemId, ZoneId } from "../domain";
import { RECIPES, applyCraft, canCraft } from "../gameplay/crafting";
import { ITEM_DEFINITIONS, contrabandCount, emptyInventory, removeContraband } from "../gameplay/items";
import type { SavePort } from "../persistence/save";
import { ROOMS, scheduleAt } from "../world/blueprint";

const GAME_MINUTES_PER_SECOND = 2.5;
const MAX_STAT = 100;

const LOOT: Record<string, Partial<Record<ItemId, number>>> = {
  "cell-desk": { toothbrush: 1, sheet: 1 },
  "cell-linen": { sheet: 1 },
  "canteen-bin": { spoon: 1 },
  "laundry-cart": { screwdriver: 1, sheet: 1 },
  "gym-locker": { file: 1 },
  "medical-linen": { ductTape: 1 },
};

function clamp(value: number, min = 0, max = MAX_STAT) {
  return Math.min(max, Math.max(min, value));
}

function cloneInventory(source?: Partial<Inventory>): Inventory {
  return { ...emptyInventory(), ...(source ?? {}) };
}

export function createFreshSnapshot(): GameSnapshot {
  const inventory = emptyInventory();
  return {
    version: 1,
    day: 1,
    minute: 425,
    schedule: "rollcall",
    health: 100,
    stamina: 100,
    suspicion: 0,
    reputation: 10,
    money: 28,
    strength: 10,
    intelligence: 14,
    inventory,
    stash: emptyInventory(),
    relationships: { marco: 0, rook: 0, nico: 0, hayes: 0, miller: 0, cole: 0 },
    searched: [],
    openedDoors: ["cell-door", "canteen-door", "laundry-door", "gym-door", "medical-door"],
    workProgress: 0,
    tunnelDigs: 0,
    currentZone: "cellblock",
    playerPosition: { x: -11.4, z: 5.5 },
    focusNpcId: null,
    message: "Перекличка через несколько минут. Осмотрись в блоке C.",
    routeProgress: {
      maintenance: { discovered: false, complete: false, progress: 0 },
      roof: { discovered: false, complete: false, progress: 0 },
      tunnel: { discovered: false, complete: false, progress: 0 },
    },
    completedRoute: null,
    teleportRevision: 0,
    paused: true,
  };
}

function sanitize(raw: GameSnapshot | null): GameSnapshot {
  const fresh = createFreshSnapshot();
  if (!raw || raw.version !== 1) return fresh;
  return {
    ...fresh,
    ...raw,
    version: 1,
    day: Math.max(1, Math.floor(Number(raw.day) || 1)),
    minute: clamp(Number(raw.minute) || fresh.minute, 0, 1439.999),
    health: clamp(Number(raw.health) || 0),
    stamina: clamp(Number(raw.stamina) || 0),
    suspicion: clamp(Number(raw.suspicion) || 0),
    reputation: clamp(Number(raw.reputation) || 0),
    money: clamp(Number(raw.money) || 0, 0, 9999),
    strength: clamp(Number(raw.strength) || 0),
    intelligence: clamp(Number(raw.intelligence) || 0),
    inventory: cloneInventory(raw.inventory),
    stash: cloneInventory(raw.stash),
    searched: Array.isArray(raw.searched) ? raw.searched.slice(0, 30) : [],
    openedDoors: Array.isArray(raw.openedDoors) ? raw.openedDoors.slice(0, 20) : fresh.openedDoors,
    relationships: { ...fresh.relationships, ...(raw.relationships ?? {}) },
    routeProgress: { ...fresh.routeProgress, ...(raw.routeProgress ?? {}) },
    playerPosition: raw.playerPosition && Number.isFinite(raw.playerPosition.x) && Number.isFinite(raw.playerPosition.z)
      ? raw.playerPosition
      : fresh.playerPosition,
    paused: true,
  };
}

export class BreakoutStore {
  private state: GameSnapshot;
  private listeners = new Set<() => void>();
  private lastActivityAt = 0;
  private lastEmitAt = 0;
  private lastSaveAt = 0;

  constructor(private readonly savePort: SavePort) {
    this.state = sanitize(savePort.load());
    this.state.schedule = scheduleAt(this.state.minute).id;
  }

  getSnapshot = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(forceSave = false) {
    for (const listener of this.listeners) listener();
    const now = performance.now();
    if (forceSave || now - this.lastSaveAt > 1200) {
      this.lastSaveAt = now;
      this.savePort.save(this.state);
    }
  }

  private patch(next: Partial<GameSnapshot>, forceSave = false) {
    this.state = { ...this.state, ...next };
    this.refreshRoutes();
    this.emit(forceSave);
  }

  start() {
    if (!this.state.paused) return;
    this.patch({ paused: false, message: "День 1. Не опаздывай на режимные мероприятия." }, true);
  }

  togglePause() {
    this.patch({ paused: !this.state.paused }, true);
  }

  tick(realSeconds: number) {
    if (this.state.paused || this.state.completedRoute) return;
    let minute = this.state.minute + realSeconds * GAME_MINUTES_PER_SECOND;
    let day = this.state.day;
    let searched = this.state.searched;
    if (minute >= 1440) {
      minute %= 1440;
      day += 1;
      searched = [];
    }
    const schedule = scheduleAt(minute).id;
    const stamina = clamp(this.state.stamina + realSeconds * (schedule === "lightsout" ? 2.2 : 0.55));
    const health = clamp(this.state.health + realSeconds * (schedule === "lightsout" ? 0.5 : 0.04));
    const now = performance.now();
    this.state = { ...this.state, day, minute, searched, schedule, stamina, health };
    if (now - this.lastEmitAt > 250) {
      this.lastEmitAt = now;
      this.refreshRoutes();
      this.emit();
    }
  }

  observePlayer(input: {
    x: number;
    z: number;
    zone: ZoneId;
    dt: number;
    moving: boolean;
    sprinting: boolean;
    nearestGuard: number;
  }) {
    if (this.state.paused || this.state.completedRoute) return;
    let stamina = this.state.stamina;
    if (input.sprinting && input.moving) stamina = clamp(stamina - input.dt * 8.5);
    else if (!input.moving) stamina = clamp(stamina + input.dt * 1.25);

    const schedule = scheduleAt(this.state.minute);
    const room = ROOMS.find((candidate) => candidate.id === input.zone);
    const disguised = this.state.inventory.guardUniform > 0;
    let suspicion = this.state.suspicion;
    const restricted = Boolean(room?.restricted) && !disguised;
    if (restricted && input.nearestGuard < 8) suspicion += input.dt * 13;
    if (schedule.requiredZone && schedule.requiredZone !== input.zone && input.nearestGuard < 7) {
      suspicion += input.dt * (disguised ? 1.2 : 3.4);
    } else {
      suspicion -= input.dt * 0.8;
    }
    if (contrabandCount(this.state.inventory) > 0 && input.nearestGuard < 2.2) suspicion += input.dt * 5.5;
    suspicion = clamp(suspicion);

    this.state = {
      ...this.state,
      stamina,
      suspicion,
      currentZone: input.zone,
      playerPosition: { x: input.x, z: input.z },
    };
    if (suspicion >= 100) this.caught("Охрана остановила тебя после слишком долгого нарушения режима.");
  }

  setMessage(message: string) {
    this.patch({ message });
  }

  interact(id: string) {
    if (this.state.completedRoute) return;
    if (id in LOOT) return this.searchContainer(id);
    if (id === "bookshelf") return this.trainIntelligence();
    if (id === "bench") return this.trainStrength();
    if (id === "laundry-job") return this.workLaundry();
    if (id === "bed") return this.sleep();
    if (id === "tunnel-dig") return this.digTunnel();
    if (id === "maintenance-hatch") return this.tryEscape("maintenance");
    if (id === "roof-exit") return this.tryEscape("roof");
    if (id === "tunnel-exit") return this.tryEscape("tunnel");
    if (id.endsWith("door") || id === "roof-gate") return this.openDoor(id);
  }

  private searchContainer(id: string) {
    const key = `${this.state.day}:${id}`;
    if (this.state.searched.includes(key)) {
      this.setMessage("Ты уже проверял это место сегодня.");
      return;
    }
    const loot = LOOT[id];
    const inventory = cloneInventory(this.state.inventory);
    const found: string[] = [];
    for (const [item, quantity] of Object.entries(loot) as [ItemId, number][]) {
      inventory[item] += quantity;
      found.push(`${ITEM_DEFINITIONS[item].name} ×${quantity}`);
    }
    this.patch({ inventory, searched: [...this.state.searched, key], message: `Найдено: ${found.join(", ")}.` }, true);
  }

  private activityReady(seconds: number) {
    const now = performance.now();
    if (now - this.lastActivityAt < seconds * 1000) return false;
    this.lastActivityAt = now;
    return true;
  }

  private trainIntelligence() {
    if (!this.activityReady(2.2)) return this.setMessage("Слишком быстро. Дай голове немного отдыха.");
    if (this.state.stamina < 6) return this.setMessage("Не хватает выносливости.");
    this.patch({
      intelligence: clamp(this.state.intelligence + 1),
      stamina: clamp(this.state.stamina - 6),
      message: `Интеллект +1. Теперь ${Math.round(this.state.intelligence + 1)}.`,
    }, true);
  }

  private trainStrength() {
    if (!this.activityReady(2.2)) return this.setMessage("Сделай короткую паузу между подходами.");
    if (this.state.stamina < 12) return this.setMessage("Не хватает выносливости.");
    this.patch({
      strength: clamp(this.state.strength + 1),
      stamina: clamp(this.state.stamina - 12),
      message: "Сила +1. Выносливость восстановится со временем.",
    }, true);
  }

  private workLaundry() {
    if (this.state.schedule !== "work") return this.setMessage("Рабочая станция активна только во время смены.");
    if (!this.activityReady(1.4)) return;
    const progress = this.state.workProgress + 1;
    if (progress < 3) {
      this.patch({ workProgress: progress, stamina: clamp(this.state.stamina - 4), message: `Прачечная: ${progress}/3 тележек обработано.` });
      return;
    }
    this.patch({
      workProgress: 0,
      money: this.state.money + 18,
      reputation: clamp(this.state.reputation + 2),
      stamina: clamp(this.state.stamina - 6),
      message: "Смена закрыта. +18$, +2 репутации. Nico теперь готов поговорить о форме.",
    }, true);
  }

  private sleep() {
    if (this.state.schedule !== "lightsout") return this.setMessage("Сейчас рано спать — охрана заметит попытку сорвать распорядок.");
    const nextDay = this.state.minute >= 1380 ? this.state.day + 1 : this.state.day;
    this.patch({
      day: nextDay,
      minute: 390,
      schedule: "rollcall",
      stamina: 100,
      health: clamp(this.state.health + 20),
      searched: [],
      message: `День ${nextDay}. Утренняя перекличка началась.`,
    }, true);
  }

  private digTunnel() {
    const inventory = cloneInventory(this.state.inventory);
    if (inventory.spoon < 1) return this.setMessage("Нечем копать. Даже ложка была бы полезнее голых рук.");
    if (this.state.schedule !== "lightsout") {
      this.patch({ suspicion: clamp(this.state.suspicion + 14), message: "Слишком шумно. Копать безопаснее после отбоя." });
      return;
    }
    if (this.state.stamina < 10) return this.setMessage("Не хватает выносливости.");
    if (!this.activityReady(2)) return;
    const digs = Math.min(3, this.state.tunnelDigs + 1);
    this.patch({
      tunnelDigs: digs,
      stamina: clamp(this.state.stamina - 10),
      message: digs >= 3 ? "Проход открыт. Теперь нужна верёвка из простыней." : `Тоннель: ${digs}/3. Землю придётся прятать.`,
    }, true);
  }

  openDoor(id: string) {
    if (this.state.openedDoors.includes(id)) return;
    const inventory = this.state.inventory;
    if (id === "service-door") {
      if (inventory.plasticKey < 1 && !(inventory.guardUniform > 0 && inventory.keycard > 0)) {
        this.setMessage("Служебная дверь. Нужен ключ или форма вместе с пропуском.");
        return;
      }
    }
    if (id === "roof-gate") {
      if (inventory.cutters < 1) {
        this.setMessage("Сетка слишком прочная. Нужен усиленный резак.");
        return;
      }
    }
    this.patch({ openedDoors: [...this.state.openedDoors, id], message: `${id === "roof-gate" ? "Сетка перекушена" : "Дверь открыта"}.` }, true);
  }

  craft(recipeId: string) {
    const recipe = RECIPES.find((candidate) => candidate.id === recipeId);
    if (!recipe) return;
    const inventory = cloneInventory(this.state.inventory);
    if (this.state.intelligence < recipe.intelligence) {
      this.setMessage(`Нужно ${recipe.intelligence} интеллекта. Поищи учебные материалы в блоке.`);
      return;
    }
    if (!canCraft(recipe, inventory, this.state.intelligence)) {
      this.setMessage("Не хватает компонентов для этого рецепта.");
      return;
    }
    applyCraft(recipe, inventory);
    this.patch({ inventory, message: `Создано: ${recipe.name}.` }, true);
  }

  talkTo(npcId: string | null) {
    this.patch({ focusNpcId: npcId });
  }

  buyFromRook(item: ItemId) {
    const allowed: ItemId[] = ["lighter", "ductTape", "file", "sheet"];
    if (!allowed.includes(item)) return;
    const price = ITEM_DEFINITIONS[item].price;
    if (this.state.money < price) return this.setMessage(`Rook: нужно ${price}$.`);
    const inventory = cloneInventory(this.state.inventory);
    inventory[item] += 1;
    this.patch({ money: this.state.money - price, inventory, message: `Rook передал: ${ITEM_DEFINITIONS[item].name}.` }, true);
  }

  npcAction(action: "marco" | "nico" | "miller" | "hayes") {
    const inventory = cloneInventory(this.state.inventory);
    if (action === "marco") {
      if ((this.state.relationships.marco ?? 0) > 0) return this.setMessage("Marco: мы уже в расчёте. Не свети пропуском.");
      if (inventory.spoon < 1) return this.setMessage("Marco: принеси ложку из столовой. Я дам кое-что полезнее.");
      inventory.spoon -= 1;
      inventory.keycard += 1;
      this.patch({ inventory, relationships: { ...this.state.relationships, marco: 1 }, reputation: clamp(this.state.reputation + 4), message: "Marco забрал ложку и передал служебный пропуск." }, true);
      return;
    }
    if (action === "nico") {
      if ((this.state.relationships.nico ?? 0) > 0) return this.setMessage("Nico: форма уже у тебя. Не попадись в ней Miller'у.");
      if (this.state.reputation < 12) return this.setMessage("Nico: сначала покажи, что умеешь работать. Закрой смену в прачечной.");
      inventory.guardUniform += 1;
      this.patch({ inventory, relationships: { ...this.state.relationships, nico: 1 }, message: "Nico спрятал форму охраны в твоей тележке." }, true);
      return;
    }
    if (action === "miller") {
      if (this.state.money < 35) return this.setMessage("Miller: разговор стоит 35$. Иначе я тебя не видел.");
      this.patch({ money: this.state.money - 35, suspicion: clamp(this.state.suspicion - 55), relationships: { ...this.state.relationships, miller: (this.state.relationships.miller ?? 0) + 1 }, message: "Miller отвёл взгляд. Подозрение резко снизилось." }, true);
      return;
    }
    if (action === "hayes") {
      if (this.state.health >= 95) return this.setMessage("Dr. Hayes: тебе лечение сейчас не нужно.");
      if (this.state.money < 10) return this.setMessage("Dr. Hayes: медикаменты стоят 10$.");
      this.patch({ money: this.state.money - 10, health: clamp(this.state.health + 40), relationships: { ...this.state.relationships, hayes: (this.state.relationships.hayes ?? 0) + 1 }, message: "Dr. Hayes обработал травмы. +40 здоровья." }, true);
    }
  }

  stashItem(item: ItemId, toStash: boolean) {
    if (this.state.currentZone !== "cellblock") {
      this.setMessage("Тайник доступен только в твоей камере.");
      return;
    }
    const inventory = cloneInventory(this.state.inventory);
    const stash = cloneInventory(this.state.stash);
    const source = toStash ? inventory : stash;
    const target = toStash ? stash : inventory;
    if (source[item] < 1) return;
    source[item] -= 1;
    target[item] += 1;
    this.patch({ inventory, stash, message: toStash ? "Предмет спрятан в тайнике." : "Предмет забран из тайника." }, true);
  }

  private tryEscape(route: EscapeRouteId) {
    if (route === "maintenance") {
      if (!this.state.openedDoors.includes("service-door")) return this.setMessage("Сначала нужен доступ в техническую зону.");
      if (this.state.inventory.screwdriver < 1) return this.setMessage("Люк закреплён винтами. Нужна отвёртка.");
    }
    if (route === "roof") {
      if (!this.state.openedDoors.includes("roof-gate")) return this.setMessage("Сначала перекуси сетку на выходе к крыше.");
      if (this.state.inventory.guardUniform < 1) return this.setMessage("На крыше открытая зона. Без формы тебя заметят сразу.");
    }
    if (route === "tunnel") {
      if (this.state.tunnelDigs < 3) return this.setMessage("Проход ещё слишком узкий.");
      if (this.state.inventory.rope < 1) return this.setMessage("Нужна верёвка, чтобы спуститься в дренаж.");
    }
    this.patch({ completedRoute: route, paused: true, message: `Побег выполнен: ${route}.` }, true);
  }

  private refreshRoutes() {
    const inventory = this.state.inventory;
    const maintenanceProgress = Number(inventory.toothbrush > 0 || inventory.plasticKey > 0)
      + Number(inventory.plasticKey > 0 || (inventory.guardUniform > 0 && inventory.keycard > 0))
      + Number(this.state.openedDoors.includes("service-door"))
      + Number(inventory.screwdriver > 0);
    const roofProgress = Number(inventory.file > 0 || inventory.cutters > 0)
      + Number(inventory.ductTape > 0 || inventory.cutters > 0)
      + Number(inventory.cutters > 0)
      + Number(inventory.guardUniform > 0)
      + Number(this.state.openedDoors.includes("roof-gate"));
    const tunnelProgress = Math.min(3, this.state.tunnelDigs) + Number(inventory.rope > 0);
    this.state = {
      ...this.state,
      routeProgress: {
        maintenance: { discovered: maintenanceProgress > 0, complete: maintenanceProgress >= 4, progress: maintenanceProgress / 4 },
        roof: { discovered: roofProgress > 0, complete: roofProgress >= 5, progress: roofProgress / 5 },
        tunnel: { discovered: this.state.tunnelDigs > 0 || inventory.spoon > 0 || inventory.rope > 0, complete: tunnelProgress >= 4, progress: tunnelProgress / 4 },
      },
    };
  }

  private caught(reason: string) {
    const inventory = cloneInventory(this.state.inventory);
    const removed = removeContraband(inventory);
    this.state = {
      ...this.state,
      inventory,
      suspicion: 0,
      reputation: clamp(this.state.reputation - 6),
      health: clamp(this.state.health - 8),
      minute: Math.min(1439, this.state.minute + 60),
      currentZone: "cellblock",
      playerPosition: { x: -11.4, z: 5.5 },
      teleportRevision: this.state.teleportRevision + 1,
      message: `${reason} ${removed.length ? `Конфисковано: ${removed.map((id) => ITEM_DEFINITIONS[id].name).join(", ")}.` : "Контрабанды при тебе не нашли."}`,
    };
    this.refreshRoutes();
    this.emit(true);
  }

  reset() {
    this.savePort.clear();
    this.state = createFreshSnapshot();
    this.emit(true);
  }
}
