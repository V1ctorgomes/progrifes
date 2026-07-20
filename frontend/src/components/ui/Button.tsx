import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-black text-brand-white hover:bg-neutral-800 border border-brand-black shadow-sm",
  secondary:
    "bg-white text-brand-black hover:bg-neutral-50 border border-neutral-200 shadow-sm",
  outline:
    "bg-white text-brand-black border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm",
  ghost: "bg-transparent text-brand-black hover:bg-neutral-100",
  whatsapp:
    "bg-brand-whatsapp text-brand-white hover:opacity-90 border border-brand-whatsapp shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
