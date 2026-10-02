"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Entrada rápida y sutil (Apple: feedback inmediato, nada lento).
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className={`material rounded-3xl ${className}`}
    >
      {children}
    </motion.section>
  );
}
