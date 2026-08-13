export interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  imagem: string | null;
  categoria: number;
  categoria_detalhe: Categoria;
  disponivel: boolean;
  tempo_preparo: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Mesa {
  id: number;
  numero: number;
  capacidade: number;
  status: "disponivel" | "ocupada" | "reservada" | "manutencao";
  status_display: string;
  qr_code: string;
  criado_em: string;
  atualizado_em: string;
}

export type PedidoStatus =
  | "recebido"
  | "preparando"
  | "pronto"
  | "entregue"
  | "cancelado";

export interface ItemPedido {
  id: number;
  produto: number;
  produto_nome: string;
  quantidade: number;
  /** Preço congelado no momento do pedido, não o preço atual do produto. */
  preco_unitario: string;
  observacao: string;
  subtotal: string;
}

export interface Pedido {
  id: number;
  mesa: number;
  mesa_numero: number;
  status: PedidoStatus;
  status_display: string;
  itens: ItemPedido[];
  total: string;
  quantidade_itens: number;
  /** Minutos do item mais demorado: a cozinha trabalha em paralelo. */
  tempo_preparo_estimado: number;
  observacao: string;
  criado_em: string;
  atualizado_em: string;
}

/** Corpo enviado pelo totem ao fechar o pedido. */
export interface NovoPedido {
  mesa: number;
  observacao?: string;
  itens: { produto: number; quantidade: number; observacao?: string }[];
}

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
