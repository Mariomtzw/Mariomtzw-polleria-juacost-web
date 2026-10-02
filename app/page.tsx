"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, MotionConfig, type Variants } from "framer-motion";
import { Leaf, Truck, Star, Phone, MapPin, Clock, ArrowRight, EggFried, Mail, Lock } from "lucide-react";
import { LampContainer } from "@/components/ui/lamp";
import { AuroraButton } from "@/components/ui/aurora-button";
import { SITE, whatsappUrl } from "@/lib/site";

// Entrada rápida que desacelera al final (ver --ease-out-expo en globals.css).
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio", hideOnMobile: true }, // en móvil el logo ya lleva a Inicio
  { href: "/recetas", label: "Recetas" },
  { href: "#productos", label: "Productos" },
  { href: "#historia", label: "Historia" },
  { href: "#contacto", label: "Pedidos" },
] as const;

const navLinkClass =
  "block rounded-full px-0.5 py-3.5 text-[0.6875rem] font-bold uppercase -outline-offset-2 text-white transition-colors hover:text-brand-yellow min-[400px]:px-1 min-[400px]:text-xs min-[400px]:tracking-wide md:px-2.5 md:py-3 md:text-sm md:tracking-wider lg:px-3";

const fieldClass =
  "w-full rounded-xl bg-brand-yellow/20 p-4 text-base font-semibold text-brand-red-dark placeholder:font-medium placeholder:text-brand-red-dark/80";

const labelClass = "mb-1.5 block text-sm font-bold text-brand-red-dark";

