import type { ProdutoSnapshot, RestaurantSnapshot } from "./context";
const brl = (v: string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(?:nn|naum)\b/g, "nao")
    .replace(/\bcarnen?\b/g, "carne");
const textoProduto = (p: ProdutoSnapshot) =>
  normalizar(`${p.nome} ${p.descricao ?? ""}`);
const bebida = (p: ProdutoSnapshot) =>
  /bebida|suco|cafe|drink/.test(normalizar(p.categoria_detalhe?.nome ?? ""));
const sobremesa = (p: ProdutoSnapshot) =>
  /sobremesa|doce/.test(normalizar(p.categoria_detalhe?.nome ?? ""));
const carne =
  /\b(carnes?|bovin\w*|suin\w*|frango|galinha|bacon|presunto|calabresa|pepperoni|linguica|salsicha|bife|mignon|file|peixe|atum|salmao|tilapia|camarao|sardinha|bolonhesa|anchova|aliche|peru|costela|picanha)\b/;
const vegetal =
  /\b(batata|cebola|tomate|tapioca|legumes|grao.de.bico|cogumelo|folhas|lentilha|berinjela|abobrinha|arroz|macarrao|penne|fettuccine)\b/;
const vegetariano = (p: ProdutoSnapshot) => {
  const t = textoProduto(p);
  const explicito = /vegetarian|vegan|sem carne/.test(t);
  return (
    !bebida(p) &&
    !sobremesa(p) &&
    !!p.descricao?.trim() &&
    !carne.test(t.replace(/sem carne/g, "")) &&
    !/nao vegetar|nao vegan/.test(t) &&
    (explicito || (!/burger|hamburguer/.test(t) && vegetal.test(t)))
  );
};
const grupos = [
  {
    query: /\b(peixes?|pescado)\b/,
    item: /\b(peixes?|atum|salmao|tilapia|sardinha|bacalhau|anchova|aliche|pescado)\b/,
  },
  {
    query: /\b(frutos? do mar)\b/,
    item: /\b(camaroes|camarao|lula|polvo|marisco|mexilhao|ostra)\b/,
  },
  { query: /\b(carnes?)\b/, item: carne },
  {
    query: /\b(queijos?)\b/,
    item: /queijo|cheddar|mucarela|parmesao|gorgonzola|catupiry/,
  },
];
const vazias = new Set([
  "quais",
  "qual",
  "prato",
  "pratos",
  "opcao",
  "opcoes",
  "voce",
  "voces",
  "recomenda",
  "recomende",
  "recomendacao",
  "sugere",
  "sugestao",
  "sugestoes",
  "quero",
  "queria",
  "gostaria",
  "pode",
  "poderia",
  "tem",
  "ter",
  "vai",
  "leva",
  "levam",
  "contem",
  "conta",
  "com",
  "sem",
  "nao",
  "para",
  "por",
  "favor",
  "algo",
  "algum",
  "alguma",
  "algumas",
  "alguns",
  "mais",
  "menos",
  "maximo",
  "tenho",
  "barato",
  "baratos",
  "barata",
  "baratas",
  "economico",
  "economica",
  "rapido",
  "rapidos",
  "rapida",
  "rapidas",
  "pronto",
  "pronta",
  "fica",
  "ficam",
  "ate",
  "comer",
  "comida",
  "cardapio",
  "menu",
  "hoje",
  "agora",
  "preco",
  "custa",
  "custam",
  "quanto",
  "reais",
  "ingrediente",
  "ingredientes",
  "explica",
  "explique",
  "qualquer",
  "uma",
  "uns",
  "das",
  "dos",
  "esse",
  "essa",
  "este",
  "esta",
  "isso",
  "gosto",
  "gostoso",
  "delicioso",
  "me",
  "um",
  "que",
  "de",
  "os",
  "as",
  "no",
  "na",
  "em",
  "ao",
  "do",
  "da",
  "e",
  "o",
  "a",
  "r",
  "beber",
  "bebida",
  "bebidas",
  "sobremesa",
  "sobremesas",
  "doce",
  "doces",
  "combina",
  "combinar",
]);
function filtros(q: string): RegExp[] {
  let resto = q.replace(
    /(?:ate|menos de|maximo)\s*(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/g,
    "",
  );
  const out: RegExp[] = [];
  for (const g of grupos) {
    if (g.query.test(resto)) {
      out.push(g.item);
      resto = resto.replace(g.query, "");
    }
  }
  for (const t of resto
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length > 2 && !vazias.has(t) && !/^\d+$/.test(t))) {
    // Palavras são dados; não construímos expressões a partir de metacaracteres do usuário.
    const base =
      t === "camaroes"
        ? "camarao|camaroes"
        : t === "hamburgueres"
          ? "hamburguer|burger"
          : t;
    out.push(new RegExp(`\\b(?:${base})\\b`));
  }
  return out;
}
/**
 * Pares comida + bebida cujo total cabe no orçamento, já somados. Modelos pequenos
 * erram a soma; com a lista pronta, o modelo só escolhe.
 */
