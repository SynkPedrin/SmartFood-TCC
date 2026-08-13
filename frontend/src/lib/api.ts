import axios from "axios";
import type { NovoPedido, PedidoStatus } from "@/types";

/** Onde o token da equipe é guardado no navegador. */
export const TOKEN_KEY = "smartfood:token";

export const api = axios.create({
  // 127.0.0.1 em vez de localhost: o runserver do Django escuta só em IPv4,
  // e o navegador tenta ::1 antes, o que atrasa ou derruba a primeira chamada.
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Toda chamada leva o token da equipe quando existe. O totem funciona sem ele:
// ler cardápio e criar pedido são públicos por decisão de projeto.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Token revogado ou expirado derruba a sessão local em vez de deixar a tela
// tentando de novo para sempre.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const naoAutorizado = error?.response?.status === 401;
    const ehLogin = String(error?.config?.url ?? "").includes("/auth/login/");
    if (naoAutorizado && !ehLogin && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/entrar")) {
        window.location.href = `/entrar?destino=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  },
);

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
