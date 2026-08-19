// Zod schemas shared between the (auth) client forms and src/lib/actions/auth.ts.
// Kept out of auth.ts itself: a 'use server' file may only export async
// functions, so schema objects (runtime values) have to live in a plain module.
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
  /** Preserves ?next= through the invite -> login -> accept round trip. */
  next: z.string().optional(),
})

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  next: z.string().optional(),
})

export const forgotSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotInput = z.infer<typeof forgotSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
