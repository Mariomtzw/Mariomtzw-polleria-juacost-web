"use client";

import React from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { ArrowLeft, Clock, Users, ChefHat } from 'lucide-react';
import Link from 'next/link';

// Arreglo de datos para mantener el código limpio y fácil de editar
const recetasData = [
  {
    id: 1,
    titulo: "Pollo Rostizado a las Finas Hierbas",
    desc: "Un clásico infalible. Jugoso por dentro y crujiente por fuera.",
    tiempo: "1.5 hrs",
    porc: "4 Porc.",
    img: "/recetas/receta-1.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 1 Pollo entero limpio (aprox. 2 kg)\n• 50g de mantequilla a temperatura ambiente\n• 3 Dientes de ajo finamente picados\n• 1 Cda. de romero y tomillo fresco\n\n⏱️ COCCIÓN: Horno a 200°C por 1h 15m.\n\n👨‍🍳 PASO A PASO:\n1. Seca perfectamente el pollo con toallas de papel.\n2. Unta la mezcla de mantequilla, ajo, hierbas, sal y pimienta por debajo de la piel y por fuera.\n3. Hornea bañándolo con sus propios jugos cada 20 minutos.\n4. Retira y deja reposar 10 minutos antes de cortar."
  },
  {
    id: 2,
    titulo: "Caldo de Pollo Reconfortante",
    desc: "El abrazo tradicional. Preparado con piezas frescas y verduras.",
    tiempo: "45 min",
    porc: "6 Porc.",
    img: "/recetas/receta-2.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 1 kg de piezas de pollo (pierna y muslo)\n• 2 Zanahorias y 2 papas en cubos\n• 1 Chayote en cubos\n• 1/2 Cebolla, 1 ajo y ramitas de cilantro\n\n⏱️ COCCIÓN: Fuego medio por 35-40 min.\n\n👨‍🍳 PASO A PASO:\n1. En una olla grande, hierve agua con la cebolla, el ajo y sal al gusto.\n2. Agrega las piezas de pollo limpias y retira la espuma que se forme arriba tras 15 min.\n3. Incorpora toda la verdura picada.\n4. Cocina por 20 minutos más o hasta que la verdura esté suave. Sirve con cilantro fresco y limón."
  },
  {
    id: 3,
    titulo: "Pechugas Rellenas de Espinaca",
    desc: "Perfectas para una cena elegante o comer sano y delicioso.",
    tiempo: "30 min",
    porc: "2 Porc.",
    img: "/recetas/receta-3.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 2 Pechugas abiertas en mariposa\n• 1 Taza de espinacas baby frescas\n• 100g de queso asadero o manchego\n• 1 Cda. de aceite de oliva\n\n⏱️ COCCIÓN: Sartén a fuego medio por 15 min.\n\n👨‍🍳 PASO A PASO:\n1. Salpimienta las pechugas por ambos lados.\n2. Coloca en el centro una cama de espinacas y el queso rallado.\n3. Dobla la pechuga y ciérrala asegurando las orillas con palillos de madera.\n4. Sella en el sartén caliente por 7-8 minutos de cada lado hasta que doren y el queso gratine."
  },
  {
    id: 4,
    titulo: "Enchiladas Suizas de Pollo",
    desc: "Rellenas de pollo deshebrado, bañadas en salsa verde cremosa.",
    tiempo: "40 min",
    porc: "4 Porc.",
    img: "/recetas/receta-4.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 500g de pechuga cocida y deshebrada\n• 12 Tortillas de maíz\n• 500g de tomate verde y 2 chiles serranos\n• 1/2 Taza de crema y 150g de queso manchego\n\n⏱️ COCCIÓN: Horno a 180°C por 10 min.\n\n👨‍🍳 PASO A PASO:\n1. Hierve los tomates y chiles. Licúalos con la crema, cilantro, ajo y sal.\n2. Pasa las tortillas ligeramente por aceite caliente para suavizarlas.\n3. Rellénalas con el pollo deshebrado y acomódalas en un refractario.\n4. Baña con la salsa verde, espolvorea el queso y hornea hasta gratinar."
  },
  {
    id: 5,
    titulo: "Huevos Orgánicos Rancheros",
    desc: "Nuestro huevo fresco sobre tortilla frita, bañados en salsa roja.",
    tiempo: "15 min",
    porc: "1 Porc.",
    img: "/recetas/receta-5.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 2 Huevos orgánicos JUACost\n• 2 Tortillas de maíz\n• 1 Taza de salsa roja de molcajete caliente\n• Frijoles refritos para acompañar\n\n⏱️ COCCIÓN: Sartén a fuego medio-alto por 5 min.\n\n👨‍🍳 PASO A PASO:\n1. En un sartén con un poco de aceite, fríe las tortillas hasta que estén semi-doradas. Retira y reserva.\n2. En ese mismo sartén, estrella los dos huevos y cocínalos a tu término favorito (tierno o bien cocido).\n3. Unta frijoles en las tortillas, coloca un huevo sobre cada una.\n4. Baña generosamente con la salsa roja caliente."
  },
  {
    id: 6,
    titulo: "Milanesa de Pollo Crujiente",
    desc: "Pechuga perfectamente aplanada y empanizada, el favorito de todos.",
    tiempo: "25 min",
    porc: "2 Porc.",
    img: "/recetas/receta-6.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 2 Milanesas de pechuga de pollo\n• 2 Huevos orgánicos JUACost batidos\n• 1 Taza de pan molido o panko\n• 1/2 Taza de harina de trigo\n\n⏱️ COCCIÓN: Freído a 170°C por 8 min.\n\n👨‍🍳 PASO A PASO:\n1. Salpimienta las milanesas.\n2. Pásalas por la harina (sacudiendo el exceso), luego sumérgelas en el huevo batido y finalmente cúbrelas bien con el pan molido.\n3. Fríe en abundante aceite caliente por unos 4 minutos de cada lado hasta lograr un dorado perfecto.\n4. Escurre sobre papel absorbente."
  },
  {
    id: 7,
    titulo: "Tostadas de Tinga",
    desc: "Pechuga deshebrada guisada a fuego lento con jitomate y chipotle.",
    tiempo: "45 min",
    porc: "6 Porc.",
    img: "/recetas/receta-7.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 500g de pechuga cocida y deshebrada\n• 2 Cebollas blancas fileteadas\n• 4 Jitomates hervidos\n• 2 Chiles chipotle de lata\n\n⏱️ COCCIÓN: Guisado a fuego medio por 20 min.\n\n👨‍🍳 PASO A PASO:\n1. Licúa los jitomates con el chipotle, un ajo, sal y un chorrito del caldo de pollo.\n2. En una cacerola, sofríe la cebolla fileteada con aceite hasta que esté muy suave y transparente (aprox. 10 min).\n3. Vierte la salsa de la licuadora sobre la cebolla y deja hervir.\n4. Agrega el pollo deshebrado, revuelve bien y cocina por 10 min a fuego bajo para que absorba el sabor."
  },
  {
    id: 8,
    titulo: "Omelette Relleno",
    desc: "Huevos batidos, rellenos de champiñones, queso y espinacas.",
    tiempo: "10 min",
    porc: "1 Porc.",
    img: "/recetas/receta-8.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 2 Huevos orgánicos JUACost\n• 1/2 Taza de champiñones fileteados\n• 50g de queso manchego rallado\n• Un puñado de espinacas troceadas\n\n⏱️ COCCIÓN: Sartén a fuego bajo por 4 min.\n\n👨‍🍳 PASO A PASO:\n1. Saltea rápidamente los champiñones y reserva.\n2. Bate los huevos con un tenedor, sal y pimienta.\n3. Derrite mantequilla en el sartén y vierte el huevo, esparciendo por todo el fondo.\n4. Cuando los bordes cuajen, coloca el queso, champiñones y espinacas en una sola mitad. Dobla la otra mitad por encima y deja derretir el queso."
  },
  {
    id: 9,
    titulo: "Fajitas de Pollo Norteñas",
    desc: "Tiras de pechuga salteadas con pimientos de colores y cebolla.",
    tiempo: "20 min",
    porc: "3 Porc.",
    img: "/recetas/receta-9.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 500g de filete de pechuga en tiras\n• 1 Pimiento morrón rojo y 1 verde en tiras\n• 1 Cebolla blanca en julianas\n• 1 Cda. de sazonador para fajitas o paprika\n\n⏱️ COCCIÓN: Salteado a fuego alto por 15 min.\n\n👨‍🍳 PASO A PASO:\n1. Sazona las tiras de pollo.\n2. En un sartén muy caliente con aceite, sella el pollo por unos 8 minutos hasta que esté casi cocido. Retira y reserva.\n3. En el mismo sartén, añade la cebolla y los pimientos; saltea por 5 minutos para que queden al dente (crujientes).\n4. Regresa el pollo, mezcla todo y cocina 2 minutos más."
  },
  {
    id: 10,
    titulo: "Alitas Picantes Búfalo",
    desc: "Para botanear el fin de semana. Jugosas y repletas de sabor.",
    tiempo: "40 min",
    porc: "4 Porc.",
    img: "/recetas/receta-10.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 1 kg de alitas de pollo JUACost limpias\n• 1 Taza de salsa picante tipo Luisiana (RedHot)\n• 50g de mantequilla\n• 1/2 Taza de harina sazonada\n\n⏱️ COCCIÓN: Horno a 220°C por 35 min.\n\n👨‍🍳 PASO A PASO:\n1. Pasa las alitas secas por la harina sazonada para darles una capa ligera.\n2. Hornéalas sobre una rejilla durante 35 minutos hasta que la piel quede súper crujiente.\n3. En una olla pequeña, derrite la mantequilla y mézclala con la salsa picante caliente.\n4. Pon las alitas en un tazón grande, vierte la salsa y agita vigorosamente para bañarlas por completo."
  },
  {
    id: 11,
    titulo: "Huevos Orgánicos Ahogados",
    desc: "Cocinados dentro de un caldillo de jitomate martajado.",
    tiempo: "20 min",
    porc: "2 Porc.",
    img: "/recetas/receta-11.avif",
    color: "blanco",
    instrucciones: "🛒 INGREDIENTES:\n• 4 Huevos orgánicos JUACost\n• 4 Jitomates hervidos\n• 1/4 de Cebolla y 1 diente de ajo\n• 1 Chile de árbol seco (opcional)\n\n⏱️ COCCIÓN: Hervido a fuego medio por 15 min.\n\n👨‍🍳 PASO A PASO:\n1. Licúa los jitomates, cebolla y ajo con un poco de agua o caldo (que quede espeso).\n2. En una cazuela, sofríe la salsa con una cucharada de aceite y deja hervir 10 minutos.\n3. Reduce el fuego al mínimo. Casca los huevos uno por uno y déjalos caer suavemente separados dentro del caldillo hirviendo.\n4. Tapa la cazuela sin revolver nada y cocina por 5-6 min hasta que la clara esté firme."
  },
  {
    id: 12,
    titulo: "Ensalada Fresca con Pollo",
    desc: "Ligera y nutritiva. Mix de lechugas con fajitas de pechuga.",
    tiempo: "15 min",
    porc: "2 Porc.",
    img: "/recetas/receta-12.avif",
    color: "amarillo",
    instrucciones: "🛒 INGREDIENTES:\n• 300g de filete fino de pechuga\n• Mix de lechugas (romana y orejona)\n• 1 Taza de jitomate cherry en mitades\n• Aderezo de mostaza dulce y limón\n\n⏱️ COCCIÓN: Plancha a fuego alto por 10 min.\n\n👨‍🍳 PASO A PASO:\n1. Marina la pechuga con jugo de limón, sal, pimienta y ajo en polvo.\n2. Ásala en un sartén o plancha caliente con poco aceite durante 5 min por lado hasta lograr costra.\n3. Déjala reposar un minuto y córtala en fajitas.\n4. En un plato hondo, sirve la cama de lechuga, añade los jitomates, acomoda el pollo tibio encima y baña con el aderezo al momento de servir."
  }
];

