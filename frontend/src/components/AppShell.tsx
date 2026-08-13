'use client'

import { DynamicIsland } from './DynamicIsland'
import { CursorTrail } from './CursorTrail'
import { ConstellationBg } from './ConstellationBg'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <ConstellationBg />
      <DynamicIsland />
      <CursorTrail />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
