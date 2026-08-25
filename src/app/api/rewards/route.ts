import { NextRequest, NextResponse } from 'next/server'
import { requestWithdrawal, dailyCheckin } from '@/lib/rewards/engine'
import { createClient } from '@/lib/supabase/server'

// POST /api/rewards/withdraw
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'withdraw') {
    const { points, ewalletType, ewalletNumber, ewalletName } = body
    const result = await requestWithdrawal(user.id, points, ewalletType, ewalletNumber, ewalletName)
    return NextResponse.json(result)
  }

  if (action === 'checkin') {
    const result = await dailyCheckin(user.id)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// GET /api/rewards/withdraw → get transactions
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('reward_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ transactions: data || [] })
}
