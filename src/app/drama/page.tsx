export const dynamic = 'force-dynamic'

import { dramabox, pinedrama, melolo } from '@/lib/api/sansekai'
import ProviderSection from '@/components/home/ProviderSection'

export default async function DramaPage() {
  const [dbData, pineData, melData] = await Promise.allSettled([
    dramabox.foryou(1, 'id'),
    pinedrama.trending(),
    melolo.trending()
  ])

  const dramaboxList = dbData.status === 'fulfilled' ? dbData.value : null
  const pinedramaList = pineData.status === 'fulfilled' ? pineData.value : null
  const mololoList = melData.status === 'fulfilled' ? melData.value : null

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Semua Drama</h1>
        <p className="text-gray-400 mt-2">Kumpulan drama pendek terbaik dari berbagai platform.</p>
      </div>

      {dramaboxList && (
        <ProviderSection title="DramaBox" provider="dramabox" items={dramaboxList?.data?.list || dramaboxList?.data || []} viewAllHref="/search" />
      )}
      {pinedramaList && (
        <ProviderSection title="PineDrama" provider="pinedrama" items={pinedramaList?.collections || pinedramaList?.data || []} viewAllHref="/search" />
      )}
      {mololoList && (
        <ProviderSection title="Melolo" provider="melolo" items={mololoList?.data?.list || mololoList?.data || []} viewAllHref="/search" />
      )}
    </div>
  )
}
