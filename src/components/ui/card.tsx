import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

function Card({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn(
        "border bg-[oklch(16%_0.02_270)] text-[oklch(93%_0.01_270)]",
        className,
      )}
      style={{
        borderRadius: "4px",
        boxShadow: "none",
        ...props.style,
      }}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-display font-medium leading-none tracking-tight",
        className,
      )}
      style={{ color: "oklch(93% 0.01 270)", ...props.style }}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  return (
    <p
      ref={ref}
      className={cn("text-sm", className)}
      style={{ color: "oklch(55% 0.02 270)", lineHeight: 1.6, ...props.style }}
      {...props}
    />
  );
}

function CardContent({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
