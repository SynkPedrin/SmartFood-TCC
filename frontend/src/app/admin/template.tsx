/**
 * Template (e não layout) remonta a cada navegação: é o que faz cada tela do
 * admin entrar com a animação de página. Só anima na entrada e não deixa
 * transform aplicado depois, para não prender modais com position:fixed.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="entrada-pagina">{children}</div>
}
