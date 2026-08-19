import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth'
import { AdminLoginForm } from './admin-login-form'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const user = await getUser()
  if (user) redirect('/admin/dashboard')
  return (
    <main className="min-h-dvh bg-[#f5f5f2] px-4 py-8 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden border border-[#dcdcd6] bg-white shadow-[0_24px_80px_rgb(0_0_0_/_0.08)] md:grid-cols-[0.88fr_1.12fr]">
          <aside className="hidden min-h-[34rem] flex-col justify-between bg-[#171717] p-10 text-white md:flex">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">DIR operations</p>
              <h1 className="mt-8 max-w-xs text-4xl font-semibold leading-[0.98] tracking-[-0.06em]">The foundation for thoughtful retail.</h1>
            </div>
            <p className="max-w-[14rem] text-sm leading-6 text-white/55">Secure access for the people who run the store.</p>
          </aside>
          <section className="w-full p-6 sm:p-10 md:p-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#666661]">Store administration</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Welcome back.</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#666661]">Sign in with an administrator account assigned to this store.</p>
            <AdminLoginForm />
          </section>
        </div>
      </div>
    </main>
  )
}
