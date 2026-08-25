import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

const MAX_DAILY_POINTS = 200
const POINTS_PER_EPISODE = 10
const STREAK_BONUS = 50
const STREAK_THRESHOLD = 5
const CHECKIN_POINTS = 5
const SHARE_POINTS = 2
const REFERRAL_POINTS = 100

export async function generateSessionToken(
  userId: string,
  provider: string,
  dramaId: string,
  episodeNumber: number
): Promise<string> {
  const supabase = await createAdminClient()
  const token = crypto.randomUUID()

  await supabase.from('watch_sessions').insert({
    user_id: userId,
    session_token: token,
    provider,
    drama_id: dramaId,
    episode_number: episodeNumber,
    started_at: new Date().toISOString(),
  })

  return token
}

export async function pingWatchSession(sessionToken: string): Promise<{ ok: boolean }> {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('watch_sessions')
    .update({ last_ping: new Date().toISOString() })
    .eq('session_token', sessionToken)
    .eq('is_completed', false)

  return { ok: !error }
}

export async function completeWatchSession(
  sessionToken: string,
  userId: string,
  watchPercentage: number,
  totalDuration: number,
  dramaMeta: { provider: string; dramaId: string; title: string; cover: string; episodeNumber: number }
): Promise<{ pointsEarned: number; message: string }> {
  if (watchPercentage < 80) {
    return { pointsEarned: 0, message: 'Tonton minimal 80% episode untuk mendapatkan poin' }
  }

  const supabase = await createAdminClient()

  // Validate session exists and belongs to user
  const { data: session } = await supabase
    .from('watch_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('user_id', userId)
    .eq('is_completed', false)
    .single()

  if (!session) return { pointsEarned: 0, message: 'Sesi tidak valid' }

  // Validate session timing (must be at least 60% of total duration in real time)
  const startedAt = new Date(session.started_at)
  const now = new Date()
  const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000
  const minRequired = totalDuration * 0.6

  if (elapsedSeconds < minRequired) {
    return { pointsEarned: 0, message: 'Kecepatan nonton mencurigakan. Ditolak.' }
  }

  // Check daily limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, daily_points_today, last_daily_reset, streak_count')
    .eq('id', userId)
    .single()

  if (!profile) return { pointsEarned: 0, message: 'User tidak ditemukan' }

  // Reset daily points if needed
  const lastReset = new Date(profile.last_daily_reset)
  const isNewDay = now.toDateString() !== lastReset.toDateString()
  const currentDailyPoints = isNewDay ? 0 : profile.daily_points_today

  if (currentDailyPoints >= MAX_DAILY_POINTS) {
    return { pointsEarned: 0, message: `Batas poin harian tercapai (${MAX_DAILY_POINTS} poin/hari)` }
  }

  // Check duplicate episode claim
  const { data: existingWatch } = await supabase
    .from('watch_history')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', dramaMeta.provider)
    .eq('drama_id', dramaMeta.dramaId)
    .eq('episode_number', dramaMeta.episodeNumber)
    .eq('reward_claimed', true)
    .single()

  if (existingWatch) {
    return { pointsEarned: 0, message: 'Poin sudah diklaim untuk episode ini' }
  }

  // Calculate streak
  const { count: recentEpisodes } = await supabase
    .from('watch_history')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('reward_claimed', true)
    .gte('watched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const episodesToday = (recentEpisodes || 0) + 1
  const streakBonus = episodesToday % STREAK_THRESHOLD === 0 ? STREAK_BONUS : 0
  const basePoints = Math.min(POINTS_PER_EPISODE, MAX_DAILY_POINTS - currentDailyPoints)
  const totalPoints = basePoints + streakBonus

  // Update session as completed
  await supabase
    .from('watch_sessions')
    .update({ is_completed: true, points_awarded: true, total_duration: totalDuration })
    .eq('session_token', sessionToken)

  // Insert watch history
  await supabase.from('watch_history').insert({
    user_id: userId,
    provider: dramaMeta.provider,
    drama_id: dramaMeta.dramaId,
    drama_title: dramaMeta.title,
    drama_cover: dramaMeta.cover,
    episode_number: dramaMeta.episodeNumber,
    duration_watched: Math.floor(totalDuration * (watchPercentage / 100)),
    total_duration: totalDuration,
    watch_percentage: watchPercentage,
    points_earned: totalPoints,
    reward_claimed: true,
    session_token: sessionToken,
  })

  // Insert reward transaction
  await supabase.from('reward_transactions').insert({
    user_id: userId,
    type: 'earn',
    points: totalPoints,
    description: `Nonton: ${dramaMeta.title} Ep.${dramaMeta.episodeNumber}${streakBonus > 0 ? ` + Streak Bonus!` : ''}`,
    status: 'completed',
  })

  // Update profile points
  await supabase
    .from('profiles')
    .update({
      total_points: profile.total_points + totalPoints,
      total_earned: (profile.total_points + totalPoints),
      daily_points_today: currentDailyPoints + totalPoints,
      last_daily_reset: isNewDay ? now.toISOString() : profile.last_daily_reset,
    })
    .eq('id', userId)

  const message = streakBonus > 0
    ? `+${basePoints} poin + Streak Bonus +${streakBonus} poin! 🎉`
    : `+${totalPoints} poin earned!`

  return { pointsEarned: totalPoints, message }
}

export async function dailyCheckin(userId: string): Promise<{ pointsEarned: number; message: string }> {
  const supabase = await createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, last_checkin')
    .eq('id', userId)
    .single()

  if (!profile) return { pointsEarned: 0, message: 'User tidak ditemukan' }

  const now = new Date()
  const lastCheckin = profile.last_checkin ? new Date(profile.last_checkin) : null

  if (lastCheckin && now.toDateString() === lastCheckin.toDateString()) {
    return { pointsEarned: 0, message: 'Sudah check-in hari ini' }
  }

  await supabase.from('reward_transactions').insert({
    user_id: userId, type: 'checkin', points: CHECKIN_POINTS,
    description: 'Daily Check-in', status: 'completed',
  })

  await supabase
    .from('profiles')
    .update({ total_points: profile.total_points + CHECKIN_POINTS, last_checkin: now.toISOString() })
    .eq('id', userId)

  return { pointsEarned: CHECKIN_POINTS, message: `Check-in berhasil! +${CHECKIN_POINTS} poin` }
}

export async function requestWithdrawal(
  userId: string,
  points: number,
  ewalletType: string,
  ewalletNumber: string,
  ewalletName: string
): Promise<{ success: boolean; message: string }> {
  const MIN_WITHDRAW = 5000
  const POINTS_TO_IDR = 10 // 1000 points = Rp 10.000 → 1 point = Rp 10

  if (points < MIN_WITHDRAW) {
    return { success: false, message: `Minimum penarikan ${MIN_WITHDRAW} poin` }
  }

  const supabase = await createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', userId)
    .single()

  if (!profile || profile.total_points < points) {
    return { success: false, message: 'Saldo poin tidak mencukupi' }
  }

  const amountIdr = points * POINTS_TO_IDR

  await supabase.from('reward_transactions').insert({
    user_id: userId,
    type: 'withdraw',
    points: -points,
    description: `Penarikan ${points} poin → Rp ${amountIdr.toLocaleString('id-ID')}`,
    status: 'pending',
    ewallet_type: ewalletType,
    ewallet_number: ewalletNumber,
    ewallet_name: ewalletName,
    amount_idr: amountIdr,
  })

  await supabase
    .from('profiles')
    .update({ total_points: profile.total_points - points })
    .eq('id', userId)

  return { success: true, message: `Permintaan penarikan Rp ${amountIdr.toLocaleString('id-ID')} sedang diproses` }
}
