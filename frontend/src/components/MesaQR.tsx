"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { urlDasMesas } from "@/lib/site";
export function MesaQR({ numero }: { numero: number }) {
  const [imagem, setImagem] = useState(""),
    [url, setURL] = useState(""),
    [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    const link = `${urlDasMesas()}/totem?mesa=${numero}`;
    QRCode.toDataURL(link, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1b2030", light: "#ffffff" },
    })
      .then((src) => {
        if (vivo) {
          setImagem(src);
          setURL(link);
        }
      })
      .catch(() => {
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, [numero]);
  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 16,
        textAlign: "center",
      }}
    >
      {imagem ? (
        <img
          src={imagem}
          width={280}
          height={280}
          alt={`QR code do cardápio da mesa ${numero}`}
        />
      ) : (
        <p>
          {erro
            ? "Não foi possível gerar o QR code. Use o link abaixo."
            : "Gerando QR code…"}
        </p>
      )}
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Aponte a câmera para abrir o cardápio na mesa {numero}.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary"
      >
        Abrir cardápio desta mesa
      </a>
      <button
        className="btn btn-ghost"
        onClick={() => navigator.clipboard.writeText(url)}
      >
        Copiar link
      </button>
    </div>
  );
}
