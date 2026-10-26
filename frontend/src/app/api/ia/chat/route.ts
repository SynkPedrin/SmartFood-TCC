import { NextRequest } from "next/server";
import { loadSnapshot, snapshotToContext } from "@/lib/ia/context";
import { carregarCerebro, cerebroToContext } from "@/lib/ia/cerebro";
import { systemPrompt } from "@/lib/ia/prompts";
import { autorizar, authHeaders, lerJSON } from "@/lib/ia/server";
import { respostaLocal } from "@/lib/ia/local";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
export async function POST(req: NextRequest) {
  const body = await lerJSON(req);
  if (
    !body ||
    !["admin", "totem"].includes(String(body.mode)) ||
    !Array.isArray(body.messages) ||
    (body.conta !== undefined && typeof body.conta !== "string")
  )
    return Response.json(
      { error: "Formato da conversa inválido." },
      { status: 400 },
    );
  const mode = body.mode === "totem" ? "totem" : "admin";
  const acesso = await autorizar(req, mode, body.conta as string | undefined);
  if (acesso.error) return acesso.error;
  const history: ChatMessage[] = [];
  for (const m of body.messages.slice(-12)) {
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      m.content.length > 3000
    )
      return Response.json(
        { error: "Mensagens devem ter até 3.000 caracteres." },
        { status: 400 },
      );
    if (m.content.trim()) history.push(m);
  }
  if (!history.length || history[history.length - 1].role !== "user")
    return Response.json({ error: "Envie uma pergunta." }, { status: 400 });
  const ids = Array.isArray(body.produtoIds)
    ? body.produtoIds
        .filter((id): id is number => Number.isInteger(id))
        .slice(0, 20000)
    : undefined;
  const [snapshot, cerebro] = await Promise.all([
    loadSnapshot(mode, authHeaders(req), ids),
    carregarCerebro(acesso.conta!),
  ]);
  // O totem nunca recebe notas internas, operação ou memória da equipe.
  const memoria = cerebro
    ? mode === "admin"
      ? cerebroToContext(cerebro)
      : `Nome do restaurante: ${cerebro.conta.nome}. Tom: ${cerebro.conta.iaTom || "acolhedor"}.`
    : null;
  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Cerebro": acesso.conta!,
    "X-Dados": snapshot.falhas.length ? "parcial" : "online",
  };
  const local = () =>
    new Response(
      respostaLocal(
        mode,
        history[history.length - 1].content,
        snapshot,
        history,
      ),
      { headers: { ...headers, "X-Assistente": "local" } },
    );
  if (!process.env.GROQ_API_KEY || !snapshot.online) return local();
  let groqRes: Response;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt(mode, snapshotToContext(snapshot), memoria),
          },
          ...history,
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: true,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    return local();
  }
  if (!groqRes.ok || !groqRes.body) return local();
  const encoder = new TextEncoder(),
    decoder = new TextDecoder();
  const reader = groqRes.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      const processar = (line: string) => {
        if (!line.trim().startsWith("data:")) return;
        const data = line.trim().slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (typeof delta === "string")
            controller.enqueue(encoder.encode(delta));
        } catch {
          /* keep-alive */
        }
      };
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(processar);
        }
        buffer += decoder.decode();
        if (buffer) processar(buffer);
        controller.close();
      } catch {
        controller.error(
          new Error("A conexão com o assistente foi interrompida."),
        );
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
  return new Response(stream, {
    headers: { ...headers, "X-Assistente": "groq" },
  });
}
