'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdblockDetector() {
  const [adblockDetected, setAdblockDetected] = useState(false)

  useEffect(() => {
    async function detect() {
      try {
        // Method 1: Bait element
        const bait = document.createElement('div')
        bait.setAttribute('class', 'ads ad adsbox doubleclick ad-placement carbon-ads')
        bait.setAttribute('style', 'height:1px;width:1px;position:absolute;left:-9999px;')
        bait.innerHTML = '&nbsp;'
        document.body.appendChild(bait)

        await new Promise(r => setTimeout(r, 150))

        const isBlocked =
          bait.offsetHeight === 0 ||
          bait.clientHeight === 0 ||
          bait.offsetWidth === 0 ||
          getComputedStyle(bait).display === 'none' ||
          getComputedStyle(bait).visibility === 'hidden'

        document.body.removeChild(bait)

        // Method 2: Fetch bait URL
        let fetchBlocked = false
        try {
          const res = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD', mode: 'no-cors',
          })
        } catch {
          fetchBlocked = true
        }

        if (isBlocked || fetchBlocked) {
          setAdblockDetected(true)
          toast.error('AdBlock terdeteksi! Nonaktifkan AdBlock untuk mengakses PioDramas dan mendapatkan reward.', {
            duration: Infinity,
            id: 'adblock-warning',
          })
        }
      } catch {}
    }

    detect()
  }, [])

  if (!adblockDetected) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-950/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 border border-red-500/50 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-400 mb-3">AdBlock Terdeteksi!</h2>
        <p className="text-gray-300 mb-2">
          PioDramas adalah layanan <strong>gratis</strong> yang didukung oleh iklan.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Nonaktifkan AdBlock / Ad Blocker kamu untuk bisa menonton drama, mendapatkan poin, 
          dan menukarkan poin ke saldo e-wallet.
        </p>
        <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left text-sm text-gray-300 space-y-2">
          <p className="font-semibold text-white">Cara menonaktifkan:</p>
          <p>1. Klik ikon ekstensi AdBlock di browser kamu</p>
          <p>2. Pilih <strong>"Pause on this site"</strong> atau <strong>"Disable"</strong></p>
          <p>3. Refresh halaman ini</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Sudah dinonaktifkan — Refresh
        </button>
      </div>
    </div>
  )
}
