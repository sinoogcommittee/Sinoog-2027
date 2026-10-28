import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Persistent label shown above the field (also the accessible name). */
  label: string;
  helperText?: string;
  /** Error message. Marks the field invalid and is announced to assistive technology. */
  error?: string;
  leadingIcon?: ReactNode;
  /** Class for the outer wrapper (className goes on the <input>, as with a plain input). */
  fieldClassName?: string;
};

export function TextField({
  label,
  helperText,
  error,
  leadingIcon,
  fieldClassName = "",
  className = "",
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const supportId = `${inputId}-support`;
  const support = error || helperText;
  const describedBy = [support ? supportId : "", ariaDescribedBy ?? ""].filter(Boolean).join(" ") || undefined;

  const wrapperClasses = ["m3-field", error ? "is-error" : "", props.disabled ? "is-disabled" : "", fieldClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <label className="m3-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className={leadingIcon ? "m3-field__control has-icon" : "m3-field__control"}>
        {leadingIcon ? (
          <span className="m3-field__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          className={["m3-field__input", className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </div>
      {support ? (
        <p id={supportId} className="m3-field__support" role={error ? "alert" : undefined}>
          {support}
        </p>
      ) : null}
    </div>
  );
}