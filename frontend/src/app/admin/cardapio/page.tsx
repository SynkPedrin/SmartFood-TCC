'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { categoriasApi, produtosApi } from '@/lib/api'
import type { Categoria, Produto, PaginatedResponse } from '@/types'
import { Modal } from '@/components/Modal'
import {
  Tag, ShoppingBag, Plus, Pencil, Trash2,
  Hash, AlignLeft, ToggleLeft, ToggleRight,
  Clock, CheckCircle, XCircle,
} from 'lucide-react'

/* ─── Types ─── */
type CatForm = { nome: string; descricao: string }
const EMPTY_CAT: CatForm = { nome: '', descricao: '' }

type ProdForm = {
  nome: string; descricao: string; preco: string
  categoria: string; disponivel: boolean; tempo_preparo: string
}
const EMPTY_PROD: ProdForm = { nome: '', descricao: '', preco: '', categoria: '', disponivel: true, tempo_preparo: '15' }

const ACCENTS = [
  { bg: 'rgba(160,107,255,.14)', border: 'rgba(160,107,255,.28)', dot: '#a78bfa' },
  { bg: 'rgba(0,224,184,.12)',  border: 'rgba(0,224,184,.24)',  dot: '#00e0b8' },
  { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.24)', dot: '#f59e0b' },
  { bg: 'rgba(244,63,94,.12)',  border: 'rgba(244,63,94,.22)',  dot: '#f43f5e' },
  { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.22)', dot: '#10b981' },
]

