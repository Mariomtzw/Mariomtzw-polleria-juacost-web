import type { Metadata } from "next";
import { MailQuestion } from "lucide-react";
import { AuthShell } from "@/components/admin/account/AuthShell";
import { RecoverForm } from "@/components/admin/account/RecoverForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

// Pantalla pública (sin sesión): pedir por correo el enlace para una contraseña nueva.
export default function RecuperarPage() {
  return (
    <AuthShell
      icon={MailQuestion}
      title="Recuperar contraseña"
      subtitle="Panel privado del dueño"
      back={{ href: "/admin/login", label: "Volver a entrar" }}
    >
      <RecoverForm />
    </AuthShell>
  );
}
