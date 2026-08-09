import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import CommerceHeader from "../../components/CommerceHeader";
import { formatCoins } from "../../lib/store";
import {
  getCartCount,
  getCartItems,
  getCartTotal,
  removeFromCart,
  setCartQuantity,
  type CartItem,
} from "../../lib/commerce";
import "../../styles/commerce.css";

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function Cart() {
  const [items, setItems] = React.useState<CartItem[]>(getCartItems);

  const refresh = React.useCallback(() => setItems(getCartItems()), []);

  React.useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener("bc:cart-changed", onChanged);
    return () => window.removeEventListener("bc:cart-changed", onChanged);
  }, [refresh]);

  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  const total = items.reduce((sum, line) => sum + line.lineTotal, 0);

  return (
    <main className="bcCommercePage" data-commerce-page="cart">
      <CommerceHeader cartCount={count} backHref="/store" backLabel="Продолжить покупки" hideCart />

      <div className="bcCommerceMain">
        <section className="bcCommerceHero">
          <span className="bcCommerceEyebrow">BLACKCROWN COMMERCE / CART</span>
          <h1>Корзина</h1>
          <p>Измени количество предметов, затем перейди к серверной проверке и оформлению заказа.</p>
          <div className="bcCommercePills">
            <span className="bcCommercePill bcCommercePill--accent">Предметов: {count}</span>
            <span className="bcCommercePill">Сумма: {formatCoins(total)} BC</span>
          </div>
        </section>

        {!items.length ? (
          <section className="bcCommerceEmpty">
            <h2>Корзина пуста</h2>
            <p>Добавь предметы из Store. Локальная покупка в один клик больше не используется.</p>
            <div className="bcCommerceActions">
              <Button variant="primary" onClick={() => navigate("/store")}>Открыть Store</Button>
              <Button variant="secondary" onClick={() => navigate("/")}>На главную</Button>
            </div>
          </section>
        ) : (
          <div className="bcCommerceSplit">
            <section className="bcCommerceCard" aria-labelledby="cart-lines-title">
              <div>
                <span className="bcCommerceMeta">CART CONTENTS</span>
                <h2 id="cart-lines-title" style={{ marginTop: 7 }}>Состав заказа</h2>
              </div>

              <div className="bcCommerceLines">
                {items.map(({ item, quantity, lineTotal }) => (
                  <article className="bcCommerceLine" key={item.id}>
                    <div
                      className="bcCommerceLine__art"
                      style={{ backgroundImage: `${item.art.glow}, ${item.art.gradient}` }}
                      aria-hidden="true"
                    />
                    <div className="bcCommerceLine__copy">
                      <strong>{item.title}</strong>
                      <span className="bcCommerceMeta">{item.category} / {item.rarity}</span>
                      <span className="bcCommercePrice">
                        <img src={Icons.crown} alt="" width="17" height="17" />
                        {formatCoins(lineTotal)} BC
                      </span>
                    </div>
                    <div className="bcCommerceLine__controls">
                      <div className="bcCommerceQuantity" aria-label={`Количество ${item.title}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setCartQuantity(item.id, quantity - 1);
                            refresh();
                          }}
                          aria-label="Уменьшить количество"
                        >−</button>
                        <output>{quantity}</output>
                        <button
                          type="button"
                          onClick={() => {
                            setCartQuantity(item.id, quantity + 1);
                            refresh();
                          }}
                          aria-label="Увеличить количество"
                        >+</button>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          removeFromCart(item.id);
                          refresh();
                        }}
                      >
                        Удалить
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="bcCommerceCard bcCommerceCard--sticky" aria-labelledby="cart-summary-title">
              <div>
                <span className="bcCommerceMeta">ORDER SUMMARY</span>
                <h2 id="cart-summary-title" style={{ marginTop: 7 }}>Итого</h2>
              </div>

              <div className="bcCommerceSummary">
                <div className="bcCommerceSummary__row"><span>Позиций</span><strong>{items.length}</strong></div>
                <div className="bcCommerceSummary__row"><span>Предметов</span><strong>{count}</strong></div>
                <div className="bcCommerceSummary__row bcCommerceSummary__row--total">
                  <span>К оплате</span><strong>{formatCoins(total)} BC</strong>
                </div>
              </div>

              <div className="bcCommerceNotice">
                На следующем шаге сервер заново проверит ID предметов, количество и цену. Данные из браузера не считаются доверенными.
              </div>

              <Button variant="primary" onClick={() => navigate("/checkout")}>Перейти к оформлению</Button>
              <Button variant="secondary" onClick={() => navigate("/store")}>Вернуться в Store</Button>
            </aside>
          </div>
        )}

        <span hidden aria-hidden="true">{getCartCount()} {getCartTotal()}</span>
      </div>
    </main>
  );
}

export default Cart;
