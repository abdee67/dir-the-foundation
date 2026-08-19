import { requireOrg, requireRole } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { settingStr } from '@/lib/settings'
import { env } from '@/lib/env'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { StorefrontSettingsForm } from '@/modules/storefront-settings/components/storefront-settings-form'

export const dynamic = 'force-dynamic'

export default async function StorefrontSettingsPage() {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')
  requireModule(ctx.org, 'storefront')

  const storefrontUrl = env.APP_URL

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Public experience" title="Storefront" description="Control your public brand, campaign image, and customer contact settings." />

      <Card>
        <CardHeader>
          <p className="admin-kicker">Live address</p>
          <CardTitle className="mt-1 text-base">Your storefront</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <code className="bg-muted px-2 py-1 text-xs">{storefrontUrl}</code>
            <CopyButton text={storefrontUrl} />
          </div>
          <p className="text-xs text-muted-foreground">This is the public storefront address for your current single-store setup.</p>
        </CardContent>
      </Card>

      <StorefrontSettingsForm
        defaultValues={{
          announcement: settingStr(ctx.settings, 'storefront.announcement'),
          whatsapp_number: settingStr(ctx.settings, 'storefront.whatsapp_number'),
          primary_color: settingStr(ctx.settings, 'storefront.primary_color') || '#171717',
          hero_image: settingStr(ctx.settings, 'storefront.hero_image'),
          name: ctx.org.name,
          phone: ctx.org.phone ?? '',
          email: ctx.org.email ?? '',
          address: ctx.org.address ?? '',
          logo_path: ctx.org.logo_path,
        }}
      />
    </div>
  )
}
