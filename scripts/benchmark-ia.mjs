// Benchmark da IA do SmartFood: perguntas simples, médias e complexas, nos modos
// admin e totem, com tempo até a primeira palavra, tempo total, motor usado e
// conferência da resposta contra os dados reais da API.
//
//   node scripts/benchmark-ia.mjs                 # usa a apresentação local
//   SITE=https://... API=https://.../api/v1 ROTULO=producao node scripts/benchmark-ia.mjs
//
// Lê a senha do admin em backend/.env (DEMO_PASSWORD). Não grava nada no banco.
import fs from 'node:fs'

const SITE = process.env.SITE || 'http://127.0.0.1:3100'
const API = process.env.API || 'http://127.0.0.1:8100/api/v1'
const ROTULO = process.env.ROTULO || 'local'
const env = Object.fromEntries(
  fs.readFileSync(new URL('../backend/.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)
const json = async (url, opts) => (await fetch(url, opts)).json()
const token = (await json(`${API}/auth/login/`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: 'admin', password: env.DEMO_PASSWORD})})).token
if (!token) throw new Error('Login do admin falhou: confira DEMO_PASSWORD em backend/.env')
const auth = {Authorization: `Token ${token}`}

// Dados de referência, lidos da API no momento do teste.
const produtos = (await json(`${API}/produtos/?page_size=500`)).results.filter((p) => p.disponivel && p.imagem)
const mesas = (await json(`${API}/mesas/?page_size=500`)).results
const ind = await json(`${API}/indicadores/`, {headers: auth})
const brl = (v) => Number(v).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
const preco = (nome) => produtos.find((p) => p.nome === nome)?.preco
const maisCaro = [...produtos].sort((a, b) => b.preco - a.preco)[0]
const bebidas = produtos.filter((p) => p.categoria_detalhe?.nome === 'Bebidas').sort((a, b) => a.preco - b.preco)
const livres = mesas.filter((m) => m.status === 'disponivel').length
const citados = (txt) => produtos.filter((p) => txt.includes(p.nome))
const valores = (txt) => [...txt.matchAll(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/g)].map((m) => Number(m[1].replace(/\./g, '').replace(',', '.')))
const comCarne = ['X-Burger', 'X-Salada', 'Bacon Burger', 'Duplo Cheddar', 'Iscas de Frango', 'Combo Burger', 'Mini Burger com Fritas', 'Frango Empanado com Fritas']

const CASOS = [
  // ── simples: um dado, uma resposta
  {nivel: 'simples', modo: 'admin', q: 'Quantos produtos temos no cardápio?', ok: (t) => t.includes(String(produtos.length))},
  {nivel: 'simples', modo: 'admin', q: 'Quantas mesas estão livres agora?', ok: (t) => new RegExp(`\\b${livres}\\b`).test(t)},
  {nivel: 'simples', modo: 'admin', q: 'Qual a receita de hoje?', ok: (t) => t.includes(brl(ind.receita))},
  {nivel: 'simples', modo: 'admin', q: 'Qual o item mais caro do cardápio?', ok: (t) => t.includes(maisCaro.nome)},
  {nivel: 'simples', modo: 'totem', q: 'Quanto custa o X-Burger?', ok: (t) => t.includes(brl(preco('X-Burger')))},
  {nivel: 'simples', modo: 'totem', q: 'Qual a bebida mais barata?', ok: (t) => t.includes(bebidas[0].nome)},
  // ── médias: filtrar, combinar, respeitar restrição
  {nivel: 'media', modo: 'totem', q: 'Me indica um lanche e uma bebida até R$ 35', ok: (t) => citados(t).length >= 2 && valores(t).every((v) => v <= 35)},
  {nivel: 'media', modo: 'totem', q: 'Tem alguma opção sem carne?', ok: (t) => !comCarne.some((n) => new RegExp(`${n}[^.\\n]{0,40}(sem carne|não (tem|contém) carne)`, 'i').test(t))},
  {nivel: 'media', modo: 'admin', q: 'Quais categorias têm menos itens?', ok: (t) => /Sobremesas/.test(t)},
  {nivel: 'media', modo: 'admin', q: 'Tem algum pedido atrasado ou parado na cozinha?', ok: (t) => t.length > 20},
  // ── complexas: análise e plano de ação
  {nivel: 'complexa', modo: 'admin', q: 'Faça um diagnóstico do restaurante agora e diga as 3 ações mais importantes.', ok: (t) => /Sobremesa/i.test(t) && /\b(1|2|3)[.)]/.test(t)},
  {nivel: 'complexa', modo: 'admin', q: 'Monte uma promoção para terça-feira usando itens do cardápio, com preço sugerido.', ok: (t) => citados(t).length >= 2 && /ter[cç]a/i.test(t)},
  {nivel: 'complexa', modo: 'admin', q: 'Analise o cardápio: preços, lacunas e o que melhorar.', ok: (t) => citados(t).length >= 2 || /Sobremesa/i.test(t)},
]

async function perguntar(caso) {
  const t0 = performance.now()
  const res = await fetch(`${SITE}/api/ia/chat`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...(caso.modo === 'admin' ? auth : {})},
    body: JSON.stringify({mode: caso.modo, conta: 'smartfood-demo', messages: [{role: 'user', content: caso.q}]}),
  })
  const leitor = res.body.getReader()
  const dec = new TextDecoder()
  let texto = '', primeira = null
  for (;;) {
    const {done, value} = await leitor.read()
    if (done) break
    const pedaco = dec.decode(value, {stream: true})
    if (primeira === null && pedaco.trim()) primeira = performance.now() - t0
    texto += pedaco
  }
  return {motor: res.headers.get('x-assistente'), primeira: (primeira ?? performance.now() - t0) / 1000, total: (performance.now() - t0) / 1000, texto}
}

// Aquece o modelo para medir o uso real, não o carregamento.
await perguntar({modo: 'totem', q: 'oi'})
const linhas = []
for (const caso of CASOS) {
  const r = await perguntar(caso)
  linhas.push({...caso, ok: caso.ok(r.texto), motor: r.motor, primeira: r.primeira, total: r.total, resposta: r.texto.replace(/\s+/g, ' ').slice(0, 220)})
  console.log(`${linhas.at(-1).ok ? 'OK   ' : 'ERRO '} ${caso.nivel.padEnd(8)} ${caso.modo.padEnd(5)} ${r.motor?.padEnd(6)} 1ª ${r.primeira.toFixed(1).padStart(5)}s  total ${r.total.toFixed(1).padStart(5)}s  ${caso.q}`)
}
const mediana = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0 }
const resumo = Object.fromEntries(['simples', 'media', 'complexa'].map((n) => {
  const g = linhas.filter((l) => l.nivel === n)
  return [n, {acertos: `${g.filter((l) => l.ok).length}/${g.length}`, primeira_mediana_s: +mediana(g.map((l) => l.primeira)).toFixed(2), total_mediano_s: +mediana(g.map((l) => l.total)).toFixed(2)}]
}))
console.log('\nResumo:', JSON.stringify(resumo))
const destino = new URL(`../docs/evidencias/benchmark-ia-${ROTULO}.json`, import.meta.url)
fs.writeFileSync(destino, JSON.stringify({data: new Date().toISOString(), site: SITE, resumo, casos: linhas.map(({ok: _ok, ...l}) => ({...l, acertou: _ok}))}, null, 2) + '\n')
console.log(`Detalhes em docs/evidencias/benchmark-ia-${ROTULO}.json`)
