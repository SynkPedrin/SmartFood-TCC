"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  Banknote,
  ClipboardList,
  Users,
  ChefHat,
  Bot,
  BookOpen,
  UtensilsCrossed,
  RefreshCw,
} from "lucide-react";
import {
  categoriasApi,
  produtosApi,
  mesasApi,
  indicadoresApi,
  pedidosApi,
} from "@/lib/api";
import type { Indicadores } from "@/lib/ia/context";
import type { PaginatedResponse, Mesa, Pedido, Produto } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { fotoCardapio } from "@/lib/cardapio";
const brl = (v: string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function AdminDashboard() {
  const { usuario } = useAuth();
  const indicadores = useQuery<Indicadores>({
    queryKey: ["indicadores"],
    queryFn: indicadoresApi.obter,
    refetchInterval: 15000,
  });
  const mesas = useQuery<PaginatedResponse<Mesa>>({
    queryKey: ["mesas"],
    queryFn: mesasApi.listar,
    refetchInterval: 15000,
  });
  const produtos = useQuery<PaginatedResponse<Produto>>({
    queryKey: ["produtos"],
    queryFn: produtosApi.listar,
  });
  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasApi.listar,
  });
  const fila = useQuery<PaginatedResponse<Pedido>>({
    queryKey: ["pedidos", "abertos"],
    queryFn: () => pedidosApi.listar({ aberto: true }),
    refetchInterval: 15000,
  });
  const i = indicadores.data;
  const itens = [
    {
      icon: Banknote,
      label: "Receita de entregas",
      value: i ? brl(i.receita) : "—",
      desc: "Pedidos entregues hoje",
    },
    {
      icon: ClipboardList,
      label: "Pedidos hoje",
      value: i ? String(i.pedidos_hoje) : "—",
      desc: i
        ? `${i.entregues} entregues · ${i.em_andamento} em andamento`
        : "Consultando operação",
    },
    {
      icon: Users,
      label: "Ticket médio",
      value: i ? brl(i.ticket_medio) : "—",
      desc: "Por pedido entregue",
    },
    {
      icon: UtensilsCrossed,
      label: "Mesas disponíveis",
      value: mesas.data
        ? `${mesas.data.results.filter((m) => m.status === "disponivel").length} / ${mesas.data.count}`
        : "—",
      desc: "Ocupação atual do salão",
    },
  ];
  const visiveis = produtos.data?.results.filter(
    (p) =>
      p.disponivel && p.categoria_detalhe?.ativo !== false && fotoCardapio(p),
  ).length;
  const erro =
    indicadores.isError || mesas.isError || fila.isError || produtos.isError;
  return (
    <div className="operations-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">
            <i className="pulso" aria-hidden /> VISÃO GERAL DA OPERAÇÃO · AO VIVO
          </span>
          <h1>Olá, {usuario?.first_name || usuario?.username || "equipe"}.</h1>
          <p>Seu restaurante, do salão à cozinha.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            indicadores.refetch();
            mesas.refetch();
            fila.refetch();
            produtos.refetch();
            categorias.refetch();
          }}
        >
          <RefreshCw size={14} /> Atualizar dados
        </button>
      </header>
      {erro && (
        <div className="error-state" role="alert">
          Alguns dados não puderam ser atualizados. Verifique a conexão e tente
          novamente.
        </div>
      )}
      <div className="operation-kpis">
        {itens.map((k) => (
          <article key={k.label} className="operation-kpi">
            <div>
              <span>{k.label}</span>
              <k.icon size={17} />
            </div>
            <strong>{k.value}</strong>
            <p>{k.desc}</p>
          </article>
        ))}
      </div>
      <div className="operation-grid">
        <section className="operation-card">
          <header>
            <div>
              <span className="eyebrow">AGORA NA COZINHA</span>
              <h2>Pedidos em andamento</h2>
            </div>
            <Link href="/cozinha">
              Abrir fila <ArrowUpRight size={15} />
            </Link>
          </header>
          {fila.isLoading ? (
            <div className="skeleton" style={{ height: 190 }} />
          ) : fila.isError ? (
            <p className="dashboard-empty">A fila está indisponível.</p>
          ) : !fila.data?.results.length ? (
            <div className="dashboard-empty">
              <ChefHat size={30} />
              <p>Tudo em dia por aqui.</p>
              <span>Os próximos pedidos aparecem nesta lista.</span>
            </div>
          ) : (
            <div className="dashboard-orders">
              {fila.data.results.slice(0, 6).map((p) => (
                <div key={p.id}>
                  <span className="order-number">#{p.id}</span>
                  <span>
                    <strong>Mesa {p.mesa_numero}</strong>
                    <small>
                      {p.quantidade_itens} itens ·{" "}
                      {new Date(p.criado_em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </span>
                  <span
                    className={`badge ${p.status === "pronto" ? "badge-ok" : "badge-purple"}`}
                  >
                    {p.status_display}
                  </span>
                  <strong>{brl(p.total)}</strong>
                </div>
              ))}
            </div>
          )}
          <footer>
            <Link href="/admin/pedidos">
              Ver histórico de pedidos <ArrowRight size={14} />
            </Link>
          </footer>
        </section>
        <section className="operation-card restaurant-overview">
          <span className="eyebrow">ORGANIZE A CASA</span>
          <h2>Cardápio e salão</h2>
          <div>
            <BookOpen size={18} />
            <span>
              <strong>
                {produtos.data?.count ?? "—"} produtos cadastrados
              </strong>
              <small>
                {visiveis ?? "—"} com foto e disponíveis para o cliente
              </small>
            </span>
            <Link href="/admin/cardapio" aria-label="Gerenciar cardápio">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div>
            <UtensilsCrossed size={18} />
            <span>
              <strong>{mesas.data?.count ?? "—"} mesas no salão</strong>
              <small>
                {categorias.data?.count ?? "—"} categorias no cardápio
              </small>
            </span>
            <Link href="/admin/mesas" aria-label="Gerenciar mesas">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="dashboard-ai borda-viva">
            <Bot size={24} />
            <h3>
              Uma conversa.
              <br />
              Mais clareza para decidir.
            </h3>
            <p>
              Consulte a operação e explore melhorias com o assistente do
              restaurante.
            </p>
            <Link href="/admin/ia" className="btn btn-primary">
              Conversar com o assistente <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
      <p className="dashboard-disclaimer">
        Indicadores do dia no horário de Brasília. Receita corresponde a pedidos
        entregues; o sistema não processa pagamentos.
      </p>
    </div>
  );
}
