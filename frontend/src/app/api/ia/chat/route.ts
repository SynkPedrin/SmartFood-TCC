import { NextRequest } from "next/server";
import { loadSnapshot, snapshotToContext } from "@/lib/ia/context";
import { carregarCerebro, cerebroToContext } from "@/lib/ia/cerebro";
import { nivelDaPergunta, systemPrompt } from "@/lib/ia/prompts";
import { diagnosticar, diagnosticoToContext } from "@/lib/ia/diagnostico";
import { respostaRapida } from "@/lib/ia/rapido";
import { autorizar, authHeaders, lerJSON } from "@/lib/ia/server";
import { combinacoes, orcamento, respostaLocal } from "@/lib/ia/local";
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
  const pergunta = history[history.length - 1].content;
  const nivel = nivelDaPergunta(pergunta);
  // O totem nunca recebe notas internas, operação ou memória da equipe.
  const memoria = cerebro
    ? mode === "admin"
      ? cerebroToContext(cerebro, { sistema: nivel.tecnica })
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
  if (!snapshot.online) return local();
  const alertas = mode === "admin" ? diagnosticar(snapshot) : [];
  // Pergunta de um dado só sai direto do banco, em milissegundos e sem erro de conta.
  const rapida = respostaRapida(mode, pergunta, snapshot, alertas);
  if (rapida)
    return new Response(rapida, {
      headers: { ...headers, "X-Assistente": "dados", "X-Nivel": "instantanea" },
    });
  // Com orçamento, o modelo só enxerga o que cabe nele: instrução no prompt não
  // impedia modelos pequenos de citar itens mais caros.
  const limite =
    mode === "totem" ? orcamento(pergunta) : null;
  const visivel =
    limite === null
      ? snapshot
      : {
          ...snapshot,
          produtos: snapshot.produtos.filter((p) => Number(p.preco) <= limite),
        };
  const mensagens = [
    {
      role: "system",
      content: systemPrompt(
        mode,
        snapshotToContext(visivel) +
          (limite === null
            ? ""
            : `\nCOMBINAÇÕES QUE CABEM NO ORÇAMENTO DE ${limite} REAIS (comida + bebida, total já somado):\n` +
              (combinacoes(visivel.produtos, limite).join("\n") ||
                "nenhuma combinação de comida e bebida cabe neste valor")) +
          (mode === "admin" ? `\n${diagnosticoToContext(alertas)}` : ""),
        memoria,
      ),
    },
    ...history,
  ];
  // Ollama é o motor principal; a Groq entra só se estiver configurada e o Ollama falhar.
  const lista = motores();
  for (let i = 0; i < lista.length; i++) {
    const motor = lista[i];
    // Com reserva, não vale esperar muito: 20 s sem a primeira palavra e passa adiante.
    const prazo = i < lista.length - 1 ? 20_000 : 45_000;
    const res = await chamar(motor, mensagens, nivel.maxTokens, prazo);
    if (res)
      return new Response(traduzir(motor, res), {
        headers: { ...headers, "X-Assistente": motor.nome, "X-Nivel": nivel.nivel },
      });
  }
  return local();
}

interface Motor {
  nome: "ollama" | "groq";
  url: string;
  modelo: string;
  chave?: string;
}

function motores(): Motor[] {
  const lista: Motor[] = [];
  const ollama = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  if (process.env.OLLAMA_MODEL || process.env.OLLAMA_URL)
    lista.push({
      nome: "ollama",
      url: `${ollama.replace(/\/$/, "")}/api/chat`,
      modelo: process.env.OLLAMA_MODEL || "qwen3.5:9b",
      // Só o Ollama Cloud (https://ollama.com) exige chave; o local não.
      chave: process.env.OLLAMA_API_KEY,
    });
  if (process.env.GROQ_API_KEY)
    lista.push({
      nome: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      modelo: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      chave: process.env.GROQ_API_KEY,
    });
  return lista;
}

function corpo(motor: Motor, messages: unknown[], maxTokens: number) {
  if (motor.nome === "ollama")
    return {
      model: motor.modelo,
      messages,
      stream: true,
      // Sem "thinking": o modelo responde direto em vez de raciocinar antes.
      think: false,
      // O contexto padrão do Ollama (4k) cortaria o cérebro e o cardápio.
      // O teto por nível mantém análises dentro do limite de 60 s da Vercel.
      options: { num_ctx: 16384, temperature: 0.2, num_predict: maxTokens },
      keep_alive: "2h",
    };
  return {
    model: motor.modelo,
    // Modelos de raciocínio gastam o max_tokens pensando; esforço baixo deixa espaço para a resposta.
    ...(motor.modelo.startsWith("openai/gpt-oss")
      ? { reasoning_effort: "low", include_reasoning: false }
      : {}),
    messages,
    temperature: 0.2,
    // Modelos de raciocínio contam o raciocínio no teto: folga para não cortar a resposta.
    max_tokens: maxTokens + 400,
    stream: true,
  };
}

async function chamar(
  motor: Motor,
  messages: unknown[],
  maxTokens: number,
  prazoMs: number,
): Promise<ReadableStream<Uint8Array> | null> {
  // O prazo vale até a primeira resposta; o stream em si pode durar mais.
  const prazo = new AbortController();
  const timer = setTimeout(() => prazo.abort(), prazoMs);
  try {
    const res = await fetch(motor.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(motor.chave ? { Authorization: `Bearer ${motor.chave}` } : {}),
      },
      body: JSON.stringify(corpo(motor, messages, maxTokens)),
      signal: prazo.signal,
    });
    if (res.ok && res.body) return res.body;
    // Sem isto a queda para o próximo motor fica invisível (ex.: 413 por limite de tokens).
    console.error(
      `[ia] ${motor.nome} ${res.status} (${motor.modelo}):`,
      (await res.text().catch(() => "")).slice(0, 300),
    );
  } catch (e) {
    console.error(`[ia] ${motor.nome} sem resposta:`, (e as Error).message);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/** Converte o stream do motor (NDJSON no Ollama, SSE na Groq) em texto puro. */
function traduzir(motor: Motor, body: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder(),
    decoder = new TextDecoder();
  const reader = body.getReader();
  const pedaco = (line: string): unknown => {
    const texto = line.trim();
    if (motor.nome === "ollama") {
      if (!texto) return;
      const data = JSON.parse(texto);
      if (data.error) throw new Error(data.error);
      return data.message?.content;
    }
    if (!texto.startsWith("data:")) return;
    const data = texto.slice(5).trim();
    if (data === "[DONE]") return;
    return JSON.parse(data).choices?.[0]?.delta?.content;
  };
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      const processar = (line: string) => {
        let delta: unknown;
        try {
          delta = pedaco(line);
        } catch (e) {
          if (e instanceof SyntaxError) return; /* keep-alive */
          throw e; // erro do motor no meio do stream
        }
        if (typeof delta === "string" && delta)
          controller.enqueue(encoder.encode(delta));
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
}
