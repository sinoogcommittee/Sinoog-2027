import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  to?: string;
  variant?: "primary" | "secondary" | "ghost";
};
export function Button({
  children,
  to,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const classes = `button button--${variant} ${className}`.trim();
  if (to)
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
