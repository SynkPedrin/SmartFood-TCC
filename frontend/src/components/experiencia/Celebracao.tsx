/**
 * Momento de confirmação do pedido: um selo que se desenha e uma chuva curta
 * de confete saindo dele. Tudo em CSS; com "reduzir movimento" fica só o selo.
 */

/** Pseudoaleatório determinístico: o mesmo índice sempre gera a mesma peça. */
function semente(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const CORES = ['var(--primary)', '#10b981', '#f59e0b', '#ef4466', '#38bdf8', 'var(--primary-strong)']

const PECAS = Array.from({ length: 42 }, (_, i) => {
  const angulo = semente(i, 1) * Math.PI * 2
  const alcance = 140 + semente(i, 2) * 260
  return {
    tx: Math.cos(angulo) * alcance,
    ty: Math.sin(angulo) * alcance * 0.7 - 80,
    queda: 120 + semente(i, 3) * 220,
    giro: Math.round(semente(i, 4) * 720 - 360),
    atraso: Math.round(semente(i, 5) * 160),
    cor: CORES[i % CORES.length],
    forma: i % 3,
  }
})

export function SeloConfirmado({ tamanho = 84 }: { tamanho?: number }) {
  return (
    <div className="selo" style={{ width: tamanho, height: tamanho }}>
      <div className="selo-halo" />
      <svg viewBox="0 0 52 52" width={tamanho} height={tamanho} aria-hidden>
        <circle className="selo-circulo" cx="26" cy="26" r="24" fill="none" />
        <path className="selo-check" fill="none" d="M15 27 l7 7 l15 -16" />
      </svg>
      <div className="confete" aria-hidden>
        {PECAS.map((p, i) => (
          <i
            key={i}
            data-forma={p.forma}
            style={{
              '--tx': `${p.tx.toFixed(0)}px`,
              '--ty': `${p.ty.toFixed(0)}px`,
              '--queda': `${p.queda.toFixed(0)}px`,
              '--giro': `${p.giro}deg`,
              '--atraso': `${p.atraso}ms`,
              '--cor': p.cor,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
