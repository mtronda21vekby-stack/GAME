import React, { useEffect, useMemo, useState } from "react";

type Route = { path: string; element: React.ReactNode };

function norm(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return path.replace(/\/+$|\/+$/g, "") || "/";
}

function match(current: string, route: string): boolean {
  current = norm(current);
  route = norm(route);
  if (route === "/") return current === "/";
  return current === route;
}

export function Link(props: {
  to: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <a
      href={props.to}
      className={props.className}
      style={props.style}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(props.to);
        props.onClick?.();
      }}
    >
      {props.children}
    </a>
  );
}

export function navigate(to: string) {
  const url = norm(to);
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Router(props: { routes: Route[]; notFound?: React.ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const el = useMemo(() => {
    const p = norm(path);
    const hit = props.routes.find((r) => match(p, r.path));
    return hit ? hit.element : (props.notFound ?? <div className="bc-container" style={{ padding: 24 }}>Not found</div>);
  }, [path, props.routes, props.notFound]);

  return <>{el}</>;
}
