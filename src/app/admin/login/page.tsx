'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Lock, User } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Login admin berhasil!')
      router.push('/admin')
      router.refresh()
    } else {
      toast.error(data.error || 'Login gagal')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Film className="w-10 h-10 text-violet-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold gradient-text">PioDramas Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Panel Administrasi</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={credentials.username}
                onChange={e => setCredentials({...credentials, username: e.target.value})}
                required className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})}
                required className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Memproses...' : 'Masuk ke Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
