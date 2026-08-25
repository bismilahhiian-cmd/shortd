'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Users, ArrowDownToLine, BarChart3, Trash2, Ban, CheckCircle, XCircle, LogOut } from 'lucide-react'
import { formatPoints, pointsToRupiah } from '@/lib/utils'
import { toast } from 'sonner'

type AdminTab = 'dashboard' | 'users' | 'withdrawals'

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (tab === 'users') fetchUsers()
    if (tab === 'withdrawals') fetchWithdrawals()
  }, [tab])

  async function fetchStats() {
    const res = await fetch('/api/admin/users?action=stats')
    const data = await res.json()
    setStats(data)
  }

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users || [])
  }

  async function fetchWithdrawals() {
    const res = await fetch('/api/admin/users?action=withdrawals')
    const data = await res.json()
    setWithdrawals(data.withdrawals || [])
  }

  async function blockUser(userId: string, reason: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'block', userId, reason }),
    })
    const data = await res.json()
    toast.success(data.message)
    fetchUsers()
  }

  async function deleteUser(userId: string) {
    if (!confirm('Yakin hapus akun ini? Tindakan tidak dapat dibatalkan.')) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    toast.success(data.message)
    fetchUsers()
  }

  async function handleWithdrawal(transactionId: string, action: 'approve' | 'reject', userId?: string, points?: number) {
    const note = action === 'reject' ? prompt('Alasan penolakan:') || '' : ''
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action === 'approve' ? 'approve_withdrawal' : 'reject_withdrawal',
        transactionId, note, userId, points,
      }),
    })
    const data = await res.json()
    toast.success(data.message)
    fetchWithdrawals()
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin Header */}
      <div className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Film className="w-6 h-6 text-violet-400" />
          <span className="font-bold text-lg">PioDramas Admin</span>
          <span className="bg-violet-600/30 text-violet-300 text-xs px-2 py-0.5 rounded-full">WisnuDrama</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900/50 border-b border-white/10 px-6">
        <div className="flex gap-1">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Pengguna', icon: Users },
            { id: 'withdrawals', label: 'Penarikan', icon: ArrowDownToLine },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">

        {/* Dashboard Stats */}
        {tab === 'dashboard' && (
          <div>
            <h1 className="text-xl font-bold mb-6">Dashboard</h1>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Pengguna', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
                  { label: 'Total Poin Beredar', value: formatPoints(stats.totalPointsEarned), icon: Film, color: 'text-yellow-400' },
                  { label: 'Penarikan Pending', value: stats.pendingWithdrawals.toLocaleString(), icon: ArrowDownToLine, color: 'text-orange-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="glass rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <p className="text-sm text-gray-400">{label}</p>
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400">Memuat statistik...</p>}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <h1 className="text-xl font-bold mb-6">Manajemen Pengguna</h1>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="text-left py-3 pr-4">Pengguna</th>
                    <th className="text-left py-3 pr-4">Email</th>
                    <th className="text-right py-3 pr-4">Poin</th>
                    <th className="text-center py-3 pr-4">Status</th>
                    <th className="text-center py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{user.full_name || 'User'}</div>
                        <div className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{user.email}</td>
                      <td className="py-3 pr-4 text-right text-yellow-400 font-bold">{formatPoints(user.total_points || 0)}</td>
                      <td className="py-3 pr-4 text-center">
                        {user.is_blocked
                          ? <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">Diblokir</span>
                          : <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Aktif</span>
                        }
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {user.is_blocked ? (
                            <button onClick={() => handleWithdrawal(user.id, 'approve')}
                              className="text-green-400 hover:text-green-300 p-1" title="Buka Blokir">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => blockUser(user.id, prompt('Alasan pemblokiran:') || 'Melanggar ketentuan')}
                              className="text-orange-400 hover:text-orange-300 p-1" title="Blokir">
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => deleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 p-1" title="Hapus Akun">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {tab === 'withdrawals' && (
          <div>
            <h1 className="text-xl font-bold mb-6">Permintaan Penarikan</h1>
            {withdrawals.length === 0 ? (
              <p className="text-gray-400">Tidak ada penarikan pending.</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(tx => (
                  <div key={tx.id} className="glass rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{tx.profiles?.full_name || 'User'}</p>
                        <p className="text-sm text-gray-400">{tx.profiles?.email}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p><span className="text-gray-400">E-Wallet:</span> {tx.ewallet_type?.toUpperCase()} - {tx.ewallet_number}</p>
                          <p><span className="text-gray-400">Atas Nama:</span> {tx.ewallet_name}</p>
                          <p><span className="text-gray-400">Poin:</span> <span className="text-yellow-400 font-bold">{formatPoints(Math.abs(tx.points))}</span></p>
                          <p><span className="text-gray-400">Nominal:</span> <span className="text-green-400 font-bold">{pointsToRupiah(Math.abs(tx.points))}</span></p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleWithdrawal(tx.id, 'approve')}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                          <CheckCircle className="w-4 h-4" /> Setujui
                        </button>
                        <button onClick={() => handleWithdrawal(tx.id, 'reject', tx.user_id, Math.abs(tx.points))}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                          <XCircle className="w-4 h-4" /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
