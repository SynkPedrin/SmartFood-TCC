import { NextRequest } from "next/server";
import { API, autorizar, authHeaders, lerJSON } from "@/lib/ia/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await lerJSON(req, 10000);
  if (
    !body ||
    typeof body.texto !== "string" ||
    !body.texto.trim() ||
    body.texto.length > 2000 ||
    typeof body.conta !== "string"
  )
    return Response.json(
      { error: "Informe a conta e um texto de até 2.000 caracteres." },
      { status: 400 },
    );
  const acesso = await autorizar(req, "admin", body.conta);
  if (acesso.error) return acesso.error;
  try {
    const res = await fetch(`${API}/ia/memorias/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(req) },
      body: JSON.stringify({ conta: acesso.conta, texto: body.texto.trim() }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(
      res.ok
        ? { ok: true, conta: acesso.conta, id: data.id }
        : {
            error:
              data.error ||
              data.texto?.[0] ||
              "Não foi possível salvar a memória.",
          },
      { status: res.status },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível salvar. Tente novamente." },
      { status: 503 },
    );
  }
}
