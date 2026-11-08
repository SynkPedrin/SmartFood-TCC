import { NextRequest } from "next/server";
import { loadSnapshot } from "@/lib/ia/context";
import { diagnosticar } from "@/lib/ia/diagnostico";
import { autorizar, authHeaders } from "@/lib/ia/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Pontos de atenção do restaurante agora, por regras: sem modelo, instantâneo. */
export async function GET(req: NextRequest) {
  const acesso = await autorizar(req, "admin");
  if (acesso.error) return acesso.error;
  const snapshot = await loadSnapshot("admin", authHeaders(req));
  if (!snapshot.online)
    return Response.json({ error: "Dados do restaurante indisponíveis." }, { status: 503 });
  return Response.json(
    { alertas: diagnosticar(snapshot), atualizado_em: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
