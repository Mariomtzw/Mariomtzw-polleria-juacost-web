"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Globe, MessageCircle, Save, XCircle } from "lucide-react";
import { confirmOrder, cancelOrder, setBotPickupBranch } from "@/lib/actions/orders";
import type { BotOrderRow } from "@/lib/queries/bot";
import { formatDateShort } from "@/lib/dates";
import { currency } from "@/components/admin/charts/chart-theme";
import { SectionTitle } from "@/components/admin/ui/PageHeader";
import { Notice } from "@/components/admin/ui/Notice";
import { ConfirmDelete } from "@/components/admin/ui/ConfirmDelete";

interface Option {
  id: string;
  name: string;
}

const SOURCE = {
  WEB: { Icon: Globe, label: "Web" },
  WHATSAPP: { Icon: MessageCircle, label: "WhatsApp" },
} as const;

const STATUS = {
  PENDING: { Icon: Clock, label: "Pendiente", tone: "text-amber-300" },
  CONFIRMED: { Icon: CheckCircle2, label: "Confirmado", tone: "text-emerald-300" },
  CANCELLED: { Icon: XCircle, label: "Cancelado", tone: "text-neutral-400" },
} as const;

// Pedidos que llegan del bot (web y WhatsApp) y el puesto donde se recogen.
export function BotOrders({
  orders,
  branches,
  pickupBranchId,
}: {
  orders: BotOrderRow[];
  branches: Option[];
  pickupBranchId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, okText: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await action();
      setMsg(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const branchId = new FormData(e.currentTarget).get("branchId");
    if (typeof branchId !== "string" || !branchId) return;
    run(() => setBotPickupBranch(branchId), "Puesto de recogida guardado.");
  }

  return (
    <section aria-labelledby="pedidos-bot" className="space-y-3">
      <SectionTitle id="pedidos-bot">Pedidos del bot</SectionTitle>

      <form onSubmit={onSubmit} className="material rounded-3xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label className="field-label" htmlFor="bot-pickup-branch">Puesto de recogida del bot</label>
            <select id="bot-pickup-branch" name="branchId" required className="field" defaultValue={pickupBranchId ?? ""}>
              {pickupBranchId ? null : <option value="" disabled>Selecciona…</option>}
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={pending} className="btn btn-secondary">
            <Save aria-hidden size={16} /> Guardar
          </button>
        </div>
        {pickupBranchId ? null : (
          <p className="mt-3 text-sm text-neutral-400">El bot no cotiza hasta que elijas un puesto.</p>
        )}
      </form>

      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}

      {orders.length === 0 ? (
        <p className="text-sm text-neutral-400">Aún no hay pedidos del bot.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {orders.map((o) => {
            const source = SOURCE[o.source];
            const status = STATUS[o.status];
            return (
              <li key={o.id} className="material rounded-3xl p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-mono font-medium text-white">#{o.folio}</span>
                  <span className="inline-flex items-center gap-1 text-neutral-300">
                    <source.Icon aria-hidden size={14} /> {source.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 ${status.tone}`}>
                    <status.Icon aria-hidden size={14} /> {status.label}
                  </span>
                </div>

                <p className="mt-2 break-words text-white">
                  {o.customerName ?? "Sin nombre"}
                  {o.customerPhone ? (
                    <>
                      {" · "}
                      <a href={`tel:${o.customerPhone}`} className="text-orange-300 underline-offset-2 hover:underline">
                        {o.customerPhone}
                      </a>
                    </>
                  ) : null}
                </p>

                <ul className="mt-2 space-y-0.5 text-sm text-neutral-300">
                  {o.lines.map((l) => (
                    <li key={l.code}>
                      {l.cantidad} × {l.label} — {currency(l.subtotal)}
                    </li>
                  ))}
                </ul>

                <p className="mt-2 text-sm text-neutral-300">
                  <span className="font-medium text-white">Total {currency(o.total)}</span>
                  {" · "}Recoge: {formatDateShort(o.pickupDate)}
                </p>
                {o.notes ? <p className="mt-1 break-words text-sm text-neutral-400">{o.notes}</p> : null}

                {o.status === "CANCELLED" ? null : (
                  <div className="mt-3 flex items-center gap-2">
                    {o.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => confirmOrder(o.id), `Pedido ${o.folio} confirmado.`)}
                        className="btn btn-primary btn-sm"
                      >
                        Confirmar
                      </button>
                    ) : null}
                    <ConfirmDelete
                      label={`Cancelar pedido ${o.folio}`}
                      confirmText="¿Cancelar?"
                      disabled={pending}
                      onConfirm={() => run(() => cancelOrder(o.id), `Pedido ${o.folio} cancelado.`)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
