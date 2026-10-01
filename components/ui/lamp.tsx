"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export const LampContainer = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  // Con "reducir movimiento" la lámpara se abre al instante. Solo cambia la
  // transición (no el estado inicial) para que servidor y cliente pinten lo mismo.
  const reduce = useReducedMotion();
  const open = reduce ? ({ duration: 0 } as const) : ({ delay: 0.3, duration: 0.8, ease: "easeInOut" } as const);
  const once = { once: true } as const;

  return (
    <div
      className={`relative z-0 flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-brand-red pt-24 ${className}`}
    >
      {/* Sistema de luces centrado y desplazado hacia abajo (decorativo) */}
      <div aria-hidden className="relative isolate z-0 mt-20 flex w-full flex-1 scale-y-125 items-center justify-center">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={once}
          transition={open}
          style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-brand-yellow via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-brand-red h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-brand-red bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={once}
          transition={open}
          style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-brand-yellow text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-brand-red bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-brand-red h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-brand-red blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-brand-yellow opacity-50 blur-3xl"></div>

        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          viewport={once}
          transition={open}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-brand-yellow blur-2xl"
        ></motion.div>

        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          viewport={once}
          transition={open}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-brand-yellow"
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-brand-red"></div>
      </div>

      {/* El contenido baja a su posición natural para no chocar con la navegación */}
      <div className="relative z-50 flex w-full -translate-y-8 flex-col items-center px-5 pb-20">
        {children}
      </div>
    </div>
  );
};
