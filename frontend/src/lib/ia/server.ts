import { NextRequest } from "next/server";
export const API = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");
export function authHeaders(req: NextRequest): Record<string, string> {
  const value = req.headers.get("authorization");
  return value && /^Token [a-f0-9]{40}$/.test(value)
    ? { Authorization: value }
    : {};
}
export async function autorizar(
  req: NextRequest,
  mode: "admin" | "totem",
  conta?: string,
) {
  try {
    const res = await fetch(`${API}/ia/acesso/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(req) },
      body: JSON.stringify({ mode, conta }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!res.ok)
      return {
        error: Response.json(
          { error: data.error || "Acesso ao assistente indisponível." },
          { status: res.status },
        ),
      };
    return { conta: data.conta as string };
  } catch {
    return {
      error: Response.json(
        { error: "Servidor indisponível. Tente novamente em instantes." },
        { status: 503 },
      ),
    };
  }
}
export async function lerJSON(
  req: NextRequest,
  limite = 40000,
): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("content-length") || 0) > limite) return null;
  const texto = await req.text();
  if (texto.length > limite) return null;
  try {
    const data = JSON.parse(texto);
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : null;
  } catch {
    return null;
  }
}
