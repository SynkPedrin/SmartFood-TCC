import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
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
