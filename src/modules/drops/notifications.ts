import { env } from '@/lib/env'
import { getAdminClient } from '@/lib/supabase/admin'
import type { Drop } from '@/types/db'

import { normalizeEthiopianPhone } from './phone'

const FALLBACK_BASE_URL = 'https://api.afromessage.com/api'

type JsonRecord = Record<string, unknown>

type AfroMessageBulkResponse = {
  acknowledge?: unknown
  response?: {
    message?: unknown
    campaign_id?: unknown
    errors?: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}

type AfroMessageConfig = {
  token: string
  identifierId: string
  sender: string
  baseUrl: string
}

type SendResult = {
  queued: number
  failed: number
  campaignId: string
}

function isRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return null
}

function getAfroMessageConfig(): AfroMessageConfig | null {
  const token = process.env.AFROMESSAGE_TOKEN?.trim()
  const identifierId = process.env.AFROMESSAGE_IDENTIFIER_ID?.trim()
  const sender = process.env.AFROMESSAGE_SENDER?.trim()

  if (!token || !identifierId || !sender) {
    return null
  }

  return {
    token,
    identifierId,
    sender,
    baseUrl: (
      process.env.AFROMESSAGE_BASE_URL?.trim() ||
      FALLBACK_BASE_URL
    ).replace(/\/+$/, ''),
  }
}

export function isAfroMessageConfigured(): boolean {
  return Boolean(getAfroMessageConfig())
}

function getCallbackUrl(path: string): string | undefined {
  const secret = process.env.AFROMESSAGE_CALLBACK_SECRET?.trim()
  const appUrl = env.APP_URL?.trim()

  if (!secret || !appUrl || !appUrl.startsWith('http')) {
    return undefined
  }

  const url = new URL(path, appUrl)

  // Keep the callback protection mechanism server-side.
  // AfroMessage will call this URL after accepting/processing the campaign.
  url.searchParams.set('token', secret)

  return url.toString()
}

function buildCampaignName(drop: Drop, retryFailed: boolean): string {
  const safeDropNumber =
    drop.drop_number
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase() || 'DROP'

  const base = `DIR-${safeDropNumber}-REVEAL`

  if (!retryFailed) {
    return base.slice(0, 80)
  }

  return `${base}-RETRY-${Date.now()}`.slice(0, 80)
}

function getCampaignId(payload: AfroMessageBulkResponse | null): string | null {
  return asString(payload?.response?.campaign_id)
}

function isAccepted(payload: AfroMessageBulkResponse | null): boolean {
  const value = asString(payload?.acknowledge)

  return (
    value?.toLowerCase() === 'success' ||
    value?.toLowerCase() === 'accepted' ||
    value?.toLowerCase() === 'ok'
  )
}

function extractProviderErrors(
  payload: AfroMessageBulkResponse | null,
): string[] {
  const errors = payload?.response?.errors

  if (Array.isArray(errors)) {
    return errors
      .map((error) => {
        if (typeof error === 'string') {
          return error.trim()
        }

        if (isRecord(error)) {
          return (
            asString(error.message) ??
            asString(error.error) ??
            asString(error.reason) ??
            JSON.stringify(error)
          )
        }

        return String(error)
      })
      .filter(Boolean)
  }

  if (typeof errors === 'string' && errors.trim()) {
    return [errors.trim()]
  }

  return []
}

function extractProviderMessage(
  payload: AfroMessageBulkResponse | null,
): string | null {
  return asString(payload?.response?.message)
}

function buildProviderError(
  payload: AfroMessageBulkResponse | null,
  response: Response,
): string {
  const errors = extractProviderErrors(payload)

  if (errors.length > 0) {
    return errors.join('; ').slice(0, 500)
  }

  const message = extractProviderMessage(payload)

  if (message) {
    return message.slice(0, 500)
  }

  return `AfroMessage rejected the request (HTTP ${response.status}).`
}

