import manifest from "../../public/images/menu/manifest.json";
interface FotoProduto {
  slug?: string | null;
  imagem?: string | null;
}
const fotos = manifest as Record<string, { image: string | null }>;
export function fotoCardapio(produto: FotoProduto): string | null {
  const local = produto.slug ? fotos[produto.slug]?.image : null;
  const imagem = produto.imagem;
  if (
    local &&
    (!imagem ||
      imagem.includes(`/produtos/${produto.slug}.`) ||
      imagem.includes("default-food"))
  )
    return local;
  if (
    imagem &&
    !imagem.includes("default-food") &&
    !imagem.includes("placeholder")
  )
    return imagem;
  return local ?? null;
}
