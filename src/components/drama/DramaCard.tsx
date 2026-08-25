import Image from 'next/image'
import Link from 'next/link'
import { truncate, PROVIDER_LABELS, PROVIDER_COLORS, cn } from '@/lib/utils'
import { Play, Star } from 'lucide-react'

interface DramaCardProps {
  provider: string
  id: string
  title: string
  cover: string
  episodes?: number
  views?: number
  categories?: string
  isHot?: boolean
  isNew?: boolean
}

export default function DramaCard({
  provider, id, title, cover, episodes, views, categories, isHot, isNew
}: DramaCardProps) {
  const href = `/watch/${provider}/${id}`

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl card-hover">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] bg-gray-800">
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-violet-600/90 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {isHot && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">HOT</span>
            )}
            {isNew && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>
            )}
          </div>

          {/* Provider badge */}
          <div className={cn('absolute top-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md', PROVIDER_COLORS[provider] || 'bg-gray-600')}>
            {PROVIDER_LABELS[provider] || provider}
          </div>

          {/* Episode count */}
          {episodes && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-md">
              {episodes} Ep
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2 px-0.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-violet-300 transition-colors">
            {title}
          </h3>
          {categories && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{truncate(categories, 30)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
