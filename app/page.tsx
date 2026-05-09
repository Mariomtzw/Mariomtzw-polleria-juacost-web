"use client";

import React, { useState } from 'react'; // <-- Agregamos useState
import { motion } from 'framer-motion';
import { Leaf, Truck, Star, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { LampContainer } from '../components/ui/lamp';
import { AuroraButton } from '../components/ui/aurora-button';
import Image from 'next/image';

// Variantes de animación
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  // --- AGREGAR ESTO JUSTO AQUÍ ---
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState(''); // <-- Nuevo estado para la dirección
  const [pedido, setPedido] = useState('');

  const enviarWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const numero = "525551234567"; // Recuerda poner tu número real
    
    // Agregamos la dirección al mensaje
    const mensaje = `Buen día, quisiera cotizar por mayoreo.%0A%0A*Nombre:* ${nombre}%0A*Teléfono:* ${telefono}%0A*Dirección de entrega:* ${direccion}%0A*Pedido:* ${pedido}`;
    
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, '_blank');
  };

  // ... (tu código de return continúa igual)
  // ---------------------------------
  return (
    <main className="min-h-screen bg-brand-red font-sans selection:bg-brand-yellow selection:text-brand-red">
      
      {/* NAVEGACIÓN FIJA */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full bg-brand-red/90 backdrop-blur-md z-50 border-b border-brand-yellow/30"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* NUEVO LOGO ADAPTADO */}
          <div className="flex items-center gap-3">
             <Image 
               src="/logo.svg" /* Cambia a /logo.png si lo exportaste en PNG */
               alt="Logo Juacos't" 
               width={50} 
               height={50} 
               className="object-contain hover:scale-105 transition-transform"
               priority
             />
             {/* Puedes borrar la palabra JUACost de abajo si tu logo ya tiene las letras */}
             <span className="text-brand-white font-black tracking-widest text-lg hidden md:block drop-shadow-md">
               Juacos't
             </span>
          </div>
          
          {/* ... el resto de tus enlaces ... */}
          <div className="flex gap-4 md:gap-8 text-white font-bold text-sm tracking-wider uppercase">
            <a href="#inicio" className="hover:text-brand-yellow transition-colors">Inicio</a>
            {/* NUEVO ENLACE A RECETAS */}
            <a href="/recetas" className="hover:text-brand-yellow transition-colors text-brand-yellow underline underline-offset-4">Recetas</a>
            <a href="#productos" className="hover:text-brand-yellow transition-colors">Productos</a>
            <a href="#historia" className="hover:text-brand-yellow transition-colors">Historia</a>
            <a href="#contacto" className="hover:text-brand-yellow transition-colors">Contacto</a>
          </div>
        </div>
      </motion.nav>

     {/* SECCIÓN 1: HERO CON EFECTO LÁMPARA CENTRADO */}
      <section id="inicio">
        <LampContainer>
          <motion.div
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center text-center w-full relative z-50"
          >
            {/* Trust Badge - Estilo Premium Glassmorphism */}
            <div className="mb-8">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs md:text-sm font-bold shadow-2xl transition-all hover:bg-white/20">
                <Star size={16} className="text-brand-yellow drop-shadow-md" fill="currentColor" />
                <span className="text-white tracking-[0.25em] uppercase">100% Calidad y Tradición</span>
              </div>
            </div>

            {/* Títulos con profundidad y contraste */}
            <h1 className="text-[4rem] md:text-[6rem] lg:text-[7.5rem] font-black tracking-tighter leading-[0.85] mb-8">
              <span className="text-brand-yellow drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">FRESCO,</span> <br/>
              <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">ORGÁNICO</span> <br/>
              <span className="text-brand-yellow drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">& DESTAZADO</span>
            </h1>
            
            {/* Subtítulo más limpio y legible */}
            <p className="text-lg md:text-2xl text-white/90 font-medium max-w-2xl mx-auto mb-12 drop-shadow-md px-4 leading-relaxed">
              De la granja a tu mesa. Especialistas en pollo de alta calidad y huevo orgánico para familias y negocios.
            </p>
            
            {/* Botón con micro-interacción en la flecha */}
            <div className="mt-2 group">
              <AuroraButton onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="flex items-center gap-2">
                  VER PRODUCTOS <ArrowRight strokeWidth={3} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </AuroraButton>
            </div>
          </motion.div>
        </LampContainer>
      </section>
      {/* SECCIÓN 2: PRODUCTOS */}
      <section id="productos" className="py-24 px-4 bg-brand-red-dark">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black text-brand-yellow mb-4">NUESTROS PRODUCTOS</h2>
            <p className="text-white text-xl">Calidad insuperable en ventas por mayoreo y menudeo.</p>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          >
            {/* Tarjeta Pollo (Sin botones individuales) */}
            <motion.div variants={fadeInUp} className="bg-brand-yellow rounded-[2rem] p-8 md:p-12 text-brand-red shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 text-brand-yellow-light opacity-30">
                <Leaf size={200} />
              </div>
              <h3 className="text-4xl font-black mb-4 relative z-10">POLLO DESTAZADO</h3>
              <p className="text-lg font-bold mb-8 relative z-10">Cortes perfectos, frescura garantizada del día. Ideal para restaurantes, rosticerías y el hogar.</p>
              <ul className="space-y-4 font-bold relative z-10">
                <li className="flex items-center gap-3"><Star /> Calidad Premium</li>
                <li className="flex items-center gap-3"><Truck /> Entrega a Domicilio</li>
                <li className="flex items-center gap-3"><Leaf /> Sin conservadores</li>
              </ul>
            </motion.div>

            {/* Tarjeta Huevo (Sin botones individuales) */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[2rem] p-8 md:p-12 text-brand-red shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 text-brand-yellow opacity-20">
                <Star size={200} />
              </div>
              <h3 className="text-4xl font-black mb-4 relative z-10 text-brand-red">HUEVO ORGÁNICO</h3>
              <p className="text-lg font-bold mb-8 relative z-10">Gallinas libres de jaula, alimentación natural. Un color y sabor que resalta en cualquier platillo.</p>
              <ul className="space-y-4 font-bold relative z-10">
                <li className="flex items-center gap-3"><Star /> 100% Orgánico Certificado</li>
                <li className="flex items-center gap-3"><Truck /> Venta por Cono o Caja</li>
                <li className="flex items-center gap-3"><Leaf /> Yema rica en nutrientes</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* BOTÓN CENTRAL PARA ORDENAR */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="flex justify-center w-full"
          >
             <AuroraButton 
                onClick={() => window.open('https://wa.me/2283346846?text=Buen%20d%C3%ADa%2C%20quisiera%20hacer%20un%20pedido', '_blank')}
                className="!px-16 !py-6 !text-2xl" 
                glowClassName="!blur-2xl"
              >
                ORDENAR AHORA
             </AuroraButton>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 3: HISTORIA / VALORES */}
      <section id="historia" className="py-24 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-4xl md:text-6xl font-black text-white mb-8"
          >
            NUESTRA <span className="text-brand-yellow">HISTORIA</span>
          </motion.h2>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="bg-brand-yellow text-brand-red p-8 md:p-12 rounded-[2rem] font-bold text-lg md:text-2xl leading-relaxed shadow-[10px_10px_0_0_rgba(255,255,255,1)]"
          >
            Desde nuestros inicios, en Pollería Juacos't hemos mantenido una promesa inquebrantable: llevar el mejor sabor y la nutrición más pura a las familias. Creemos en el trabajo honesto, en el bienestar animal y en que la calidad de los ingredientes define el amor en cada comida. Somos tradición, somos frescura.
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 4: CONTACTO Y FOOTER */}
      <section id="contacto" className="bg-brand-yellow pt-24 pb-12 px-4 rounded-t-[3rem] text-brand-red">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16"
          >
            <div>
              <h2 className="text-5xl font-black mb-6">HAZ TU PEDIDO <br/> HOY MISMO.</h2>
              <p className="text-xl font-bold mb-8">Atendemos pedidos de mayoreo para tu negocio y menudeo para tu hogar.</p>
              <div className="space-y-6 text-lg font-bold">
                <div className="flex items-center gap-4 bg-brand-red text-white p-4 rounded-xl">
                  <Phone className="text-brand-yellow" /> <span>2283 34 68 46</span>
                </div>
                <div className="flex items-center gap-4 bg-brand-red text-white p-4 rounded-xl">
                  <MapPin className="text-brand-yellow" /> <span>Banderilla, Centro, Local 73</span>
                </div>
                <div className="flex items-center gap-4 bg-brand-red text-white p-4 rounded-xl">
                  <Clock className="text-brand-yellow" /> <span>Lunes a Domingo: 6:00 AM - 4:00 PM</span>
                </div>
              </div>
            </div>

            {/* Formulario Dinámico convertido a enlace de WhatsApp */}
            {/* Formulario Dinámico conectado a WhatsApp */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl">
              <h3 className="text-2xl font-black mb-6 uppercase text-brand-red">COTIZA POR MAYOREO</h3>
              
              <form onSubmit={enviarWhatsApp} className="space-y-4 flex flex-col">
                <input 
                  type="text" 
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu Nombre" 
                  className="bg-brand-yellow/20 text-brand-red font-bold placeholder:text-brand-red/60 p-4 rounded-xl outline-none focus:ring-4 focus:ring-brand-red/20 transition-all" 
                />
                
                <input 
                  type="text" 
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono" 
                  className="bg-brand-yellow/20 text-brand-red font-bold placeholder:text-brand-red/60 p-4 rounded-xl outline-none focus:ring-4 focus:ring-brand-red/20 transition-all" 
                />
                {/* --- NUEVO CAMPO DE DIRECCIÓN --- */}
                <input 
                  type="text" 
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección de entrega" 
                  className="bg-brand-yellow/20 text-brand-red font-bold placeholder:text-brand-red/60 p-4 rounded-xl outline-none focus:ring-4 focus:ring-brand-red/20 transition-all" 
                />
                {/* --------------------------------- */}
                <textarea 
                  rows={4} 
                  required
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  placeholder="¿Qué necesitas? (Ej. 100 de pechugas...)" 
                  className="bg-brand-yellow/20 text-brand-red font-bold placeholder:text-brand-red/60 p-4 rounded-xl outline-none focus:ring-4 focus:ring-brand-red/20 transition-all resize-none"
                ></textarea>
                
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  className="bg-brand-red text-brand-yellow font-black py-4 rounded-xl text-lg uppercase tracking-widest mt-2 hover:bg-brand-red-dark transition-colors block text-center w-full"
                >
                  Enviar Mensaje
                </motion.button>
              </form>
            </div>
          </motion.div>

          <div className="border-t-[3px] border-brand-red/20 pt-8 flex flex-col md:flex-row justify-between items-center font-bold text-sm">
            <p>© 2026 Pollería Juacos't. Todos los derechos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:underline">Privacidad</a>
              <a href="#" className="hover:underline">Términos</a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}