"use client";
import Link from "next/link";
import { ArrowRight, ChefHat, LayoutDashboard, Lock, MonitorSmartphone } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useBrand } from "@/lib/brand/BrandContext";

/**
 * Entrada do site da equipe: dois postos de trabalho.
 * A cozinha abre direto (fica num monitor fixo, sem login);
 * a gestão pede usuário e senha.
 */
const acessos = [
  {
    href: "/cozinha",
    icon: ChefHat,
    nome: "Cozinha",
    texto: "Fila de pedidos por etapa, atualizada em tempo real.",
    selo: { icon: MonitorSmartphone, texto: "Sem login" },
    acao: "Abrir a cozinha",
    arte: "esquerda",
  },
  {
    href: "/admin",
    icon: LayoutDashboard,
    nome: "Gestor",
    texto: "Cardápio, mesas, pedidos, indicadores do dia e assistente.",
    selo: { icon: Lock, texto: "Com senha" },
    acao: "Entrar na gestão",
    arte: "direita",
  },
] as const;

export default function AreaDaEquipe() {
  const { brand } = useBrand();
  return (
    <main className="equipe com-wallpaper">
      <header className="equipe-topo">
        <div>
          <BrandLogo size={48} />
        </div>
        <div>
          <h1>Área da equipe</h1>
          <p>{brand.name}. Escolha o seu posto de trabalho.</p>
        </div>
      </header>

      <div className="equipe-cards">
        {acessos.map((a) => (
          <Link key={a.href} href={a.href} className="equipe-card">
            <div className={`equipe-arte arte-${a.arte}`} aria-hidden />
            <div className="equipe-corpo">
              <div className="equipe-linha">
                <h2>
                  <a.icon size={20} /> {a.nome}
                </h2>
                <span className="equipe-selo">
                  <a.selo.icon size={12} /> {a.selo.texto}
                </span>
              </div>
              <p>{a.texto}</p>
              <span className="equipe-acao">
                {a.acao} <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <footer className="equipe-rodape">{brand.name} · Projeto de TCC UniSalesiano 2026</footer>
    </main>
  );
}
