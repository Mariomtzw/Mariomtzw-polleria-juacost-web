"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function WhatsAppFloat() {
  // Reemplaza con el número real de la pollería
  const whatsappNumber = "2283576092"; 
  const message = "¡Hola! Vengo desde el sitio web y me gustaría hacer un pedido.";

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center pointer-events-auto">
      <motion.a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center"
        initial="initial"
        whileHover="active"
        whileTap="active"
      >
        {/* Efecto de Pulso Verde ajustado para salir desde detrás de la imagen */}
        <motion.div
          variants={{
            active: {
              scale: [1, 1.5],
              opacity: [0.7, 0],
              transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeOut"
              }
            },
            initial: { scale: 1, opacity: 0 }
          }}
          className="absolute inset-0 bg-[#25D366] rounded-full blur-lg z-0"
        />

        {/* Contenedor Limpio (Sin fondo blanco ni bordes, solo tu PNG y una sombra) */}
        <motion.div
          className="relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
          variants={{
            active: { scale: 1.1 },
            initial: { scale: 1 }
          }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Image
            src="/whatsapp-globo.png"
            alt="WhatsApp JUACost"
            width={80}
            height={80}
            className="w-14 h-14 md:w-20 md:h-20 object-contain"
            priority
          />
        </motion.div>
      </motion.a>
    </div>
  );
}