import { NextResponse } from 'next/server'

import { hasValidAfroMessageCallbackToken, processAfroMessageStatusCallback } from '@/modules/drops/notifications'

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!hasValidAfroMessageCallbackToken(url.searchParams.get('token'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await processAfroMessageStatusCallback(Object.fromEntries(url.searchParams.entries()))
  } catch (error) {
    console.error('[afromessage:callback] status callback processing failed', error)
  }
  return NextResponse.json({ ok: true })
}
