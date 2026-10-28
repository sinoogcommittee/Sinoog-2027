import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "filled" | "elevated" | "outlined";
  /** Element to render. Use "article" for self-contained items, "li" inside lists. */
  as?: "div" | "section" | "article" | "li";
};

export function Card({
  children,
  variant = "filled",
  as: Tag = "div",
  className = "",
  ...props
}: Props) {
  const classes = ["m3-card", `m3-card--${variant}`, className].filter(Boolean).join(" ");
  return (
    <Tag {...props} className={classes}>
      {children}
    </Tag>
  );
}