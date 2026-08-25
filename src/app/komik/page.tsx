export const dynamic = 'force-dynamic'

import { komik } from '@/lib/api/sansekai'
import ProviderSection from '@/components/home/ProviderSection'

export default async function KomikPage() {
  let mangaList = []
  try {
    const res = await komik.latest('manga') // Assuming 'manga' or '' is the type
    mangaList = res?.data || []
  } catch (e) {
    console.error(e)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Semua Komik / Manga</h1>
        <p className="text-gray-400 mt-2">Baca manga terbaru dan kumpulkan poin.</p>
      </div>

      {mangaList.length > 0 && (
        <ProviderSection title="Manga Terbaru" provider="komik" items={mangaList} viewAllHref="/search" />
      )}
    </div>
  )
}
