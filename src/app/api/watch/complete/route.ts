import { NextRequest, NextResponse } from 'next/server'
import { completeWatchSession } from '@/lib/rewards/engine'
import { createClient } from '@/lib/supabase/server'

// POST /api/watch/complete → claim reward for completed episode
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sessionToken, watchPercentage, totalDuration, dramaMeta } = body

  const result = await completeWatchSession(
    sessionToken, user.id, watchPercentage, totalDuration, dramaMeta
  )
  return NextResponse.json(result)
}
