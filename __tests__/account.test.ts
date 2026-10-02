// Protege la recuperación de contraseña: enlaces firmados, reglas de la
// contraseña y la forma del envío de correo.
import { passwordProblem, PASSWORD_MIN_LENGTH } from "@/lib/account/password-policy";
import { RESET_TOKEN_TTL_MS, createResetToken, parseResetToken, passwordVersion, verifyResetToken } from "@/lib/account/tokens";
import { passwordResetMail, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/app-url";

const secret = "secreto-de-prueba-0123456789";
const userId = "cku1234567890abcdef";
const hashA = "$2a$12$abcdefghijklmnopqrstuuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const hashB = "$2a$12$abcdefghijklmnopqrstuuBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const now = Date.UTC(2026, 9, 2, 3, 0, 0);

describe("enlace de recuperación", () => {
  const token = createResetToken({ userId, passwordHash: hashA, secret, now });

  it("es válido dentro de los 30 minutos y dice de qué usuario es", () => {
    expect(parseResetToken(token)?.userId).toBe(userId);
    expect(verifyResetToken({ token, passwordHash: hashA, secret, now: now + RESET_TOKEN_TTL_MS - 1000 })).toBe("ok");
  });

  it("vence después de 30 minutos", () => {
    expect(verifyResetToken({ token, passwordHash: hashA, secret, now: now + RESET_TOKEN_TTL_MS + 1000 })).toBe("expired");
  });

  it("es de un solo uso: al cambiar la contraseña deja de servir", () => {
    expect(verifyResetToken({ token, passwordHash: hashB, secret, now })).toBe("invalid");
  });

  it("no se puede fabricar sin el secreto ni alargar su vigencia", () => {
    expect(verifyResetToken({ token, passwordHash: hashA, secret: "otro-secreto", now })).toBe("invalid");

    const [id, , sig] = token.split(".");
    const later = (now + 10 * RESET_TOKEN_TTL_MS).toString(36);
    expect(verifyResetToken({ token: `${id}.${later}.${sig}`, passwordHash: hashA, secret, now })).toBe("invalid");

    const otherUser = Buffer.from("otro-usuario").toString("base64url");
    expect(verifyResetToken({ token: `${otherUser}.${token.split(".")[1]}.${sig}`, passwordHash: hashA, secret, now })).toBe("invalid");
  });

  it("rechaza textos que no son un enlace", () => {
    for (const bad of ["", "abc", "a.b", "a.b.c.d", "../../etc.passwd.x", "x".repeat(600)]) {
      expect(verifyResetToken({ token: bad, passwordHash: hashA, secret, now })).toBe("invalid");
    }
  });
});

describe("huella de contraseña de la sesión", () => {
  it("cambia cuando cambia la contraseña y no revela el hash", () => {
    expect(passwordVersion(hashA)).toBe(passwordVersion(hashA));
    expect(passwordVersion(hashA)).not.toBe(passwordVersion(hashB));
    expect(hashA).not.toContain(passwordVersion(hashA));
  });
});

describe("reglas de la contraseña", () => {
  it("acepta una frase larga", () => {
    expect(passwordProblem("pollo fresco cada mañana")).toBeNull();
  });

  it("rechaza las cortas, las comunes, las repetitivas y el propio correo", () => {
    expect(passwordProblem("a".repeat(PASSWORD_MIN_LENGTH - 1))).toMatch(/al menos/);
    expect(passwordProblem("1234567890")).toMatch(/común/);
    expect(passwordProblem("CambiaEstaClave123")).toMatch(/común/);
    expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/variada/);
    expect(passwordProblem("dueno@ejemplo.com", "Dueno@Ejemplo.com")).toMatch(/correo/);
    expect(passwordProblem("ñ".repeat(40))).toMatch(/larga|variada/); // 80 bytes: bcrypt la truncaría
  });
});

describe("correo", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  it("el correo de recuperación lleva el enlace y cuánto dura", () => {
    const mail = passwordResetMail("dueno@ejemplo.com", "https://sitio.test/admin/restablecer?token=a.b.c", 30);
    expect(mail.text).toContain("https://sitio.test/admin/restablecer?token=a.b.c");
    expect(mail.text).toContain("30 minutos");
    expect(mail.html).toContain('href="https://sitio.test/admin/restablecer?token=a.b.c"');
  });

  it("envía por la API de Resend con la clave y el remitente configurados", async () => {
    process.env.RESEND_API_KEY = "re_prueba";
    process.env.MAIL_FROM = "Panel <panel@ejemplo.com>";
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 200 }));

    const result = await sendMail({ to: "dueno@ejemplo.com", subject: "Hola", text: "t", html: "<p>t</p>" });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_prueba");
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "Panel <panel@ejemplo.com>",
      to: ["dueno@ejemplo.com"],
      subject: "Hola",
      text: "t",
      html: "<p>t</p>",
    });
  });

  it("reporta el motivo cuando Resend rechaza el envío", async () => {
    process.env.RESEND_API_KEY = "re_prueba";
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 403, name: "validation_error", message: "You can only send testing emails to your own email address" }), { status: 403 }),
    );
    const result = await sendMail({ to: "otra@ejemplo.com", subject: "s", text: "t", html: "h" });
    expect(result).toMatchObject({ ok: false, reason: "rejected" });
    expect(result.ok === false && result.detail).toContain("your own email address");
  });

  it("en producción, sin clave, no envía ni imprime el correo", async () => {
    delete process.env.RESEND_API_KEY;
    (process.env as Record<string, string>).NODE_ENV = "production";
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    const result = await sendMail({ to: "a@b.c", subject: "s", text: "enlace secreto", html: "h" });
    expect(result).toMatchObject({ ok: false, reason: "not_configured" });
    expect(info).not.toHaveBeenCalled();
  });
});

describe("dirección del sitio para los enlaces", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("usa APP_URL, después el dominio de producción de Vercel y al final localhost", () => {
    process.env.APP_URL = "https://pollosjuacost.mx/";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "proyecto.vercel.app";
    expect(appUrl()).toBe("https://pollosjuacost.mx");
    delete process.env.APP_URL;
    expect(appUrl()).toBe("https://proyecto.vercel.app");
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(appUrl()).toMatch(/^http:\/\/localhost:/);
  });
});
