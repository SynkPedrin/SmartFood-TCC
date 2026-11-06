// Porta de entrada do Ollama para a internet (usada por scripts/publicar.sh).
//
// O Ollama não tem autenticação. Exposto direto pelo túnel, qualquer pessoa usaria
// a GPU deste Mac e os outros modelos instalados. Este proxy só deixa passar
// POST /api/chat com a chave certa e sempre com o modelo configurado.
//
//   OLLAMA_PROXY_KEY=... OLLAMA_MODEL=qwen3.5:9b node scripts/ollama-proxy.mjs
import http from 'node:http'
import {timingSafeEqual} from 'node:crypto'

const CHAVE = process.env.OLLAMA_PROXY_KEY || ''
const MODELO = process.env.OLLAMA_MODEL || 'qwen3.5:9b'
const PORTA = Number(process.env.OLLAMA_PROXY_PORT || 11435)
const DESTINO = new URL(process.env.OLLAMA_LOCAL_URL || 'http://127.0.0.1:11434')
const LIMITE = 200_000 // bytes: o prompt do SmartFood tem cerca de 30 KB

if (CHAVE.length < 32) {
  console.error('Defina OLLAMA_PROXY_KEY com pelo menos 32 caracteres.')
  process.exit(1)
}

const autorizado = (cabecalho = '') => {
  const recebido = Buffer.from(cabecalho)
  const esperado = Buffer.from(`Bearer ${CHAVE}`)
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado)
}

const recusar = (res, status, erro) => {
  res.writeHead(status, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({error: erro}))
}

http
  .createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/api/chat') return recusar(res, 404, 'não encontrado')
    if (!autorizado(req.headers.authorization)) return recusar(res, 401, 'chave inválida')
    const partes = []
    let tamanho = 0
    req.on('data', (p) => {
      tamanho += p.length
      if (tamanho > LIMITE) req.destroy()
      else partes.push(p)
    })
    req.on('end', () => {
      let corpo
      try {
        corpo = JSON.parse(Buffer.concat(partes).toString('utf8'))
      } catch {
        return recusar(res, 400, 'JSON inválido')
      }
      corpo.model = MODELO
      const dados = Buffer.from(JSON.stringify(corpo))
      const ida = http.request(
        {
          hostname: DESTINO.hostname,
          port: DESTINO.port,
          path: '/api/chat',
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Content-Length': dados.length},
        },
        (volta) => {
          res.writeHead(volta.statusCode ?? 502, {'Content-Type': volta.headers['content-type'] ?? 'application/x-ndjson'})
          volta.pipe(res)
        },
      )
      ida.on('error', () => recusar(res, 502, 'Ollama indisponível'))
      res.on('close', () => ida.destroy())
      ida.end(dados)
    })
  })
  .listen(PORTA, '127.0.0.1', () => console.log(`Proxy do Ollama em http://127.0.0.1:${PORTA} → ${DESTINO.origin} (${MODELO})`))
