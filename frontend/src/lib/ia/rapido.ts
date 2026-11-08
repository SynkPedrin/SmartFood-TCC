import type { ProdutoSnapshot, RestaurantSnapshot } from "./context";
import type { Alerta } from "./diagnostico";
import { normalizar } from "./local";

/**
 * Respostas instantâneas para perguntas de um dado só ("quanto custa", "quantas
 * mesas livres", "receita de hoje"). Saem direto do banco, sem passar pelo
 * modelo: chegam em milissegundos e não erram conta.
 *
 * Só responde quando a pergunta é curta e o assunto é inequívoco; na dúvida
 * devolve null e a pergunta segue para o modelo, que trata o que é aberto.
 */
const brl = (v: string | number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Pede análise, opinião ou plano: isso é trabalho do modelo, não de consulta. */
const ABERTA =
  /\b(por ?que|porque|como (posso|devo|melhor|aument|resolv|faco|fazer)|analis|plano|estrateg|sugest|sugir|recomend|indica|ideia|promoc|campanha|compar|melhor(ar|ia)|devo|vale a pena|explique|explica|acoes|diagnostico)\b/;

const CATEGORIAS: [RegExp, string][] = [
  [/\bbebida/, "Bebidas"],
  [/\b(burger|hamburguer|lanche)/, "Burgers"],
  [/\bentrada/, "Entradas"],
  [/\bcombo/, "Combos"],
  [/\b(sobremesa|doce)/, "Sobremesas"],
  [/\b(infantil|crianca|kids)/, "Infantil"],
];

function produtoCitado(q: string, produtos: ProdutoSnapshot[]) {
  // O nome mais longo ganha: "Batata com Cheddar e Bacon" antes de "Batata Frita".
  return [...produtos]
    .sort((a, b) => b.nome.length - a.nome.length)
    .find((p) => q.includes(normalizar(p.nome)));
}

export function respostaRapida(
  mode: "admin" | "totem",
  pergunta: string,
  s: RestaurantSnapshot,
  alertas: Alerta[],
): string | null {
  const q = normalizar(pergunta).replace(/[?!.]+/g, " ").trim();
  if (!s.online || q.split(/\s+/).length > 14 || ABERTA.test(q)) return null;
  const vendaveis = s.produtos.filter((p) => p.disponivel && p.categoria_detalhe?.ativo !== false);

  // Preço e tempo de um item citado pelo nome
  const item = produtoCitado(q, vendaveis);
  if (item && /\b(quanto custa|custa|preco|valor|quanto e|quanto sai)\b/.test(q))
    return `O **${item.nome}** custa **${brl(item.preco)}** e fica pronto em cerca de ${item.tempo_preparo} min.`;
  if (item && /\b(quanto tempo|demora|tempo de preparo|leva quanto)\b/.test(q))
    return `O **${item.nome}** fica pronto em cerca de **${item.tempo_preparo} min**.`;

  // Mais caro / mais barato, no geral ou dentro de uma categoria
  const extremo = q.match(/\bmais (car[oa]|barat[oa]|em conta|economic[oa])\b/);
  if (extremo && !item) {
    const categoria = CATEGORIAS.find(([re]) => re.test(q))?.[1];
    const lista = vendaveis
      .filter((p) => !categoria || p.categoria_detalhe?.nome === categoria)
      .sort((a, b) => Number(a.preco) - Number(b.preco));
    if (!lista.length) return null;
    const barato = !extremo[1].startsWith("car");
    const p = barato ? lista[0] : lista[lista.length - 1];
    const onde = categoria ? ` em ${categoria}` : " do cardápio";
    return `O item mais ${barato ? "barato" : "caro"}${onde} é o **${p.nome}**, por **${brl(p.preco)}**.`;
  }

  if (mode === "totem") return null;

  // Daqui para baixo, só gestão
  if (/\bquant[oa]s? (produtos|itens|pratos|categorias)\b/.test(q) && !/vend|pedid/.test(q)) {
    const categorias = new Set(vendaveis.map((p) => p.categoria_detalhe?.nome)).size;
    const fora = s.produtos.length - vendaveis.length;
    return `O cardápio tem **${s.produtos.length} produtos** em **${categorias} categorias**${fora ? `, ${fora} deles indisponíveis para o cliente agora` : ", todos disponíveis para o cliente"}.`;
  }

  if (/\bmesas?\b/.test(q) && /\b(quant|livre|disponive|ocupad|situacao|status)/.test(q)) {
    const por = (st: string) => s.mesas.filter((m) => m.status === st).map((m) => m.numero);
    const livres = por("disponivel"), ocupadas = por("ocupada");
    const outras = s.mesas.filter((m) => !["disponivel", "ocupada"].includes(m.status));
    return [
      `**${livres.length} de ${s.mesas.length} mesas livres** agora${livres.length ? ` (${livres.join(", ")})` : ""}.`,
      ocupadas.length ? `Ocupadas: ${ocupadas.join(", ")}.` : "Nenhuma ocupada.",
      outras.length ? `Fora de uso: ${outras.map((m) => `${m.numero} (${m.status})`).join(", ")}.` : "",
    ].filter(Boolean).join(" ");
  }

  if (/\b(receita|faturamento|faturou|fatur|ticket medio|vendemos|vendeu)\b/.test(q) && !/\b(semana|mes|ontem|ano|periodo)\b/.test(q)) {
    const ind = s.indicadores;
    if (!ind) return null;
    return `Hoje: **receita de ${brl(ind.receita)}** em ${ind.entregues} pedido(s) entregue(s), ticket médio de **${brl(ind.ticket_medio)}**. ${ind.pedidos_hoje} pedido(s) no dia, ${ind.em_andamento} em andamento. A receita conta só pedidos entregues e não é pagamento confirmado.`;
  }

  if (/\b(atrasad|parad|demorand|esperando|alerta|pontos? de atencao|problema)/.test(q)) {
    const cozinha = /\b(atrasad|parad|demorand|esperando|cozinha|pedido)/.test(q)
      ? alertas.filter((a) => a.area === "cozinha")
      : alertas;
    if (!cozinha.length)
      return /\b(atrasad|parad|demorand|esperando|cozinha|pedido)/.test(q)
        ? `Nenhum pedido atrasado ou parado agora. ${s.pedidosAbertos.length ? `${s.pedidosAbertos.length} pedido(s) em andamento, todos dentro do tempo.` : "A cozinha está sem pedidos em andamento."}`
        : "Nenhum ponto de atenção agora: cozinha, salão e cardápio dentro do esperado.";
    return cozinha.map((a) => `- **${a.texto}.** ${a.acao}.`).join("\n");
  }

  return null;
}
