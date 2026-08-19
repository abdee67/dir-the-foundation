import { cache } from 'react'

import { getAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_SETTINGS } from '@/lib/settings/registry'

/**
 * One query for all of an org's settings, merged over DEFAULT_SETTINGS so
 * every SETTING_DEFS key always has a value. React cache() dedupes repeat
 * calls within one request tree. Uses the admin client so it's readable from
 * contexts without a full RLS session (e.g. storefront checkout).
 */
export const getOrgSettings = cache(async (orgId: string): Promise<Record<string, unknown>> => {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from('org_settings')
    .select('key, value')
    .eq('org_id', orgId)

  const overrides: Record<string, unknown> = {}

  if (!error && data) {
    for (const row of data as { key: string; value: unknown }[]) {
      overrides[row.key] = row.value
    }
  }

  return { ...DEFAULT_SETTINGS, ...overrides }
})

export function getSetting<T>(settings: Record<string, unknown>, key: string): T {
  return settings[key] as T
}

export function settingBool(settings: Record<string, unknown>, key: string): boolean {
  return Boolean(getSetting(settings, key))
}

export function settingNum(settings: Record<string, unknown>, key: string): number {
  const value = getSetting<unknown>(settings, key)
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export function settingStr(settings: Record<string, unknown>, key: string): string {
  const value = getSetting<unknown>(settings, key)
  return typeof value === 'string' ? value : String(value ?? '')
}
