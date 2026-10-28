import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label: string;
  helperText?: string;
  error?: string;
  fieldClassName?: string;
  /** <option> / <optgroup> elements. Keeps the native select for best mobile behaviour. */
  children: ReactNode;
};

export function SelectField({
  label,
  helperText,
  error,
  fieldClassName = "",
  className = "",
  id,
  children,
  "aria-describedby": ariaDescribedBy,
  ...props
}: Props) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const supportId = `${selectId}-support`;
  const support = error || helperText;
  const describedBy = [support ? supportId : "", ariaDescribedBy ?? ""].filter(Boolean).join(" ") || undefined;

  const wrapperClasses = ["m3-field", error ? "is-error" : "", props.disabled ? "is-disabled" : "", fieldClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <label className="m3-field__label" htmlFor={selectId}>
        {label}
      </label>
      <div className="m3-field__control has-chevron">
        <select
          {...props}
          id={selectId}
          className={["m3-field__input", "m3-field__select", className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          {children}
        </select>
        <ChevronDown className="m3-field__chevron" size={20} aria-hidden="true" />
      </div>
      {support ? (
        <p id={supportId} className="m3-field__support" role={error ? "alert" : undefined}>
          {support}
        </p>
      ) : null}
    </div>
  );
}