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

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
