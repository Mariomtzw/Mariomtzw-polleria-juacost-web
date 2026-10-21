"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { SITE, WHATSAPP_PEDIDOS, whatsappUrl } from "@/lib/site";

// Chat del sitio público. Solo envía a /api/chat; el bot vive en n8n.

type Entry = { role: "user" | "bot"; text: string } | { role: "error"; text: string };

const SESSION_KEY = "pj-chat-session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_ERROR = "No pude responder ahora. Llámanos o escríbenos por WhatsApp.";
const GREETING = `¡Hola! Soy el asistente de Pollos Juacos't. Te ayudo con precios, horario y pedidos para recoger en ${SITE.address}. Usamos tu nombre y teléfono solo para tu pedido.`;

function getSessionId(): string {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored && UUID.test(stored)) return stored;
  } catch {}
  const id = crypto.randomUUID();
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {}
  return id;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef("");
  const openRef = useRef(false);
  const listEndRef = useRef<HTMLLIElement>(null);

  // Al abrir, foco en el campo; al cerrar, de vuelta al lanzador.
  useEffect(() => {
    if (open) textareaRef.current?.focus();
    else if (openRef.current) launcherRef.current?.focus();
    openRef.current = open;
  }, [open]);

  // Escape a nivel de documento: cierra aunque el foco esté en Enviar (deshabilitado) o fuera.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [entries, waiting]);

  if (pathname?.startsWith("/admin")) return null;

  async function send() {
    const message = draft.trim();
    if (!message || waiting) return;
    if (!sessionRef.current) sessionRef.current = getSessionId();
    setEntries((prev) => [...prev, { role: "user", text: message }]);
    setDraft("");
    setWaiting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionRef.current, message }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && typeof data.data?.reply === "string") {
        setEntries((prev) => [...prev, { role: "bot", text: data.data.reply }]);
      } else {
        setEntries((prev) => [...prev, { role: "error", text: typeof data?.error === "string" ? data.error : FALLBACK_ERROR }]);
      }
    } catch {
      setEntries((prev) => [...prev, { role: "error", text: FALLBACK_ERROR }]);
    } finally {
      setWaiting(false);
      // Nunca dejes el foco en el botón Enviar deshabilitado; si ya se cerró, no lo robes al lanzador.
      if (openRef.current) textareaRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send();
  }

  function onTextareaKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="site">
        <button
          ref={launcherRef}
          type="button"
          aria-expanded={open}
          aria-controls="pj-chat-panel"
          onClick={() => setOpen(true)}
          className={`fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.75rem)] z-50 inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-brand [--focus-ring:var(--color-brand-yellow)] md:right-6 md:bottom-[7.5rem] ${open ? "invisible" : ""}`}
        >
          <MessageCircle aria-hidden size={18} />
          Pregúntanos
        </button>

        <AnimatePresence>
          {open ? (
            <motion.section
              id="pj-chat-panel"
              role="dialog"
              aria-modal="false"
              aria-labelledby="pj-chat-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border border-black/5 bg-white/92 text-brand-red-dark shadow-brand backdrop-blur-xl [--focus-ring:var(--color-brand-red)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[560px] sm:w-[380px] sm:rounded-3xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
                <h2 id="pj-chat-title" className="text-base font-bold tracking-tight text-brand-red-dark">
                  Asistente de Pollos Juacos&apos;t
                </h2>
                <button
                  type="button"
                  aria-label="Cerrar chat"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-red-dark hover:bg-black/5"
                >
                  <X aria-hidden size={18} />
                </button>
              </header>

              <ol aria-live="polite" aria-busy={waiting} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm">
                <li className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-brand-yellow-light px-3.5 py-2.5 text-brand-red-dark">
                  {GREETING}
                </li>
                {entries.map((entry, i) =>
                  entry.role === "error" ? (
                    <li key={i} className="max-w-[85%] space-y-2 rounded-2xl border border-brand-red/20 bg-white px-3.5 py-2.5 text-brand-red-dark">
                      <p>{entry.text}</p>
                      <p>
                        Llámanos:{" "}
                        {SITE.phones.map((p, j) => (
                          <span key={p.tel}>
                            {j > 0 ? " · " : null}
                            <a href={`tel:${p.tel}`} className="font-semibold whitespace-nowrap underline underline-offset-2">
                              {p.label}
                            </a>
                          </span>
                        ))}
                      </p>
                      <a
                        href={whatsappUrl("¡Hola! Vengo del chat del sitio.", WHATSAPP_PEDIDOS)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block font-semibold underline underline-offset-2"
                      >
                        Escríbenos por WhatsApp ›
                      </a>
                    </li>
                  ) : (
                    <li
                      key={i}
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 ${
                        entry.role === "user"
                          ? "ml-auto bg-brand-red text-white"
                          : "bg-brand-yellow-light text-brand-red-dark"
                      }`}
                    >
                      {entry.text}
                    </li>
                  ),
                )}
                {waiting ? <li className="text-brand-red-dark/80">Escribiendo…</li> : null}
                <li ref={listEndRef} aria-hidden className="h-px" />
              </ol>

              <form onSubmit={onSubmit} className="border-t border-black/10 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <label htmlFor="pj-chat-input" className="mb-1.5 block text-xs font-semibold text-brand-red-dark">
                  Escribe tu mensaje
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    id="pj-chat-input"
                    rows={2}
                    maxLength={500}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onTextareaKey}
                    className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-black/15 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none focus:border-brand-red sm:text-sm"
                  />
                  <button
                    type="submit"
                    aria-label="Enviar"
                    disabled={waiting || !draft.trim()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-white disabled:opacity-40"
                  >
                    <Send aria-hidden size={18} />
                  </button>
                </div>
              </form>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
