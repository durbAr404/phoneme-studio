"use client";
import Link from "next/link";
import { forwardRef, useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-[0_4px_0_var(--primary-strong)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none",
  secondary: "bg-sunken text-ink hover:bg-mint",
  ghost: "bg-transparent text-ink hover:bg-sunken",
  accent: "bg-accent text-[#2b1a14] shadow-[0_4px_0_color-mix(in_srgb,var(--accent)_70%,#000)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none",
  danger: "bg-transparent text-danger ring-2 ring-danger/60 hover:bg-danger/10",
  outline: "bg-transparent text-ink ring-2 ring-line hover:ring-line-strong",
};
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[15px] gap-1.5",
  md: "h-12 px-5 text-base gap-2",
  lg: "h-14 px-7 text-lg gap-2",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "btn-jelly inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ComponentProps<"button"> & { variant?: Variant; size?: Size }>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

export function LinkButton({ variant = "secondary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[28px] bg-surface p-6 shadow-[0_6px_0_var(--shadow-ring)] ring-1 ring-line", className)} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-10 pb-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-lg text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, "min-h-28 resize-y leading-relaxed", className)} {...props} />;
});

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && <p className="text-[15px] text-ink-soft">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span className={cn("absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-6")} />
      </button>
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-2xl bg-sunken p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-[15px] font-medium transition-colors",
            o.value === value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const tagTones = {
  mint: "bg-mint text-mint-ink",
  sky: "bg-sky text-sky-ink",
  peach: "bg-peach text-peach-ink",
  butter: "bg-butter text-butter-ink",
  lilac: "bg-lilac text-lilac-ink",
  plain: "bg-sunken text-ink-soft",
};
export type Tone = keyof typeof tagTones;

export function Tag({ tone = "plain", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-medium", tagTones[tone], className)} {...props} />;
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(92vw,560px)] rounded-[28px] bg-surface p-0 text-ink shadow-2xl backdrop:bg-[#0c1a15]/45 backdrop:backdrop-blur-[2px]",
        wide && "w-[min(94vw,760px)]",
      )}
    >
      <div className="p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="text-2xl font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-xl hover:bg-sunken">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function Empty({ title, body, action, icon }: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-[28px] border-3 border-dashed border-line-strong px-6 py-14 text-center">
      {icon && <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-mint text-mint-ink">{icon}</div>}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>
      {action && <div className="mt-6 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <span className="size-5 animate-spin rounded-full border-3 border-line border-t-primary" />
      {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-peach px-4 py-3 text-peach-ink">
      {children}
    </p>
  );
}
