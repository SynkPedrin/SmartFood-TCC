import Image from 'next/image'

interface LogoMarkProps {
  size?: number
  radius?: number
  style?: React.CSSProperties
}

/* Per spec: logo icon gradient = #8b4dff → #6a1fe0 → #00e0b8 */
export function LogoMark({ size = 36, radius = 10, style }: LogoMarkProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: 'linear-gradient(135deg, #8b4dff, #6a1fe0, #00e0b8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
      ...style,
    }}>
      <Image
        src="/logo.png"
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        alt="SmartFood"
        style={{ filter: 'invert(1)', mixBlendMode: 'screen', objectFit: 'contain' }}
      />
    </div>
  )
}

export function LogoLockup({ compact = false }: { compact?: boolean }) {
  const sz = compact ? 28 : 34
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10 }}>
      <LogoMark size={sz} radius={compact ? 8 : 10} />
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: compact ? 14 : 16,
        fontWeight: 700, letterSpacing: '-0.03em',
        color: '#111111', lineHeight: 1,
      }}>
        SmartFood
      </div>
    </div>
  )
}
