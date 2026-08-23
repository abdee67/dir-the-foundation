export type DropStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'
export type DropPhase = 'teaser' | 'reveal' | 'store'
export type DropTransitionType = 'automatic' | 'manual' | 'notification'
export type DropWaitlistNotificationStatus = 'waiting' | 'queued' | 'sent' | 'failed'

export interface Drop {
  id: string
  org_id: string
  drop_number: string
  name: string
  description: string | null
  launch_message: string | null
  status: DropStatus
  current_phase: DropPhase
  teaser_hero_media_id: string | null
  teaser_starts_at: string | null
  teaser_ends_at: string | null
  reveal_product_id: string | null
  mens_campaign_media_id: string | null
  womens_campaign_media_id: string | null
  store_starts_at: string | null
  automatic_transitions_enabled: boolean
  manual_phase_override: DropPhase | null
  launch_notification_sent_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface DropWaitlistEntry {
  id: string
  drop_id: string
  phone_number: string
  notification_status: DropWaitlistNotificationStatus
  notified_at: string | null
  provider_message_id: string | null
  provider_campaign_id: string | null
  last_error: string | null
  created_at: string
}

export interface DropPhaseEvent {
  id: number
  drop_id: string
  org_id: string
  from_phase: DropPhase | null
  to_phase: DropPhase
  transition_type: DropTransitionType
  triggered_by: string | null
  detail: Record<string, unknown>
  created_at: string
}
