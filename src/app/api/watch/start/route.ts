import { NextRequest, NextResponse } from 'next/server'
import { generateSessionToken, pingWatchSession, completeWatchSession } from '@/lib/rewards/engine'
import { createClient } from '@/lib/supabase/server'

// POST /api/watch/start → create watch session
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { provider, dramaId, episodeNumber } = body

  const token = await generateSessionToken(user.id, provider, dramaId, episodeNumber)
  return NextResponse.json({ sessionToken: token })
}
