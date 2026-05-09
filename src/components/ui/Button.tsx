import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "bet-a" | "bet-b";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "md", disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-[0.98]",
          // Size variants — sharp corners
          size === "sm" && "text-xs px-3 py-1.5",
          size === "md" && "text-sm px-4 py-2.5",
          size === "lg" && "text-sm px-6 py-3",
          // Style variants — dark exchange, neon accents
          variant === "default" &&
            "bg-[oklch(72%_0.19_195)] text-[oklch(10%_0.02_270)] hover:bg-[oklch(65%_0.22_195)]",
          variant === "outline" &&
            "border border-[oklch(25%_0.03_270)] bg-transparent text-[oklch(78%_0.01_270)] hover:border-[oklch(72%_0.19_195)] hover:text-[oklch(72%_0.19_195)]",
          variant === "ghost" &&
            "bg-transparent text-[oklch(65%_0.01_270)] hover:bg-[oklch(20%_0.02_270)]",
          variant === "bet-a" &&
            "bg-[oklch(72%_0.19_155)] text-[oklch(10%_0.02_270)] hover:bg-[oklch(65%_0.22_155)]",
          variant === "bet-b" &&
            "bg-[oklch(75%_0.16_85)] text-[oklch(10%_0.02_270)] hover:bg-[oklch(70%_0.18_85)]",
          className,
        )}
        style={{
          borderRadius: "0px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: '"JetBrains Mono", monospace',
        }}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
