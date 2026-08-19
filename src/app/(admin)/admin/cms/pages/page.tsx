import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { getServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { CmsPagesTable, type CmsPageRow } from '@/modules/cms/components/cms-pages-table'
import { NewPageDialog } from '@/modules/cms/components/new-page-dialog'

export const dynamic = 'force-dynamic'

export default async function CmsPagesListPage() {
  const ctx = await requireOrg()
  requireModule(ctx.org, 'cms')

  const supabase = await getServerClient()
  const { data } = await supabase
    .from('cms_pages')
    .select('id, title, slug, type, status, draft_blocks, updated_at')
    .eq('org_id', ctx.org.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Content studio" title="Pages" description="Build and publish the supporting pages around your storefront." actions={<NewPageDialog />} />
      <CmsPagesTable data={(data ?? []) as CmsPageRow[]} />
    </div>
  )
}
