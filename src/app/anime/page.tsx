export const dynamic = 'force-dynamic'

import { anime } from '@/lib/api/sansekai'
import ProviderSection from '@/components/home/ProviderSection'

export default async function AnimePage() {
  const animeData = await anime.recommended(1).catch(() => null)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Semua Anime</h1>
        <p className="text-gray-400 mt-2">Tonton anime favoritmu dan dapatkan poin.</p>
      </div>

      {animeData && (
        <ProviderSection title="Anime Terbaru" provider="anime" items={animeData?.data?.list || animeData?.data || []} viewAllHref="/search" />
      )}
    </div>
  )
}
