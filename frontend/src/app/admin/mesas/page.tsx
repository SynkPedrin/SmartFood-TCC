'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { mesasApi } from '@/lib/api'
import type { Mesa, PaginatedResponse } from '@/types'
import { Modal } from '@/components/Modal'
import { UtensilsCrossed, Plus, Pencil, Trash2, Users, CheckCircle, XCircle, Clock, Wrench } from 'lucide-react'

type Form = { numero: string; capacidade: string; status: Mesa['status'] }
const EMPTY: Form = { numero: '', capacidade: '4', status: 'disponivel' }

const STATUS_CFG: Record<Mesa['status'], { label: string; cls: string; badgeCls: string; dotCls: string; icon: React.ReactNode; color: string }> = {
  disponivel: { label: 'Disponível',  cls: 'mesa-ok',   badgeCls: 'badge-ok',   dotCls: 'dot-ok',   icon: <CheckCircle size={20} />, color: '#10b981' },
  ocupada:    { label: 'Ocupada',     cls: 'mesa-err',  badgeCls: 'badge-err',  dotCls: 'dot-err',  icon: <XCircle     size={20} />, color: '#ef4444' },
  reservada:  { label: 'Reservada',   cls: 'mesa-warn', badgeCls: 'badge-warn', dotCls: 'dot-warn', icon: <Clock       size={20} />, color: '#f59e0b' },
  manutencao: { label: 'Manutenção',  cls: 'mesa-gray', badgeCls: 'badge-gray', dotCls: 'dot-gray', icon: <Wrench      size={20} />, color: '#6b7280' },
}

const LEGEND = Object.entries(STATUS_CFG).map(([k, v]) => ({ key: k as Mesa['status'], ...v }))

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const cardAnim = {
  hidden: { opacity: 0, scale: 0.82 },
  show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit:   { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
}

export default function MesasPage() {
  const qc = useQueryClient()
  const [form, setForm]   = useState<Form>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [modal, setModal] = useState(false)

  const { data, isLoading } = useQuery<PaginatedResponse<Mesa>>({
    queryKey: ['mesas'], queryFn: mesasApi.listar,
  })

  const salvar = useMutation({
    mutationFn: () => editId ? mesasApi.atualizar(editId, form) : mesasApi.criar(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mesas'] }); toast.success(editId ? 'Mesa atualizada!' : 'Mesa criada!'); close() },
    onError:   () => toast.error('Erro ao salvar mesa.'),
  })

  const excluir = useMutation({
    mutationFn: (id: number) => mesasApi.excluir(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mesas'] }); toast.success('Mesa removida.') },
    onError:   () => toast.error('Erro ao excluir mesa.'),
  })

  function open(m?: Mesa) {
    setForm(m ? { numero: String(m.numero), capacidade: String(m.capacidade), status: m.status } : EMPTY)
    setEditId(m?.id ?? null)
    setModal(true)
  }
  function close() { setModal(false); setForm(EMPTY); setEditId(null) }

  const mesas  = data?.results ?? []
  const counts = LEGEND.map(l => ({ ...l, count: mesas.filter(m => m.status === l.key).length }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas</h1>
          <p className="page-sub">{isLoading ? '...' : `${mesas.length} mesas cadastradas`}</p>
        </div>
        <button onClick={() => open()} className="btn btn-primary"><Plus size={15} /> Nova mesa</button>
      </div>

      {/* Status legend */}
      {!isLoading && mesas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {counts.map(s => (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.80)',
              border: '1px solid var(--border)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              fontSize: 13, minHeight: 46,
            }}>
              <span className={`dot ${s.dotCls}`} />
              <span style={{ color: 'rgba(17,17,17,0.62)', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 17, color: '#111111' }}>{s.count}</span>
            </div>
          ))}
        </motion.div>
      )}

      {isLoading && (
        <div className="floor-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 20 }} />)}</div>
      )}

      {!isLoading && mesas.length === 0 && (
        <div className="empty glass-static">
          <div className="empty-icon"><UtensilsCrossed size={28} /></div>
          <p className="empty-title">Nenhuma mesa</p>
          <p className="empty-desc">Adicione as mesas do restaurante para visualizá-las no mapa.</p>
          <button onClick={() => open()} className="btn btn-primary" style={{ marginTop: 20 }}><Plus size={14} /> Adicionar mesa</button>
        </div>
      )}

      {!isLoading && mesas.length > 0 && (
        <motion.div className="floor-grid" variants={stagger} initial="hidden" animate="show">
          <AnimatePresence mode="popLayout">
            {mesas.map(mesa => {
              const cfg = STATUS_CFG[mesa.status]
              return (
                <motion.div key={mesa.id} variants={cardAnim} exit="exit" layout className={`mesa-card ${cfg.cls}`}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', color: '#111111', lineHeight: 1 }}>
                    {mesa.numero}
                  </div>
                  <div style={{ color: cfg.color, opacity: 0.85 }}>{cfg.icon}</div>
                  <span className={`badge ${cfg.badgeCls}`} style={{ fontSize: 10 }}>
                    <span className={`dot ${cfg.dotCls}`} />{cfg.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'rgba(17,17,17,0.55)' }}>
                    <Users size={10} /> {mesa.capacidade}
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, opacity: 0, transition: 'opacity .2s' }} className="mesa-actions">
                    <button onClick={e => { e.stopPropagation(); open(mesa) }} className="btn btn-ghost btn-icon btn-xs" style={{ width: 28, height: 28, borderRadius: 7 }}><Pencil size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); if (!confirm(`Excluir Mesa ${mesa.numero}?`)) return; excluir.mutate(mesa.id) }} className="btn btn-danger btn-icon btn-xs" style={{ width: 28, height: 28, borderRadius: 7 }}><Trash2 size={10} /></button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <style jsx global>{`.mesa-card:hover .mesa-actions { opacity: 1 !important; }`}</style>

      <Modal open={modal} onClose={close} title={editId ? 'Editar Mesa' : 'Nova Mesa'}
        footer={<><button onClick={close} className="btn btn-ghost btn-sm">Cancelar</button><button onClick={() => salvar.mutate()} disabled={salvar.isPending || !form.numero} className="btn btn-primary btn-sm">{salvar.isPending ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}</button></>}
      >
        <form onSubmit={e => { e.preventDefault(); salvar.mutate() }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label className="label">Número *</label>
              <input className="field" type="number" min="1" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="1" required />
            </div>
            <div className="form-row">
              <label className="label">Capacidade</label>
              <input className="field" type="number" min="1" value={form.capacidade} onChange={e => setForm({ ...form, capacidade: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="label">Status</label>
            <select className="field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Mesa['status'] })}>
              {LEGEND.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.75)', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${STATUS_CFG[form.status].badgeCls}`}><span className={`dot ${STATUS_CFG[form.status].dotCls}`} />{STATUS_CFG[form.status].label}</span>
            <span style={{ fontSize: 12, color: 'rgba(17,17,17,0.40)' }}>prévia do status</span>
          </div>
        </form>
      </Modal>
    </div>
  )
}
