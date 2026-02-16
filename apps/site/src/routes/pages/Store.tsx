import React from "react";
import { Button, Modal } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { openTelegramBot } from "../../lib/telegram";
import {
  StoreItem,
  StoreState,
  StoreCategory,
  ensureStoreInit,
  getStoreItems,
  getStoreState,
  buyItem,
  toggleWishlist,
  formatCoins,
  rarityAccent,
  rarityLabel,
} from "../../lib/store";

const TG_URL = "https://t.me/GGBF6_WARZON_BOT";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function navExternal(path: string) {
  window.location.assign(path);
}

function Pill(props: { children: React.ReactNode; tone?: "soft" | "accent" }) {
  const tone = props.tone ?? "soft";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: tone === "accent" ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.10)",
        background: tone === "accent" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.86)",
        fontWeight: 900,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {props.children}
    </span>
  );
}

function Card(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
        {props.right}
      </div>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </div>
  );
}

function Segmented(props: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        borderRadius: 16,
        padding: 8,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => props.onChange(o.value)}
            style={{
              height: 40,
              padding: "0 12px",
              borderRadius: 12,
              border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
              color: "var(--text)",
              fontWeight: 950,
              cursor: "pointer",
              outline: "none",
            }}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function categoryLabel(c: StoreCategory | "all") {
  switch (c) {
    case "all":
      return "Все";
    case "skins":
      return "Скины";
    case "badges":
      return "Бейджи";
    case "bundles":
      return "Наборы";
  }
}

