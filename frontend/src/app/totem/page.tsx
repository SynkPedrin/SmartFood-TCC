'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { categoriasApi, produtosApi, mesasApi, pedidosApi } from '@/lib/api'
import type { Categoria, Produto, Mesa, Pedido, PaginatedResponse } from '@/types'
import ChefIA from '@/components/ChefIA'
import { BrandLogo } from '@/components/BrandLogo'
import { useBrand } from '@/lib/brand/BrandContext'
import {
  ShoppingCart, Plus, Minus, Trash2, Home,
  ChevronRight, CheckCircle, Clock, X, UtensilsCrossed,
} from 'lucide-react'

type Screen = 'mesa' | 'menu' | 'cart' | 'success'

interface CartItem { produto: Produto; qtd: number }

function formatPrice(price: string | number) {
  return `R$ ${Number(price).toFixed(2)}`
}

/* ─────────────────────────── MESA SELECTOR ─────────────────────────── */
function MesaSelector({ onSelect }: { onSelect: (mesa: Mesa) => void }) {
  const { data, isLoading } = useQuery<PaginatedResponse<Mesa>>({
    queryKey: ['mesas'], queryFn: mesasApi.listar,
  })

  const mesas = data?.results?.filter(m => m.status === 'disponivel') ?? []

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px, 9vh, 96px) 24px', background: 'var(--bg-elevated)' }}>
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vh, 56px)' }}>
        <BrandLogo size={132} radius={0} style={{ margin: '0 auto 14px' }} />
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(1.9rem, 4.5vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 8 }}>
          Bem-vindo
        </h1>
        <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
          Toque na sua mesa para começar o pedido
        </p>
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14, width: '100%', maxWidth: 680 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 18 }} />)}
        </div>
      ) : mesas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <UtensilsCrossed size={40} style={{ color: 'rgba(17,17,17,0.25)', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(17,17,17,0.55)' }}>Nenhuma mesa disponível</p>
          <p style={{ fontSize: 14, color: 'rgba(17,17,17,0.38)', marginTop: 6 }}>Aguarde ou consulte um atendente.</p>
        </div>
      ) : (
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 14, width: '100%', maxWidth: 720 }}
        >
          {mesas.map(mesa => (
            <motion.button
              key={mesa.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
              onClick={() => onSelect(mesa)}
              className="mesa-tile"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>{mesa.numero}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
                Disponível
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      <Link href="/" style={{ position: 'fixed', top: 20, right: 20 }}>
        <button className="btn btn-ghost btn-sm" style={{ gap: 7 }}><Home size={13} /> Sair</button>
      </Link>
    </div>
  )
}

/* ─────────────────────────── CART DRAWER ─────────────────────────── */
function CartDrawer({
  cart, onClose, onQty, onRemove, onCheckout,
}: {
  cart: CartItem[]
  onClose: () => void
  onQty: (id: number, delta: number) => void
  onRemove: (id: number) => void
  onCheckout: () => void
}) {
  const total = cart.reduce((s, ci) => s + Number(ci.produto.preco) * ci.qtd, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '90%', maxWidth: 440,
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '20px 0 0 20px',
          boxShadow: '1px 0 0 0 rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingCart size={20} style={{ color: '#7b2eff' }} />
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 800, color: '#111111', flex: 1, letterSpacing: '-0.03em' }}>
            Seu Pedido
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(17,17,17,0.40)' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>Carrinho vazio</p>
            </div>
          ) : cart.map(ci => (
            <div key={ci.produto.id} style={{
              display: 'flex', gap: 14, padding: '14px 0',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(123,46,255,0.10), rgba(0,224,184,0.08))',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {ci.produto.imagem
                  ? <img src={`http://localhost:8000${ci.produto.imagem}`} alt={ci.produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <UtensilsCrossed size={20} style={{ color: 'rgba(123,46,255,0.35)' }} />
                }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#111111', marginBottom: 4 }}>{ci.produto.nome}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#00e0b8' }}>{formatPrice(Number(ci.produto.preco) * ci.qtd)}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onQty(ci.produto.id, -1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                  <Minus size={12} />
                </button>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>{ci.qtd}</span>
                <button onClick={() => onQty(ci.produto.id, 1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                  <Plus size={12} />
                </button>
                <button onClick={() => onRemove(ci.produto.id)} style={{ width: 32, height: 32, borderRadius: 9, border: '2px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total + checkout */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(17,17,17,0.60)' }}>Total</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 900, color: '#111111', letterSpacing: '-0.04em' }}>
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #7b2eff, #00e0b8)',
                border: '1px solid var(--border)',
                borderRadius: 14, color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 16, fontWeight: 800,
                cursor: 'pointer', letterSpacing: '-0.02em',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
            >
              Enviar Pedido para Cozinha
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────── MENU SCREEN ─────────────────────────── */
function MenuScreen({
  mesa, cart, onAdd, onOpenCart, onBack,
}: {
  mesa: Mesa
  cart: CartItem[]
  onAdd: (p: Produto) => void
  onOpenCart: () => void
  onBack: () => void
}) {
  const [catSel, setCatSel] = useState<number | null>(null)

  const { data: catData } = useQuery<PaginatedResponse<Categoria>>({ queryKey: ['categorias'], queryFn: categoriasApi.listar })
  const { data: prodData, isLoading } = useQuery<PaginatedResponse<Produto>>({ queryKey: ['produtos'], queryFn: produtosApi.listar })

  const categorias = catData?.results ?? []
  const produtos   = prodData?.results?.filter(p => p.disponivel) ?? []
  const filtered   = catSel ? produtos.filter(p => p.categoria === catSel) : produtos

  const cartCount = cart.reduce((s, ci) => s + ci.qtd, 0)
  const cartTotal = cart.reduce((s, ci) => s + Number(ci.produto.preco) * ci.qtd, 0)
  const { brand } = useBrand()

  return (
    <>
      {/* Sticky header */}
      <div className="totem-header">
        <BrandLogo size={36} radius={10} />

        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em' }}>
            {brand.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(17,17,17,0.50)', fontWeight: 600 }}>Cardápio</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 10,
            background: 'rgba(123,46,255,0.10)',
            border: '2px solid rgba(123,46,255,0.30)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
            fontSize: 13, fontWeight: 700, color: '#7b2eff',
          }}>
            Mesa {mesa.numero}
          </div>

          <button onClick={onBack} style={{
            background: 'rgba(0,0,0,0.06)', border: '1px solid var(--border)',
            borderRadius: 10, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
            color: 'rgba(17,17,17,0.50)',
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="totem-cats">
        <button
          onClick={() => setCatSel(null)}
          className={`totem-cat-pill${catSel === null ? ' active' : ''}`}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCatSel(cat.id)}
            className={`totem-cat-pill${catSel === cat.id ? ' active' : ''}`}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="totem-content">
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 18 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(17,17,17,0.40)' }}>
            <UtensilsCrossed size={40} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>Nenhum produto nesta categoria</p>
          </div>
        ) : (
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}
          >
            {filtered.map(prod => {
              const inCart = cart.find(ci => ci.produto.id === prod.id)
              return (
                <motion.div
                  key={prod.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } } }}
                  className="totem-product-card"
                >
                  {/* Image area */}
                  <div className="totem-img">
                    {prod.imagem ? (
                      <img src={`http://localhost:8000${prod.imagem}`} alt={prod.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UtensilsCrossed size={40} style={{ color: 'rgba(123,46,255,0.25)' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    {prod.categoria_detalhe && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#7b2eff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {prod.categoria_detalhe.nome}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', margin: '4px 0 6px' }}>
                      {prod.nome}
                    </h3>
                    {prod.descricao && (
                      <p style={{ fontSize: 12.5, color: 'rgba(17,17,17,0.55)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prod.descricao}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 900, color: '#00e0b8', letterSpacing: '-0.04em' }}>
                        {formatPrice(prod.preco)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(17,17,17,0.42)', fontWeight: 600, marginLeft: 'auto' }}>
                        <Clock size={11} />{prod.tempo_preparo} min
                      </div>
                    </div>

                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px', borderRadius: 12, background: 'rgba(123,46,255,0.08)', border: '2px solid rgba(123,46,255,0.28)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#7b2eff' }}>×{inCart.qtd} no pedido</span>
                        <button onClick={() => onAdd(prod)} style={{ padding: '4px 10px', borderRadius: 8, border: '2px solid rgba(123,46,255,0.35)', background: '#7b2eff', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                          + Mais
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAdd(prod)}
                        style={{
                          width: '100%', padding: '12px',
                          background: 'linear-gradient(135deg, #7b2eff, #00e0b8)',
                          border: '1px solid var(--border)',
                          borderRadius: 12, color: '#fff',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 14, fontWeight: 800,
                          cursor: 'pointer', letterSpacing: '-0.01em',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 0.16s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
                      >
                        <Plus size={16} /> Adicionar
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="totem-cart-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#7b2eff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              position: 'relative',
            }}>
              <ShoppingCart size={17} style={{ color: '#fff' }} />
              <span style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff',
              }}>{cartCount}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(17,17,17,0.55)', fontWeight: 600 }}>{cartCount} item{cartCount > 1 ? 's' : ''}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 900, color: '#111111', letterSpacing: '-0.03em' }}>
                {formatPrice(cartTotal)}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenCart}
            style={{
              padding: '13px 24px',
              background: 'linear-gradient(135deg, #7b2eff, #00e0b8)',
              border: '1px solid var(--border)',
              borderRadius: 14, color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontSize: 15, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
          >
            Ver pedido <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </>
  )
}

/* ─────────────────────────── SUCCESS SCREEN ─────────────────────────── */
function SuccessScreen({ mesa, cart, orderNum, onReset }: { mesa: Mesa; cart: CartItem[]; orderNum: number; onReset: () => void }) {
  const total = cart.reduce((s, ci) => s + Number(ci.produto.preco) * ci.qtd, 0)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff', textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
        style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)',
          border: '3px solid rgba(16,185,129,0.50)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <CheckCircle size={52} style={{ color: '#10b981' }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111111', marginBottom: 8 }}>
          Pedido enviado!
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(17,17,17,0.55)', fontWeight: 500, marginBottom: 6 }}>
          Mesa {mesa.numero} · Pedido #{orderNum}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'rgba(17,17,17,0.45)', marginBottom: 32 }}>
          A cozinha já recebeu seu pedido e vai começar o preparo.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        style={{
          background: '#f6f6f7', border: '1px solid var(--border)',
          borderRadius: 18, padding: '20px 24px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          width: '100%', maxWidth: 380, marginBottom: 28, textAlign: 'left',
        }}
      >
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: 'rgba(17,17,17,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Resumo do pedido
        </h3>
        {cart.map(ci => (
          <div key={ci.produto.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#111111', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span>{ci.produto.nome} ×{ci.qtd}</span>
            <span style={{ color: '#00e0b8', fontWeight: 800 }}>{formatPrice(Number(ci.produto.preco) * ci.qtd)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 900, color: '#111111' }}>Total</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 900, color: '#111111' }}>{formatPrice(total)}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.35)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
          <Clock size={15} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
            ~{Math.max(...cart.map(ci => ci.produto.tempo_preparo))} min para ficar pronto
          </span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.60 }}
        onClick={onReset}
        style={{
          marginTop: 32, padding: '14px 32px',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, color: 'rgba(17,17,17,0.65)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
        }}
      >
        Fazer novo pedido
      </motion.button>
    </div>
  )
}

/* ─────────────────────────── MAIN ─────────────────────────── */

export default function TotemPage() {
  const [screen, setScreen]     = useState<Screen>('mesa')
  const [mesa, setMesa]         = useState<Mesa | null>(null)
  const [cart, setCart]         = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderNum, setOrderNum] = useState(0)
  const queryClient = useQueryClient()

  function selectMesa(m: Mesa) {
    setMesa(m)
    setScreen('menu')
  }

  function addToCart(prod: Produto) {
    setCart(prev => {
      const existing = prev.find(ci => ci.produto.id === prod.id)
      if (existing) return prev.map(ci => ci.produto.id === prod.id ? { ...ci, qtd: ci.qtd + 1 } : ci)
      return [...prev, { produto: prod, qtd: 1 }]
    })
  }

  function changeQty(id: number, delta: number) {
    setCart(prev => {
      const updated = prev.map(ci => ci.produto.id === id ? { ...ci, qtd: ci.qtd + delta } : ci)
      return updated.filter(ci => ci.qtd > 0)
    })
  }

  function removeItem(id: number) {
    setCart(prev => prev.filter(ci => ci.produto.id !== id))
  }

  // O pedido nasce aqui: vai para o banco e cai na fila da cozinha na hora.
  const enviarPedido = useMutation({
    mutationFn: () => pedidosApi.criar({
      mesa: mesa!.id,
      itens: cart.map(ci => ({ produto: ci.produto.id, quantidade: ci.qtd })),
    }),
    onSuccess: (pedido: Pedido) => {
      setOrderNum(pedido.id)
      setCartOpen(false)
      setScreen('success')
      // a mesa passou a ocupada e a cozinha tem pedido novo
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
    onError: (err: unknown) => {
      const detalhe = axios.isAxiosError(err)
        ? Object.values(err.response?.data ?? {}).flat(2).join(' ')
        : ''
      toast.error(detalhe || 'Não consegui enviar seu pedido. Chame o atendimento.')
    },
  })

  function checkout() {
    if (!mesa || !cart.length || enviarPedido.isPending) return
    enviarPedido.mutate()
  }

  function reset() {
    setCart([])
    setMesa(null)
    setScreen('mesa')
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'mesa' && (
          <motion.div key="mesa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MesaSelector onSelect={selectMesa} />
          </motion.div>
        )}

        {screen === 'menu' && mesa && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MenuScreen
              mesa={mesa}
              cart={cart}
              onAdd={addToCart}
              onOpenCart={() => setCartOpen(true)}
              onBack={reset}
            />
            <ChefIA raised={cart.reduce((s, ci) => s + ci.qtd, 0) > 0} />
          </motion.div>
        )}

        {screen === 'success' && mesa && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SuccessScreen mesa={mesa} cart={cart} orderNum={orderNum} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            onClose={() => setCartOpen(false)}
            onQty={changeQty}
            onRemove={removeItem}
            onCheckout={checkout}
          />
        )}
      </AnimatePresence>
    </>
  )
}
