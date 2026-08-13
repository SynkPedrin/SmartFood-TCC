import axios from "axios";
import type { NovoPedido, PedidoStatus } from "@/types";

export const api = axios.create({
  // 127.0.0.1 em vez de localhost: o runserver do Django escuta só em IPv4,
  // e o navegador tenta ::1 antes, o que atrasa ou derruba a primeira chamada.
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Categorias
export const categoriasApi = {
  listar: () => api.get("/categorias/").then((r) => r.data),
  criar: (data: unknown) => api.post("/categorias/", data).then((r) => r.data),
  atualizar: (id: number, data: unknown) => api.patch(`/categorias/${id}/`, data).then((r) => r.data),
  excluir: (id: number) => api.delete(`/categorias/${id}/`),
};

// Produtos
export const produtosApi = {
  listar: () => api.get("/produtos/").then((r) => r.data),
  criar: (data: unknown) => api.post("/produtos/", data).then((r) => r.data),
  atualizar: (id: number, data: unknown) => api.patch(`/produtos/${id}/`, data).then((r) => r.data),
  excluir: (id: number) => api.delete(`/produtos/${id}/`),
};

// Mesas
export const mesasApi = {
  listar: () => api.get("/mesas/").then((r) => r.data),
  criar: (data: unknown) => api.post("/mesas/", data).then((r) => r.data),
  atualizar: (id: number, data: unknown) => api.patch(`/mesas/${id}/`, data).then((r) => r.data),
  excluir: (id: number) => api.delete(`/mesas/${id}/`),
};

// Pedidos
export const pedidosApi = {
  listar: (params?: { aberto?: boolean; status?: PedidoStatus; mesa?: number }) =>
    api.get("/pedidos/", { params }).then((r) => r.data),
  criar: (data: NovoPedido) => api.post("/pedidos/", data).then((r) => r.data),
  /** Avança o pedido na fila. O backend recusa salto de etapa. */
  mudarStatus: (id: number, status: PedidoStatus) =>
    api.post(`/pedidos/${id}/status/`, { status }).then((r) => r.data),
  excluir: (id: number) => api.delete(`/pedidos/${id}/`),
};
