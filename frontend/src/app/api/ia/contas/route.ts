import { NextRequest } from "next/server";
import { autorizar } from "@/lib/ia/server";
import { carregarCerebro } from "@/lib/ia/cerebro";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const acesso = await autorizar(req, "admin");
  if (acesso.error) return acesso.error;
  const cerebro = await carregarCerebro(acesso.conta!);
  return Response.json(
    {
      disponivel: true,
      contas: [cerebro?.conta ?? { slug: acesso.conta, nome: acesso.conta }],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
