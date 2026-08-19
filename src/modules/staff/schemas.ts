import { z } from 'zod'

// Mirrors Role (src/types/db/core.ts) — duplicated as a runtime zod enum the
// same way src/lib/status.ts duplicates DB enums locally; keep in sync.
export const ROLE_VALUES = ['owner', 'admin', 'manager', 'staff', 'viewer'] as const
const roleEnum = z.enum(ROLE_VALUES)

export const inviteMemberSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  role: roleEnum,
})
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const updateMemberRoleSchema = z.object({
  userId: z.string().uuid(),
  role: roleEnum,
})
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

export const removeMemberSchema = z.object({
  userId: z.string().uuid(),
})
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>

export const revokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
})
export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>
