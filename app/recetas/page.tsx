"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { ArrowLeft, ChefHat, Clock, ListOrdered, ShoppingBasket, Timer, Users, X } from "lucide-react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { recetas, type Receta } from "./recetas-data";

const sectionTitleClass = "mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-brand-yellow";

function RecetaCard({
  receta,
  open,
  onToggle,
  onClose,
}: {
  receta: Receta;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const panelId = `receta-${receta.id}-preparacion`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const amarillo = receta.color === "amarillo";

  // Escape cierra la preparación y devuelve el foco a la tarjeta.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <article
      className={`group relative isolate flex flex-col items-center overflow-hidden rounded-[2rem] p-6 text-center shadow-brand transition-transform duration-300 ease-out-expo hover:-translate-y-2 motion-reduce:transition-none [--focus-ring:var(--color-brand-red-dark)] ${
        amarillo ? "bg-brand-yellow" : "bg-white"
      }`}
    >
      <div className="relative mb-6 aspect-[3/2] w-full overflow-hidden rounded-xl bg-brand-red/10">
        <Image
          src={receta.img}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw"
          className="object-cover"
        />
      </div>

      <h3 className="mb-3 text-balance text-2xl font-black text-brand-red">{receta.titulo}</h3>
      <p className="mb-6 text-pretty text-sm font-semibold text-brand-red-dark">{receta.desc}</p>

      <div className="mt-auto flex flex-col items-center gap-3">
        <ul className="flex gap-4 rounded-full bg-brand-red-dark px-4 py-2 text-sm font-bold text-brand-yellow">
          <li className="flex items-center gap-1">
            <Clock aria-hidden size={16} /> <span className="sr-only">Tiempo: </span>
            {receta.tiempo}
          </li>
          <li className="flex items-center gap-1">
            <Users aria-hidden size={16} /> <span className="sr-only">Rinde: </span>
            {receta.porc}
          </li>
        </ul>

        {/* El ::after estira el botón a toda la tarjeta: tocar cualquier parte abre la receta. */}
        <button
          ref={triggerRef}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-black text-brand-red-dark underline decoration-2 underline-offset-4 after:absolute after:inset-0 after:rounded-[2rem]"
        >
          <ChefHat aria-hidden size={18} className="shrink-0" />
          Ver preparación
          <span className="sr-only"> de {receta.titulo}</span>
        </button>
      </div>

      {/* Capa de preparación: se muestra al abrir (clic, toque o teclado) y como
          vista previa al pasar el cursor en equipos con mouse; un clic sobre ella
          la fija o la cierra. Con visibility oculta no entra al orden de
          tabulación ni la leen los lectores de pantalla. */}
      <div
        id={panelId}
        role="region"
        aria-label={`Preparación de ${receta.titulo}`}
        tabIndex={open ? 0 : -1}
        onClick={onToggle}
        className={`absolute inset-0 z-10 flex cursor-pointer flex-col overflow-y-auto overscroll-contain rounded-[2rem] bg-brand-red-dark/95 p-6 text-left -outline-offset-4 backdrop-blur-sm transition-[opacity,translate,visibility] duration-300 ease-out-expo [--focus-ring:var(--color-brand-yellow)] [scrollbar-color:var(--color-brand-yellow)_transparent] [scrollbar-width:thin] motion-reduce:transition-none ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-6 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
        }`}
      >
        <div className="my-auto w-full text-white">
          <div className="mb-5 flex items-start justify-between gap-3">
            <h4 className="flex items-center gap-2 text-xl font-black leading-tight text-brand-yellow">
              <ChefHat aria-hidden size={26} className="shrink-0" />
              ¿Cómo prepararlo?
            </h4>
            {open && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  triggerRef.current?.focus();
                }}
                aria-label="Cerrar preparación"
                className="-mt-1 -mr-1 shrink-0 cursor-pointer rounded-full p-2 text-white hover:bg-white/15"
              >
                <X aria-hidden size={20} strokeWidth={3} />
              </button>
            )}
          </div>

          <h5 className={sectionTitleClass}>
            <ShoppingBasket aria-hidden size={16} className="shrink-0" /> Ingredientes
          </h5>
          <ul className="mb-5 list-disc space-y-1 pl-5 text-sm font-medium leading-relaxed marker:text-brand-yellow md:text-base">
            {receta.ingredientes.map((ingrediente) => (
              <li key={ingrediente}>{ingrediente}</li>
            ))}
          </ul>

          <h5 className={sectionTitleClass}>
            <Timer aria-hidden size={16} className="shrink-0" /> Cocción
          </h5>
          <p className="mb-5 text-sm font-medium leading-relaxed md:text-base">{receta.coccion}</p>

          <h5 className={sectionTitleClass}>
            <ListOrdered aria-hidden size={16} className="shrink-0" /> Paso a paso
          </h5>
          <ol className="list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed marker:font-black marker:text-brand-yellow md:text-base">
            {receta.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

export default function RecetasPage() {
  // Solo una receta abierta a la vez.
  const [recetaActiva, setRecetaActiva] = useState<number | null>(null);

  return (
    <MotionConfig reducedMotion="user">
      <main className="site min-h-[100dvh] bg-brand-red font-sans">
        {/* Botón flotante para regresar */}
        <div className="fixed top-4 left-4 z-50 md:top-6 md:left-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-2.5 text-sm font-bold text-brand-red-dark shadow-brand transition-transform duration-200 hover:scale-105 active:scale-100 motion-reduce:transition-none md:text-base"
          >
            <ArrowLeft aria-hidden size={20} /> Volver a Inicio
          </Link>
        </div>

        <ScrollExpandMedia
          mediaSrc="/recetas/hero-pollo3.avif"
          mediaAlt="Pollo rostizado con papas y romero en una sartén de hierro"
          bgImageSrc="/recetas/hero-bg.avif"
          title="RECETAS DELICIOSAS"
          date="JUACost"
          scrollToExpand="Desliza hacia abajo para cocinar"
        >
          <div className="mx-auto w-full max-w-7xl px-0 pt-12 md:px-4">
            <h2 className="mb-12 text-balance text-center text-4xl font-black leading-none tracking-tight text-brand-yellow md:text-5xl">
              INSPIRACIÓN PARA TU MESA
            </h2>

            <div className="grid grid-cols-1 gap-8 pb-20 md:grid-cols-2 lg:grid-cols-3">
              {recetas.map((receta) => (
                <RecetaCard
                  key={receta.id}
                  receta={receta}
                  open={recetaActiva === receta.id}
                  onToggle={() => setRecetaActiva((actual) => (actual === receta.id ? null : receta.id))}
                  onClose={() => setRecetaActiva(null)}
                />
              ))}
            </div>
          </div>
        </ScrollExpandMedia>
      </main>
    </MotionConfig>
  );
}
