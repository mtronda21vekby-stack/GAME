import type React from "react";

declare module "@blackcrown/ui" {
  export function Button(props: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void);
    variant?: "primary" | "secondary" | "ghost";
    size?: "md" | "lg";
    disabled?: boolean;
    leftIconSrc?: string;
    rightIconSrc?: string;
    ariaLabel?: string;
    type?: "button" | "submit";
    className?: string;
  }): JSX.Element;
}
