'use client'

/**
 * Lê um arquivo de imagem, redimensiona para caber em maxDim e devolve um dataURL.
 * Mantém PNG (com transparência) para logos; usa JPEG para fotos de fundo.
 * Isso mantém o payload pequeno o suficiente para o localStorage.
 */
export function imageToDataUrl(
  file: File,
  opts: { maxDim: number; format: 'png' | 'jpeg'; quality?: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo precisa ser uma imagem.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('Imagem inválida.'))
      img.onload = () => {
        const scale = Math.min(1, opts.maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas indisponível.')); return }
        ctx.drawImage(img, 0, 0, w, h)
        const mime = opts.format === 'png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mime, opts.quality ?? 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