export default function RecetasPage() {
  return (
    <main className="bg-brand-red min-h-screen font-sans selection:bg-brand-yellow selection:text-brand-red">
      
      {/* Botón Flotante para Regresar */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/">
          <button className="flex items-center gap-2 bg-brand-yellow text-brand-red px-4 py-2 rounded-full font-bold shadow-xl hover:scale-105 transition-transform">
            <ArrowLeft size={20} /> Volver a Inicio
          </button>
        </Link>
      </div>

      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="/recetas/hero-pollo3.avif" 
        bgImageSrc="/recetas/hero-bg.avif"
        title="RECETAS DELICIOSAS"
        date="Juacos't"
        scrollToExpand="↓ Desliza hacia abajo para cocinar ↓"
      >
        
        {/* Grid de Recetas */}
        <div className="max-w-7xl mx-auto w-full pt-12">
          <h3 className="text-4xl md:text-5xl font-black text-brand-yellow mb-12 text-center drop-shadow-md">
            INSPIRACIÓN PARA TU MESA
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {recetasData.map((receta) => (
              <div 
                key={receta.id} 
                className={`relative rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center group transition-transform hover:-translate-y-2 overflow-hidden ${
                  receta.color === "blanco" ? "bg-white" : "bg-brand-yellow"
                }`}
              >
                {/* Imagen del platillo */}
                <div className={`w-full h-48 rounded-xl overflow-hidden mb-6 relative z-10 ${receta.color === "amarillo" ? "border-4 border-brand-red/20" : ""}`}>
                  {/* Se usa img nativa para cargar desde local de forma simple */}
                  <img src={receta.img} alt={receta.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                </div>
                
                {/* Títulos y Descripción */}
                <div className="relative z-10 flex flex-col flex-grow items-center">
                  <h4 className="text-2xl font-black text-brand-red mb-3">{receta.titulo}</h4>
                  <p className="text-brand-red/80 font-bold mb-6 text-sm">{receta.desc}</p>
                </div>

                {/* Footer de Tiempos y Porciones */}
                <div className="flex gap-4 text-brand-yellow bg-brand-red px-4 py-2 rounded-full text-sm font-bold mt-auto relative z-10 shadow-md">
                  <span className="flex items-center gap-1"><Clock size={16}/> {receta.tiempo}</span>
                  <span className="flex items-center gap-1"><Users size={16}/> {receta.porc}</span>
                </div>

                {/* CAPA DE PREPARACIÓN QUE APARECE EN HOVER */}
                <div className="absolute inset-0 bg-brand-red/95 p-8 flex flex-col justify-center items-center text-center opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 backdrop-blur-sm overflow-y-auto">
                  <ChefHat size={40} className="text-brand-yellow mb-4" />
                  <h5 className="text-2xl font-black text-brand-yellow mb-4">¿Cómo prepararlo?</h5>
                  <p className="text-white font-bold text-sm leading-relaxed whitespace-pre-line text-left">
                    {receta.instrucciones}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </ScrollExpandMedia>
    </main>
  );
}