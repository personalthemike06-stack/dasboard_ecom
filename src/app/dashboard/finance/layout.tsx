import { getCurrentClient } from '@/lib/supabase/server'
import { planHasFullAccess } from '@/lib/plans'
import { UpgradeNotice } from '@/components/UpgradeNotice'

// dashboard/layout.tsx ya garantiza que hay client antes de renderizar esta
// rama (redirige/bloquea antes si no lo hay), pero getCurrentClient está en
// cache() de React — llamarla aquí no repite la consulta real.
export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const client = await getCurrentClient()
  if (!client || !planHasFullAccess(client.plan)) {
    return <UpgradeNotice feature="Financiero" />
  }

  return children
}
