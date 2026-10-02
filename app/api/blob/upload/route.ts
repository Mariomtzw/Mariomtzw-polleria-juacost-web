import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { assertOwner } from "@/lib/auth-guards";

/**
 * Ruta para SUBIDA DIRECTA (client upload) hacia Vercel Blob.
 * Sirve para archivos grandes (>4 MB) que no pueden pasar por un Server Action.
 *
 * Flujo:
 *  1) El cliente pide un token a esta ruta (onBeforeGenerateToken valida OWNER).
 *  2) El navegador sube el archivo directo a Blob con ese token.
 *  3) Al terminar, se registra el Attachment con linkUploadedBlob() en el cliente.
 *
 * Requiere BLOB_READ_WRITE_TOKEN en el entorno.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Solo el dueño puede obtener token de subida.
        await assertOwner();
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // El registro en BD lo hace el cliente vía linkUploadedBlob() tras subir.
        // (Aquí no hay sesión disponible: este callback lo llama Vercel Blob.)
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
