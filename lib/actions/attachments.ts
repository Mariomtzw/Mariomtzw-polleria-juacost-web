"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/sales";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (límite práctico de subida por Server Action)
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/**
 * Sube un archivo (ticket, foto, reporte) a Vercel Blob y lo enlaza como
 * Attachment, opcionalmente asociado a una venta (saleId).
 *
 * Para archivos pequeños (<4 MB). Para archivos grandes usa el flujo de
 * client-upload (ver app/api/blob/upload/route.ts).
 * Requiere BLOB_READ_WRITE_TOKEN en el entorno.
 */
export async function uploadAttachment(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  const session = await assertOwner();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un archivo válido." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo supera 4 MB. Usa la subida directa (client upload)." };
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return { ok: false, error: `Tipo no permitido: ${file.type}` };
  }

  const saleIdRaw = formData.get("saleId");
  const saleId = typeof saleIdRaw === "string" && saleIdRaw.length > 0 ? saleIdRaw : null;

  // Sube a Blob con nombre único (evita colisiones).
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const blob = await put(`attachments/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Enlaza al usuario (dueño) por email de la sesión.
  const owner = await prisma.user.findUnique({
    where: { email: session.user.email ?? "" },
    select: { id: true },
  });
  if (!owner) return { ok: false, error: "No se encontró el usuario de la sesión." };

  const attachment = await prisma.attachment.create({
    data: {
      url: blob.url,
      filename: file.name,
      contentType: file.type || null,
      sizeBytes: file.size,
      uploadedById: owner.id,
      saleId,
    },
    select: { id: true, url: true },
  });

  if (saleId) revalidatePath("/admin/ventas");
  return { ok: true, data: attachment };
}

/** Registra en la BD un archivo ya subido por client-upload (recibe la URL). */
export async function linkUploadedBlob(input: {
  url: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  saleId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const session = await assertOwner();
  const owner = await prisma.user.findUnique({
    where: { email: session.user.email ?? "" },
    select: { id: true },
  });
  if (!owner) return { ok: false, error: "No se encontró el usuario de la sesión." };

  const attachment = await prisma.attachment.create({
    data: {
      url: input.url,
      filename: input.filename,
      contentType: input.contentType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      uploadedById: owner.id,
      saleId: input.saleId ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/admin/ventas");
  return { ok: true, data: attachment };
}
