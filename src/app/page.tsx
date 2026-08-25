export const dynamic = 'force-dynamic'

import { dramabox, pinedrama, melolo, anime, reelshort } from '@/lib/api/sansekai'
import DramaCard from '@/components/drama/DramaCard'
import HeroBanner from '@/components/home/HeroBanner'
import ProviderSection from '@/components/home/ProviderSection'
import RewardBanner from '@/components/home/RewardBanner'
import { Coins, TrendingUp, Flame } from 'lucide-react'

export default async function HomePage() {
  // Fetch from multiple providers in parallel
  const [dramaboxData, pinedramaData, mololoData, animeData] = await Promise.allSettled([
    dramabox.foryou(1, 'id'),
    pinedrama.trending(),
    melolo.trending(),
    anime.recommended(1),
  ])

  const dramaboxList = dramaboxData.status === 'fulfilled' ? dramaboxData.value : null
  const pinedramaList = pinedramaData.status === 'fulfilled' ? pinedramaData.value : null
  const mololoList = mololoData.status === 'fulfilled' ? mololoData.value : null
  const animeList = animeData.status === 'fulfilled' ? animeData.value : null

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Reward Banner */}
      <RewardBanner />

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Coins, label: 'Nonton = Dapat Poin', value: '+10 poin/episode', color: 'text-yellow-400' },
            { icon: TrendingUp, label: 'Streak Bonus', value: '+50 poin per 5 ep', color: 'text-green-400' },
            { icon: Flame, label: 'Min. Withdraw', value: '5.000 poin = Rp 50.000', color: 'text-orange-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-sm font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DramaBox Section */}
      {dramaboxList && (
        <ProviderSection
          title="🎬 Drama Populer"
          provider="dramabox"
          items={dramaboxList?.data?.list || dramaboxList?.data || []}
          viewAllHref="/drama?provider=dramabox"
        />
      )}

      {/* PineDrama Trending */}
      {pinedramaList && (
        <ProviderSection
          title="🔥 PineDrama Trending"
          provider="pinedrama"
          items={pinedramaList?.collections || pinedramaList?.data || []}
          viewAllHref="/drama?provider=pinedrama"
        />
      )}

      {/* Melolo Trending */}
      {mololoList && (
        <ProviderSection
          title="⚡ Melolo Drama"
          provider="melolo"
          items={mololoList?.data?.list || mololoList?.data || []}
          viewAllHref="/drama?provider=melolo"
        />
      )}

      {/* Anime */}
      {animeList && (
        <ProviderSection
          title="🌸 Anime Rekomendasi"
          provider="anime"
          items={animeList?.data?.list || animeList?.data || []}
          viewAllHref="/anime"
        />
      )}
    </div>
  )
}
