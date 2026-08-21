import { NextResponse } from 'next/server'

import { processAutomaticDropTransitions } from '@/modules/drops/service'

/**
 * Invoke from Vercel Cron (or another trusted scheduler) with
 * Authorization: Bearer $CRON_SECRET (or $DROP_CRON_SECRET). No browser route can run this.
 */
async function processTransitions(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.DROP_CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await processAutomaticDropTransitions())
  } catch (error) {
    console.error('[drops:transitions]', error)
    return NextResponse.json({ error: 'Unable to process drop transitions.' }, { status: 500 })
  }
}

export const GET = processTransitions
export const POST = processTransitions
