/** Selo de pedido confirmado: o círculo e o check se desenham uma vez. */
export function SeloConfirmado({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <div className="selo" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 52 52" width={tamanho} height={tamanho} aria-hidden>
        <circle className="selo-circulo" cx="26" cy="26" r="24" />
        <path className="selo-check" fill="none" d="M15 27 l7 7 l15 -16" />
      </svg>
    </div>
  )
}
