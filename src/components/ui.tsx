import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-accent text-accent-ink",
    secondary: "bg-surface-2 text-ink",
    danger: "bg-surface-2 text-danger",
  }[variant];
  return (
    <button
      className={`min-h-12 rounded-2xl px-5 text-[17px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

// `flush` drops the padding for cards that hold full-width list rows.
export function Card({ children, className = "", flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
  return <section className={`rounded-3xl bg-surface shadow-sm ${flush ? "" : "p-5"} ${className}`}>{children}</section>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[15px] text-danger">
      {children}
    </p>
  );
}
