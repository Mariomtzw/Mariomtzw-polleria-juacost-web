// Prueba estática de n8n/: el prompt, la guía y los workflows exportados no llevan secretos ni números.
import fs from "node:fs";
import path from "node:path";

const N8N = path.join(process.cwd(), "n8n");
const WORKFLOWS = path.join(N8N, "workflows");
const DIGITS = /\d{10,}/;
const SECRET = /sk-ant-|sk-[A-Za-z0-9]{20,}|EAA[A-Za-z0-9]{20,}|Bearer [A-Za-z0-9]/;

/** Archivo de workflow → tipos de nodo obligatorios. Cada workflow nuevo se agrega aquí. */
const EXPECTED: Record<string, string[]> = {};

const read = (...p: string[]) => fs.readFileSync(path.join(N8N, ...p), "utf8");

function allFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? allFiles(full) : [full];
  });
}

/** Quita recursivamente `id` y `webhookId` (n8n los genera; pueden ser largos y numéricos). */
function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => k !== "id" && k !== "webhookId")
        .map(([k, v]) => [k, stripIds(v)]),
    );
  }
  return value;
}

describe("n8n/prompts/agente-sistema.md", () => {
  const prompt = read("prompts", "agente-sistema.md");

  it("nombra las 3 herramientas", () => {
    for (const tool of ["consultar_catalogo", "crear_pedido", "escalar_a_persona"]) expect(prompt).toContain(tool);
  });

  it("no contiene números de 10 dígitos o más", () => {
    expect(prompt).not.toMatch(DIGITS);
  });
});

describe("n8n/README.md", () => {
  const readme = read("README.md");

  it("documenta variables, plantillas e idioma", () => {
    for (const key of [
      "WEB_BASE_URL",
      "BOT_WEBHOOK_SECRET",
      "OWNER_WHATSAPP",
      "WHATSAPP_PHONE_NUMBER_ID",
      "pedido_nuevo",
      "atencion_humana",
      "es_MX",
    ]) {
      expect(readme).toContain(key);
    }
  });

  it("no contiene números de 10 dígitos o más", () => {
    expect(readme).not.toMatch(DIGITS);
  });
});

describe("secretos en n8n/", () => {
  it.each(allFiles(N8N).map((f) => [path.relative(N8N, f)]))("%s no contiene claves ni tokens", (rel) => {
    expect(read(rel)).not.toMatch(SECRET);
  });
});

describe("n8n/workflows/", () => {
  const files = fs.existsSync(WORKFLOWS) ? fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith(".json")) : [];

  it("cada workflow exportado está en EXPECTED", () => {
    const unknown = files.filter((f) => !(f in EXPECTED));
    expect(unknown).toEqual([]);
  });

  for (const file of files.filter((f) => f in EXPECTED)) it(`${file} es válido y sin secretos`, () => {
    const flow = JSON.parse(read("workflows", file));
    expect(Array.isArray(flow.nodes)).toBe(true);

    const types = (flow.nodes as { type: string }[]).map((n) => n.type);
    for (const type of EXPECTED[file]) expect(types).toContain(type);

    for (const node of flow.nodes as { credentials?: Record<string, unknown> }[]) {
      for (const cred of Object.values(node.credentials ?? {})) {
        expect(cred && typeof cred === "object" ? Object.keys(cred) : cred).toEqual(["name"]);
      }
    }

    expect(JSON.stringify(stripIds(flow))).not.toMatch(DIGITS);
  });
});
