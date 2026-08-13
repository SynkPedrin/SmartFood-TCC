'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrandProvider } from '@/lib/brand/BrandContext'
import { AuthProvider } from '@/lib/auth/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Respeita "reduzir movimento" do sistema: quem pediu menos animação
          recebe o estado final direto, sem transição. */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <BrandProvider>
          {children}
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111111',
              color: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
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
