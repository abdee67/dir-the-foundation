import { PageHeader } from '@/components/ui/page-header'
import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { getServerClient } from '@/lib/supabase/server'
import type { Product } from '@/types/db'
import { DropEditor } from '@/modules/drops/components/drop-editor'

export const dynamic = 'force-dynamic'

export default async function NewDropPage() {
  const ctx = await requireOrg()
  requireModule(ctx.org, 'drops')
  const supabase = await getServerClient()
  const { data } = await supabase.from('products').select('id, name, price, status').eq('org_id', ctx.org.id).order('name')
  return <div className="flex flex-col gap-6"><PageHeader eyebrow="Campaign control" title="New drop" description="Start with the campaign identity, then build its teaser and first reveal." backHref="/admin/drops" /><DropEditor mode="create" products={(data ?? []) as Pick<Product, 'id' | 'name' | 'price' | 'status'>[]} media={{}} /></div>
}
