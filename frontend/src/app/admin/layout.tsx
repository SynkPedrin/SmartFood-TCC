import { AdminSidebar } from '@/components/AdminSidebar'
import { ExigeLogin } from '@/components/ExigeLogin'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExigeLogin>
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </ExigeLogin>
  )
}
