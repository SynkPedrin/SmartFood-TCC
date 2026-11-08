'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrandProvider } from '@/lib/brand/BrandContext'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { SalaoAoVivo } from '@/lib/salao/SalaoAoVivo'
import { Ambiente } from '@/components/experiencia/Ambiente'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SalaoAoVivo />
      {/* Respeita "reduzir movimento" do sistema: quem pediu menos animação
          recebe o estado final direto, sem transição. */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <BrandProvider>
          <Ambiente />
          {children}
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(20,20,30,0.9)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              backdropFilter: 'blur(16px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 14px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 40px -14px rgba(14,10,30,0.5)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
          </BrandProvider>
        </AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}
