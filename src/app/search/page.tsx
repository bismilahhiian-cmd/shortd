'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import DramaCard from '@/components/drama/DramaCard'
import { PROVIDER_LABELS } from '@/lib/utils'

const SEARCH_PROVIDERS = ['dramabox', 'pinedrama', 'reelshort', 'shortmax', 'melolo', 'anime', 'komik', 'moviebox']

function normalizeSearchResult(item: any, provider: string) {
  return {
    id: item.collection_id || item.bookId || item.id || item.book_id || item.shortPlayId || item.urlId || item.dramaId || item.manga_id || '',
    title: item.title || item.name || item.book_name || '',
    cover: item.cover || item.cover_img || item.thumbnail || item.image || '',
    episodes: item.total_episodes || item.episode_count || item.episodes || 0,
    categories: Array.isArray(item.tags) ? item.tags.join(', ') : (item.categories || item.genre || ''),
    isHot: item.label_hot || false,
    isNew: item.label_new || false,
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const searchResults: Record<string, any[]> = {}

    await Promise.allSettled(
      SEARCH_PROVIDERS.map(async (provider) => {
        try {
          const res = await fetch(`/api/drama?provider=${provider}&endpoint=search&query=${encodeURIComponent(query)}`)
          const data = await res.json()
          const items = data?.data?.list || data?.data || data?.collections || data?.results || []
          if (Array.isArray(items) && items.length > 0) {
            searchResults[provider] = items.slice(0, 6)
          }
        } catch {}
      })
    )

    setResults(searchResults)
    setLoading(false)
  }

  const totalResults = Object.values(results).flat().length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cari Drama, Anime & Komik</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Cari judul drama, anime, komik..."
            className="w-full bg-gray-900 border border-gray-700 text-white pl-12 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <button type="submit" disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Cari
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-violet-400" />
          <p>Mencari di {SEARCH_PROVIDERS.length} platform...</p>
        </div>
      )}

      {!loading && searched && totalResults === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">Tidak ditemukan</p>
          <p className="text-sm mt-1">Coba kata kunci lain</p>
        </div>
      )}

      {!loading && searched && totalResults > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-6">
            Ditemukan <span className="text-white font-semibold">{totalResults}</span> hasil untuk "{query}"
          </p>
          {Object.entries(results).map(([provider, items]) => (
            <div key={provider} className="mb-8">
              <h2 className="font-bold text-base mb-4">
                {PROVIDER_LABELS[provider] || provider}
                <span className="ml-2 text-gray-500 text-sm font-normal">({items.length} hasil)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((item, idx) => {
                  const n = normalizeSearchResult(item, provider)
                  if (!n.id || !n.title) return null
                  return <DramaCard key={n.id || idx} provider={provider} {...n} />
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
