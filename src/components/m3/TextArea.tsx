import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Persistent label shown above the field (also the accessible name). */
  label: string;
  helperText?: string;
  /** Error message. Marks the field invalid and is announced to assistive technology. */
  error?: string;
  /** Class for the outer wrapper (className goes on the <textarea>, as with a plain input). */
  fieldClassName?: string;
};

export function TextArea({
  label,
  helperText,
  error,
  fieldClassName = "",
  className = "",
  id,
  rows = 3,
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
      <div className="m3-field__control">
        <textarea
          {...props}
          id={inputId}
          rows={rows}
          className={["m3-field__input", "m3-field__textarea", className].filter(Boolean).join(" ")}
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
