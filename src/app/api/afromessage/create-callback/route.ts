import { NextResponse } from 'next/server'

import { hasValidAfroMessageCallbackToken } from '@/modules/drops/notifications'

export async function POST(request: Request) {
  if (!hasValidAfroMessageCallbackToken(new URL(request.url).searchParams.get('token'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // The waitlist is already marked queued after AfroMessage acknowledges the
  // batch. Retain this endpoint for provider create callbacks without exposing
  // callback payloads to the browser or changing notification state blindly.
  await request.json().catch(() => null)
  return NextResponse.json({ ok: true })
}
