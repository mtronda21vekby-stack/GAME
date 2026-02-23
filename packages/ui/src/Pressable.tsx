import React from "react";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

export type PressableProps<E extends keyof JSX.IntrinsicElements = "button"> = {
  as?: E;
  disabled?: boolean;
  pressScale?: number; // default 0.985
  hoverLiftPx?: number; // default 1
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "disabled" | "style" | "className" | "children">;

export const Pressable = React.forwardRef(function Pressable<
  E extends keyof JSX.IntrinsicElements = "button"
>(props: PressableProps<E>, ref: React.ForwardedRef<any>) {
  const {
    as,
    disabled,
    pressScale = 0.985,
    hoverLiftPx = 1,
    className,
    style,
    children,
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();

  const Tag = (as ?? "button") as any;
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const canAnimate = !reduced && !disabled;

  const transform = React.useMemo(() => {
    if (!canAnimate) return style?.transform;

    const parts: string[] = [];
    if (hovered) parts.push(`translate3d(0, ${-hoverLiftPx}px, 0)`);
    if (pressed) parts.push(`scale(${pressScale})`);

    const t = parts.length ? parts.join(" ") : "translate3d(0,0,0)";
    return style?.transform ? `${style.transform} ${t}` : t;
  }, [canAnimate, hovered, pressed, hoverLiftPx, pressScale, style?.transform]);

  const mergedStyle: React.CSSProperties = {
    ...style,
    transform,
    willChange: canAnimate ? "transform" : style?.willChange,
    transition: canAnimate
      ? "transform 180ms cubic-bezier(.2,.8,.2,1)"
      : style?.transition,
    WebkitTapHighlightColor: "transparent",
    cursor: disabled ? "default" : style?.cursor ?? "pointer",
  };

  const commonHandlers = {
    onPointerEnter: (e: React.PointerEvent) => {
      (rest as any).onPointerEnter?.(e);
      if (disabled) return;
      setHovered(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      (rest as any).onPointerLeave?.(e);
      setHovered(false);
      setPressed(false);
    },
    onPointerDown: (e: React.PointerEvent) => {
      (rest as any).onPointerDown?.(e);
      if (disabled) return;
      // только primary
      if (e.button !== 0) return;
      setPressed(true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      (rest as any).onPointerUp?.(e);
      setPressed(false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      (rest as any).onPointerCancel?.(e);
      setPressed(false);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      (rest as any).onKeyDown?.(e);
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") setPressed(true);
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      (rest as any).onKeyUp?.(e);
      setPressed(false);
    },
  };

  const tagProps: any = {
    ref,
    className,
    style: mergedStyle,
    ...rest,
    ...commonHandlers,
  };

  if (Tag === "button") {
    tagProps.type = (tagProps.type ?? "button") as any;
    tagProps.disabled = !!disabled;
  } else {
    if (disabled) tagProps["aria-disabled"] = true;
    if (tagProps.role == null) tagProps.role = "button";
    if (tagProps.tabIndex == null && !disabled) tagProps.tabIndex = 0;
  }

  return <Tag {...tagProps}>{children}</Tag>;
}) as <E extends keyof JSX.IntrinsicElements = "button">(
  p: PressableProps<E> & { ref?: React.Ref<any> }
) => React.ReactElement | null;
