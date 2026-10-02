import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Size = "md" | "lg";

interface BaseProps {
  children: ReactNode;
  className?: string;
  glowClassName?: string;
  size?: Size;
}

type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };

type AsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };

export type AuroraButtonProps = AsButton | AsLink;

const SIZES: Record<Size, string> = {
  md: "px-8 py-4 text-sm md:px-10 md:py-5 md:text-base",
  lg: "px-8 py-4 text-lg md:px-16 md:py-6 md:text-2xl",
};

/**
 * Botón principal del sitio público: pastilla amarilla con canto "3D" y un
 * resplandor cálido detrás. Con `href` se renderiza como enlace (para anclas y
 * WhatsApp); sin `href`, como <button>.
 */
export function AuroraButton({
  className = "",
  glowClassName = "",
  size = "md",
  children,
  ...rest
}: AuroraButtonProps) {
  const classes = [
    "relative flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-yellow",
    "font-black uppercase tracking-widest text-brand-red-dark",
    // Canto sólido: baja al pasar el cursor y se hunde al presionar.
    "shadow-[0_8px_0_0_var(--color-brand-red-deep)] transition-[translate,box-shadow] duration-150 ease-out",
    "hover:translate-y-1 hover:shadow-[0_4px_0_0_var(--color-brand-red-deep)]",
    "active:translate-y-2 active:shadow-[0_0_0_0_var(--color-brand-red-deep)]",
    "motion-reduce:transition-none",
    SIZES[size],
    className,
  ].join(" ");

  return (
    <span className="group relative inline-block">
      {/* Resplandor decorativo, solo con amarillos de la marca */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-1 rounded-full bg-linear-to-r from-brand-yellow-light via-brand-yellow to-brand-yellow-light opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-90 motion-reduce:transition-none ${glowClassName}`}
      />
      {rest.href !== undefined ? (
        <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes}>
          {children}
        </a>
      ) : (
        <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes}>
          {children}
        </button>
      )}
    </span>
  );
}
