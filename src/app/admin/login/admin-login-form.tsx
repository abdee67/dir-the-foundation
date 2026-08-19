'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { loginAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminLoginForm() {
  const [pending, setPending] = useState(false)
  async function submit(formData: FormData) {
    setPending(true)
    const result = await loginAction({ email: String(formData.get('email') ?? ''), password: String(formData.get('password') ?? ''), next: '/admin/dashboard' })
    setPending(false)
    if (!result.ok) toast.error(result.error)
  }
  return <form action={submit} className="mt-6 flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="flex flex-col gap-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div><Button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button></form>
}
