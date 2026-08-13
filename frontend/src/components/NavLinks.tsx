"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/categorias", label: "Categorias" },
  { href: "/produtos",   label: "Produtos"   },
  { href: "/mesas",      label: "Mesas"      },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: "14px",
              fontWeight: active ? 600 : 500,
              color: active ? "#5246C8" : "#555",
              textDecoration: "none",
              borderBottom: active ? "2px solid #5246C8" : "2px solid transparent",
              paddingBottom: "2px",
            }}
          >
            {label}
          </Link>
        );
      })}
      <a
        href="http://localhost:8000/api/v1/docs/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: "14px", fontWeight: 500, color: "#555", textDecoration: "none" }}
      >
        API Docs ↗
      </a>
    </nav>
  );
}
