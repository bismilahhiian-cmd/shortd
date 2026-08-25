'use client'

import Link from 'next/link'
import { Coins, TrendingUp, Gift, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function RewardBanner() {
  const { user } = useAuth()

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/50 via-purple-900/50 to-pink-900/50 border border-violet-500/30 p-6 md:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-semibold">REWARD PROGRAM</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Nonton Drama,<br />
              <span className="gradient-text">Dapat Uang Sungguhan!</span>
            </h2>
            <p className="text-gray-300 text-sm max-w-md">
              Kumpulkan poin dari setiap episode yang kamu tonton, lalu tukarkan langsung ke GoPay, OVO, atau Dana.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
              <Coins className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Per episode</p>
                <p className="text-sm font-bold text-white">+10 poin</p>
              </div>
            </div>
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Streak 5 episode</p>
                <p className="text-sm font-bold text-white">+50 bonus poin</p>
              </div>
            </div>
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
              <Gift className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-xs text-gray-400">Referral teman</p>
                <p className="text-sm font-bold text-white">+100 poin/orang</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex gap-3">
          {user ? (
            <Link href="/wallet"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Lihat Dompet <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href="/auth/login"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Daftar Gratis <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link href="/cara-kerja"
            className="flex items-center gap-2 glass text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
            Cara Kerja
          </Link>
        </div>
      </div>
    </section>
  )
}