function ProductCard(props: {
  item: StoreItem;
  owned: boolean;
  wish: boolean;
  onOpen: () => void;
  onBuy: () => void;
  onWish: () => void;
}) {
  const { item, owned, wish } = props;

  return (
    <div
      className="glassStrong bc-motion"
      role="button"
      tabIndex={0}
      onClick={props.onOpen}
      onKeyDown={(e) => {
        if (e.key === " ") e.preventDefault();
        if (e.key === "Enter" || e.key === " ") props.onOpen();
      }}
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.28)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          height: 160,
          position: "relative",
          backgroundImage: `${item.art.glow}, ${item.art.gradient}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.40) 100%)",
          }}
        />
        <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill tone="accent">
            <span style={{ color: rarityAccent(item.rarity), fontWeight: 980 }}>{rarityLabel(item.rarity)}</span>
          </Pill>
          <Pill>{categoryLabel(item.category)}</Pill>
          {wish ? <Pill>Избранное</Pill> : null}
          {owned ? <Pill tone="accent">В коллекции</Pill> : null}
        </div>

        <div style={{ position: "absolute", left: 14, bottom: 12, right: 14 }}>
          <div style={{ fontWeight: 980, letterSpacing: "-0.01em", fontSize: 16 }}>{item.title}</div>
          <div style={{ marginTop: 6, opacity: 0.84, lineHeight: 1.35, fontWeight: 850 }}>{item.desc}</div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.tags.slice(0, 3).map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <img alt="" src={Icons.crown} width="16" height="16" style={{ opacity: 0.9 }} />
            <div style={{ fontWeight: 980 }}>{formatCoins(item.price)}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant={owned ? "secondary" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              if (!owned) props.onBuy();
            }}
          >
            {owned ? "В коллекции" : "Получить"}
          </Button>

          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              props.onWish();
            }}
          >
            {wish ? "Убрать" : "В избранное"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Store() {
  const [items, setItems] = React.useState<StoreItem[]>(() => {
    ensureStoreInit();
    return getStoreItems();
  });

  const [state, setState] = React.useState<StoreState>(() => getStoreState());

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<StoreCategory | "all">("all");
  const [view, setView] = React.useState<"all" | "wishlist" | "owned">("all");

  const [active, setActive] = React.useState<StoreItem | null>(null);
  const [info, setInfo] = React.useState<{ title: string; desc: string; tone: "ok" | "warn" } | null>(null);

  const ownedSet = React.useMemo(() => new Set(state.owned), [state.owned]);
  const wishSet = React.useMemo(() => new Set(state.wishlist), [state.wishlist]);

  function refresh() {
    ensureStoreInit();
    setItems(getStoreItems());
    setState(getStoreState());
  }

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((it) => {
      if (filter !== "all" && it.category !== filter) return false;
      if (view === "wishlist" && !wishSet.has(it.id)) return false;
      if (view === "owned" && !ownedSet.has(it.id)) return false;

      if (!q) return true;
      const hay = `${it.title} ${it.desc} ${it.tags.join(" ")} ${it.category} ${it.rarity}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, filter, view, wishSet, ownedSet]);

  const ownedItems = React.useMemo(() => items.filter((x) => ownedSet.has(x.id)), [items, ownedSet]);
  const wishItems = React.useMemo(() => items.filter((x) => wishSet.has(x.id)), [items, wishSet]);

  function doBuy(item: StoreItem) {
    const res = buyItem(item);

    setState(res.state);

    if (res.ok) {
      setInfo({ title: "Добавлено в коллекцию", desc: item.title, tone: "ok" });
      return;
    }

    if (res.reason === "owned") {
      setInfo({ title: "Уже в коллекции", desc: item.title, tone: "ok" });
      return;
    }

    setInfo({
      title: "Недостаточно средств",
      desc: "Пополнение доступно через AI-Coach в Telegram.",
      tone: "warn",
    });
  }

  function doWish(itemId: string) {
    const next = toggleWishlist(itemId);
    setState(next);
  }

  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "auto" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/about">
              О проекте
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
            <a className="bcLink" href="/store">
              Магазин
            </a>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
          </nav>

          <div className="bcRight">
            <Button variant="secondary" onClick={() => nav("/account")}>
              Аккаунт
            </Button>
            <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
              Lobby
            </Button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill tone="accent">Магазин</Pill>
              <Pill>Витрина</Pill>
              <Pill>Коллекция</Pill>
              <Pill>Избранное</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Store
              <br />
              BlackCrown
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Предметы для профиля и интерфейса. Покупки сохраняются в коллекции, избранное — для быстрого доступа.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div
                className="glassStrong"
                style={{
                  borderRadius: 16,
                  padding: "10px 12px",
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.16)",
                }}
              >
                <img alt="" src={Icons.crown} width="16" height="16" style={{ opacity: 0.9 }} />
                <div style={{ fontWeight: 980 }}>Баланс: {formatCoins(state.balance)}</div>
              </div>

              <Button variant="secondary" onClick={openTelegramBot}>
                Пополнить через Telegram
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                  setView("all");
                }}
              >
                Сбросить
              </Button>

              <Button variant="ghost" onClick={refresh}>
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1.2fr 0.8fr", alignItems: "start" }}>
              <div style={{ display: "grid", gap: 12 }}>
                <Card title="Витрина" right={<Pill>{visible.length} шт.</Pill>}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 950 }}>Режим</div>
                        <Segmented
                          value={view}
                          options={[
                            { value: "all", label: "Все" },
                            { value: "wishlist", label: "Избранное" },
                            { value: "owned", label: "Коллекция" },
                          ]}
                          onChange={(v) => setView(v as any)}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 950 }}>Категория</div>
                        <Segmented
                          value={filter}
                          options={[
                            { value: "all", label: "Все" },
                            { value: "skins", label: "Скины" },
                            { value: "badges", label: "Бейджи" },
                            { value: "bundles", label: "Наборы" },
                          ]}
                          onChange={(v) => setFilter(v as any)}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 950 }}>Поиск</div>
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Название, тег, категория"
                          inputMode="text"
                          style={{
                            width: "100%",
                            height: 46,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text)",
                            padding: "0 12px",
                            outline: "none",
                            fontWeight: 900,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                      {visible.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          owned={ownedSet.has(item.id)}
                          wish={wishSet.has(item.id)}
                          onOpen={() => setActive(item)}
                          onBuy={() => doBuy(item)}
                          onWish={() => doWish(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <Card title="Избранное" right={<Pill>{wishItems.length}</Pill>}>
                  {wishItems.length === 0 ? (
                    <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.5 }}>
                      Добавь предметы в избранное — они появятся здесь для быстрого доступа.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {wishItems.slice(0, 8).map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setActive(it)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: 12,
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.16)",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "var(--text)",
                          }}
                        >
                          <div style={{ display: "grid", gap: 4 }}>
                            <div style={{ fontWeight: 980 }}>{it.title}</div>
                            <div style={{ opacity: 0.78, fontWeight: 850, fontSize: 12 }}>{rarityLabel(it.rarity)}</div>
                          </div>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              backgroundImage: `${it.art.glow}, ${it.art.gradient}`,
                              border: "1px solid rgba(255,255,255,0.12)",
                              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="Коллекция" right={<Pill>{ownedItems.length}</Pill>}>
                  {ownedItems.length === 0 ? (
                    <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.5 }}>
                      Коллекция пока пустая. Выбери предмет во витрине и нажми «Получить».
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {ownedItems.slice(0, 8).map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setActive(it)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: 12,
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.16)",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "var(--text)",
                          }}
                        >
                          <div style={{ display: "grid", gap: 4 }}>
                            <div style={{ fontWeight: 980 }}>{it.title}</div>
                            <div style={{ opacity: 0.78, fontWeight: 850, fontSize: 12 }}>{rarityLabel(it.rarity)}</div>
                          </div>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              backgroundImage: `${it.art.glow}, ${it.art.gradient}`,
                              border: "1px solid rgba(255,255,255,0.12)",
                              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                            }}
                          />
                        </button>
                      ))}

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Button variant="secondary" onClick={() => nav("/account")}>
                          В аккаунт
                        </Button>
                        <Button variant="ghost" onClick={() => setView("owned")}>
                          Показать в витрине
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                <Card title="История">
                  {state.tx.length === 0 ? (
                    <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.5 }}>
                      Здесь появятся операции: покупки, пополнения и избранное.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {state.tx
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((t) => {
                          const sign = t.type === "buy" ? "" : t.type === "credit" ? "+" : "";
                          const amount = typeof t.amount === "number" ? `${sign}${formatCoins(t.amount)}` : "";
                          const title = t.type === "buy" ? "Покупка" : t.type === "credit" ? "Пополнение" : "Избранное";

                          return (
                            <div
                              key={t.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                padding: 10,
                                borderRadius: 16,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(0,0,0,0.16)",
                              }}
                            >
                              <div style={{ display: "grid", gap: 3 }}>
                                <div style={{ fontWeight: 980 }}>{title}</div>
                                <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>{fmtTime(t.at)}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {amount ? <div style={{ fontWeight: 980 }}>{amount}</div> : null}
                                <img alt="" src={Icons.crown} width="16" height="16" style={{ opacity: 0.9 }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/privacy">
                Privacy
              </a>
              <a className="bcLink" href="/terms">
                Terms
              </a>
              <a className="bcLink" href="/support">
                Поддержка
              </a>
            </div>
          </div>
        </div>
      </section>

      <Modal open={!!active} title={active ? active.title : ""} onClose={() => setActive(null)}>
        {active ? (
          <div className="bc-col" style={{ gap: 12 }}>
            <div
              style={{
                height: 180,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundImage: `${active.art.glow}, ${active.art.gradient}`,
                boxShadow: "0 22px 70px rgba(0,0,0,0.40)",
              }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill tone="accent">
                <span style={{ color: rarityAccent(active.rarity), fontWeight: 980 }}>{rarityLabel(active.rarity)}</span>
              </Pill>
              <Pill>{categoryLabel(active.category)}</Pill>
              {wishSet.has(active.id) ? <Pill>Избранное</Pill> : null}
              {ownedSet.has(active.id) ? <Pill tone="accent">В коллекции</Pill> : null}
            </div>

            <div style={{ opacity: 0.88, lineHeight: 1.55, fontWeight: 850 }}>{active.desc}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <img alt="" src={Icons.crown} width="16" height="16" style={{ opacity: 0.9 }} />
                <div style={{ fontWeight: 980 }}>{formatCoins(active.price)}</div>
              </div>

              <div style={{ flex: "1 1 auto" }} />

              <Button
                variant={ownedSet.has(active.id) ? "secondary" : "primary"}
                onClick={() => {
                  if (ownedSet.has(active.id)) return;
                  doBuy(active);
                }}
              >
                {ownedSet.has(active.id) ? "В коллекции" : "Получить"}
              </Button>

              <Button variant="ghost" onClick={() => doWish(active.id)}>
                {wishSet.has(active.id) ? "Убрать" : "В избранное"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!info} title={info?.title ?? ""} onClose={() => setInfo(null)}>
        <div className="bc-col" style={{ gap: 12 }}>
          <div style={{ opacity: 0.88, fontWeight: 850, lineHeight: 1.55 }}>{info?.desc ?? ""}</div>

          {info?.tone === "warn" ? (
            <div className="glassStrong" style={{ borderRadius: 16, padding: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.16)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 980 }}>Пополнение</div>
                  <div style={{ opacity: 0.78, fontWeight: 850, fontSize: 12 }}>Через AI-Coach в Telegram</div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={openTelegramBot}>
                    Открыть Telegram
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText?.(TG_URL);
                    }}
                  >
                    Скопировать ссылку
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={() => setInfo(null)}>
              Закрыть
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
