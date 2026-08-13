/** Utilidades de cor para derivar tons do acento white-label. */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
}

/** Escurece (amount<0) ou clareia (amount>0) uma cor hex. amount em [-1,1]. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  if (amount < 0) {
    const f = 1 + amount
    return rgbToHex(r * f, g * f, b * f)
  }
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

/** Luminância relativa simples (0..1), para decidir texto claro/escuro sobre a cor. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Retorna cor de texto legível (#ffffff ou ink) para um fundo dado. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.6 ? '#111111' : '#ffffff'
}

export function isHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
}
