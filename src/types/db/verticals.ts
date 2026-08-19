// src/types/db/verticals.ts
// Thin vertical modules: courses, services, realestate — mirrors
// supabase/migrations/0003_delivery_cms_ops.sql.

export type CourseStatus = 'draft' | 'active' | 'archived'

export interface Course {
  id: string
  org_id: string
  title: string
  slug: string
  description: string | null
  price: number
  cover_media_id: string | null
  status: CourseStatus
  updated_at: string
  created_at: string
}

export interface Lesson {
  id: string
  org_id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  position: number
  is_free: boolean
  created_at: string
}

export type EnrollmentStatus = 'active' | 'completed' | 'revoked'

export interface Enrollment {
  id: string
  org_id: string
  course_id: string
  customer_id: string
  order_id: string | null
  status: EnrollmentStatus
  progress: Record<string, unknown>
  enrolled_at: string
  created_at: string
}

export type ServiceJobStatus =
  | 'quoted'
  | 'scheduled'
  | 'in_progress'
  | 'done'
  | 'invoiced'
  | 'cancelled'

export interface ServiceJob {
  id: string
  org_id: string
  job_no: string
  customer_id: string
  title: string
  description: string | null
  status: ServiceJobStatus
  scheduled_at: string | null
  assigned_to: string | null
  address: Record<string, unknown> | null
  quote_amount: number | null
  final_amount: number | null
  updated_at: string
  created_at: string
}

export type AppointmentStatus = 'booked' | 'done' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  org_id: string
  job_id: string | null
  customer_id: string | null
  title: string
  starts_at: string
  ends_at: string | null
  status: AppointmentStatus
  note: string | null
  created_at: string
}

export type ListingPurpose = 'sale' | 'rent'
export type ListingPropertyType = 'apartment' | 'house' | 'land' | 'commercial'
export type ListingStatus = 'draft' | 'active' | 'under_offer' | 'sold' | 'rented'

export interface Listing {
  id: string
  org_id: string
  title: string
  slug: string
  purpose: ListingPurpose
  property_type: ListingPropertyType
  price: number
  area_sqft: number | null
  beds: number | null
  baths: number | null
  address: Record<string, unknown> | null
  description: string | null
  features: string[]
  status: ListingStatus
  media_ids: string[]
  updated_at: string
  created_at: string
}

export type InquiryStatus = 'new' | 'contacted' | 'closed'

export interface Inquiry {
  id: string
  org_id: string
  listing_id: string | null
  product_id: string | null
  name: string
  phone: string | null
  email: string | null
  message: string | null
  status: InquiryStatus
  created_at: string
}
