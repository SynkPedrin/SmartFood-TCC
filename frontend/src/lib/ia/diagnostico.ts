import type { RestaurantSnapshot } from "./context";

/**
 * Diagnóstico do restaurante, calculado por regras a partir do snapshot.
 *
 * É o que dá autonomia ao assistente: sem ninguém perguntar, ele sabe o que
 * pede atenção agora (pedido atrasado, prato pronto esperando, mesa sem
 * atendimento, lacuna no cardápio) e qual a próxima ação. Regras simples e
 * determinísticas: instantâneas, auditáveis e sem depender do modelo.
 */
export interface Alerta {
  nivel: "alta" | "media" | "info";
  area: "cozinha" | "salao" | "cardapio" | "vendas";
  texto: string;
  acao: string;
}

/** Folga além do tempo previsto antes de chamar de atraso, em minutos. */
const FOLGA_ATRASO = 10;
/** Prato pronto esperando mais que isto já está esfriando. */
const PRONTO_PARADO = 8;
/** Mesa ocupada sem pedido por mais que isto pede alguém da equipe. */
const MESA_SEM_PEDIDO = 15;

const minutosDesde = (iso: string | undefined, agora: number) =>
  iso ? Math.floor((agora - new Date(iso).getTime()) / 60_000) : 0;

export function diagnosticar(s: RestaurantSnapshot, agora = Date.now()): Alerta[] {
  const alertas: Alerta[] = [];

  // Cozinha
  for (const p of s.pedidosAbertos) {
    const idade = minutosDesde(p.criado_em, agora);
    if (p.status === "pronto") {
      const parado = minutosDesde(p.atualizado_em, agora);
      if (parado >= PRONTO_PARADO)
        alertas.push({
          nivel: "alta",
          area: "cozinha",
          texto: `Pedido #${p.id} da mesa ${p.mesa_numero} está pronto há ${parado} min`,
          acao: `Levar à mesa ${p.mesa_numero} e marcar como entregue`,
        });
    } else if (idade > p.tempo_preparo_estimado + FOLGA_ATRASO) {
      alertas.push({
        nivel: "alta",
        area: "cozinha",
        texto: `Pedido #${p.id} da mesa ${p.mesa_numero} está há ${idade} min (${p.status === "recebido" ? "ainda não iniciado" : "em preparo"}; previsto ${p.tempo_preparo_estimado} min)`,
        acao: p.status === "recebido" ? "Iniciar o preparo agora ou avisar a mesa" : "Priorizar na cozinha e avisar a mesa da demora",
      });
    }
  }
  const naFila = s.pedidosAbertos.filter((p) => p.status === "recebido").length;
  if (naFila >= 5)
    alertas.push({
      nivel: "media",
      area: "cozinha",
      texto: `${naFila} pedidos esperando para começar`,
      acao: "Reforçar a cozinha ou avisar as mesas sobre o tempo de espera",
    });

  // Salão
  const comPedido = new Set(s.pedidosAbertos.map((p) => p.mesa_numero));
  for (const m of s.mesas) {
    if (m.status !== "ocupada" || comPedido.has(m.numero)) continue;
    const ha = minutosDesde(m.atualizado_em, agora);
    if (ha >= MESA_SEM_PEDIDO)
      alertas.push({
        nivel: "media",
        area: "salao",
        texto: `Mesa ${m.numero} ocupada há ${ha} min sem pedido em andamento`,
        acao: `Passar na mesa ${m.numero}: oferecer ajuda ou liberar se já saíram`,
      });
  }
  if (s.mesas.length) {
    const ocupadas = s.mesas.filter((m) => m.status === "ocupada").length;
    const taxa = Math.round((ocupadas / s.mesas.length) * 100);
    if (taxa >= 80)
      alertas.push({
        nivel: "media",
        area: "salao",
        texto: `Salão com ${taxa}% de ocupação (${ocupadas} de ${s.mesas.length} mesas)`,
        acao: "Preparar a rotatividade: conferir mesas perto de fechar",
      });
  }

  // Cardápio
  const indisponiveis = s.produtos.filter((p) => !p.disponivel);
  if (indisponiveis.length)
    alertas.push({
      nivel: "media",
      area: "cardapio",
      texto: `${indisponiveis.length} item(ns) indisponível(is): ${indisponiveis.map((p) => p.nome).join(", ")}`,
      acao: "Repor ou reativar no cardápio para não perder vendas",
    });
  const porCategoria = new Map<string, number>();
  for (const p of s.produtos)
    if (p.disponivel && p.categoria_detalhe?.ativo !== false) {
      const nome = p.categoria_detalhe?.nome ?? "Sem categoria";
      porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + 1);
    }
  for (const [nome, n] of Array.from(porCategoria))
    if (n <= 1)
      alertas.push({
        nivel: "media",
        area: "cardapio",
        texto: `${nome} tem só ${n} opção`,
        acao: `Cadastrar mais opções em ${nome} para o cliente ter escolha`,
      });
  const semDescricao = s.produtos.filter((p) => !p.descricao?.trim());
  if (semDescricao.length)
    alertas.push({
      nivel: "info",
      area: "cardapio",
      texto: `${semDescricao.length} item(ns) sem descrição`,
      acao: "Pedir ao assistente uma descrição para cada um",
    });

  // Vendas do dia
  const ind = s.indicadores;
  if (ind) {
    const cancelados = ind.por_status.find((x) => x.status === "cancelado")?.quantidade ?? 0;
    if (cancelados > 0)
      alertas.push({
        nivel: "media",
        area: "vendas",
        texto: `${cancelados} pedido(s) cancelado(s) hoje`,
        acao: "Entender o motivo com a equipe (falta de item, demora, erro no pedido)",
      });
    if (ind.pedidos_hoje === 0)
      alertas.push({
        nivel: "info",
        area: "vendas",
        texto: "Nenhum pedido hoje ainda",
        acao: "Conferir se o totem e os QR codes das mesas estão acessíveis",
      });
  }

  const ordem = { alta: 0, media: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

/** Bloco para o prompt: a IA começa pelo que importa sem precisar calcular. */
export function diagnosticoToContext(alertas: Alerta[]): string {
  if (!alertas.length) return "DIAGNÓSTICO CALCULADO: nenhum ponto de atenção agora.";
  return [
    "DIAGNÓSTICO CALCULADO (regras sobre os dados ao vivo; prioridade alta primeiro):",
    ...alertas.map((a) => `- [${a.nivel}] ${a.texto}. Ação: ${a.acao}.`),
  ].join("\n");
}
