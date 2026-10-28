import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

/** Material 3 variants. */
export type M3ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "danger";
/** Legacy names still used by existing pages; mapped to M3 variants below. */
type LegacyVariant = "primary" | "secondary" | "ghost";

const LEGACY_VARIANT: Record<LegacyVariant, M3ButtonVariant> = {
  primary: "filled",
  secondary: "outlined",
  ghost: "text",
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  variant?: M3ButtonVariant | LegacyVariant;
  /** 44 px tall instead of the default 48 px. Both meet the touch-target minimum. */
  size?: "default" | "small";
  leadingIcon?: ReactNode;
  /** Keeps the label visible, shows a spinner, and blocks duplicate submissions. */
  loading?: boolean;
  /** Renders a router link styled as a button (button-only props are ignored, as before). */
  to?: string;
};

export function Button({
  children,
  variant = "filled",
  size = "default",
  leadingIcon,
  loading = false,
  to,
  className = "",
  disabled,
  ...props
}: Props) {
  const resolved: M3ButtonVariant =
    variant in LEGACY_VARIANT ? LEGACY_VARIANT[variant as LegacyVariant] : (variant as M3ButtonVariant);

  const classes = [
    "m3-button",
    `m3-button--${resolved}`,
    size === "small" ? "m3-button--small" : "",
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="m3-state-layer" aria-hidden="true" />
      {loading ? (
        <span className="m3-spinner" aria-hidden="true" />
      ) : leadingIcon ? (
        <span className="m3-button__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className="m3-button__label">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  // `type` is deliberately not defaulted: the previous Button didn't default it either,
  // so existing forms keep their exact submit behaviour.
  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}