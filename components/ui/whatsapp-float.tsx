"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/site";

export default function WhatsAppFloat() {
  const pathname = usePathname();
  // No mostrar el botón dentro del panel privado.
  if (pathname?.startsWith("/admin")) return null;

  const message = "¡Hola! Vengo desde el sitio web y me gustaría hacer un pedido.";

  return (
    <div className="site fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-center md:right-6 md:bottom-6">
      <motion.a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hacer un pedido por WhatsApp (se abre en otra pestaña)"
        className="relative flex items-center justify-center rounded-full [--focus-ring:var(--color-brand-yellow)]"
        initial="initial"
        whileHover="active"
        whileTap="active"
      >
        <motion.span
          aria-hidden
          variants={{
            active: { scale: [1, 1.5], opacity: [0.7, 0], transition: { duration: 1, repeat: Infinity, ease: "easeOut" } },
            initial: { scale: 1, opacity: 0 },
          }}
          className="absolute inset-0 z-0 rounded-full bg-[#25D366] blur-lg"
        />
        <motion.span
          className="relative z-10 block drop-shadow-[0_10px_15px_rgba(74,12,10,0.45)]"
          variants={{ active: { scale: 1.1 }, initial: { scale: 1 } }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {/* Decorativa: el enlace ya lleva su nombre en aria-label */}
          <Image src="/whatsapp-globo.png" alt="" width={80} height={80} className="h-14 w-14 object-contain md:h-20 md:w-20" priority />
        </motion.span>
      </motion.a>
    </div>
  );
}
