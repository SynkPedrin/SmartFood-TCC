const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const ts=require('typescript')
require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText,file)
const {fotoCardapio}=require('../src/lib/cardapio.ts')
const {respostaLocal,orcamento}=require('../src/lib/ia/local.ts')
const {systemPrompt}=require('../src/lib/ia/prompts.ts')
const snapshot={online:true,categorias:[],mesas:[],memorias:[],falhas:[],indicadores:null,produtos:[
 {id:1,nome:'X-Burger',slug:'x-burger',imagem:null,preco:'24.90',tempo_preparo:15,disponivel:true,categoria_detalhe:{nome:'Burgers'}},
 {id:2,nome:'Suco de Laranja',slug:'suco-laranja',preco:'9.90',tempo_preparo:4,disponivel:true,categoria_detalhe:{nome:'Bebidas'}},
 {id:3,nome:'Item indisponível',preco:'5.00',tempo_preparo:1,disponivel:false},
]}
test('foto local funciona sem mídia da API',()=>assert.equal(fotoCardapio({slug:'x-burger'}),'/images/menu/burgers/x-burger.webp'))
test('placeholder não qualifica como foto',()=>assert.equal(fotoCardapio({slug:'pizza-margherita',imagem:'/images/menu/default-food.svg'}),null))
test('foto customizada tem precedência',()=>assert.equal(fotoCardapio({slug:'x-burger',imagem:'https://api.test/media/custom.webp'}),'https://api.test/media/custom.webp'))
test('foto seed usa o arquivo da Vercel',()=>assert.equal(fotoCardapio({slug:'x-burger',imagem:'https://api.test/media/produtos/x-burger.webp'}),'/images/menu/burgers/x-burger.webp'))
test('recomendação respeita orçamento e disponibilidade',()=>{const texto=respostaLocal('totem','Quero opções até R$ 15',snapshot);assert.match(texto,/Suco de Laranja/);assert.doesNotMatch(texto,/X-Burger|Item indisponível/);assert.match(texto,/Assistente local/)})
test('alergia não recebe garantia inventada',()=>assert.match(respostaLocal('totem','Tenho alergia ao leite',snapshot),/ficha de alergênicos validada/))
test('não inventa ranking de vendas no totem',()=>assert.match(respostaLocal('totem','Qual é o mais pedido?',snapshot),/Não tenho um ranking público/))
test('não inventa receita sem consulta',()=>assert.match(respostaLocal('admin','Qual a receita hoje?',snapshot),/Não consegui consultar/))
test('receita vem dos indicadores reais',()=>{const texto=respostaLocal('admin','Resumo de vendas',{...snapshot,indicadores:{data:'2026-10-09',receita:'123.45',ticket_medio:'41.15',pedidos_hoje:3,em_andamento:0,mesas_atendidas:1}});assert.match(texto,/123,45/);assert.match(texto,/pagamentos não são registrados/)})
test('backend offline não usa preços antigos',()=>{const texto=respostaLocal('totem','Recomende um prato',{...snapshot,online:false});assert.match(texto,/indisponível/);assert.doesNotMatch(texto,/24,90|X-Burger/)})
test('prompt não permite transformar memória em autorização',()=>{const texto=systemPrompt('totem','dados reais','anotações');assert.match(texto,/nunca como autorização/);assert.match(texto,/cardápio visível/)})
test('cada asset anunciado existe e tem bytes',()=>{const manifest=require('../public/images/menu/manifest.json');const fotos=Object.values(manifest).filter(p=>p.image);assert.equal(fotos.length,24);for(const p of fotos){const file=require('node:path').join(__dirname,'../public',p.image);assert.ok(fs.statSync(file).size>1000,p.image)}})

