"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Table2, Tag, ShoppingBag, Snowflake, ClipboardList, Wallet, Sparkles, Menu, X, Drumstick, ExternalLink, UserCog,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/captura", label: "Captura del día", icon: Table2 },
  { href: "/admin/precios", label: "Precios", icon: Tag },
  { href: "/admin/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/frio", label: "Sobras y Frío", icon: Snowflake },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/corte", label: "Corte del día", icon: Wallet },
  { href: "/admin/analitica", label: "Analítica", icon: Sparkles },
] as const;

/**
 * Menú del panel. En escritorio es una columna fija a la izquierda; en móvil
 * es un cajón que se abre con el botón de menú y se cierra con Escape, al
 * tocar fuera o al elegir una sección.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  const close = () => {
    setOpen(false);
    openButton.current?.focus();
  };

  // Con el cajón abierto: Escape lo cierra y el foco entra al cajón.
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      openButton.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="menu-panel"
        className="btn btn-icon btn-secondary fixed left-3 top-2.5 z-40 backdrop-blur-md md:hidden"
      >
        <Menu aria-hidden size={18} />
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={close} aria-hidden /> : null}

      {/* En móvil, cerrado = fuera de pantalla e invisible (así tampoco recibe foco). */}
      <aside
        id="menu-panel"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-white/10 bg-neutral-900/80 backdrop-blur-xl",
          "duration-200 ease-out md:visible md:sticky md:top-0 md:h-dvh md:translate-x-0",
          // Al abrir se vuelve visible de inmediato (para poder recibir el foco);
          // al cerrar, la visibilidad espera a que termine el deslizamiento.
          open ? "visible translate-x-0 transition-transform" : "invisible -translate-x-full transition-[translate,visibility]",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-500/20 p-1.5 text-orange-400">
              <Drumstick aria-hidden size={18} />
            </span>
            <span className="font-semibold text-white">Pollos Juacost</span>
          </div>
          <button ref={closeButton} type="button" onClick={close} aria-label="Cerrar menú" className="btn btn-sm btn-icon btn-ghost md:hidden">
            <X aria-hidden size={18} />
          </button>
        </div>

        <nav aria-label="Secciones del panel" className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-orange-500/15 font-medium text-orange-300" : "text-neutral-300 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <Icon aria-hidden size={18} className="shrink-0" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          <Link
            href="/admin/cuenta"
            onClick={() => setOpen(false)}
            aria-current={pathname.startsWith("/admin/cuenta") ? "page" : undefined}
            className={[
              "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin/cuenta")
                ? "bg-orange-500/15 font-medium text-orange-300"
                : "text-neutral-300 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            <UserCog aria-hidden size={18} className="shrink-0" /> Mi cuenta
          </Link>
          <Link
            href="/"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink aria-hidden size={18} className="shrink-0" /> Ver sitio público
          </Link>
          <p className="px-3 pt-1 text-xs text-neutral-400">Panel privado · solo dueño</p>
        </div>
      </aside>
    </>
  );
}
