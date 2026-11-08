"use client";
import Link from "next/link";
import { ArrowUpRight, ChefHat, LayoutDashboard, Lock, Radio } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useBrand } from "@/lib/brand/BrandContext";

/**
 * Entrada do site da equipe: só dois caminhos.
 * A cozinha abre direto (fica num monitor fixo, sem login);
 * a gestão pede usuário e senha.
 */
const acessos = [
  {
    href: "/cozinha",
    icon: ChefHat,
    numero: "01",
    nome: "Cozinha",
    texto: "Fila de pedidos em tempo real, do recebido ao entregue.",
    selo: { icon: Radio, texto: "Acesso direto" },
    acao: "Abrir a cozinha",
    arte: "esquerda",
  },
  {
    href: "/admin",
    icon: LayoutDashboard,
    numero: "02",
    nome: "Gestor",
    texto: "Cardápio, salão, pedidos, indicadores e o assistente com IA.",
    selo: { icon: Lock, texto: "Requer senha" },
    acao: "Entrar na gestão",
    arte: "direita",
  },
] as const;

export default function AreaDaEquipe() {
  const { brand } = useBrand();
  return (
    <main className="equipe">
      <header className="equipe-topo">
        <span className="logo-halo">
          <BrandLogo size={96} />
        </span>
        <span className="eyebrow">
          <i className="pulso" aria-hidden /> ÁREA DA EQUIPE
        </span>
        <h1>
          {brand.name}
          <br />
          <em>por trás de cada prato.</em>
        </h1>
        <p>Escolha onde você vai trabalhar agora.</p>
      </header>

      <div className="equipe-cards">
        {acessos.map((a) => (
          <Link key={a.href} href={a.href} className="equipe-card luz">
            <div className={`equipe-arte arte-${a.arte}`} aria-hidden>
              <span className="equipe-icone">
                <a.icon size={28} />
              </span>
              <span className="equipe-numero">{a.numero}</span>
            </div>
            <div className="equipe-corpo">
              <span className="equipe-selo">
                <a.selo.icon size={13} /> {a.selo.texto}
              </span>
              <h2>{a.nome}</h2>
              <p>{a.texto}</p>
              <span className="equipe-acao">
                {a.acao} <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <footer className="equipe-rodape">
        {brand.name} · Gestão para restaurantes · Projeto de TCC UniSalesiano 2026
      </footer>
    </main>
  );
}
