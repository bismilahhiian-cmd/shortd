import { NextRequest, NextResponse } from 'next/server'
import { pingWatchSession } from '@/lib/rewards/engine'
import { createClient } from '@/lib/supabase/server'

// POST /api/watch/ping → heartbeat to validate real watching
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionToken } = await req.json()
  const result = await pingWatchSession(sessionToken)
  return NextResponse.json(result)
}
