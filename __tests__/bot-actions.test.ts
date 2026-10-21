// Protege las acciones del panel sobre los pedidos del bot y el puesto de recogida.
const assertOwner = jest.fn();
const revalidatePath = jest.fn();
const orderUpdateMany = jest.fn();
const branchFindFirst = jest.fn();
const appSettingUpsert = jest.fn();

jest.mock("@/lib/auth-guards", () => ({ assertOwner: () => assertOwner() }));
jest.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: { updateMany: (...a: unknown[]) => orderUpdateMany(...a) },
    branch: { findFirst: (...a: unknown[]) => branchFindFirst(...a) },
    appSetting: { upsert: (...a: unknown[]) => appSettingUpsert(...a) },
  },
}));

import { confirmOrder, cancelOrder, setBotPickupBranch } from "@/lib/actions/orders";

beforeEach(() => {
  jest.clearAllMocks();
  assertOwner.mockResolvedValue(undefined);
  orderUpdateMany.mockResolvedValue({ count: 1 });
});

describe("confirmOrder", () => {
  it("confirma un pedido PENDING después de assertOwner", async () => {
    expect(await confirmOrder("o1")).toEqual({ ok: true });
    expect(assertOwner.mock.invocationCallOrder[0]).toBeLessThan(orderUpdateMany.mock.invocationCallOrder[0]);
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: "o1", status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/pedidos");
  });

  it("si no cambia ninguna fila responde que ya no está pendiente", async () => {
    orderUpdateMany.mockResolvedValue({ count: 0 });
    expect(await confirmOrder("o1")).toEqual({ ok: false, error: "El pedido ya no está pendiente" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza un id vacío sin tocar la base", async () => {
    expect(await confirmOrder("")).toEqual({ ok: false, error: "Pedido inválido" });
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });
});

describe("cancelOrder", () => {
  it("cancela solo pedidos del bot PENDING o CONFIRMED", async () => {
    expect(await cancelOrder("o1")).toEqual({ ok: true });
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: "o1", source: { in: ["WEB", "WHATSAPP"] }, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED" },
    });
  });

  it("si no aplica responde que no se puede cancelar", async () => {
    orderUpdateMany.mockResolvedValue({ count: 0 });
    expect(await cancelOrder("o1")).toEqual({ ok: false, error: "El pedido no se puede cancelar" });
  });
});

describe("setBotPickupBranch", () => {
  it("con un puesto inactivo o inexistente no escribe", async () => {
    branchFindFirst.mockResolvedValue(null);
    expect(await setBotPickupBranch("b9")).toEqual({ ok: false, error: "Puesto no encontrado o inactivo" });
    expect(branchFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "b9", isActive: true } }));
    expect(appSettingUpsert).not.toHaveBeenCalled();
  });

  it("con un puesto activo guarda bot.pickupBranchId", async () => {
    branchFindFirst.mockResolvedValue({ id: "b1" });
    expect(await setBotPickupBranch("b1")).toEqual({ ok: true });
    expect(appSettingUpsert).toHaveBeenCalledWith({
      where: { key: "bot.pickupBranchId" },
      create: { key: "bot.pickupBranchId", value: "b1" },
      update: { value: "b1" },
    });
  });
});

describe("sin sesión de dueño", () => {
  it.each([
    ["confirmOrder", () => confirmOrder("o1")],
    ["cancelOrder", () => cancelOrder("o1")],
    ["setBotPickupBranch", () => setBotPickupBranch("b1")],
  ])("%s propaga el error de assertOwner y no llama Prisma", async (_name, run) => {
    assertOwner.mockRejectedValue(new Error("No autorizado"));
    await expect(run()).rejects.toThrow("No autorizado");
    expect(orderUpdateMany).not.toHaveBeenCalled();
    expect(branchFindFirst).not.toHaveBeenCalled();
    expect(appSettingUpsert).not.toHaveBeenCalled();
  });
});
