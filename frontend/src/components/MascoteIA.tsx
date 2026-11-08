/**
 * Mascote da IA do SmartFood (o robô "SF"). É o ícone do assistente em todo o
 * sistema. Parado ele flutua de leve; enquanto a IA responde, balança como
 * quem está pensando. Com "reduzir movimento" fica imóvel.
 */
export function MascoteIA({
  tamanho = 32,
  pensando = false,
  parado = false,
}: {
  tamanho?: number
  /** A IA está gerando a resposta agora. */
  pensando?: boolean
  /** Sem animação (ex.: ícone de menu). */
  parado?: boolean
}) {
  const classes = ['mascote-ia', pensando && 'pensando', parado && 'parado'].filter(Boolean).join(' ')
  return (
    <span className={classes} style={{ width: tamanho, height: tamanho }} aria-hidden>
      <img
        src="/images/ia-smartfood.webp"
        srcSet="/images/ia-smartfood.webp 1x, /images/ia-smartfood@2x.webp 2x"
        width={tamanho}
        height={tamanho}
        alt=""
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
