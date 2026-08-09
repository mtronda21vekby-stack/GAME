import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import CommerceHeader from "../../components/CommerceHeader";
import {
  ensureStoreInit,
  formatCoins,
  getStoreItems,
  getStoreState,
  rarityAccent,
  rarityLabel,
  toggleWishlist,
  type StoreCategory,
  type StoreItem,
  type StoreState,
} from "../../lib/store";
import { addToCart, getCartCount } from "../../lib/commerce";
import "../../styles/commerce.css";

type StoreView = "all" | "wishlist" | "owned";
type StoreFilter = StoreCategory | "all";

function categoryLabel(category: StoreCategory | "all") {
  if (category === "all") return "Все категории";
  if (category === "skins") return "Скины";
  if (category === "badges") return "Бейджи";
  return "Наборы";
}

function ProductCard({
  item,
  owned,
  wished,
  onAdd,
  onWish,
}: {
  item: StoreItem;
  owned: boolean;
  wished: boolean;
  onAdd: () => void;
  onWish: () => void;
}) {
  return (
    <article className="bcCommerceProduct">
      <div
        className="bcCommerceProduct__art"
        style={{ backgroundImage: `${item.art.glow}, ${item.art.gradient}` }}
        aria-hidden="true"
      >
        <div className="bcCommercePills" style={{ position: "absolute", zIndex: 2, left: 12, top: 12 }}>
          <span className="bcCommercePill bcCommercePill--accent" style={{ color: rarityAccent(item.rarity) }}>
            {rarityLabel(item.rarity)}
          </span>
          <span className="bcCommercePill">{categoryLabel(item.category)}</span>
        </div>
      </div>

      <div className="bcCommerceProduct__body">
        <div className="bcCommercePills">
          {item.tags.slice(0, 3).map((tag) => <span className="bcCommercePill" key={tag}>{tag}</span>)}
          {owned ? <span className="bcCommercePill bcCommercePill--accent">В коллекции</span> : null}
        </div>

        <h3>{item.title}</h3>
        <p>{item.desc}</p>

        <div className="bcCommerceProduct__footer">
          <div className="bcCommercePrice">
            <img src={Icons.crown} alt="" width="17" height="17" />
            <span>{formatCoins(item.price)} BC</span>
          </div>

          <div className="bcCommerceActions">
            <Button variant="ghost" onClick={onWish}>
              {wished ? "Убрать" : "Избранное"}
            </Button>
            <Button variant={owned ? "secondary" : "primary"} onClick={onAdd} disabled={owned}>
              {owned ? "Получено" : "В корзину"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Store() {
  const [items] = React.useState<StoreItem[]>(() => {
    ensureStoreInit();
    return getStoreItems();
  });
  const [storeState, setStoreState] = React.useState<StoreState>(() => getStoreState());
  const [cartCount, setCartCount] = React.useState(getCartCount);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<StoreFilter>("all");
  const [view, setView] = React.useState<StoreView>("all");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    const onCartChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      setCartCount(typeof detail?.count === "number" ? detail.count : getCartCount());
    };
    window.addEventListener("bc:cart-changed", onCartChanged);
    return () => window.removeEventListener("bc:cart-changed", onCartChanged);
  }, []);

  const owned = React.useMemo(() => new Set(storeState.owned), [storeState.owned]);
  const wishlist = React.useMemo(() => new Set(storeState.wishlist), [storeState.wishlist]);

  const visible = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (view === "wishlist" && !wishlist.has(item.id)) return false;
      if (view === "owned" && !owned.has(item.id)) return false;
      if (!normalizedQuery) return true;
      return `${item.title} ${item.desc} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
    });
  }, [filter, items, owned, query, view, wishlist]);

  function addItem(item: StoreItem) {
    if (owned.has(item.id)) return;
    const next = addToCart(item.id);
    setCartCount(next.reduce((sum, line) => sum + line.quantity, 0));
    setNotice(`${item.title} добавлен в корзину.`);
  }

  function toggleItemWishlist(item: StoreItem) {
    setStoreState(toggleWishlist(item.id));
  }

  return (
    <main className="bcCommercePage" data-commerce-page="store">
      <CommerceHeader cartCount={cartCount} backHref="/" backLabel="Главная" />

      <div className="bcCommerceMain">
        <section className="bcCommerceHero">
          <span className="bcCommerceEyebrow">BLACKCROWN COMMERCE / SERVER-VALIDATED FLOW</span>
          <h1>Store</h1>
          <p>
            Предметы BlackCrown теперь проходят через корзину и отдельный checkout. Цена и состав заказа повторно
            проверяются сервером перед созданием заказа.
          </p>
          <div className="bcCommercePills">
            <span className="bcCommercePill bcCommercePill--accent">Корзина: {cartCount}</span>
            <span className="bcCommercePill">Коллекция: {storeState.owned.length}</span>
            <span className="bcCommercePill">Избранное: {storeState.wishlist.length}</span>
          </div>
          {notice ? <div className="bcCommerceNotice" role="status">{notice}</div> : null}
        </section>

        <section className="bcCommerceToolbar" aria-label="Фильтры магазина">
          <input
            className="bcCommerceInput"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Поиск по названию или тегу"
          />

          <select
            className="bcCommerceSelect"
            value={filter}
            onChange={(event) => setFilter(event.currentTarget.value as StoreFilter)}
            aria-label="Категория"
          >
            <option value="all">Все категории</option>
            <option value="skins">Скины</option>
            <option value="badges">Бейджи</option>
            <option value="bundles">Наборы</option>
          </select>

          <select
            className="bcCommerceSelect"
            value={view}
            onChange={(event) => setView(event.currentTarget.value as StoreView)}
            aria-label="Режим витрины"
          >
            <option value="all">Вся витрина</option>
            <option value="wishlist">Избранное</option>
            <option value="owned">Коллекция</option>
          </select>
        </section>

        <section className="bcCommerceSection" aria-labelledby="store-items-title">
          <div className="bcCommerceToolbar" style={{ marginBottom: 16 }}>
            <div>
              <span className="bcCommerceMeta">CATALOG / {visible.length} ITEMS</span>
              <h2 id="store-items-title" style={{ marginTop: 7 }}>Витрина BlackCrown</h2>
            </div>
            <Button variant="primary" onClick={() => {
              window.history.pushState(null, "", "/cart");
              window.dispatchEvent(new PopStateEvent("popstate"));
              window.scrollTo({ top: 0, behavior: "auto" });
            }}>
              Открыть корзину · {cartCount}
            </Button>
          </div>

          {visible.length ? (
            <div className="bcCommerceGrid">
              {visible.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  owned={owned.has(item.id)}
                  wished={wishlist.has(item.id)}
                  onAdd={() => addItem(item)}
                  onWish={() => toggleItemWishlist(item)}
                />
              ))}
            </div>
          ) : (
            <div className="bcCommerceEmpty">
              <h2>Ничего не найдено</h2>
              <p>Сбрось фильтры или измени поисковый запрос.</p>
              <Button variant="secondary" onClick={() => {
                setQuery("");
                setFilter("all");
                setView("all");
              }}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Store;
