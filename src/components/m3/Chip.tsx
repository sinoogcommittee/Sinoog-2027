import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  /**
   * "filter" toggles (pass `selected`); "assist" triggers an action.
   * For a non-interactive status, use StatusBadge instead.
   */
  variant?: "assist" | "filter";
  selected?: boolean;
  leadingIcon?: ReactNode;
};

export function Chip({
  children,
  variant = "assist",
  selected = false,
  leadingIcon,
  className = "",
  type = "button",
  ...props
}: Props) {
  const isFilter = variant === "filter";
  const classes = [
    "m3-chip",
    `m3-chip--${variant}`,
    isFilter && selected ? "is-selected" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      aria-pressed={isFilter ? selected : undefined}
    >
      <span className="m3-state-layer" aria-hidden="true" />
      {leadingIcon ? (
        <span className="m3-chip__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className="m3-chip__label">{children}</span>
    </button>
  );
}