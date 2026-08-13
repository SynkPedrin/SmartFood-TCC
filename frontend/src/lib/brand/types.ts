/** Configuração white-label da conta. Persistida localmente hoje;
 *  arquitetada para sincronizar com a API da conta futuramente. */
export interface BrandConfig {
  /** Slug da conta. Chaveia a marca E o cérebro da IA (cerebro/Contas/<slug>/). */
  accountId: string
  /** Nome exibido no lugar de "SmartFood". */
  name: string
  /** Logo custom em dataURL, ou null para usar o padrão. */
  logo: string | null
  /** Cor de acento principal (hex). */
  accent: string
  /** Estilo do plano de fundo. */
  background: BackgroundStyle
  /** Imagem de fundo custom (dataURL), usada quando background === 'image'. */
  backgroundImage: string | null
}

export type BackgroundStyle = 'dots' | 'plain' | 'grid' | 'image'

export const DEFAULT_BRAND: BrandConfig = {
  accountId: 'smartfood-demo',
  name: 'SmartFood',
  logo: null,
  accent: '#6e56cf',
  background: 'dots',
  backgroundImage: null,
}

export const STORAGE_KEY = 'smartfood:brand'
