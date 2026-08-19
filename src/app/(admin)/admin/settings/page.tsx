import Link from 'next/link'

import { requireOrg, requireRole } from '@/lib/auth'
import { SETTING_DEFS, SETTING_GROUPS } from '@/lib/settings/registry'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgProfileSection } from '@/modules/settings/components/org-profile-section'
import { SettingsGroupSection, GROUP_LABELS } from '@/modules/settings/components/settings-group-section'
import { SettingsNav } from '@/modules/settings/components/settings-nav'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')

  const sections = [
    { id: 'section-organization', label: 'Organization' },
    { id: 'section-storefront', label: 'Storefront' },
    ...SETTING_GROUPS.map((group) => ({ id: `section-${group}`, label: GROUP_LABELS[group] })),
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Organization profile and the controls that shape store operations."
      />

      <div className="flex items-start gap-8">
        <SettingsNav sections={sections} />

        <div className="flex min-w-0 flex-1 flex-col gap-6 pb-16">
          <OrgProfileSection org={ctx.org} />

          <Card id="section-storefront" className="scroll-mt-6">
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <p className="admin-kicker">Public experience</p>
                <CardTitle className="mt-1 text-base">Storefront identity</CardTitle>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/storefront">Edit storefront</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage your homepage hero image, logo, announcement, WhatsApp contact, and public business details in one media-aware editor.
              </p>
            </CardContent>
          </Card>

          {SETTING_GROUPS.map((group) => (
            <SettingsGroupSection
              key={group}
              group={group}
              defs={SETTING_DEFS.filter((def) => def.group === group)}
              initialValues={ctx.settings}
              role={ctx.role}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
