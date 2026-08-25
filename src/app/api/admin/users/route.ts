import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return token === (process.env.ADMIN_SECRET_KEY || 'piodramas_admin_secret_2024')
}

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createAdminClient()
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'withdrawals') {
    const { data } = await supabase
      .from('reward_transactions')
      .select('*, profiles(full_name, email, phone)')
      .eq('type', 'withdraw')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return NextResponse.json({ withdrawals: data || [] })
  }

  if (action === 'stats') {
    const [users, transactions, pendingWithdrawals] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('reward_transactions').select('points').eq('type', 'earn'),
      supabase.from('reward_transactions').select('id', { count: 'exact' }).eq('status', 'pending').eq('type', 'withdraw'),
    ])
    return NextResponse.json({
      totalUsers: users.count || 0,
      totalPointsEarned: (transactions.data || []).reduce((sum: number, t: any) => sum + t.points, 0),
      pendingWithdrawals: pendingWithdrawals.count || 0,
    })
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ users: data || [] })
}

// PATCH /api/admin/users — block/unblock or approve withdrawal
export async function PATCH(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createAdminClient()
  const body = await req.json()
  const { action } = body

  if (action === 'block') {
    const { userId, reason } = body
    await supabase.from('profiles').update({ is_blocked: true, block_reason: reason }).eq('id', userId)
    return NextResponse.json({ success: true, message: 'Pengguna diblokir' })
  }

  if (action === 'unblock') {
    const { userId } = body
    await supabase.from('profiles').update({ is_blocked: false, block_reason: null }).eq('id', userId)
    return NextResponse.json({ success: true, message: 'Pengguna dibuka blokirnya' })
  }

  if (action === 'approve_withdrawal') {
    const { transactionId } = body
    await supabase
      .from('reward_transactions')
      .update({ status: 'completed', processed_by: 'WisnuDrama', processed_at: new Date().toISOString() })
      .eq('id', transactionId)
    return NextResponse.json({ success: true, message: 'Penarikan disetujui' })
  }

  if (action === 'reject_withdrawal') {
    const { transactionId, note, userId, points } = body
    // Refund points
    const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single()
    if (profile) {
      await supabase.from('profiles').update({ total_points: profile.total_points + points }).eq('id', userId)
    }
    await supabase
      .from('reward_transactions')
      .update({ status: 'rejected', admin_note: note, processed_by: 'WisnuDrama', processed_at: new Date().toISOString() })
      .eq('id', transactionId)
    return NextResponse.json({ success: true, message: 'Penarikan ditolak, poin dikembalikan' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE /api/admin/users — delete user account
export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createAdminClient()
  const { userId } = await req.json()

  // Delete from auth.users (cascade deletes profile)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Akun berhasil dihapus' })
}
