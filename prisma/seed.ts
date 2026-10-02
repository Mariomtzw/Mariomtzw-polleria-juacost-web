import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Multiplicador por pollo según tu fórmula real:
// precioPorPieza = pechuga + 2·pierna + 2·ala + huacal + rabadilla + higado + 2·pata + cabeza
const PIECE_TYPES = [
  { code: "PECHUGA", label: "Pechuga", perChicken: 1, sortOrder: 1 },
  { code: "PIERNA", label: "Pierna", perChicken: 2, sortOrder: 2 },
  { code: "ALA", label: "Ala", perChicken: 2, sortOrder: 3 },
  { code: "HUACAL", label: "Huacal", perChicken: 1, sortOrder: 4 },
  { code: "RABADILLA", label: "Rabadilla", perChicken: 1, sortOrder: 5 },
  { code: "HIGADO", label: "Hígado", perChicken: 1, sortOrder: 6 },
  { code: "PATA", label: "Pata", perChicken: 2, sortOrder: 7 },
  { code: "CABEZA", label: "Cabeza", perChicken: 1, sortOrder: 8 },
];

// 9 puestos + vendedora habitual + precios de despiece iniciales (del Excel).
const BRANCHES = [
  { code: "P01", zone: "S.M.", name: "S.M. Manuela", seller: "Manuela", precios: { pechuga: 45, pierna: 10, ala: 4, huacal: 2.5, rabadilla: 2, higado: 1.5, pata: 0.5, cabeza: 0.5 } },
  { code: "P02", zone: "S.M.", name: "S.M. Marilú", seller: "Marilú", precios: { pechuga: 48, pierna: 10, ala: 4, huacal: 2.5, rabadilla: 2, higado: 1.5, pata: 0.5, cabeza: 1 } },
  { code: "P03", zone: "Piletas", name: "Piletas Felicia", seller: "Felicia", precios: { pechuga: 50, pierna: 10, ala: 5, huacal: 3, rabadilla: 2.5, higado: 1.5, pata: 0.5, cabeza: 1 } },
  { code: "P04", zone: "Local", name: "Local Laura", seller: "Laura", precios: { pechuga: 50, pierna: 10, ala: 4.5, huacal: 3, rabadilla: 2.5, higado: 1.5, pata: 0.5, cabeza: 0.5 } },
  { code: "P05", zone: "Central", name: "Central José", seller: "José", precios: { pechuga: 50, pierna: 10, ala: 5, huacal: 3, rabadilla: 2, higado: 1, pata: 0.5, cabeza: 0.5 } },
  { code: "P06", zone: "Iglesia", name: "Iglesia Ana", seller: "Ana", precios: { pechuga: 50, pierna: 10, ala: 5, huacal: 2.5, rabadilla: 2, higado: 1, pata: 0.5, cabeza: 0.5 } },
  { code: "P07", zone: "L.B.", name: "L.B. Julia", seller: "Julia", precios: { pechuga: 50, pierna: 10, ala: 4, huacal: 2, rabadilla: 1.5, higado: 1, pata: 0.5, cabeza: 0.5 } },
  { code: "P08", zone: "L.M.", name: "L.M. Alba", seller: "Alba", precios: { pechuga: 50, pierna: 10, ala: 5, huacal: 3, rabadilla: 2, higado: 1, pata: 0.5, cabeza: 0.5 } },
  { code: "P09", zone: "21 M.", name: "21 M. Isa", seller: "Isa", precios: { pechuga: 50, pierna: 10, ala: 5, huacal: 3, rabadilla: 2, higado: 1, pata: 0.5, cabeza: 0.5 } },
];

function precioPorPieza(p: { pechuga: number; pierna: number; ala: number; huacal: number; rabadilla: number; higado: number; pata: number; cabeza: number }): number {
  return p.pechuga + 2 * p.pierna + 2 * p.ala + p.huacal + p.rabadilla + p.higado + 2 * p.pata + p.cabeza;
}

async function main() {
  // 1) Usuario OWNER
  // La contraseña del dueño SIEMPRE viene del entorno (.env): el repositorio es
  // público y no debe traer ninguna clave por defecto.
  const email = process.env.OWNER_EMAIL ?? "dueno@pollosjuacost.com";
  const password = process.env.OWNER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "Define OWNER_PASSWORD en tu .env (mínimo 12 caracteres) antes de correr el seed. Ejemplo: openssl rand -base64 18",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Dueño", passwordHash, role: "OWNER" },
  });
  console.log(`✓ OWNER: ${email}`);

  // 2) Catálogo de piezas
  for (const pt of PIECE_TYPES) {
    await prisma.pieceType.upsert({ where: { code: pt.code }, update: pt, create: pt });
  }
  console.log(`✓ ${PIECE_TYPES.length} tipos de pieza`);

  // 3) Umbrales del semáforo (configurables)
  await prisma.appSetting.upsert({ where: { key: "tier.green.max" }, update: {}, create: { key: "tier.green.max", value: "1" } });
  await prisma.appSetting.upsert({ where: { key: "tier.yellow.max" }, update: {}, create: { key: "tier.yellow.max", value: "5" } });

  // 4) Puestos, vendedoras y lista de precios inicial
  const effectiveFrom = new Date("2026-01-01");
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, zone: b.zone },
      create: { code: b.code, name: b.name, zone: b.zone, isActive: true },
    });

    const seller = await prisma.seller.findFirst({ where: { name: b.seller, branchId: branch.id } });
    if (!seller) {
      await prisma.seller.create({ data: { name: b.seller, branchId: branch.id, isActive: true } });
    }

    const pp = precioPorPieza(b.precios);
    const exists = await prisma.priceList.findFirst({ where: { branchId: branch.id, isActive: true } });
    if (!exists) {
      await prisma.priceList.create({
        data: {
          branchId: branch.id,
          effectiveFrom,
          isActive: true,
          precioPechuga: b.precios.pechuga,
          precioPierna: b.precios.pierna,
          precioAla: b.precios.ala,
          precioHuacal: b.precios.huacal,
          precioRabadilla: b.precios.rabadilla,
          precioHigado: b.precios.higado,
          precioPata: b.precios.pata,
          precioCabeza: b.precios.cabeza,
          precioPorPieza: pp,
          note: "Precios iniciales importados del Excel",
        },
      });
    }
  }
  console.log(`✓ ${BRANCHES.length} puestos con vendedora y lista de precios`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
