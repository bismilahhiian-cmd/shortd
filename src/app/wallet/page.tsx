'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatPoints, pointsToRupiah } from '@/lib/utils'
import { Coins, TrendingUp, ArrowDownToLine, Gift, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const EWALLET_OPTIONS = [
  { value: 'gopay', label: 'GoPay' },
  { value: 'ovo', label: 'OVO' },
  { value: 'dana', label: 'Dana' },
  { value: 'shopeepay', label: 'ShopeePay' },
]

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawData, setWithdrawData] = useState({ points: '', ewallet: 'gopay', number: '', name: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  async function fetchTransactions() {
    const res = await fetch('/api/rewards')
    const data = await res.json()
    setTransactions(data.transactions || [])
  }

  async function handleCheckin() {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin' }),
    })
    const data = await res.json()
    if (data.pointsEarned > 0) {
      toast.success(data.message)
      refreshProfile()
      fetchTransactions()
    } else {
      toast.info(data.message)
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'withdraw',
        points: parseInt(withdrawData.points),
        ewalletType: withdrawData.ewallet,
        ewalletNumber: withdrawData.number,
        ewalletName: withdrawData.name,
      }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message)
      setShowWithdrawForm(false)
      refreshProfile()
      fetchTransactions()
    } else {
      toast.error(data.message || data.error)
    }
    setLoading(false)
  }

  const totalPoints = profile?.total_points || 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dompet Poin</h1>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 to-purple-900 border border-violet-500/30 p-6 mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
        <p className="text-gray-300 text-sm mb-1">Total Poin Kamu</p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-white">{formatPoints(totalPoints)}</span>
          <span className="text-violet-300 mb-1">poin</span>
        </div>
        <p className="text-violet-200 text-sm mt-1">≈ {pointsToRupiah(totalPoints)}</p>

        <div className="mt-4 flex gap-3">
          <button onClick={handleCheckin}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Calendar className="w-4 h-4" /> Daily Check-in
          </button>
          <button onClick={() => setShowWithdrawForm(true)}
            disabled={totalPoints < 5000}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            <ArrowDownToLine className="w-4 h-4" /> Tarik Poin
          </button>
        </div>

        {totalPoints < 5000 && (
          <p className="text-yellow-300 text-xs mt-2">
            ⚠️ Perlu {formatPoints(5000 - totalPoints)} poin lagi untuk bisa menarik
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Coins, label: 'Total Earned', value: formatPoints(profile?.total_earned || 0) + ' poin', color: 'text-yellow-400' },
          { icon: TrendingUp, label: 'Hari Ini', value: formatPoints(profile?.daily_points_today || 0) + '/200', color: 'text-green-400' },
          { icon: Gift, label: 'Streak', value: (profile?.streak_count || 0) + ' hari', color: 'text-pink-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-xl p-3 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <div className="glass rounded-2xl p-6 mb-6 border border-yellow-500/30">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-yellow-400" /> Form Penarikan
          </h2>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Jumlah Poin</label>
              <input type="number" value={withdrawData.points} onChange={e => setWithdrawData({...withdrawData, points: e.target.value})}
                min="5000" max={totalPoints} step="1000" required
                placeholder="Min. 5000 poin"
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-yellow-500" />
              {withdrawData.points && <p className="text-xs text-yellow-400 mt-1">= {pointsToRupiah(parseInt(withdrawData.points) || 0)}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">E-Wallet</label>
              <select value={withdrawData.ewallet} onChange={e => setWithdrawData({...withdrawData, ewallet: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-yellow-500">
                {EWALLET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Nomor {EWALLET_OPTIONS.find(o => o.value === withdrawData.ewallet)?.label}</label>
              <input type="text" value={withdrawData.number} onChange={e => setWithdrawData({...withdrawData, number: e.target.value})}
                placeholder="08xxxxxxxxxx" required
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Nama Pemilik Akun</label>
              <input type="text" value={withdrawData.name} onChange={e => setWithdrawData({...withdrawData, name: e.target.value})}
                placeholder="Nama sesuai akun e-wallet" required
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowWithdrawForm(false)}
                className="flex-1 glass text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-bold transition-colors">
                {loading ? 'Memproses...' : 'Ajukan Penarikan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="font-bold mb-4">Riwayat Transaksi</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada transaksi. Mulai nonton drama untuk kumpulkan poin!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tx.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  ) : tx.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-white">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.points > 0 ? '+' : ''}{formatPoints(tx.points)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