const contactLinkClass = "rounded-sm underline-offset-4 hover:underline";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pedido, setPedido] = useState("");

  const enviarWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    const mensaje = [
      "Buen día, quisiera cotizar por mayoreo.",
      "",
      `*Nombre:* ${nombre}`,
      `*Teléfono:* ${telefono}`,
      `*Dirección de entrega:* ${direccion}`,
      `*Pedido:* ${pedido}`,
    ].join("\n");
    window.open(whatsappUrl(mensaje), "_blank", "noopener,noreferrer");
  };

  return (
    // reducedMotion="user": si el sistema pide menos movimiento, las entradas
    // dejan de desplazarse y solo aparecen.
    <MotionConfig reducedMotion="user">
      <main className="site min-h-[100dvh] overflow-x-hidden bg-brand-red font-sans">
        {/* NAVEGACIÓN FIJA */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="fixed inset-x-0 top-0 z-50 border-b border-brand-yellow/30 bg-brand-red/90 backdrop-blur-md"
        >
          <nav aria-label="Principal" className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 md:px-6">
            <a href="#inicio" className="flex shrink-0 items-center gap-2 rounded-full md:gap-3">
              <Image
                src="/logo.svg"
                alt=""
                width={50}
                height={50}
                className="h-10 w-10 object-contain transition-transform hover:scale-105 motion-reduce:transition-none md:h-[50px] md:w-[50px]"
                priority
              />
              <span className="hidden text-base font-black tracking-widest text-white sm:block md:text-lg">
                Juacos&apos;t
              </span>
              <span className="sr-only sm:hidden">Juacos&apos;t, ir al inicio</span>
            </a>

            <div className="flex min-w-0 items-center gap-1 md:gap-3">
            {/* Si aun así no caben (pantallas muy angostas), la lista se desliza */}
            <ul className="flex min-w-0 items-center gap-0.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className={"hideOnMobile" in link ? "hidden sm:block" : undefined}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href} className={navLinkClass}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={navLinkClass}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {/* Acceso al panel privado, siempre a la vista: candado en teléfono y
                tableta, candado + "Admin" en pantallas anchas. Pide correo y contraseña. */}
            <Link
              href="/admin"
              prefetch={false}
              aria-label="Acceso administrador"
              title="Acceso administrador"
              className="flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-brand-yellow text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-yellow hover:text-brand-red-dark md:size-10 lg:size-auto lg:px-4 lg:py-2"
            >
              <Lock aria-hidden size={16} strokeWidth={2.5} className="shrink-0" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
            </div>
          </nav>
        </motion.header>

        {/* SECCIÓN 1: HERO CON EFECTO LÁMPARA */}
        <section id="inicio">
          <LampContainer>
            <motion.div
              initial={{ opacity: 0.5, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASE_OUT_EXPO }}
              className="relative z-50 flex w-full flex-col items-center px-1 pt-20 text-center md:pt-0"
            >
              {/* Sello de confianza */}
              <p className="mb-6 flex items-center gap-2 rounded-full border border-white/20 bg-brand-red-dark/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md md:mb-8 md:gap-3 md:px-6 md:py-2.5 md:text-sm md:tracking-[0.25em]">
                <Star aria-hidden size={16} className="shrink-0 text-brand-yellow" fill="currentColor" />
                100% Calidad y Tradición
              </p>

              {/* Una línea por idea. En teléfonos "& SIN HORMONAS" se parte en dos para
                  conservar el tamaño; desde 640px caben las tres líneas. Tope: 6rem. */}
              <h1 className="mb-6 text-[clamp(2.75rem,13vw,6rem)] sm:text-[clamp(3.5rem,10.6vw,6rem)] font-black leading-[0.95] tracking-[-0.04em] drop-shadow-[0_4px_6px_rgba(74,12,10,0.45)] md:mb-8">
                <span className="block text-brand-yellow">FRESCO,</span>
                <span className="block text-white">ORGÁNICO</span>
                <span className="block text-brand-yellow">&amp; SIN HORMONAS</span>
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-white/90 md:mb-12 md:text-2xl">
                Especialistas en pollo de alta calidad y huevo orgánico para familias y negocios desde hace más de 35 años.
              </p>

              <div className="group mt-2">
                <AuroraButton href="#productos">
                  VER PRODUCTOS
                  <ArrowRight
                    aria-hidden
                    strokeWidth={3}
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </AuroraButton>
              </div>
            </motion.div>
          </LampContainer>
        </section>

        {/* SECCIÓN 2: PRODUCTOS */}
        <section id="productos" className="bg-brand-red-dark px-4 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12 text-center md:mb-16"
            >
              <h2 className="mb-4 text-balance text-4xl font-black leading-none tracking-tight text-brand-yellow md:text-7xl">
                NUESTROS PRODUCTOS
              </h2>
              <p className="mx-auto max-w-2xl text-pretty px-4 text-lg text-white md:text-xl">
                Calidad insuperable de nuestra granja a tu mesa. Ventas por mayoreo y menudeo.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="mb-12 grid grid-cols-1 gap-6 md:mb-16 md:gap-8 lg:grid-cols-2"
            >
              {/* Tarjeta Pollo */}
              <motion.article
                variants={fadeInUp}
                className="relative overflow-hidden rounded-[2rem] bg-brand-yellow p-6 text-brand-red-dark shadow-brand md:p-12"
              >
                <Leaf aria-hidden className="absolute -top-10 -right-10 h-[150px] w-[150px] text-brand-yellow-light opacity-30 md:h-[200px] md:w-[200px]" />
                <h3 className="relative mb-4 text-3xl font-black md:text-4xl">POLLO DESTAZADO</h3>
                <p className="relative mb-6 max-w-[48ch] text-pretty text-base font-semibold md:mb-8 md:text-lg">
                  Cortes perfectos, frescura garantizada del día. Ideal para restaurantes, rosticerías y el hogar.
                </p>
                <ul className="relative space-y-3 text-sm font-bold md:space-y-4 md:text-base">
                  <li className="flex items-center gap-3"><Star aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> Calidad Premium</li>
                  <li className="flex items-center gap-3"><Truck aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> Entrega a Domicilio</li>
                  <li className="flex items-center gap-3"><Leaf aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> Sin hormonas</li>
                </ul>
              </motion.article>

              {/* Tarjeta Huevo */}
              <motion.article
                variants={fadeInUp}
                className="relative overflow-hidden rounded-[2rem] bg-white p-6 text-brand-red shadow-brand md:p-12"
              >
                <Star aria-hidden className="absolute -right-10 -bottom-10 h-[150px] w-[150px] text-brand-yellow opacity-20 md:h-[200px] md:w-[200px]" />
                <h3 className="relative mb-4 text-3xl font-black md:text-4xl">HUEVO ORGÁNICO</h3>
                <p className="relative mb-6 max-w-[48ch] text-pretty text-base font-semibold md:mb-8 md:text-lg">
                  Gallinas de libre pastoreo, alimentadas con una dieta natural a base de pasto fresco, albahaca, orégano y leguminosas.
                </p>
                <ul className="relative space-y-3 text-sm font-bold md:space-y-4 md:text-base">
                  <li className="flex items-center gap-3"><Star aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> 100% Orgánico</li>
                  <li className="flex items-center gap-3"><Leaf aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> Libre de pesticidas</li>
                  <li className="flex items-center gap-3"><EggFried aria-hidden className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> Yema rica en nutrientes</li>
                </ul>
              </motion.article>
            </motion.div>

            {/* BOTÓN CENTRAL PARA ORDENAR */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex w-full justify-center px-4"
            >
              <AuroraButton
                href={whatsappUrl("Buen día, quisiera hacer un pedido")}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                glowClassName="blur-2xl"
              >
                ORDENAR AHORA
                <span className="sr-only"> por WhatsApp (se abre en otra pestaña)</span>
              </AuroraButton>
            </motion.div>
          </div>
        </section>

        {/* SECCIÓN 3: HISTORIA / VALORES */}
        <section id="historia" className="relative px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mb-6 text-balance text-4xl font-black leading-none tracking-tight text-white md:mb-10 md:text-6xl"
            >
              NUESTRA <span className="text-brand-yellow">HISTORIA</span>
            </motion.h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6 rounded-[2rem] bg-brand-yellow p-6 text-pretty text-lg font-semibold leading-relaxed text-brand-red-dark shadow-[6px_6px_0_0_#fff] md:p-12 md:text-2xl md:shadow-[10px_10px_0_0_#fff]"
            >
              <p>
                Desde hace más de 35 años, en Pollos Juacos&apos;t hemos mantenido una promesa inquebrantable: llevar el mejor sabor y la nutrición más pura a las familias. Creemos en el trabajo honesto, en el bienestar animal y en que la calidad de los ingredientes define el amor en cada comida.
              </p>
              <p className="font-black">Somos tradición, somos frescura.</p>
            </motion.div>
          </div>
        </section>

        {/* SECCIÓN 4: CONTACTO Y PIE. Sobre amarillo el foco va en rojo oscuro. */}
        <section
          id="contacto"
          className="rounded-t-[3rem] bg-brand-yellow px-4 pt-20 pb-8 text-brand-red-dark [--focus-ring:var(--color-brand-red-dark)] md:pt-24 md:pb-12"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mb-12 grid grid-cols-1 gap-10 md:mb-16 md:gap-12 lg:grid-cols-2"
            >
              <div>
                <h2 className="mb-4 text-4xl font-black leading-tight tracking-tight md:mb-6 md:text-5xl">
                  HAZ TU PEDIDO <br className="hidden md:block" /> HOY MISMO.
                </h2>
                <p className="mb-6 max-w-[40ch] text-pretty text-lg font-bold md:mb-8 md:text-xl">
                  Atendemos pedidos de mayoreo para tu negocio y menudeo para tu hogar.
                </p>
                <ul className="space-y-4 text-base font-bold [--focus-ring:#fff] md:space-y-5 md:text-lg">
                  <li className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-brand-red p-4 text-white">
                    <Phone aria-hidden className="shrink-0 text-brand-yellow" />
                    {SITE.phones.map((phone) => (
                      <a key={phone.tel} href={`tel:${phone.tel}`} className={`${contactLinkClass} tabular-nums`}>
                        <span className="sr-only">Llamar al </span>
                        {phone.label}
                      </a>
                    ))}
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-brand-red p-4 text-white md:gap-4">
                    <Mail aria-hidden className="shrink-0 text-brand-yellow" />
                    <a href={`mailto:${SITE.email}`} className={`${contactLinkClass} break-all`}>
                      {SITE.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-brand-red p-4 text-white md:gap-4">
                    <MapPin aria-hidden className="shrink-0 text-brand-yellow" />
                    <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                      {SITE.address}
                      <span className="sr-only"> (abrir en Google Maps, otra pestaña)</span>
                    </a>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-brand-red p-4 text-white md:gap-4">
                    <Clock aria-hidden className="shrink-0 text-brand-yellow" />
                    <span className="text-sm md:text-base">{SITE.hours}</span>
                  </li>
                </ul>
              </div>

              {/* Formulario conectado a WhatsApp. Sobre blanco el foco va en rojo. */}
              <div className="rounded-[2rem] bg-white p-6 shadow-brand [--focus-ring:var(--color-brand-red)] md:p-8">
                <h3 className="mb-6 text-xl font-black uppercase text-brand-red md:text-2xl">COTIZA POR MAYOREO</h3>

                <form onSubmit={enviarWhatsApp} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="cotiza-nombre" className={labelClass}>Tu nombre</label>
                    <input
                      id="cotiza-nombre"
                      name="nombre"
                      type="text"
                      autoComplete="name"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cotiza-telefono" className={labelClass}>Teléfono</label>
                    <input
                      id="cotiza-telefono"
                      name="telefono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cotiza-direccion" className={labelClass}>Dirección de entrega</label>
                    <input
                      id="cotiza-direccion"
                      name="direccion"
                      type="text"
                      autoComplete="street-address"
                      required
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cotiza-pedido" className={labelClass}>¿Qué necesitas?</label>
                    <textarea
                      id="cotiza-pedido"
                      name="pedido"
                      rows={4}
                      required
                      value={pedido}
                      onChange={(e) => setPedido(e.target.value)}
                      placeholder="Ej. 100 pechugas en bisteces de 4 aplanados"
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2 block w-full cursor-pointer rounded-xl bg-brand-red-dark py-4 text-center text-base font-black uppercase tracking-widest text-brand-yellow shadow-md md:text-lg"
                  >
                    Enviar Mensaje
                  </motion.button>
                  <p className="text-center text-sm font-medium text-brand-red-dark">
                    Se abrirá WhatsApp con tu pedido listo para enviar.
                  </p>
                </form>
              </div>
            </motion.div>

            <footer className="flex flex-col items-center gap-2 border-t-2 border-brand-red/20 pt-6 text-center text-xs font-bold md:flex-row md:justify-between md:pt-8 md:text-left md:text-sm">
              <p>© {new Date().getFullYear()} Pollos Juacos&apos;t. Todos los derechos reservados.</p>
              {/* Acceso discreto al panel privado (pide correo y contraseña) */}
              <Link href="/admin" prefetch={false} className="rounded px-1 py-1 font-semibold underline decoration-brand-red/40 underline-offset-4 hover:decoration-brand-red-dark">
                Acceso administrador
              </Link>
            </footer>
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}
