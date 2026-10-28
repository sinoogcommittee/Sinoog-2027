import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  label: ReactNode;
  fieldClassName?: string;
};

export function Switch({ label, fieldClassName = "", className = "", ...props }: Props) {
  const classes = ["m3-switch", props.disabled ? "is-disabled" : "", fieldClassName].filter(Boolean).join(" ");
  return (
    <label className={classes}>
      <input
        {...props}
        type="checkbox"
        role="switch"
        className={["m3-switch__input", className].filter(Boolean).join(" ")}
      />
      <span className="m3-switch__track" aria-hidden="true">
        <span className="m3-switch__thumb" />
      </span>
      <span className="m3-switch__label">{label}</span>
    </label>
  );
}