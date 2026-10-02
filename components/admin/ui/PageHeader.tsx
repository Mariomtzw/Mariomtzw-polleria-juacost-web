import type { ReactNode } from "react";

/**
 * Encabezado único de cada pantalla del panel: título, una línea de ayuda y,
 * a la derecha, las acciones de la página (si las hay).
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-1 max-w-[72ch] text-pretty text-sm text-neutral-400">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

/** Título de sección dentro de una pantalla. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-3 text-sm font-medium text-neutral-200">
      {children}
    </h2>
  );
}
