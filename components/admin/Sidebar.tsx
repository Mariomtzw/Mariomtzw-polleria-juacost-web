"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Table2, Tag, ShoppingBag, Snowflake, ClipboardList, Wallet, Sparkles, Menu, X, Drumstick,
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

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-200 backdrop-blur-md md:hidden" aria-label="Abrir menú"><Menu size={18} /></button>
      {open ? <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}
      <aside className={["fixed z-50 flex h-full w-64 flex-col border-r border-white/10 bg-neutral-900/70 backdrop-blur-xl transition-transform md:static md:translate-x-0", open ? "translate-x-0" : "-translate-x-full"].join(" ")}>
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-500/20 p-1.5 text-orange-400"><Drumstick size={18} /></span>
            <span className="font-semibold text-white">Pollos Juacost</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 md:hidden" aria-label="Cerrar menú"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={["flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", active ? "bg-orange-500/15 text-orange-300" : "text-neutral-300 hover:bg-white/5 hover:text-white"].join(" ")}>
                <Icon size={18} /> {label}
              </Link>
            );
          })}
        </nav>
        <p className="px-5 py-4 text-[11px] text-neutral-500">Panel privado · solo dueño</p>
      </aside>
    </>
  );
}
