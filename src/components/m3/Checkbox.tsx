import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  /** Label content. May include links (e.g. terms); the whole row is the click target. */
  label: ReactNode;
  error?: boolean;
  fieldClassName?: string;
};

export function Checkbox({ label, error = false, fieldClassName = "", className = "", ...props }: Props) {
  const classes = ["m3-check", error ? "is-error" : "", props.disabled ? "is-disabled" : "", fieldClassName]
    .filter(Boolean)
    .join(" ");
  return (
    <label className={classes}>
      <input {...props} type="checkbox" className={["m3-check__input", className].filter(Boolean).join(" ")} />
      <span className="m3-check__box" aria-hidden="true" />
      <span className="m3-check__label">{label}</span>
    </label>
  );
}