const cardAnim = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit:   { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

/* ══════════════════════════════════════════════
   CATEGORIAS TAB
══════════════════════════════════════════════ */
function CategoriasTab() {
  const qc = useQueryClient()
  const [form, setForm]     = useState<CatForm>(EMPTY_CAT)
  const [editId, setEditId] = useState<number | null>(null)
  const [modal, setModal]   = useState(false)

  const { data, isLoading } = useQuery<PaginatedResponse<Categoria>>({
    queryKey: ['categorias'], queryFn: categoriasApi.listar,
  })

  const salvar = useMutation({
    mutationFn: () => editId ? categoriasApi.atualizar(editId, form) : categoriasApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); toast.success(editId ? 'Categoria atualizada!' : 'Categoria criada!'); close() },
    onError:   () => toast.error('Erro ao salvar categoria.'),
  })

  const excluir = useMutation({
    mutationFn: (id: number) => categoriasApi.excluir(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['categorias'] }); toast.success('Categoria excluída.') },
    onError:    () => toast.error('Erro ao excluir.'),
  })

  function open(c?: Categoria) {
    setForm(c ? { nome: c.nome, descricao: c.descricao } : EMPTY_CAT)
    setEditId(c?.id ?? null)
    setModal(true)
  }
  function close() { setModal(false); setForm(EMPTY_CAT); setEditId(null) }

  const categorias = data?.results ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="subhead">Categorias</h2>
          <p className="page-sub">{isLoading ? 'Carregando…' : `${categorias.length} ${categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}`}</p>
        </div>
        <button onClick={() => open()} className="btn btn-primary">
          <Plus size={15} /> Nova categoria
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="glass-static" style={{ padding: 24, height: 140 }}><div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 12 }} /><div className="skeleton" style={{ height: 13, width: '70%' }} /></div>)}
        </div>
      )}

      {!isLoading && categorias.length === 0 && (
        <div className="empty glass-static">
          <div className="empty-icon"><Tag size={28} /></div>
          <p className="empty-title">Nenhuma categoria</p>
          <p className="empty-desc">Crie a primeira categoria para organizar o cardápio.</p>
          <button onClick={() => open()} className="btn btn-primary" style={{ marginTop: 20 }}><Plus size={14} /> Criar categoria</button>
        </div>
      )}

      {!isLoading && categorias.length > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {categorias.map((cat, idx) => {
              const a = ACCENTS[idx % ACCENTS.length]
              return (
                <motion.div key={cat.id} variants={cardAnim} exit="exit" layout className="glass" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${a.dot}, transparent)`, borderRadius: '16px 16px 0 0' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: a.bg, border: `1px solid ${a.border}`, fontSize: 11, fontWeight: 700, color: a.dot }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.dot }} />#{cat.id}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => open(cat)} className="btn btn-ghost btn-icon btn-sm"><Pencil size={13} /></button>
                      <button onClick={() => { if (!confirm(`Excluir "${cat.nome}"?`)) return; excluir.mutate(cat.id) }} className="btn btn-danger btn-icon btn-sm"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', marginBottom: 6 }}>{cat.nome}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(17,17,17,0.60)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {cat.descricao || <span style={{ color: 'rgba(17,17,17,0.35)', fontStyle: 'italic' }}>Sem descrição</span>}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, fontSize: 11, fontWeight: 700, color: cat.ativo ? '#10b981' : 'rgba(17,17,17,0.38)' }}>
                    {cat.ativo ? <><ToggleRight size={13} /> Ativa</> : <><ToggleLeft size={13} /> Inativa</>}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={modal} onClose={close} title={editId ? 'Editar Categoria' : 'Nova Categoria'}
        footer={<><button onClick={close} className="btn btn-ghost btn-sm">Cancelar</button><button onClick={() => salvar.mutate()} disabled={salvar.isPending || !form.nome.trim()} className="btn btn-primary btn-sm">{salvar.isPending ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}</button></>}
      >
        <form onSubmit={e => { e.preventDefault(); salvar.mutate() }}>
          <div className="form-row">
            <label className="label"><Hash size={9} style={{ display: 'inline', marginRight: 4 }} />Nome *</label>
            <input className="field" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Pratos Principais" required />
          </div>
          <div className="form-row">
            <label className="label"><AlignLeft size={9} style={{ display: 'inline', marginRight: 4 }} />Descrição</label>
            <textarea className="field" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva esta categoria (opcional)" rows={3} style={{ resize: 'vertical', minHeight: 80 }} />
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PRODUTOS TAB
══════════════════════════════════════════════ */
function ProdutosTab() {
  const qc = useQueryClient()
  const [form, setForm]     = useState<ProdForm>(EMPTY_PROD)
  const [editId, setEditId] = useState<number | null>(null)
  const [modal, setModal]   = useState(false)

  const { data, isLoading }  = useQuery<PaginatedResponse<Produto>>({ queryKey: ['produtos'],   queryFn: produtosApi.listar })
  const { data: catData }    = useQuery<PaginatedResponse<Categoria>>({ queryKey: ['categorias'], queryFn: categoriasApi.listar })

  const salvar = useMutation({
    mutationFn: () => editId ? produtosApi.atualizar(editId, form) : produtosApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['produtos'] }); toast.success(editId ? 'Produto atualizado!' : 'Produto criado!'); close() },
    onError:   () => toast.error('Erro ao salvar produto.'),
  })

  const excluir = useMutation({
    mutationFn: (id: number) => produtosApi.excluir(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['produtos'] }); toast.success('Produto excluído.') },
    onError:    () => toast.error('Erro ao excluir.'),
  })

  function open(p?: Produto) {
    setForm(p ? { nome: p.nome, descricao: p.descricao, preco: p.preco, categoria: String(p.categoria), disponivel: p.disponivel, tempo_preparo: String(p.tempo_preparo) } : EMPTY_PROD)
    setEditId(p?.id ?? null)
    setModal(true)
  }
  function close() { setModal(false); setForm(EMPTY_PROD); setEditId(null) }

  const produtos   = data?.results ?? []
  const categorias = catData?.results ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="subhead">Produtos</h2>
          <p className="page-sub">{isLoading ? 'Carregando…' : `${produtos.length} ${produtos.length === 1 ? 'produto no cardápio' : 'produtos no cardápio'}`}</p>
        </div>
        <button onClick={() => open()} className="btn btn-primary"><Plus size={15} /> Novo produto</button>
      </div>

      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="glass-static" style={{ padding: 22, height: 160 }}><div className="skeleton" style={{ height: 14, width: '55%', marginBottom: 10 }} /><div className="skeleton" style={{ height: 28, width: '35%', marginBottom: 14 }} /></div>)}
        </div>
      )}

      {!isLoading && produtos.length === 0 && (
        <div className="empty glass-static">
          <div className="empty-icon"><ShoppingBag size={28} /></div>
          <p className="empty-title">Nenhum produto</p>
          <p className="empty-desc">Adicione os primeiros itens ao cardápio.</p>
          <button onClick={() => open()} className="btn btn-primary" style={{ marginTop: 20 }}><Plus size={14} /> Adicionar produto</button>
        </div>
      )}

      {!isLoading && produtos.length > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {produtos.map(prod => (
              <motion.div key={prod.id} variants={cardAnim} exit="exit" layout className="glass" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {prod.categoria_detalhe && <span className="badge badge-purple" style={{ fontSize: 10 }}><Tag size={9} />{prod.categoria_detalhe.nome}</span>}
                    <span className={`badge ${prod.disponivel ? 'badge-ok' : 'badge-err'}`} style={{ fontSize: 10 }}>
                      {prod.disponivel ? <><CheckCircle size={9} /> Disponível</> : <><XCircle size={9} /> Indisponível</>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => open(prod)} className="btn btn-ghost btn-icon btn-sm"><Pencil size={12} /></button>
                    <button onClick={() => { if (!confirm(`Excluir "${prod.nome}"?`)) return; excluir.mutate(prod.id) }} className="btn btn-danger btn-icon btn-sm"><Trash2 size={12} /></button>
                  </div>
                </div>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', marginBottom: 6 }}>{prod.nome}</h3>
                {prod.descricao && <p style={{ fontSize: 12, color: 'rgba(17,17,17,0.58)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.descricao}</p>}
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 900, color: '#00e0b8', letterSpacing: '-0.04em' }}>
                    R$ {Number(prod.preco).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'rgba(17,17,17,0.45)' }}>
                    <Clock size={12} />{prod.tempo_preparo} min
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={modal} onClose={close} title={editId ? 'Editar Produto' : 'Novo Produto'}
        footer={<><button onClick={close} className="btn btn-ghost btn-sm">Cancelar</button><button onClick={() => salvar.mutate()} disabled={salvar.isPending || !form.nome.trim() || !form.preco || !form.categoria} className="btn btn-primary btn-sm">{salvar.isPending ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}</button></>}
      >
        <form onSubmit={e => { e.preventDefault(); salvar.mutate() }}>
          <div className="form-row">
            <label className="label">Nome *</label>
            <input className="field" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Frango Grelhado" required />
          </div>
          <div className="form-row">
            <label className="label">Descrição</label>
            <textarea className="field" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o produto" rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label className="label">Preço (R$) *</label>
              <input className="field" type="number" step="0.01" min="0" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="0,00" required />
            </div>
            <div className="form-row">
              <label className="label">Preparo (min)</label>
              <input className="field" type="number" min="1" value={form.tempo_preparo} onChange={e => setForm({ ...form, tempo_preparo: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="label">Categoria *</label>
            <select className="field" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} required>
              <option value="">Selecione uma categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.80)', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', cursor: 'pointer' }}
            onClick={() => setForm({ ...form, disponivel: !form.disponivel })}>
            {form.disponivel ? <ToggleRight size={22} style={{ color: '#10b981' }} /> : <ToggleLeft size={22} style={{ color: 'rgba(17,17,17,0.35)' }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>Disponível no cardápio</div>
              <div style={{ fontSize: 11, color: 'rgba(17,17,17,0.48)' }}>{form.disponivel ? 'Visível para os clientes' : 'Oculto'}</div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE - Tabs
══════════════════════════════════════════════ */
type Tab = 'categorias' | 'produtos'

export default function CardapioPage() {
  const [tab, setTab] = useState<Tab>('categorias')

  return (
    <div>
      {/* Section header + segmented control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-primary)' }}>Cardápio</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>Gerencie categorias e produtos do menu.</p>
        </div>
        <div className="segmented" role="tablist">
          {([
            { key: 'categorias', icon: Tag, label: 'Categorias' },
            { key: 'produtos', icon: ShoppingBag, label: 'Produtos' },
          ] as { key: Tab; icon: typeof Tag; label: string }[]).map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button key={t.key} role="tab" aria-selected={active} onClick={() => setTab(t.key)} className={active ? 'seg-active' : ''}>
                <Icon size={15} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {tab === 'categorias' ? <CategoriasTab /> : <ProdutosTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