function sanitizeRecipients(
  rows: Array<{ id: string; phone_number: string | null }>,
): {
  recipients: string[]
  recipientIds: string[]
  invalidIds: string[]
} {
  const normalized = new Map<string, string>()
  const invalidIds: string[] = []

  for (const row of rows) {
    const normalizedPhone = row.phone_number
      ? normalizeEthiopianPhone(row.phone_number)
      : null

    if (!normalizedPhone) {
      invalidIds.push(row.id)
      continue
    }

    // Deduplicate by normalized phone number.
    if (!normalized.has(normalizedPhone)) {
      normalized.set(normalizedPhone, row.id)
    }
  }

  return {
    recipients: [...normalized.keys()],
    recipientIds: [...normalized.values()],
    invalidIds,
  }
}

async function markRowsAsFailed(
  supabase: ReturnType<typeof getAdminClient>,
  ids: string[],
  message: string,
): Promise<void> {
  if (ids.length === 0) {
    return
  }

  const { error } = await supabase
    .from('drop_waitlist')
    .update({
      notification_status: 'failed',
      last_error: message.slice(0, 500),
    })
    .in('id', ids)

  if (error) {
    console.error('[afromessage] failed to update waitlist rows', {
      ids,
      error: error.message,
    })
  }
}

export async function sendDropLaunchNotifications(
  drop: Drop,
  retryFailed = false,
): Promise<SendResult> {
  const config = getAfroMessageConfig()

  if (!config) {
    throw new Error(
      'SMS delivery is not configured. Add the AfroMessage server environment variables.',
    )
  }

  const message = drop.launch_message?.trim()

  if (!message) {
    throw new Error(
      'Add an SMS launch message to this drop before sending.',
    )
  }

  const supabase = getAdminClient()

  /*
   * Load only recipients that are eligible for this send.
   *
   * Initial send:
   *   waiting
   *
   * Retry:
   *   failed
   */
  const eligibleStatuses = retryFailed
    ? ['failed']
    : ['waiting']

  const { data: candidates, error: candidatesError } = await supabase
    .from('drop_waitlist')
    .select('id, phone_number')
    .eq('drop_id', drop.id)
    .in('notification_status', eligibleStatuses)

  if (candidatesError) {
    throw new Error(
      `Unable to load the SMS waitlist: ${candidatesError.message}`,
    )
  }

  const rows = (candidates ?? []) as Array<{
    id: string
    phone_number: string | null
  }>

  if (rows.length === 0) {
    return {
      queued: 0,
      failed: 0,
      campaignId: '',
    }
  }

  const {
    recipients,
    recipientIds,
    invalidIds,
  } = sanitizeRecipients(rows)

  /*
   * Mark invalid numbers as failed before attempting the campaign.
   */
  if (invalidIds.length > 0) {
    await markRowsAsFailed(
      supabase,
      invalidIds,
      'Phone number is not a valid Ethiopian mobile number.',
    )
  }

  if (recipients.length === 0) {
    return {
      queued: 0,
      failed: invalidIds.length,
      campaignId: '',
    }
  }

  /*
   * Guard against concurrent sends.
   *
   * Only rows still in the expected status are moved to QUEUED.
   */
  const { data: lockedRows, error: lockError } = await supabase
    .from('drop_waitlist')
    .update({
      notification_status: 'queued',
      last_error: null,
    })
    .in('id', recipientIds)
    .in('notification_status', eligibleStatuses)
    .select('id, phone_number')

  if (lockError) {
    throw new Error(
      `Unable to reserve SMS recipients: ${lockError.message}`,
    )
  }

  const locked = (lockedRows ?? []) as Array<{
    id: string
    phone_number: string | null
  }>

  if (locked.length === 0) {
    return {
      queued: 0,
      failed: invalidIds.length,
      campaignId: '',
    }
  }

  /*
   * Re-normalize the rows that were actually locked.
   * This prevents sending to rows we failed to acquire.
   */
  const lockedRecipientMap = new Map<string, string>()

  for (const row of locked) {
    if (!row.phone_number) {
      continue
    }

    const normalizedPhone = normalizeEthiopianPhone(row.phone_number)

    if (normalizedPhone && !lockedRecipientMap.has(normalizedPhone)) {
      lockedRecipientMap.set(normalizedPhone, row.id)
    }
  }

  const lockedRecipients = [...lockedRecipientMap.keys()]
  const lockedIds = [...lockedRecipientMap.values()]

  if (lockedRecipients.length === 0) {
    await markRowsAsFailed(
      supabase,
      locked.map((row) => row.id),
      'No valid recipients remained after normalization.',
    )

    return {
      queued: 0,
      failed: invalidIds.length + locked.length,
      campaignId: '',
    }
  }

  const campaign = buildCampaignName(drop, retryFailed)

  /*
   * Keep callbacks optional.
   * The core bulk-send request should work even when callbacks are not
   * configured yet.
   */
  const createCallback = getCallbackUrl(
    '/api/afromessage/create-callback',
  )

  const statusCallback = getCallbackUrl(
    '/api/afromessage/status-callback',
  )

  const requestBody: Record<string, unknown> = {
    to: lockedRecipients,
    message,
    from: config.identifierId,
    //sender: config.sender,
    campaign,
  }

  if (createCallback) {
    requestBody.createCallback = createCallback
  }

  if (statusCallback) {
    requestBody.statusCallback = statusCallback
  }

  /*
   * Do not log secrets.
   *
   * During initial debugging it is useful to log:
   * - recipient count
   * - identifier
   * - sender
   * - campaign
   *
   * but NEVER the API token.
   */
  console.info('[afromessage] sending bulk campaign', {
    recipientCount: lockedRecipients.length,
    identifierId: config.identifierId,
    sender: config.sender,
    campaign,
    callbacksEnabled: Boolean(createCallback || statusCallback),
  })

  let response: Response

  try {
    response = await fetch(
      `${config.baseUrl}/bulk_send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to connect to AfroMessage.'

    await markRowsAsFailed(
      supabase,
      lockedIds,
      `AfroMessage request failed: ${message}`,
    )

    throw new Error(
      `Unable to connect to AfroMessage: ${message}`,
    )
  }

  let payload: AfroMessageBulkResponse | null = null

  try {
    payload = (await response.json()) as AfroMessageBulkResponse
  } catch {
    payload = null
  }

  const accepted = isAccepted(payload)
  const providerCampaignId = getCampaignId(payload)

  /*
   * Important:
   *
   * AfroMessage can return HTTP 200 with:
   *
   * acknowledge: "error"
   *
   * Therefore HTTP status alone is NOT enough.
   */
  if (!response.ok || !accepted || !providerCampaignId) {
    const errorMessage = buildProviderError(payload, response)

    console.error('[afromessage] bulk campaign rejected', {
      httpStatus: response.status,
      acknowledge: payload?.acknowledge ?? null,
      providerMessage: extractProviderMessage(payload),
      providerErrors: extractProviderErrors(payload),
      campaignIdFound: Boolean(providerCampaignId),
    })

    await markRowsAsFailed(
      supabase,
      lockedIds,
      errorMessage,
    )

    throw new Error(errorMessage)
  }

  /*
   * AfroMessage has accepted/queued the bulk campaign.
   * The campaign ID is now our provider-level reference.
   */
  const { error: waitlistUpdateError } = await supabase
    .from('drop_waitlist')
    .update({
      notification_status: 'queued',
      provider_campaign_id: providerCampaignId,
      last_error: null,
    })
    .in('id', lockedIds)

  if (waitlistUpdateError) {
    console.error(
      '[afromessage] campaign accepted but waitlist update failed',
      {
        error: waitlistUpdateError.message,
        providerCampaignId,
      },
    )
  }

  /*
   * Record campaign-level information on the drop.
   *
   * Keep the existing timestamp if this is a retry.
   */
  if (!retryFailed) {
    const { error: dropUpdateError } = await supabase
      .from('drops')
      .update({
        launch_notification_sent_at: new Date().toISOString(),
      })
      .eq('id', drop.id)

    if (dropUpdateError) {
      console.error(
        '[afromessage] failed to mark launch notification sent',
        {
          error: dropUpdateError.message,
          dropId: drop.id,
        },
      )
    }
  }

  /*
   * Record a phase-event/audit record.
   *
   * This should represent notification dispatch, not the actual phase
   * transition itself.
   */
  const { error: eventError } = await supabase
    .from('drop_phase_events')
    .insert({
      drop_id: drop.id,
      org_id: drop.org_id,
      from_phase: null,
      to_phase: 'reveal',
      transition_type: 'notification',
      detail: {
        provider: 'afromessage',
        provider_campaign_id: providerCampaignId,
        queued: lockedRecipients.length,
        invalid: invalidIds.length,
        retry_failed: retryFailed,
        campaign,
      },
    })

  if (eventError) {
    console.error(
      '[afromessage] failed to write notification phase event',
      {
        error: eventError.message,
        dropId: drop.id,
        providerCampaignId,
      },
    )
  }

  return {
    queued: lockedRecipients.length,
    failed: invalidIds.length,
    campaignId: providerCampaignId,
  }
}

/**
 * Validates the application-level callback token.
 *
 * This is OUR secret, not an AfroMessage-provided credential.
 *
 * Important:
 * Do not compare secrets with a naive string comparison in a highly
 * security-sensitive context. If you later move this to a more hardened
 * endpoint, consider constant-time comparison.
 */
export function hasValidAfroMessageCallbackToken(
  token: string | null,
): boolean {
  const expected =
    process.env.AFROMESSAGE_CALLBACK_SECRET?.trim()

  if (!expected || !token) {
    return false
  }

  return token === expected
}

/**
 * Process an AfroMessage status callback.
 *
 * AfroMessage may provide fields with slightly different names depending
 * on callback/event type, so normalize the documented/common forms here.
 */
export async function processAfroMessageStatusCallback(
  payload: unknown,
): Promise<void> {
  const body = isRecord(payload) ? payload : null

  if (!body) {
    return
  }

  const responseRecord = isRecord(body.response)
    ? body.response
    : null

  const campaignId =
    asString(body.campaign_id) ??
    asString(body.campaignId) ??
    asString(responseRecord?.campaign_id) ??
    asString(responseRecord?.campaignId)

  const rawPhone =
    asString(body.to) ??
    asString(body.phone_number) ??
    asString(body.phone) ??
    asString(body.recipient)

  const phone = rawPhone
    ? normalizeEthiopianPhone(rawPhone)
    : null

  if (!campaignId || !phone) {
    console.warn(
      '[afromessage:callback] missing campaign or phone',
      {
        campaignId,
        hasPhone: Boolean(phone),
      },
    )
    return
  }

  const rawStatus = (
    asString(body.status) ??
    asString(body.message_status) ??
    asString(responseRecord?.status) ??
    ''
  ).toLowerCase()

  const status =
    ['delivered', 'sent', 'success'].includes(rawStatus)
      ? 'sent'
      : ['failed', 'undelivered', 'rejected'].includes(rawStatus)
        ? 'failed'
        : 'queued'

  const messageId =
    asString(body.message_id) ??
    asString(body.messageId) ??
    asString(body.id)

  const lastError =
    status === 'failed'
      ? (
          asString(body.error) ??
          asString(body.reason) ??
          asString(responseRecord?.error) ??
          'AfroMessage reported delivery failure.'
        ).slice(0, 500)
      : null

  const update =
    status === 'sent'
      ? {
          notification_status: 'sent',
          provider_message_id: messageId,
          notified_at: new Date().toISOString(),
          last_error: null,
        }
      : status === 'failed'
        ? {
            notification_status: 'failed',
            provider_message_id: messageId,
            last_error: lastError,
          }
        : {
            notification_status: 'queued',
            provider_message_id: messageId,
            last_error: null,
          }

  const supabase = getAdminClient()

  const { error } = await supabase
    .from('drop_waitlist')
    .update(update)
    .eq('provider_campaign_id', campaignId)
    .eq('phone_number', phone)

  if (error) {
    console.error(
      '[afromessage:callback] waitlist status update failed',
      {
        campaignId,
        phone,
        error: error.message,
      },
    )
  }
}