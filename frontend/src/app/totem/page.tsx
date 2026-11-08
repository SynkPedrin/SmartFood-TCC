"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  categoriasApi,
  produtosApi,
  mesasApi,
  pedidosApi,
  api,
} from "@/lib/api";
import { imagemUrl } from "@/lib/imagem";
import { fotoCardapio } from "@/lib/cardapio";
import type {
  Categoria,
  Produto,
  Mesa,
  Pedido,
  PaginatedResponse,
} from "@/types";
import ChefIA from "@/components/ChefIA";
import { SeloConfirmado } from "@/components/experiencia/Celebracao";
import { MODO_SITE } from "@/lib/site";
import { BrandLogo } from "@/components/BrandLogo";
import { useBrand } from "@/lib/brand/BrandContext";
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Clock,
  X,
  Search,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";
type Item = { produto: Produto; qtd: number };
/** Mesa escolhida nesta aba: recarregar a página não tira o cliente da mesa. */
const MESA_KEY = "smartfood:mesa";
const brl = (v: string | number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function Acompanhamento({ codigo }: { codigo: string }) {
  const { data, isError } = useQuery<{
    status: string;
    status_display: string;
  }>({
    queryKey: ["acompanhamento", codigo],
    queryFn: () => api.get(`/acompanhamento/${codigo}/`).then((r) => r.data),
    refetchInterval: 5000,
  });
  const etapas = ["recebido", "preparando", "pronto", "entregue"];
  const atual = data ? etapas.indexOf(data.status) : -1;
  return (
    <div className="order-progress" aria-live="polite">
      <p>
        {isError
          ? "Não foi possível atualizar o status. Consulte o atendimento."
          : data?.status === "cancelado"
            ? "Pedido cancelado. Consulte o atendimento."
            : data?.status_display || "Atualizando pedido…"}
      </p>
      <div>
        {etapas.map((e, i) => (
          <span
            key={e}
            className={
              atual >= i ? (atual === i ? "complete atual" : "complete") : ""
            }
          >
            {["Recebido", "Em preparo", "Pronto", "Entregue"][i]}
          </span>
        ))}
      </div>
    </div>
  );
}
export default function TotemPage() {
  const { brand } = useBrand();
  const qc = useQueryClient();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [cart, setCart] = useState<Item[]>([]);
  const [aberto, setAberto] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);
  const [ordem, setOrdem] = useState("nome");
  const [observacao, setObservacao] = useState("");
  const [falhas, setFalhas] = useState<number[]>([]);
  const chave = useRef<string | null>(null);
  const selecionouQR = useRef(false);
  const mesaQuery = useQuery<PaginatedResponse<Mesa>>({
    queryKey: ["mesas"],
    queryFn: mesasApi.listar,
    refetchInterval: 15000,
  });
  const produtosQuery = useQuery<PaginatedResponse<Produto>>({
    queryKey: ["produtos"],
    queryFn: produtosApi.listar,
    refetchInterval: 30000,
  });
  const catsQuery = useQuery<PaginatedResponse<Categoria>>({
    queryKey: ["categorias"],
    queryFn: categoriasApi.listar,
  });
  // Escolher a mesa já a ocupa no servidor: as outras telas veem na hora.
  const sentar = useMutation({
    mutationFn: (m: Mesa) => mesasApi.sentar(m.id),
    onSuccess: (m: Mesa) => {
      setMesa(m);
      try {
        sessionStorage.setItem(MESA_KEY, String(m.id));
      } catch {
        /* navegação privada */
      }
      qc.invalidateQueries({ queryKey: ["mesas"] });
    },
    onError: (err: unknown) => {
      toast.error(
        (axios.isAxiosError(err) && err.response?.data?.detail) ||
          "Não foi possível ocupar a mesa. Tente novamente.",
      );
      qc.invalidateQueries({ queryKey: ["mesas"] });
    },
  });
  useEffect(() => {
    if (selecionouQR.current || !mesaQuery.data) return;
    selecionouQR.current = true;
    // QR code da mesa tem prioridade; sem ele, recarregar a página mantém a mesa da sessão.
    const numero = new URLSearchParams(window.location.search).get("mesa");
    let salva: string | null = null;
    try {
      salva = sessionStorage.getItem(MESA_KEY);
    } catch {
      /* navegação privada */
    }
    if (!numero && !salva) return;
    const encontrada = mesaQuery.data.results.find(
      (m) =>
        (numero ? String(m.numero) === numero : String(m.id) === salva) &&
        ["disponivel", "ocupada"].includes(m.status),
    );
    if (encontrada) sentar.mutate(encontrada);
    else if (numero) toast.error("Mesa indisponível. Consulte o atendimento.");
  }, [mesaQuery.data, sentar]);
  const pedidosDaMesa = useQuery({
    queryKey: ["mesa-pedidos", mesa?.id],
    queryFn: () => mesasApi.pedidos(mesa!.id),
    enabled: !!mesa,
    refetchInterval: 15000,
  });
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);
  const produtos = (produtosQuery.data?.results ?? []).filter(
    (p) =>
      p.disponivel &&
      p.categoria_detalhe?.ativo !== false &&
      fotoCardapio(p) &&
      !falhas.includes(p.id),
  );
  const categorias = (catsQuery.data?.results ?? []).filter(
    (c) => c.ativo && produtos.some((p) => p.categoria === c.id),
  );
  const filtrados = produtos
    .filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        normalizar(`${p.nome} ${p.descricao}`).includes(normalizar(busca)),
    )
    .sort((a, b) =>
      ordem === "preco"
        ? Number(a.preco) - Number(b.preco)
        : ordem === "tempo"
          ? a.tempo_preparo - b.tempo_preparo
          : a.nome.localeCompare(b.nome, "pt-BR"),
    );
  const total = cart.reduce((n, i) => n + Number(i.produto.preco) * i.qtd, 0);
  const quantidade = cart.reduce((n, i) => n + i.qtd, 0);
  const enviar = useMutation({
    mutationFn: () =>
      pedidosApi.criar({
        mesa: mesa!.id,
        chave_idempotencia: chave.current!,
        observacao,
        itens: cart.map((i) => ({ produto: i.produto.id, quantidade: i.qtd })),
      }),
    onSuccess: (p: Pedido) => {
      setPedido(p);
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["mesas"] });
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["indicadores"] });
    },
    onError: (err: unknown) => {
      const detalhe = axios.isAxiosError(err)
        ? Object.values(err.response?.data ?? {})
            .flat(2)
            .join(" ")
        : "";
      toast.error(
        detalhe ||
          "Não foi possível enviar. Tente novamente; o pedido não será duplicado.",
      );
    },
  });
  function adicionar(produto: Produto) {
    if (enviar.isPending) return;
    chave.current = null;
    setCart((prev) =>
      prev.some((i) => i.produto.id === produto.id)
        ? prev.map((i) =>
            i.produto.id === produto.id
              ? { ...i, qtd: Math.min(99, i.qtd + 1) }
              : i,
          )
        : [...prev, { produto, qtd: 1 }],
    );
    toast.success(`${produto.nome} adicionado`, { duration: 1300 });
  }
  function quantidadeItem(id: number, delta: number) {
    if (enviar.isPending) return;
    chave.current = null;
    setCart((prev) =>
      prev
        .map((i) =>
          i.produto.id === id ? { ...i, qtd: Math.min(99, i.qtd + delta) } : i,
        )
        .filter((i) => i.qtd > 0),
    );
  }
  function finalizar() {
    if (!mesa || !cart.length || enviar.isPending) return;
    if (!chave.current) chave.current = crypto.randomUUID();
    enviar.mutate();
  }
  function sair() {
    // Sem pedido em andamento a mesa volta a ficar livre; com pedido, o servidor a mantém ocupada.
    if (mesa) mesasApi.liberar(mesa.id).catch(() => undefined);
    try {
      sessionStorage.removeItem(MESA_KEY);
    } catch {
      /* navegação privada */
    }
    setMesa(null);
    setCart([]);
    setPedido(null);
    setObservacao("");
    chave.current = null;
  }
  if (!mesa)
    return (
      <main className="table-welcome com-wallpaper">
        {MODO_SITE !== "mesa" && (
          <Link href="/" className="btn btn-ghost welcome-back">
            <ArrowLeft size={16} /> Início
          </Link>
        )}
        <div className="marca-moldura">
          <BrandLogo size={56} />
        </div>
        <h1>Escolha sua mesa</h1>
        <p>Selecione a mesa em que você está para ver o cardápio de {brand.name}.</p>
        {mesaQuery.isError ? (
          <div className="error-state" role="alert">
            Não foi possível consultar as mesas.{" "}
            <button
              className="btn btn-ghost"
              onClick={() => mesaQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : mesaQuery.isLoading ? (
          <div
            className="skeleton"
            style={{ height: 150, width: "100%", maxWidth: 700 }}
          />
        ) : (
          <div className="table-options">
            {mesaQuery.data?.results
              .filter((m) => m.status === "disponivel")
              .map((m) => (
                <button
                  key={m.id}
                  className="table-option"
                  disabled={sentar.isPending}
                  onClick={() => sentar.mutate(m)}
                >
                  <span>MESA</span>
                  <strong>{String(m.numero).padStart(2, "0")}</strong>
                  <small>
                    {m.capacidade} lugares <i /> Disponível
                  </small>
                </button>
              ))}
          </div>
        )}
        {!mesaQuery.isLoading &&
          !mesaQuery.isError &&
          !mesaQuery.data?.results.some((m) => m.status === "disponivel") && (
            <p>Nenhuma mesa livre no momento. Consulte o atendimento.</p>
          )}
        {!!mesaQuery.data?.results.some((m) => m.status === "ocupada") && (
          <div className="table-rejoin">
            <span>Já está sentado? Entre na sua mesa:</span>
            <div>
              {mesaQuery.data.results
                .filter((m) => m.status === "ocupada")
                .map((m) => (
                  <button
                    key={m.id}
                    className="btn btn-ghost"
                    disabled={sentar.isPending}
                    onClick={() => sentar.mutate(m)}
                  >
                    Mesa {String(m.numero).padStart(2, "0")}
                  </button>
                ))}
            </div>
          </div>
        )}
        <small className="welcome-note">
          Ou acesse pelo QR code da mesa para continuar pedindo.
        </small>
      </main>
    );
  if (pedido)
    return (
      <main className="table-welcome success-view">
        <SeloConfirmado />
        <h1>Pedido enviado para a cozinha</h1>
        <p>
          Pedido <strong>#{pedido.id}</strong> · Mesa{" "}
          {String(mesa.numero).padStart(2, "0")}. Acompanhe o preparo abaixo.
        </p>
        {pedido.acompanhamento && (
          <Acompanhamento codigo={pedido.acompanhamento} />
        )}
        <div className="order-summary">
          {cart.map((i) => (
            <div key={i.produto.id}>
              <span>
                {i.qtd} × {i.produto.nome}
              </span>
              <strong>{brl(Number(i.produto.preco) * i.qtd)}</strong>
            </div>
          ))}
          <div>
            <span>Total enviado</span>
            <strong>{brl(total)}</strong>
          </div>
        </div>
        <p className="welcome-note">
          O pagamento é combinado com o atendimento.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setCart([]);
            setPedido(null);
            setObservacao("");
            chave.current = null;
          }}
        >
          Pedir mais <Plus size={16} />
        </button>
        <button className="btn btn-ghost" onClick={sair}>
          Voltar às mesas
        </button>
      </main>
    );
  return (
    <main className="menu-page">
      <header className="menu-top">
        <Link href="/" aria-label="Voltar ao início">
          <BrandLogo size={44} />
        </Link>
        <div>
          <strong>{brand.name}</strong>
          <span>Cardápio da casa</span>
        </div>
        <span className="table-badge">
          Mesa {String(mesa.numero).padStart(2, "0")}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          aria-label="Trocar mesa"
          onClick={() => {
            if (!cart.length || confirm("Trocar mesa e limpar o pedido?"))
              sair();
          }}
        >
          <ArrowLeft size={18} />
        </button>
      </header>
      <div className="menu-container">
        <section className="menu-intro">
          <div>
            <span className="eyebrow">{brand.name}</span>
            <h1>Cardápio</h1>
            <p>Peça direto da mesa. O tempo de preparo aparece em cada prato.</p>
          </div>
          <div className="menu-info">
            <Clock size={20} />
            <div>
              <strong>Preparado na hora</strong>
              <span>Tempo estimado em cada opção</span>
            </div>
          </div>
        </section>
        {!!pedidosDaMesa.data?.pedidos.length && (
          <section className="table-orders" aria-live="polite">
            <strong>Pedidos da mesa {String(mesa.numero).padStart(2, "0")}</strong>
            {pedidosDaMesa.data.pedidos.map((p) => (
              <div key={p.id}>
                <span>
                  #{p.id} ·{" "}
                  {p.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(", ")}
                </span>
                <em className={`status-${p.status}`}>{p.status_display}</em>
              </div>
            ))}
          </section>
        )}
        <div className="menu-toolbar">
          <label className="menu-search">
            <Search size={18} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busque um prato ou ingrediente"
              aria-label="Buscar no cardápio"
            />
            {busca && (
              <button onClick={() => setBusca("")} aria-label="Limpar busca">
                <X size={15} />
              </button>
            )}
          </label>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            aria-label="Ordenar cardápio"
          >
            <option value="nome">Nome do prato</option>
            <option value="preco">Menor preço</option>
            <option value="tempo">Mais rápido</option>
          </select>
        </div>
        <nav className="menu-categories" aria-label="Categorias do cardápio">
          <button
            onClick={() => setCategoria(null)}
            className={!categoria ? "selected" : ""}
          >
            {!categoria && <PilulaAtiva />}
            Todos <span>{produtos.length}</span>
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoria(c.id)}
              className={categoria === c.id ? "selected" : ""}
            >
              {categoria === c.id && <PilulaAtiva />}
              {c.nome}
            </button>
          ))}
        </nav>
        {produtosQuery.isError ? (
          <div className="error-state" role="alert">
            Não foi possível carregar o cardápio.{" "}
            <button
              className="btn btn-ghost"
              onClick={() => produtosQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : produtosQuery.isLoading ? (
          <div className="menu-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 380 }} />
            ))}
          </div>
        ) : !filtrados.length ? (
          <div className="menu-empty">
            <UtensilsCrossed size={34} />
            <h2>Nenhuma opção encontrada</h2>
            <p>Experimente outra busca ou categoria.</p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setBusca("");
                setCategoria(null);
              }}
            >
              Ver cardápio
            </button>
          </div>
        ) : (
          <div className="menu-grid">
            {filtrados.map((p) => {
              const item = cart.find((i) => i.produto.id === p.id);
              return (
                <article className="food-card" key={p.id}>
                  <div className="food-photo">
                    <img
                      src={imagemUrl(fotoCardapio(p))}
                      alt={p.nome}
                      onError={() =>
                        setFalhas((prev) =>
                          prev.includes(p.id) ? prev : [...prev, p.id],
                        )
                      }
                      loading="lazy"
                    />
                    <span>
                      <Clock size={12} />
                      {p.tempo_preparo} min
                    </span>
                  </div>
                  <div className="food-body">
                    <span className="food-category">
                      {p.categoria_detalhe?.nome}
                    </span>
                    <h2>{p.nome}</h2>
                    <p>{p.descricao}</p>
                    <div className="food-footer">
                      <strong>{brl(p.preco)}</strong>
                      {item ? (
                        <div className="quantity-control">
                          <button
                            aria-label={`Diminuir ${p.nome}`}
                            onClick={() => quantidadeItem(p.id, -1)}
                          >
                            <Minus size={15} />
                          </button>
                          <span>{item.qtd}</span>
                          <button
                            disabled={item.qtd >= 99}
                            aria-label={`Aumentar ${p.nome}`}
                            onClick={() => quantidadeItem(p.id, 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="food-add"
                          onClick={() => adicionar(p)}
                          aria-label={`Adicionar ${p.nome}`}
                        >
                          <Plus size={17} /> Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <footer className="menu-footnote">
          Preços em reais · Consulte a equipe sobre alergênicos e restrições
          alimentares.
        </footer>
      </div>
      {!!quantidade && (
        <div className="cart-dock">
          <div>
            <span className="doca-sacola">
              <ShoppingBag size={20} />
              <b className="doca-qtd">
                {quantidade}
              </b>
            </span>
            <span>
              <strong>
                {quantidade} {quantidade === 1 ? "item" : "itens"} no pedido
              </strong>
              <small>Mesa {mesa.numero}</small>
            </span>
            <strong>{brl(total)}</strong>
          </div>
          <button onClick={() => setAberto(true)}>
            Revisar pedido <ArrowRight size={17} />
          </button>
        </div>
      )}
      <ChefIA raised={!!quantidade} produtoIds={produtos.map((p) => p.id)} />
      {aberto && (
        <div
          className="cart-overlay"
          onClick={() => !enviar.isPending && setAberto(false)}
        >
          <section
            className="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">MESA {mesa.numero}</span>
                <h2 id="cart-title">Seu pedido</h2>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                aria-label="Fechar pedido"
                onClick={() => setAberto(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="cart-items">
              {cart.length ? (
                cart.map((i) => (
                  <div className="cart-item" key={i.produto.id}>
                    <img
                      src={imagemUrl(fotoCardapio(i.produto))}
                      alt={i.produto.nome}
                    />
                    <div>
                      <strong>{i.produto.nome}</strong>
                      <span>{brl(Number(i.produto.preco) * i.qtd)}</span>
                    </div>
                    <div className="quantity-control">
                      <button
                        disabled={enviar.isPending}
                        aria-label={`Diminuir ${i.produto.nome}`}
                        onClick={() => quantidadeItem(i.produto.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{i.qtd}</span>
                      <button
                        disabled={enviar.isPending || i.qtd >= 99}
                        aria-label={`Aumentar ${i.produto.nome}`}
                        onClick={() => quantidadeItem(i.produto.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Seu pedido está vazio. Escolha um prato no cardápio.</p>
              )}
              <label className="cart-note">
                Alguma observação?
                <textarea
                  className="field"
                  rows={3}
                  maxLength={500}
                  disabled={enviar.isPending}
                  value={observacao}
                  onChange={(e) => {
                    setObservacao(e.target.value);
                    chave.current = null;
                  }}
                  placeholder="Ex.: sem cebola. Confirme alergias com o atendimento."
                />
              </label>
            </div>
            <footer>
              <div>
                <span>Total do pedido</span>
                <strong>{brl(total)}</strong>
              </div>
              <button
                className="btn btn-primary"
                disabled={!cart.length || enviar.isPending}
                onClick={finalizar}
              >
                {enviar.isPending ? (
                  <>
                    <Loader2 className="spin" size={17} /> Enviando…
                  </>
                ) : (
                  <>
                    Enviar para a cozinha <ArrowRight size={17} />
                  </>
                )}
              </button>
              <small>
                Revise os itens antes de confirmar. Pagamento com o atendimento.
              </small>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

/** Fundo da categoria escolhida: desliza de um botão para o outro. */
function PilulaAtiva() {
  return (
    <motion.span
      layoutId="categoria-ativa"
      className="cat-ativa"
      transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      aria-hidden
    />
  );
}
