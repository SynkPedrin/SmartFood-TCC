"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  UtensilsCrossed,
  ClipboardList,
  Home,
  ChefHat,
  Palette,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { MascoteIA } from "./MascoteIA";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBrand } from "@/lib/brand/BrandContext";
import { MODO_SITE } from "@/lib/site";
const nav = [
  { href: "/admin", icon: LayoutDashboard, label: "Visão geral" },
  { href: "/admin/cardapio", icon: BookOpen, label: "Cardápio" },
  { href: "/admin/mesas", icon: UtensilsCrossed, label: "Salão e mesas" },
  { href: "/admin/pedidos", icon: ClipboardList, label: "Pedidos" },
  { href: "/admin/ia", icon: null, label: "Assistente IA" },
  { href: "/admin/personalizacao", icon: Palette, label: "Identidade da casa" },
];
export function AdminSidebar() {
  const pathname = usePathname(),
    router = useRouter(),
    { usuario, sair } = useAuth(),
    { brand } = useBrand();
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <div className="mobile-admin-bar">
        <BrandLogo size={30} />
        <strong>{brand.name}</strong>
        <button
          aria-label={aberto ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={aberto}
          onClick={() => setAberto(!aberto)}
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {aberto && (
        <div className="sidebar-overlay" onClick={() => setAberto(false)} />
      )}
      <aside className={`admin-sidebar-wrap ${aberto ? "open" : ""}`}>
        <Link href="/admin" className="admin-brand">
          <BrandLogo size={45} />
          <span className="sidebar-label">
            <strong>{brand.name}</strong>
            <small>GESTÃO DO RESTAURANTE</small>
          </span>
        </Link>
        <nav className="admin-navigation" aria-label="Administração">
          <span className="sidebar-section-label">WORKSPACE</span>
          {nav.map((n) => {
            const ativo =
              n.href === "/admin"
                ? pathname === n.href
                : pathname.startsWith(n.href);
            return (
              <Link
                href={n.href}
                key={n.href}
                onClick={() => setAberto(false)}
                aria-current={ativo ? "page" : undefined}
                title={n.label}
                className={`admin-nav-link ${ativo ? "active" : ""}`}
              >
                {n.icon ? <n.icon size={18} /> : <MascoteIA tamanho={20} parado />}
                <span className="sidebar-label">{n.label}</span>
                {n.href === "/admin/ia" && (
                  <small className="sidebar-label">IA</small>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/cozinha" title="Cozinha" className="admin-nav-link">
            <ChefHat size={18} />
            <span className="sidebar-label">Abrir cozinha</span>
          </Link>
          <Link href="/" title="Início" className="admin-nav-link">
            <Home size={18} />
            <span className="sidebar-label">
              {MODO_SITE === "equipe" ? "Área da equipe" : "Seleção de ambiente"}
            </span>
          </Link>
          {usuario && (
            <div className="admin-user">
              <div className="user-avatar">
                {(usuario.first_name || usuario.username)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <span className="sidebar-label">
                <strong>{usuario.first_name || usuario.username}</strong>
                <small>Equipe do restaurante</small>
              </span>
              <button
                title="Sair"
                aria-label="Sair da conta"
                onClick={async () => {
                  await sair();
                  router.replace("/entrar");
                }}
              >
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
