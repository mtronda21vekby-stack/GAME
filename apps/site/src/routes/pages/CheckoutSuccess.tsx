import React from "react";
import { Button } from "@blackcrown/ui";
import CommerceHeader from "../../components/CommerceHeader";
import { formatCoins } from "../../lib/store";
import { getCommerceOrder, type CommerceOrder } from "../../lib/commerce";
import "../../styles/commerce.css";

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function CheckoutSuccess() {
  const orderId = React.useMemo(() => new URLSearchParams(window.location.search).get("order")?.trim() ?? "", []);
  const [order, setOrder] = React.useState<CommerceOrder | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!orderId) {
      setError("order_id_missing");
      return;
    }

    const controller = new AbortController();
    void getCommerceOrder(orderId, controller.signal)
      .then(setOrder)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "order_not_found");
      });
    return () => controller.abort();
  }, [orderId]);

  return (
    <main className="bcCommercePage" data-commerce-page="success">
      <CommerceHeader backHref="/store" backLabel="Вернуться в Store" hideCart />

      <div className="bcCommerceMain">
        <section className="bcCommerceHero">
          <span className="bcCommerceEyebrow">BLACKCROWN COMMERCE / ORDER STATUS</span>
          <h1>Заказ принят</h1>
          <p>Статус читается с сервера, а не из локального состояния браузера.</p>
        </section>

        {!order && !error ? (
          <section className="bcCommerceCard">
            <span className="bcCommerceMeta">LOADING ORDER</span>
            <h2>Проверяем выполнение…</h2>
          </section>
        ) : null}

        {error ? (
          <section className="bcCommerceEmpty">
            <h2>Заказ не найден</h2>
            <p>Сервер не смог подтвердить этот ID заказа: {error}.</p>
            <div className="bcCommerceActions">
              <Button variant="primary" onClick={() => navigate("/store")}>Открыть Store</Button>
              <Button variant="secondary" onClick={() => navigate("/support")}>Поддержка</Button>
            </div>
          </section>
        ) : null}

        {order ? (
          <section className="bcCommerceCard bcCommerceStatus" aria-labelledby="order-success-title">
            <div className="bcCommerceStatus__icon" aria-hidden="true">✓</div>
            <div>
              <span className="bcCommerceMeta">ORDER / {order.id}</span>
              <h2 id="order-success-title" style={{ marginTop: 8 }}>
                {order.status === "fulfilled" ? "Предметы выданы" : "Платёж подтверждён"}
              </h2>
            </div>

            <div className="bcCommercePills">
              <span className="bcCommercePill bcCommercePill--accent">{order.status.toUpperCase()}</span>
              <span className="bcCommercePill">{order.paymentMethod.toUpperCase()}</span>
              <span className="bcCommercePill">{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
            </div>

            <div className="bcCommerceLines" style={{ width: "100%" }}>
              {order.items.map((line) => (
                <div className="bcCommerceSummary__row" key={line.itemId}>
                  <span>{line.title} × {line.quantity}</span>
                  <strong>{formatCoins(line.lineTotal)} BC</strong>
                </div>
              ))}
              <div className="bcCommerceSummary__row bcCommerceSummary__row--total">
                <span>Итого</span><strong>{formatCoins(order.total)} BC</strong>
              </div>
            </div>

            <div className="bcCommerceNotice">
              Серверная выдача завершена для BlackCrown ID: <strong>{order.userId}</strong>.
            </div>

            <div className="bcCommerceActions">
              <Button variant="primary" onClick={() => navigate("/account")}>Открыть профиль</Button>
              <Button variant="secondary" onClick={() => navigate("/store")}>Продолжить покупки</Button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default CheckoutSuccess;
