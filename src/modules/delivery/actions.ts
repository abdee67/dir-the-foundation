'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg, requireRole } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function createDeliveryZoneAction(formData: FormData): Promise<void> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')
  const name = String(formData.get('name') ?? '').trim()
  const areas = String(formData.get('areas') ?? '').split(',').map((area) => area.trim()).filter(Boolean)
  const charge = Math.round(Number(formData.get('charge') ?? 0) * 100)
  const etaText = String(formData.get('eta_text') ?? '').trim() || null
  if (!name || !Number.isFinite(charge) || charge < 0) return
  await getAdminClient().from('delivery_zones').insert({ org_id: ctx.org.id, name, districts: areas, charge, eta_text: etaText })
  revalidatePath('/admin/delivery-zones')
}
