import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  error,
  className,
  wrapperClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-brand-black">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm text-brand-black placeholder:text-brand-gray transition-colors focus:border-brand-black focus:outline-none",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
