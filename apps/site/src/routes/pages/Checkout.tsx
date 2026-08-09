import React from "react";
import { Button } from "@blackcrown/ui";
import CommerceHeader from "../../components/CommerceHeader";
import { formatCoins } from "../../lib/store";
import {
  clearCart,
  getCartCount,
  getCartItems,
  requestCommerceQuote,
  submitMockCheckout,
  type CommerceQuote,
} from "../../lib/commerce";
import "../../styles/commerce.css";

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function Checkout() {
  const [quote, setQuote] = React.useState<CommerceQuote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const cartItems = React.useMemo(getCartItems, []);
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const fallbackTotal = cartItems.reduce((sum, line) => sum + line.lineTotal, 0);

  React.useEffect(() => {
    if (!cartItems.length) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    void requestCommerceQuote(controller.signal)
      .then((nextQuote) => setQuote(nextQuote))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Не удалось проверить заказ.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [cartItems.length]);

  async function placeOrder() {
    if (submitting || !cartItems.length) return;
    setSubmitting(true);
    setError("");

    try {
      const order = await submitMockCheckout();
      clearCart();
      navigate(`/checkout/success?order=${encodeURIComponent(order.id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось создать заказ.");
      setSubmitting(false);
    }
  }

  const total = quote?.total ?? fallbackTotal;

  return (
    <main className="bcCommercePage" data-commerce-page="checkout">
      <CommerceHeader cartCount={getCartCount()} backHref="/cart" backLabel="Назад в корзину" hideCart />

      <div className="bcCommerceMain">
        <section className="bcCommerceHero">
          <span className="bcCommerceEyebrow">BLACKCROWN COMMERCE / CHECKOUT</span>
          <h1>Оформление</h1>
          <p>Сервер формирует авторитетную котировку и создаёт заказ. На этом этапе используется прозрачный тестовый платёжный шлюз.</p>
          <div className="bcCommercePills">
            <span className="bcCommercePill bcCommercePill--accent">SERVER QUOTE</span>
            <span className="bcCommercePill">MOCK PAYMENT</span>
            <span className="bcCommercePill">FULFILLMENT</span>
          </div>
        </section>

        {!cartItems.length ? (
          <section className="bcCommerceEmpty">
            <h2>Нечего оформлять</h2>
            <p>Корзина пуста или уже была очищена после успешного заказа.</p>
            <Button variant="primary" onClick={() => navigate("/store")}>Открыть Store</Button>
          </section>
        ) : (
          <div className="bcCommerceSplit">
            <section className="bcCommerceCard" aria-labelledby="checkout-payment-title">
              <div>
                <span className="bcCommerceMeta">PAYMENT METHOD</span>
                <h2 id="checkout-payment-title" style={{ marginTop: 7 }}>Тестовый шлюз</h2>
              </div>

              <div className="bcCommerceNotice bcCommerceNotice--warning">
                Реальное списание денег не выполняется. Этот режим проверяет полноценную цепочку: корзина → серверная валидация → заказ → статус → выдача предметов.
              </div>

              <label className="bcCommerceCard" style={{ padding: 16, cursor: "pointer" }}>
                <span className="bcCommerceMeta">SELECTED</span>
                <strong>BlackCrown Mock Gateway</strong>
                <span style={{ color: "rgba(224,241,251,.68)", lineHeight: 1.5 }}>
                  Без банковских данных. Заказ получает статус paid и затем fulfilled на сервере.
                </span>
                <input type="radio" name="payment" value="mock" defaultChecked style={{ accentColor: "#70eaff" }} />
              </label>

              {error ? <div className="bcCommerceError" role="alert">{error}</div> : null}

              <div className="bcCommerceActions">
                <Button variant="primary" onClick={placeOrder} disabled={loading || submitting || !quote}>
                  {submitting ? "Создаём заказ…" : loading ? "Проверяем цены…" : `Оплатить ${formatCoins(total)} BC`}
                </Button>
                <Button variant="secondary" onClick={() => navigate("/cart")} disabled={submitting}>
                  Изменить корзину
                </Button>
              </div>
            </section>

            <aside className="bcCommerceCard bcCommerceCard--sticky" aria-labelledby="checkout-summary-title">
              <div>
                <span className="bcCommerceMeta">AUTHORITATIVE SUMMARY</span>
                <h2 id="checkout-summary-title" style={{ marginTop: 7 }}>Заказ</h2>
              </div>

              <div className="bcCommerceLines">
                {(quote?.items ?? cartItems.map(({ item, quantity, lineTotal }) => ({
                  itemId: item.id,
                  title: item.title,
                  quantity,
                  unitPrice: item.price,
                  lineTotal,
                }))).map((line) => (
                  <div className="bcCommerceSummary__row" key={line.itemId}>
                    <span>{line.title} × {line.quantity}</span>
                    <strong>{formatCoins(line.lineTotal)} BC</strong>
                  </div>
                ))}
              </div>

              <div className="bcCommerceSummary__row"><span>Предметов</span><strong>{cartCount}</strong></div>
              <div className="bcCommerceSummary__row bcCommerceSummary__row--total">
                <span>Итого</span><strong>{formatCoins(total)} BC</strong>
              </div>

              <div className="bcCommerceNotice">
                Quote ID: <strong>{quote?.quoteId ?? "ожидание сервера"}</strong>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Checkout;
