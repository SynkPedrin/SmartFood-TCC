"use client";
import Link from "next/link";
import {
  Monitor,
  ChefHat,
  LayoutDashboard,
  ArrowUpRight,
  ArrowRight,
  UtensilsCrossed,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useBrand } from "@/lib/brand/BrandContext";
const ambientes = [
  {
    href: "/totem",
    icon: Monitor,
    numero: "01",
    nome: "Quero fazer um pedido",
    papel: "PARA QUEM VEM À MESA",
    texto:
      "Explore o cardápio, encontre seu favorito e envie direto para a cozinha.",
    link: "Abrir cardápio",
  },
  {
    href: "/cozinha",
    icon: ChefHat,
    numero: "02",
    nome: "Vamos preparar",
    papel: "PARA A EQUIPE DA COZINHA",
    texto: "Acompanhe a fila em tempo real e organize cada etapa do preparo.",
    link: "Entrar na cozinha",
  },
  {
    href: "/admin",
    icon: LayoutDashboard,
    numero: "03",
    nome: "Quero gerir a operação",
    papel: "PARA A ADMINISTRAÇÃO",
    texto: "Cardápio, salão, indicadores e um assistente com os dados da casa.",
    link: "Abrir administração",
  },
];
export default function Home() {
  const { brand } = useBrand();
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          <BrandLogo size={48} />
          <strong>
            {brand.name}
            <small>RESTAURANT WORKSPACE</small>
          </strong>
        </Link>
        <Link href="/entrar" className="btn btn-ghost">
          Acesso da equipe <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">
            <UtensilsCrossed size={14} /> À MESA. NA COZINHA. NA GESTÃO.
          </span>
          <h1>
            Mais sabor.
            <br />
            Mais organização.
            <br />
            <em>Uma só operação.</em>
          </h1>
          <p>
            Uma experiência simples para quem pede.
            <br />
            Uma visão clara para quem faz acontecer.
          </p>
          <Link href="/totem" className="hero-cta">
            Conhecer o cardápio <ArrowRight size={18} />
          </Link>
          <div className="hero-detail">
            <span>
              <ClipboardCheck size={16} /> Pedidos conectados
            </span>
            <span>
              <Sparkles size={16} /> Assistência inteligente
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            className="hero-dish"
            src="/images/menu/burgers/bacon-burger.webp"
            alt="Bacon burger do cardápio SmartFood"
          />
          <div className="hero-caption">
            <span>BOA COMIDA, BOA OPERAÇÃO</span>
            <strong>
              Do primeiro pedido
              <br />à última entrega.
            </strong>
          </div>
          <div className="hero-mini">
            <img
              src="/images/menu/entradas/bruschetta.webp"
              alt="Bruschetta da casa"
            />
            <span>
              Escolha.
              <br />
              <strong>A cozinha cuida.</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="landing-modes">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEU AMBIENTE DE TRABALHO</span>
            <h2>Por onde começamos?</h2>
          </div>
          <p>
            Três ambientes conectados.
            <br />
            Cada pessoa no seu ritmo.
          </p>
        </div>
        <div className="mode-grid">
          {ambientes.map((a) => (
            <Link href={a.href} key={a.href} className="mode-card">
              <div className="mode-top">
                <a.icon size={23} />
                <span>{a.numero}</span>
              </div>
              <small>{a.papel}</small>
              <h3>{a.nome}</h3>
              <p>{a.texto}</p>
              <span className="mode-link">
                {a.link}
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="landing-footer">
        <span>{brand.name} · Gestão para restaurantes</span>
        <span>Projeto de TCC · UniSalesiano · 2026</span>
      </footer>
    </main>
  );
}
