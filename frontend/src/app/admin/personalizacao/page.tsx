'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Palette, Upload, Trash2, RotateCcw, Check, ArrowRight, Brain } from 'lucide-react'
import { useBrand } from '@/lib/brand/BrandContext'
import { BrandLogo } from '@/components/BrandLogo'
import { imageToDataUrl } from '@/lib/brand/image'
import { readableOn } from '@/lib/brand/color'
import { useContasCerebro } from '@/lib/ia/useContas'
import type { BackgroundStyle } from '@/lib/brand/types'

const ACCENT_PRESETS = [
  { hex: '#6e56cf', name: 'Violeta' },
  { hex: '#3f9e8c', name: 'Sálvia' },
  { hex: '#2f6fed', name: 'Azul' },
  { hex: '#c2603f', name: 'Terracota' },
  { hex: '#b08423', name: 'Ocre' },
  { hex: '#16161a', name: 'Grafite' },
]

const BACKGROUNDS: { id: BackgroundStyle; label: string; hint: string }[] = [
  { id: 'dots', label: 'Pontos', hint: 'Plano infinito com parallax sutil' },
  { id: 'grid', label: 'Grade', hint: 'Grade fina e discreta' },
  { id: 'plain', label: 'Liso', hint: 'Somente o creme da marca' },
  { id: 'image', label: 'Imagem', hint: 'Sua foto, com véu para leitura' },
]

