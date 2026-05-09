"use client"

import * as React from "react";

interface AuroraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  glowClassName?: string;
}

export function AuroraButton({
  className = "",
  children,
  glowClassName = "",
  ...props
}: AuroraButtonProps) {
  return (
    <div className="relative group inline-block">
      {/* Contenedor del Resplandor (Aurora) 
        Adaptado a colores cálidos: Amarillos y Naranjas brillantes
      */}
      <div
        className={`absolute -inset-[4px] rounded-full bg-gradient-to-r from-white via-brand-yellow to-orange-400 opacity-60 blur-lg transition-all duration-500 group-hover:opacity-100 group-hover:blur-xl group-hover:-inset-[6px] ${glowClassName}`}
      />

      {/* Botón Principal 
        Mantiene el estilo 3D y la tipografía de nuestra pollería
      */}
      <button
        className={`relative flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-10 py-5 text-brand-red font-black text-xl shadow-[0_8px_0_0_#9a201d] transition-all hover:translate-y-1 hover:shadow-[0_4px_0_0_#9a201d] uppercase tracking-widest ${className}`}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}