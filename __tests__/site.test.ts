// Protege el enlace de WhatsApp del sitio y el número de pedidos del bot.
import { whatsappUrl } from "@/lib/site";

const original = process.env.NEXT_PUBLIC_WHATSAPP_BOT;

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_BOT;
  else process.env.NEXT_PUBLIC_WHATSAPP_BOT = original;
});

function pedidosWith(value: string): string {
  process.env.NEXT_PUBLIC_WHATSAPP_BOT = value;
  let result = "";
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    result = require("@/lib/site").WHATSAPP_PEDIDOS;
  });
  return result;
}

describe("whatsappUrl", () => {
  it("con un argumento usa el número del sitio, como antes", () => {
    expect(whatsappUrl("Hola & adiós")).toBe("https://wa.me/522283576092?text=" + encodeURIComponent("Hola & adiós"));
  });

  it("con `to` usa ese número", () => {
    expect(whatsappUrl("Hola", "522280000000")).toBe("https://wa.me/522280000000?text=Hola");
  });
});

describe("WHATSAPP_PEDIDOS", () => {
  it("usa NEXT_PUBLIC_WHATSAPP_BOT si trae exactamente 12 dígitos", () => {
    expect(pedidosWith("522280000000")).toBe("522280000000");
  });

  it.each(["5212280000000", "abc", ""])("con %p vuelve al número del sitio", (value) => {
    expect(pedidosWith(value)).toBe("522283576092");
  });
});