export function combinacoes(produtos: ProdutoSnapshot[], limite: number): string[] {
  const comidas = produtos.filter((p) => !bebida(p) && !sobremesa(p));
  return comidas
    .flatMap((c) =>
      produtos
        .filter(bebida)
        .map((b) => ({ c, b, total: Number(c.preco) + Number(b.preco) })),
    )
    .filter((x) => x.total <= limite)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map((x) => `${x.c.nome} + ${x.b.nome} = ${brl(String(x.total))}`);
}
/** Orçamento pedido pelo cliente ("até R$ 25", "menos de 30"), ou null. */
export function orcamento(texto: string): number | null {
  const m = normalizar(texto).match(
    /(?:ate|menos de|maximo)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/,
  );
  return m ? Number(m[1].replace(",", ".")) : null;
}
export function respostaLocal(
  mode: "admin" | "totem",
  pergunta: string,
  s: RestaurantSnapshot,
  historico: { role: string; content: string }[] = [],
): string {
  const aviso =
    "**Assistente local** · consulta de dados, sem geração por IA externa.\n\n";
  let q = normalizar(pergunta);
  // Refinamentos curtos mantêm o assunto; uma nova pergunta explícita o substitui.
  if (
    /^(e\s+)?(ate\s|menos de\s|mais barat|mais rapid|qual (?:e |o )?mais)/.test(
      q,
    )
  ) {
    const anteriores = historico.filter(
      (m) => m.role === "user" && normalizar(m.content) !== q,
    );
    const anterior = anteriores.at(-1)?.content;
    if (anterior)
      q = `${normalizar(anterior).replace(/(?:ate|menos de|maximo)\s*(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/g, "")} ${q}`;
  }
  if (!s.online)
    return (
      aviso +
      "O cardápio está indisponível agora. Consulte o atendimento e tente novamente."
    );
  if (/alerg|gluten|lactose|celiac|intoler/.test(q))
    return (
      aviso +
      "Não temos uma ficha de alergênicos validada. Confirme ingredientes e risco de contaminação cruzada com a equipe antes de pedir."
    );
  if (/mais pedido|mais vendid|popular/.test(q)) {
    if (mode === "admin" && s.indicadores?.mais_vendidos?.length)
      return (
        aviso +
        s.indicadores.mais_vendidos
          .map(
            (p) =>
              `- ${p.produto__nome}: ${p.quantidade} unidades em pedidos entregues hoje.`,
          )
          .join("\n")
      );
    return (
      aviso +
      "Não tenho um ranking público de vendas para afirmar qual é o prato mais pedido. Posso ajudar a escolher pelos ingredientes, preço ou tempo de preparo."
    );
  }
  if (
    mode === "admin" &&
    /venda|receita|ticket|fatur|panorama|resumo|pedido/.test(q)
  ) {
    const i = s.indicadores;
    if (!i)
      return (
        aviso +
        "Não consegui consultar os indicadores de vendas. Não posso informar valores agora."
      );
    return (
      aviso +
      `**Operação de ${i.data}**\n\n- Receita de pedidos entregues: **${brl(i.receita)}**.\n- Ticket médio: **${brl(i.ticket_medio)}**.\n- Pedidos: **${i.pedidos_hoje}**, com **${i.em_andamento}** em andamento.\n- Mesas atendidas: **${i.mesas_atendidas}**.\n\nEsses valores representam pedidos entregues; pagamentos não são registrados nesta versão.`
    );
  }
  if (mode === "admin" && /mesa/.test(q))
    return (
      aviso +
      (s.falhas.includes("mesas")
        ? "As mesas estão indisponíveis agora."
        : `**Salão:** ${s.mesas.length} mesas, ${s.mesas.filter((m) => m.status === "disponivel").length} disponíveis e ${s.mesas.filter((m) => m.status === "ocupada").length} ocupadas.`)
    );
  if (mode === "admin" && /melhor|cardapio|descri|promoc/.test(q))
    return (
      aviso +
      `**Revisão do cardápio**\n\n- ${s.produtos.length} produtos cadastrados; ${s.produtos.filter((p) => p.disponivel).length} disponíveis.\n- ${s.produtos.filter((p) => !p.descricao?.trim()).length} produtos sem descrição.\n\nItens sem foto funcional ficam ocultos do cliente. Para textos e análise livre, configure o serviço externo de IA.`
    );

  const semCarne = /vegetarian|(?:sem|nao(?:\s+\w+){0,2})\s+carne\b/.test(q);
  const vegano = /vegan/.test(q);
  const querBebida = /beber|bebida|suco|cafe|refrigerante/.test(q);
  const querDoce = /sobremesa|doce|sorvete/.test(q);
  let produtos = s.produtos.filter(
    (p) => p.disponivel && p.categoria_detalhe?.ativo !== false,
  );
  let nota = "";
  if (semCarne || vegano) {
    produtos = produtos.filter(vegetariano);
    if (vegano)
      produtos = produtos.filter(
        (p) =>
          /vegan/.test(textoProduto(p)) &&
          !/queijo|leite|ovo|mel\b|manteiga|creme|maionese/.test(
            textoProduto(p),
          ),
      );
    nota = vegano
      ? "O cadastro identifica estas opções como veganas; confirme o preparo com a equipe."
      : "Pela descrição do cardápio, estas opções não listam carne. Confirme a composição e o preparo com a equipe.";
  } else if (querBebida) produtos = produtos.filter(bebida);
  else if (querDoce) produtos = produtos.filter(sobremesa);
  else if (/prato|comer|comida|peixe|frango|carne|burger|hamburguer/.test(q))
    produtos = produtos.filter((p) => !bebida(p) && !sobremesa(p));

  const limite = orcamento(q);
  if (limite !== null)
    produtos = produtos.filter((p) => Number(p.preco) <= limite);
  let consulta = q;
  const exclusoes: string[] = [];
  consulta = consulta.replace(
    /\b(?:sem|nao (?:vai|leva|tem|quero|como))\s+([a-z]+)/g,
    (trecho, ingrediente: string) => {
      if (ingrediente === "carne") return trecho;
      exclusoes.push(ingrediente);
      return "";
    },
  );
  if (exclusoes.length) {
    const proibidos = exclusoes.flatMap(filtros);
    produtos = produtos.filter(
      (p) =>
        !!p.descricao?.trim() &&
        !bebida(p) &&
        !sobremesa(p) &&
        proibidos.every((t) => !t.test(textoProduto(p))),
    );
    nota =
      "Estas opções não citam " +
      exclusoes.join(" ou ") +
      " na descrição. Confirme a composição com a equipe antes de pedir.";
  }
  const termos = filtros(
    consulta.replace(
      /\bvegetarian\w*\b|\bvegan\w*\b|(?:sem|nao(?:\s+\w+){0,2})\s+carne\b/g,
      "",
    ),
  );
  // Nunca substitui uma busca sem correspondência pelos itens mais baratos.
  if (termos.length)
    produtos = produtos.filter((p) =>
      termos.every((t) => t.test(textoProduto(p))),
    );
  if (!produtos.length)
    return (
      aviso +
      (vegano
        ? "Não encontrei uma opção identificada como vegana no cardápio disponível."
        : semCarne
          ? "Não encontrei uma opção sem carne que eu possa indicar com base nas descrições do cardápio disponível."
          : /\bpeixes?\b/.test(q)
            ? "Não encontrei pratos com peixe no cardápio disponível agora."
            : "Não encontrei uma opção correspondente no cardápio disponível. Diga outro ingrediente ou o nome do prato para eu conferir.")
    );
  produtos.sort((a, b) =>
    /rapid/.test(q)
      ? a.tempo_preparo - b.tempo_preparo
      : Number(a.preco) - Number(b.preco),
  );
  return (
    aviso +
    (nota
      ? nota + "\n\n"
      : "Opções do cardápio" +
        (limite !== null ? ` até ${brl(String(limite))}` : "") +
        ":\n\n") +
    produtos
      .slice(0, 3)
      .map(
        (p) =>
          `- **${p.nome}** — ${brl(p.preco)} · cerca de ${p.tempo_preparo} min. ${p.descricao ?? ""}`,
      )
      .join("\n")
  );
}
