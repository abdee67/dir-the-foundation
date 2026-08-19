import { getAdminClient } from '@/lib/supabase/admin'
import type { OrgContext } from '@/lib/auth'

/**
 * Fire-and-forget audit_log insert. Never throws — callers append this after
 * a write (docs/conventions.md — Server actions) without needing try/catch.
 *
 * Not `.then().catch()` chained: PostgrestBuilder's `then()` types as
 * PromiseLike, not Promise, so `.catch()` doesn't type-check on it directly —
 * an async helper + try/catch is the safe fire-and-forget shape here.
 */
export function audit(
  ctx: OrgContext,
  action: string,
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
): void {
  void insertAuditRow(ctx, action, entity, entityId, before, after)
}

async function insertAuditRow(
  ctx: OrgContext,
  action: string,
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase.from('audit_log').insert({
      org_id: ctx.org.id,
      actor_id: ctx.user.id,
      action,
      entity,
      entity_id: entityId,
      before: before ?? null,
      after: after ?? null,
    })
    if (error) console.error('[audit] insert failed', error)
  } catch (err) {
    console.error('[audit] insert threw', err)
  }
}
