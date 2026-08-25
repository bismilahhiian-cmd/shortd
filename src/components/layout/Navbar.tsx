'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatPoints } from '@/lib/utils'
import {
  Film, Search, Menu, X, Coins, User, LogOut,
  ChevronDown, Star, Tv, BookOpen, Clapperboard
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Drama', href: '/drama', icon: Tv },
  { label: 'Anime', href: '/anime', icon: Star },
  { label: 'Komik', href: '/komik', icon: BookOpen },
  { label: 'Film', href: '/film', icon: Clapperboard },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Film className="w-7 h-7 text-violet-400" />
            <span className="text-xl font-bold gradient-text">PioDramas</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </Link>

            {user ? (
              <>
                {/* Points badge */}
                <Link href="/wallet" className="hidden sm:flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-violet-600/30 transition-colors">
                  <Coins className="w-4 h-4" />
                  {formatPoints(profile?.total_points || 0)}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <User className="w-4 h-4" /> Profil
                      </Link>
                      <Link href="/wallet" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Coins className="w-4 h-4" /> Dompet Poin
                      </Link>
                      <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors">
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/auth/login"
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                Masuk
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400 hover:text-white">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-white/10 px-4 py-4 space-y-2">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
          {user && (
            <Link href="/wallet" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 text-violet-300 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
              <Coins className="w-5 h-5" /> {formatPoints(profile?.total_points || 0)} Poin
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
