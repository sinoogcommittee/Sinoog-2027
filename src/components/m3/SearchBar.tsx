import type { InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "./IconButton";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "size"> & {
  /** Accessible name (not shown visually; the placeholder carries the visible hint). */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  fieldClassName?: string;
};

export function SearchBar({ label, value, onValueChange, fieldClassName = "", className = "", ...props }: Props) {
  return (
    <div className={["m3-search", fieldClassName].filter(Boolean).join(" ")}>
      <Search className="m3-search__icon" size={20} aria-hidden="true" />
      <input
        {...props}
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={["m3-search__input", className].filter(Boolean).join(" ")}
      />
      {value ? (
        <IconButton
          className="m3-search__clear"
          label="Clear search"
          icon={<X size={20} />}
          onClick={() => onValueChange("")}
        />
      ) : null}
    </div>
  );
}