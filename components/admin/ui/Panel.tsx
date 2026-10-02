"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Entrada rápida y sutil (feedback inmediato, nada lento). Con "reducir
// movimiento" aparece al instante: solo cambia la transición (no el estado
// inicial) para que servidor y cliente pinten lo mismo.
export function Panel({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  /** id del título de la sección, para lectores de pantalla. */
  labelledBy?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      aria-labelledby={labelledBy}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className={`material rounded-3xl ${className}`}
    >
      {children}
    </motion.section>
  );
}
