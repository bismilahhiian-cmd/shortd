export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Star, Eye, ListVideo, Coins } from 'lucide-react'
import { formatViews } from '@/lib/utils'

import { pinedrama, dramabox, melolo, reelshort, shortmax, freereels, dramanova, anime, komik, moviebox } from '@/lib/api/sansekai'

export default async function DramaDetailPage({ params }: { params: { provider: string, id: string } }) {
  const { provider, id } = params
  
  let detail: any = {}
  let episodesList: any = null
  
  try {
    let res: any = null
    switch (provider) {
      case 'pinedrama': res = await pinedrama.detail(id); break;
      case 'dramabox': res = await dramabox.detail(id); episodesList = await dramabox.allepisode(id); break;
      case 'melolo': res = await melolo.detail(id); break;
      case 'reelshort': res = await reelshort.detail(id); break;
      case 'shortmax': res = await shortmax.detail(id); break;
      case 'freereels': res = await freereels.detailAndAllEpisode(id); break;
      case 'dramanova': res = await dramanova.detail(id); break;
      case 'anime': res = await anime.detail(id); break;
      case 'komik': res = await komik.detail(id); break;
      case 'moviebox': res = await moviebox.detail(id); break;
      default: throw new Error("Unknown provider")
    }
    detail = res?.data || res?.detail || res || {}
    
    // Some providers have episodes in a separate call
    if (episodesList) {
      detail.episode_list = episodesList?.data || episodesList?.list || episodesList
    }
  } catch (e) {
    console.error("Failed to fetch detail", e)
  }
  
  const title = detail.title || detail.name || detail.book_name || 'Drama Tidak Diketahui'
  const cover = detail.cover || detail.cover_img || detail.thumbnail || detail.image || ''
  const description = detail.description || detail.desc || detail.summary || 'Tidak ada deskripsi.'
  const episodes = detail.episodes || detail.episode_list || detail.chapter_list || []
  const totalEpisodes = detail.total_episodes || detail.episode_count || episodes.length || 0
  const views = detail.views || detail.view_count || 0
  const tags = Array.isArray(detail.tags) ? detail.tags.join(', ') : (detail.categories || detail.genre || '')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Cover Image */}
        <div className="w-full md:w-1/3 max-w-sm mx-auto md:mx-0 shrink-0">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {cover ? (
              <Image src={cover} alt={title} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">No Cover</div>
            )}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold capitalize border border-white/10">
              {provider}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-6">
            <span className="flex items-center gap-1.5 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
              <ListVideo className="w-4 h-4 text-violet-400" /> {totalEpisodes} Episode
            </span>
            <span className="flex items-center gap-1.5 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
              <Eye className="w-4 h-4 text-blue-400" /> {formatViews(views)}
            </span>
            <span className="flex items-center gap-1.5 bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/20 font-medium">
              <Coins className="w-4 h-4" /> +10 Poin / Ep
            </span>
          </div>

          <div className="mb-8">
            <h3 className="text-gray-400 text-sm mb-2 font-medium">Kategori</h3>
            <p className="text-sm font-semibold">{tags || '-'}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm mb-2 font-medium">Sinopsis</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-6">{description}</p>
          </div>
        </div>
      </div>

      {/* Episode List */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Play className="w-5 h-5 text-violet-400" /> Pilih Episode
        </h2>
        
        {episodes.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-gray-400">Daftar episode tidak tersedia untuk saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {episodes.map((ep: any, index: number) => {
              const epNum = ep.episode_number || ep.chapter_number || ep.episode || ep.sort || (index + 1)
              const isVIP = ep.is_vip || ep.need_pay || false
              
              return (
                <Link 
                  key={ep.id || index}
                  href={`/watch/${provider}/${id}/${epNum}`}
                  className="group relative bg-gray-900 hover:bg-violet-900/40 border border-gray-800 hover:border-violet-500/50 rounded-xl p-4 transition-all duration-300 overflow-hidden"
                >
                  <div className="flex items-center justify-between z-10 relative">
                    <span className="font-bold text-gray-300 group-hover:text-white transition-colors">
                      Eps {epNum}
                    </span>
                    {isVIP && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
