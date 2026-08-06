import React from "react";
import { Home } from "./routes/Home";
import { About } from "./routes/pages/About";
import { Support } from "./routes/pages/Support";
import { Privacy } from "./routes/pages/Privacy";
import { Terms } from "./routes/pages/Terms";
import { Store } from "./routes/pages/Store";
import { Account } from "./routes/pages/Account";

function pathOf() {
  const p = window.location.pathname;
  return p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
}

function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { to, children, ...rest } = props;
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}

export function Router() {
  const [path, setPath] = React.useState(pathOf());

  React.useEffect(() => {
    const onPop = () => setPath(pathOf());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!isInternal(href)) return;

      e.preventDefault();
      window.history.pushState(null, "", href);
      setPath(pathOf());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  switch (path) {
    case "/":
      return <Home />;
    case "/about":
      return <About />;
    case "/support":
      return <Support />;
    case "/privacy":
      return <Privacy />;
    case "/terms":
      return <Terms />;
    case "/store":
      return <Store />;
    case "/account":
      return <Account />;
    default:
      return <Home />;
  }
}