export default function PersonalizacaoPage() {
  const { brand, update, reset } = useBrand()
  const logoInput = useRef<HTMLInputElement>(null)
  const bgInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const { contas, disponivel, carregando } = useContasCerebro()
  const contaAtiva = contas.find(c => c.slug === brand.accountId)

  /** Trocar de conta troca a marca E o cérebro que responde na IA. */
  function trocarConta(slug: string) {
    const c = contas.find(x => x.slug === slug)
    if (!c) return
    update({ accountId: c.slug, name: c.nome, ...(c.accent ? { accent: c.accent } : {}) })
    toast.success(`Conta ativa: ${c.nome}`)
  }

  async function onLogo(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await imageToDataUrl(file, { maxDim: 256, format: 'png' })
      update({ logo: dataUrl })
      toast.success('Logo atualizado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao processar imagem')
    } finally {
      setBusy(false)
    }
  }

  async function onBgImage(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await imageToDataUrl(file, { maxDim: 1600, format: 'jpeg', quality: 0.8 })
      update({ backgroundImage: dataUrl, background: 'image' })
      toast.success('Fundo atualizado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao processar imagem')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--ink)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
              <Palette size={16} style={{ color: '#ffffff' }} />
            </div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Personalização</h1>
          </div>
          <p className="page-sub">Identidade white-label da conta: logo, plano de fundo e cor</p>
        </div>
        <button onClick={() => { reset(); toast.success('Restaurado ao padrão') }} className="btn btn-ghost btn-sm" style={{ gap: 7 }}>
          <RotateCcw size={13} /> Restaurar padrão
        </button>
      </motion.div>

      <div className="brand-grid">
        {/* ── Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Conta ativa + cérebro */}
          <section className="brand-card">
            <h2 className="brand-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={15} style={{ color: 'var(--terracotta)' }} /> Conta ativa
            </h2>
            <p className="brand-card-hint">
              Cada conta tem um cérebro próprio no vault (<code>cerebro/Contas/&lt;slug&gt;/</code>).
              Trocar aqui troca a marca e a memória que a IA usa para responder.
            </p>

            {carregando ? (
              <p className="brand-card-hint" style={{ marginTop: 12 }}>Lendo o vault…</p>
            ) : !disponivel ? (
              <p className="brand-card-hint" style={{ marginTop: 12 }}>
                Vault do cérebro não encontrado. Defina <code>CEREBRO_DIR</code> apontando para a
                pasta <code>cerebro/</code> do projeto.
              </p>
            ) : (
              <>
                <select
                  className="field"
                  value={brand.accountId}
                  onChange={e => trocarConta(e.target.value)}
                  style={{ marginTop: 12 }}
                >
                  {!contaAtiva && <option value={brand.accountId}>{brand.accountId} (sem cérebro)</option>}
                  {contas.map(c => (
                    <option key={c.slug} value={c.slug}>
                      {c.nome} · {c.slug}
                    </option>
                  ))}
                </select>

                {contaAtiva && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {contaAtiva.iaNome && (
                      <span className="badge">IA: {contaAtiva.iaNome}</span>
                    )}
                    {contaAtiva.segmento && <span className="badge">{contaAtiva.segmento}</span>}
                    {contaAtiva.plano && <span className="badge">plano {contaAtiva.plano}</span>}
                  </div>
                )}
                {contaAtiva?.iaTom && (
                  <p className="brand-card-hint" style={{ marginTop: 10 }}>
                    Tom de voz: {contaAtiva.iaTom}
                  </p>
                )}
              </>
            )}
          </section>

          {/* Nome */}
          <section className="brand-card">
            <h2 className="brand-card-title">Nome da conta</h2>
            <p className="brand-card-hint">Exibido no cabeçalho das telas no lugar de “SmartFood”.</p>
            <input
              className="field"
              value={brand.name}
              maxLength={28}
              onChange={e => update({ name: e.target.value })}
              placeholder="Nome do restaurante"
              style={{ marginTop: 12 }}
            />
          </section>

          {/* Logo */}
          <section className="brand-card">
            <h2 className="brand-card-title">Logo</h2>
            <p className="brand-card-hint">PNG com fundo transparente fica melhor. Redimensionamos automaticamente.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
              <BrandLogo size={64} radius={16} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => logoInput.current?.click()} disabled={busy}
                  style={{ background: 'var(--terracotta)', color: '#ffffff', border: '2px solid var(--ink)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                  <Upload size={13} /> Enviar logo
                </button>
                {brand.logo && (
                  <button className="btn btn-ghost btn-sm" onClick={() => update({ logo: null })}>
                    <Trash2 size={13} /> Remover
                  </button>
                )}
              </div>
              <input ref={logoInput} type="file" accept="image/*" hidden onChange={e => onLogo(e.target.files?.[0])} />
            </div>
          </section>

          {/* Accent */}
          <section className="brand-card">
            <h2 className="brand-card-title">Cor de acento</h2>
            <p className="brand-card-hint">Aplica em botões, destaques e elementos de marca.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center' }}>
              {ACCENT_PRESETS.map(p => {
                const active = brand.accent.toLowerCase() === p.hex.toLowerCase()
                return (
                  <button
                    key={p.hex}
                    onClick={() => update({ accent: p.hex })}
                    title={p.name}
                    aria-label={p.name}
                    style={{
                      width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
                      background: p.hex,
                      border: `2.5px solid ${active ? 'var(--ink)' : 'rgba(17,17,17,0.2)'}`,
                      boxShadow: active ? '0 6px 16px rgba(0,0,0,0.06)' : '0 6px 16px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {active && <Check size={16} style={{ color: readableOn(p.hex) }} />}
                  </button>
                )
              })}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
                <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', display: 'inline-block' }}>
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(brand.accent) ? brand.accent : '#7b2eff'}
                    onChange={e => update({ accent: e.target.value })}
                    style={{ position: 'absolute', inset: -6, width: 'calc(100% + 12px)', height: 'calc(100% + 12px)', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
                    aria-label="Escolher cor personalizada"
                  />
                </span>
                <span className="brand-card-hint" style={{ margin: 0 }}>Personalizada</span>
              </label>
            </div>
          </section>

          {/* Background */}
          <section className="brand-card">
            <h2 className="brand-card-title">Plano de fundo</h2>
            <p className="brand-card-hint">Discreto por padrão. O conteúdo sempre vem primeiro.</p>
            <div className="brand-bg-grid" style={{ marginTop: 14 }}>
              {BACKGROUNDS.map(b => {
                const active = brand.background === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (b.id === 'image' && !brand.backgroundImage) { bgInput.current?.click(); return }
                      update({ background: b.id })
                    }}
                    className={`brand-bg-opt${active ? ' active' : ''}`}
                  >
                    <span className={`brand-bg-swatch bg-${b.id}`} aria-hidden
                      style={b.id === 'image' && brand.backgroundImage ? { backgroundImage: `url(${brand.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{b.label}</span>
                    <span className="brand-card-hint" style={{ margin: 0, fontSize: 11 }}>{b.hint}</span>
                  </button>
                )
              })}
            </div>
            {brand.background === 'image' && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => bgInput.current?.click()} disabled={busy}>
                  <Upload size={13} /> Trocar imagem
                </button>
                {brand.backgroundImage && (
                  <button className="btn btn-ghost btn-sm" onClick={() => update({ backgroundImage: null, background: 'dots' })}>
                    <Trash2 size={13} /> Remover imagem
                  </button>
                )}
              </div>
            )}
            <input ref={bgInput} type="file" accept="image/*" hidden onChange={e => onBgImage(e.target.files?.[0])} />
          </section>

          <p className="brand-card-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={13} style={{ color: 'var(--sage)' }} /> Alterações são salvas automaticamente neste dispositivo.
          </p>
        </div>

        {/* ── Live preview ── */}
        <div className="brand-preview">
          <h2 className="brand-card-title" style={{ marginBottom: 12 }}>Pré-visualização</h2>
          <div className="brand-preview-stage">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <BrandLogo size={44} radius={12} />
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{brand.name || 'Sua marca'}</div>
                <div className="brand-card-hint" style={{ margin: 0 }}>Cabeçalho da conta</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Ação principal <ArrowRight size={14} /></span>
              <span className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none' }}>Secundária</span>
            </div>

            <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--terracotta)' }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Cartão de exemplo</span>
              </div>
              <p className="brand-card-hint" style={{ margin: 0 }}>
                O acento colore botões, marcadores e destaques em todas as telas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