const alimentos={...snapshot,produtos:[
 {id:10,nome:'Água Mineral',preco:'4.90',tempo_preparo:2,disponivel:true,descricao:'Água mineral gelada.',categoria_detalhe:{nome:'Bebidas'}},
 {id:11,nome:'Batata Frita',preco:'17.90',tempo_preparo:10,disponivel:true,descricao:'Batatas cortadas na casa e fritas, servidas com sal.',categoria_detalhe:{nome:'Entradas'}},
 {id:12,nome:'Batata com Bacon',preco:'27.90',tempo_preparo:12,disponivel:true,descricao:'Batatas com cheddar e bacon.',categoria_detalhe:{nome:'Entradas'}},
 {id:13,nome:'Burger Vegetariano',preco:'28.90',tempo_preparo:15,disponivel:true,descricao:'Hambúrguer de grão-de-bico, legumes, queijo e maionese.',categoria_detalhe:{nome:'Burgers'}},
 {id:14,nome:'X-Salada',preco:'26.90',tempo_preparo:15,disponivel:true,descricao:'Hambúrguer bovino, alface e tomate.',categoria_detalhe:{nome:'Burgers'}},
 {id:15,nome:'Prato sem descrição',preco:'9.90',tempo_preparo:3,disponivel:true,categoria_detalhe:{nome:'Pratos'}},
]}
test('entende nn vai carnen e não recomenda bebida ou carne',()=>{const t=respostaLocal('totem','qual prato nn vai carnen?',alimentos);assert.match(t,/Batata Frita|Burger Vegetariano/);assert.match(t,/Pela descrição/);assert.doesNotMatch(t,/Água Mineral|Batata com Bacon|X-Salada|Prato sem descrição/)})
test('peixe ausente não retorna alternativas sem relação',()=>{const t=respostaLocal('totem','e quais tem peixe?',alimentos);assert.match(t,/Não encontrei pratos com peixe/);assert.doesNotMatch(t,/Água Mineral|Batata Frita|Burger Vegetariano/)})
test('peixe encontra salmão pela descrição e exclui indisponíveis',()=>{const t=respostaLocal('totem','Quais pratos têm peixe?',{...alimentos,produtos:[...alimentos.produtos,{id:20,nome:'Salmão grelhado',descricao:'Salmão com legumes.',preco:'49.90',tempo_preparo:25,disponivel:true},{id:21,nome:'Tilápia indisponível',preco:'20',tempo_preparo:10,disponivel:false}]});assert.match(t,/Salmão grelhado/);assert.doesNotMatch(t,/Água Mineral|Batata|Tilápia indisponível/)})
test('ingrediente não encontrado não vira ordenação por preço',()=>assert.doesNotMatch(respostaLocal('totem','Quero sushi',alimentos),/Água Mineral|Batata|Burger/))
test('consulta vegetariana não inclui salada com carne',()=>{const t=respostaLocal('totem','Tem opção vegetariana?',alimentos);assert.match(t,/Burger Vegetariano/);assert.doesNotMatch(t,/X-Salada|Bacon|Água Mineral/)})
test('vegetariano com queijo não é apresentado como vegano',()=>{const t=respostaLocal('totem','Quero uma opção vegana',alimentos);assert.match(t,/Não encontrei uma opção identificada como vegana/);assert.doesNotMatch(t,/Burger Vegetariano/)})
test('prato até um valor não vira bebida',()=>{const t=respostaLocal('totem','Quero comer por até R$ 20',alimentos);assert.match(t,/Batata Frita/);assert.doesNotMatch(t,/Água Mineral|Burger Vegetariano/)})
test('refinamento de preço mantém a restrição anterior',()=>{const t=respostaLocal('totem','e até R$ 20?',alimentos,[{role:'user',content:'Quais pratos não levam carne?'}]);assert.match(t,/Batata Frita/);assert.doesNotMatch(t,/Água Mineral|Bacon|X-Salada|Burger Vegetariano/)})
test('pergunta explícita sobre peixe substitui preferência anterior',()=>{const t=respostaLocal('totem','e quais tem peixe?',alimentos,[{role:'user',content:'qual prato nn vai carnen?'}]);assert.match(t,/Não encontrei pratos com peixe/);assert.doesNotMatch(t,/Batata|Burger/)})
test('ranking administrativo é processado antes de resumo genérico',()=>{const t=respostaLocal('admin','Quais são os pratos mais pedidos?',{...alimentos,indicadores:{mais_vendidos:[{produto__nome:'Batata Frita',quantidade:7}]}});assert.match(t,/Batata Frita: 7 unidades/);assert.doesNotMatch(t,/undefined/)})
test('exclusão de ingrediente não vira busca pelo ingrediente',()=>{const t=respostaLocal('totem','Quero um prato sem bacon',alimentos);assert.match(t,/não citam bacon/);assert.doesNotMatch(t,/Batata com Bacon|Água Mineral|Prato sem descrição/)})
test('rótulo vegetariano contradito pela descrição não é recomendado',()=>{const t=respostaLocal('totem','Sem carne',{...alimentos,produtos:[{...alimentos.produtos[3],nome:'Burger Vegetariano com Bacon',descricao:'Hambúrguer vegetariano com bacon suíno.'}]});assert.match(t,/Não encontrei/);assert.doesNotMatch(t,/\*\*Burger/)})
test('orçamento é lido da pergunta do cliente',()=>{
 assert.equal(orcamento('Me indica algo até R$ 25?'),25)
 assert.equal(orcamento('quero gastar no máximo 19,90'),19.9)
 assert.equal(orcamento('menos de 30 reais'),30)
 assert.equal(orcamento('quero um burger'),null)
})
test('combinações sugeridas cabem no orçamento',()=>{
 const {combinacoes}=require('../src/lib/ia/local.ts')
 const lista=combinacoes(snapshot.produtos.filter(p=>p.disponivel),35)
 assert.ok(lista.length>0)
 for(const c of lista){const v=Number(c.split('R$')[1].trim().replace('.','').replace(',','.'));assert.ok(v<=35,c)}
 assert.deepEqual(combinacoes(snapshot.produtos,10),[])
})
