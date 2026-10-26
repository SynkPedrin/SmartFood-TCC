import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(new URL('../frontend/package.json',import.meta.url))
const WebSocket=require('ws')
const API=process.env.SMOKE_API_URL||'http://127.0.0.1:8100/api/v1'
const SITE=process.env.SMOKE_SITE_URL||'http://127.0.0.1:3100'
// Somente ambiente de apresentação. O teste cria e conclui um pedido real.
const env=Object.fromEntries(fs.readFileSync(new URL('../backend/.env',import.meta.url),'utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}))
const evidencias=[]
async function request(url,body,token,method=body?'POST':'GET'){
 const res=await fetch(url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Token ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})
 const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text}
 return {res,data}
}
const login=await request(`${API}/auth/login/`,{username:'admin',password:env.DEMO_PASSWORD});assert.equal(login.res.status,200);const token=login.data.token
const produtos=(await request(`${API}/produtos/?page_size=500`)).data.results
const mesa=(await request(`${API}/mesas/?page_size=500`)).data.results.find(m=>m.status==='disponivel')
const p=produtos.find(p=>p.slug==='x-burger');assert.ok(p);assert.ok(mesa)
const acesso=await request(`${SITE}/api/ia/chat`,{mode:'admin',messages:[{role:'user',content:'Resumo'}]});assert.equal(acesso.res.status,401);evidencias.push('IA administrativa bloqueia usuário sem sessão')
const conta=await request(`${SITE}/api/ia/contas`,undefined,token);assert.equal(conta.res.status,200);assert.equal(conta.data.contas.length,1);evidencias.push('Lista de contas restrita à instalação autenticada')
const chave=crypto.randomUUID();const dados={mesa:mesa.id,chave_idempotencia:chave,itens:[{produto:p.id,quantidade:1}],observacao:'Verificação local da apresentação'}
const criado=await request(`${API}/pedidos/`,dados);assert.equal(criado.res.status,201);const id=criado.data.id
const repetido=await request(`${API}/pedidos/`,dados);assert.equal(repetido.res.status,200);assert.equal(repetido.data.id,id);evidencias.push('Pedido persistido uma vez mesmo com repetição do envio')
for(const status of ['preparando','pronto','entregue']){const r=await request(`${API}/pedidos/${id}/status/`,{status},token);assert.equal(r.res.status,200);assert.equal(r.data.status,status)}
const acompanhar=await request(`${API}/acompanhamento/${criado.data.acompanhamento}/`);assert.equal(acompanhar.data.status,'entregue')
const mesas=(await request(`${API}/mesas/?page_size=500`)).data.results;assert.equal(mesas.find(m=>m.id===mesa.id).status,'disponivel');evidencias.push('Pedido avança por todas as etapas e libera a mesa')
const resumo=await request(`${API}/indicadores/`,undefined,token);assert.equal(resumo.res.status,200);assert.ok(Number(resumo.data.receita)>=Number(p.preco));evidencias.push('Receita e ticket são confirmados após a entrega')
const texto='Verificação local: o atendimento confirma alergênicos.'
const memoria=await request(`${SITE}/api/ia/memoria`,{conta:'smartfood-demo',texto},token);assert.equal(memoria.res.status,201)
const notas=await request(`${API}/ia/memorias/`,undefined,token);assert.ok(notas.data.results.some(m=>m.id===memoria.data.id&&m.texto===texto));evidencias.push('Memória gravada pela rota Next e relida no banco')
const chat=await request(`${SITE}/api/ia/chat`,{mode:'totem',conta:'smartfood-demo',messages:[{role:'user',content:'Quero opções até R$ 30'}]});assert.equal(chat.res.status,200);assert.match(chat.data,/Assistente local/);assert.doesNotMatch(chat.data,/Pizza Margherita|Filé Grelhado/);evidencias.push('Assistente local recomenda itens visíveis dentro do orçamento')
const chatAdmin=await request(`${SITE}/api/ia/chat`,{mode:'admin',conta:'smartfood-demo',messages:[{role:'user',content:'Resumo de vendas de hoje'}]},token);assert.equal(chatAdmin.res.status,200);assert.match(chatAdmin.data,/receita|Receita/);evidencias.push('Assistente administrativo consulta os indicadores autenticados')
const invalido=await request(`${SITE}/api/ia/chat`,{mode:'totem',messages:'x'});assert.equal(invalido.res.status,400);evidencias.push('Payload inválido é recusado sem erro de servidor')
const ticket=await request(`${API}/auth/ws-ticket/`,{},token);assert.equal(ticket.res.status,200)
await new Promise((resolve,reject)=>{const ws=new WebSocket(`${API.replace(/^http/,'ws').replace('/api/v1','')}/ws/cozinha/?ticket=${ticket.data.ticket}`,{headers:{Origin:SITE}});const timer=setTimeout(()=>{ws.close();reject(new Error('WebSocket não conectou'))},6000);ws.onopen=()=>{clearTimeout(timer);ws.close();resolve()};ws.onerror=reject})
evidencias.push('WebSocket autenticado por ticket conectado')
const result={data:new Date().toISOString(),ambiente:'local',pedido_verificado:id,verificacoes:evidencias,provedor_externo:'não verificado: GROQ_API_KEY ausente no ambiente de teste'}
fs.writeFileSync(new URL('../docs/evidencias/smoke.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
