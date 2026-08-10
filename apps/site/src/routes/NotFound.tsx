import React from "react";
import { Button } from "@blackcrown/ui";
import { nav } from "../lib/nav";
import "../styles/not-found.css";

type NotFoundProps = {
  requestedPath: string;
};

export function NotFound({ requestedPath }: NotFoundProps) {
  return (
    <main className="bcNotFound">
      <div className="bcNotFound__signal" aria-hidden="true">
        <span>404</span>
      </div>
      <div className="bcNotFound__copy">
        <span className="bcNotFound__eyebrow">BLACKCROWN / LOST ROUTE</span>
        <h1>Маршрут не найден</h1>
        <p>
          Адрес <code>{requestedPath}</code> не связан ни с одним активным узлом BlackCrown.
        </p>
        <div className="bcNotFound__actions">
          <Button variant="primary" onClick={() => nav("/")}>На главную</Button>
          <Button variant="secondary" onClick={() => nav("/support")}>Поддержка</Button>
        </div>
      </div>
    </main>
  );
}
