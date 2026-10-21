// Prueba estática de n8n/: el prompt, la guía y los workflows exportados no llevan secretos ni números.
import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";
import { signPayload, verifySignature } from "@/lib/bot/signature";

const N8N = path.join(process.cwd(), "n8n");
const WORKFLOWS = path.join(N8N, "workflows");
const DIGITS = /\d{10,}/;
const SECRET = /sk-ant-|sk-[A-Za-z0-9]{20,}|EAA[A-Za-z0-9]{20,}|Bearer [A-Za-z0-9]/;

/** Archivo de workflow → tipos de nodo obligatorios. Cada workflow nuevo se agrega aquí. */
const EXPECTED: Record<string, string[]> = {
  "herramientas.json": [
    "n8n-nodes-base.executeWorkflowTrigger",
    "n8n-nodes-base.switch",
    "n8n-nodes-base.set",
    "n8n-nodes-base.crypto",
    "n8n-nodes-base.httpRequest",
    "n8n-nodes-base.whatsApp",
  ],
  "agente.json": [
    "n8n-nodes-base.executeWorkflowTrigger",
    "@n8n/n8n-nodes-langchain.agent",
    "@n8n/n8n-nodes-langchain.lmChatAnthropic",
    "@n8n/n8n-nodes-langchain.memoryPostgresChat",
    "@n8n/n8n-nodes-langchain.toolWorkflow",
  ],
  "web-chat.json": [
    "n8n-nodes-base.webhook",
    "n8n-nodes-base.set",
    "n8n-nodes-base.crypto",
    "n8n-nodes-base.if",
    "n8n-nodes-base.executeWorkflow",
    "n8n-nodes-base.respondToWebhook",
  ],
};

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

type FlowNode = { name: string; type: string; parameters: Record<string, unknown> };

describe("agente.json", () => {
  const raw = read("workflows", "agente.json");
  const nodes: FlowNode[] = JSON.parse(raw).nodes;

  it("lleva el prompt idéntico al de n8n/prompts/agente-sistema.md", () => {
    const agent = nodes.find((n) => n.type === "@n8n/n8n-nodes-langchain.agent");
    const options = agent?.parameters.options as { systemMessage: string };
    expect(options.systemMessage.trim()).toBe(read("prompts", "agente-sistema.md").trim());
  });

  it("usa claude-sonnet-5-5 y exactamente las 3 herramientas", () => {
    expect(raw).toContain("claude-sonnet-5-5");
    const tools = nodes.filter((n) => n.type === "@n8n/n8n-nodes-langchain.toolWorkflow").map((n) => n.name);
    expect(tools.sort()).toEqual(["consultar_catalogo", "crear_pedido", "escalar_a_persona"]);
  });
});

describe("herramientas.json", () => {
  it("firma las llamadas a la web y avisa al dueño con las plantillas", () => {
    const raw = read("workflows", "herramientas.json");
    for (const text of [
      "$vars.BOT_WEBHOOK_SECRET",
      "/api/bot/catalogo",
      "/api/bot/pedidos",
      "X-Hub-Signature-256",
      "X-Bot-Timestamp",
      "pedido_nuevo",
      "atencion_humana",
      "$vars.OWNER_WHATSAPP",
    ]) {
      expect(raw).toContain(text);
    }
  });
});

describe("web-chat.json", () => {
  const raw = read("workflows", "web-chat.json");
  const nodes: FlowNode[] = JSON.parse(raw).nodes;

  it("expone el webhook POST pollos-chat que responde desde un nodo", () => {
    const webhook = nodes.find((n) => n.type === "n8n-nodes-base.webhook");
    expect(webhook?.parameters).toMatchObject({ path: "pollos-chat", httpMethod: "POST", responseMode: "responseNode" });
  });

  it("verifica la firma y responde 401 si no coincide", () => {
    const responders = nodes.filter((n) => n.type === "n8n-nodes-base.respondToWebhook");
    expect(responders).toHaveLength(2);
    expect(responders.filter((n) => JSON.stringify(n.parameters).includes("401"))).toHaveLength(1);
    for (const text of ["$vars.BOT_WEBHOOK_SECRET", "x-hub-signature-256", "x-bot-timestamp", "JSON.stringify($json.body)", "300"]) {
      expect(raw).toContain(text);
    }
  });
});

describe("contrato de firma n8n ↔ web (calculado)", () => {
  const secret = "secreto-de-prueba";
  const ts = "1760990000";

  it("n8n → web: el cuerpo del nodo «Firmar pedido» firmado como «HMAC pedido» pasa verifySignature", () => {
    const input = {
      externalId: "wa:wamid.PRUEBA",
      channel: "whatsapp",
      customerName: "Ana López",
      customerPhone: "5212280000",
      items: '[{"code":"POLLO_ENTERO","cantidad":2}]',
      notes: "",
    };
    // Misma expresión que el nodo «Firmar pedido».
    const body = JSON.stringify({
      externalId: input.externalId,
      source: input.channel === "whatsapp" ? "WHATSAPP" : "WEB",
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      items: JSON.parse(input.items || "[]"),
      notes: input.notes || undefined,
    });
    const header = "sha256=" + createHmac("sha256", secret).update(ts + "." + body).digest("hex");
    expect(verifySignature({ secret, signatureHeader: header, timestampHeader: ts, body, nowSeconds: Number(ts) })).toBe(true);
    expect(body).not.toContain("notes");
  });

  it("web → n8n: la cadena de «Preparar firma» da la misma firma que signPayload", () => {
    const body = JSON.stringify({
      sessionId: "web:00000000-0000-4000-8000-000000000000",
      messageId: "00000000-0000-4000-8000-000000000001",
      message: '¿Tienen pollo? Dijo "sí" — gracias',
    });
    const n8nString = ts + "." + JSON.stringify(JSON.parse(body));
    expect("sha256=" + createHmac("sha256", secret).update(n8nString).digest("hex")).toBe(signPayload(secret, ts, body));
  });
});
