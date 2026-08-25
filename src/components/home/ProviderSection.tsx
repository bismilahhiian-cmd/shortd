import Link from 'next/link'
import DramaCard from '@/components/drama/DramaCard'
import { ChevronRight } from 'lucide-react'

interface ProviderSectionProps {
  title: string
  provider: string
  items: any[]
  viewAllHref: string
}

function normalizeItem(item: any, provider: string) {
  // Normalize different API response structures
  return {
    id: item.collection_id || item.bookId || item.id || item.book_id || item.shortPlayId || item.urlId || item.dramaId || '',
    title: item.title || item.name || item.book_name || '',
    cover: item.cover || item.cover_img || item.thumbnail || item.image || '',
    episodes: item.total_episodes || item.episode_count || item.episodes || 0,
    views: item.views || item.view_count || 0,
    categories: Array.isArray(item.tags) ? item.tags.join(', ') : (item.categories || item.genre || ''),
    isHot: item.label_hot || item.is_hot || false,
    isNew: item.label_new || item.is_new || false,
  }
}

export default function ProviderSection({ title, provider, items, viewAllHref }: ProviderSectionProps) {
  if (!items || !Array.isArray(items) || items.length === 0) return null

  const displayItems = items.slice(0, 10)

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <Link href={viewAllHref}
          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
          Lihat semua <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {displayItems.map((item, idx) => {
          const normalized = normalizeItem(item, provider)
          if (!normalized.id || !normalized.title) return null
          return (
            <DramaCard
              key={normalized.id || idx}
              provider={provider}
              {...normalized}
            />
          )
        })}
      </div>
    </section>
  )
}
