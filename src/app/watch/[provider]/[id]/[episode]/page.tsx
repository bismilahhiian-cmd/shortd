export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import VideoPlayer from '@/components/player/VideoPlayer'
import { pinedrama, dramabox, melolo, reelshort, shortmax, freereels, dramanova, anime, moviebox } from '@/lib/api/sansekai'

export default async function WatchEpisodePage({ params }: { params: { provider: string, id: string, episode: string } }) {
  const { provider, id, episode } = params
  
  let epData: any = {}
  let detail: any = {}
  
  try {
    let resEp: any = null
    let resDet: any = null
    const epNum = parseInt(episode)

    switch (provider) {
      case 'pinedrama':
        [resEp, resDet] = await Promise.all([pinedrama.episode(id, epNum), pinedrama.detail(id)]);
        break;
      case 'dramabox':
        resDet = await dramabox.detail(id);
        const epListRes = await dramabox.allepisode(id);
        const list = epListRes?.data?.list || epListRes?.data || [];
        const epItem = list.find((e:any) => e.episode === epNum || e.sort === epNum || e.chapter_number === epNum);
        if (epItem && epItem.url) {
          resEp = await dramabox.decrypt(epItem.url);
        }
        break;
      case 'melolo':
        [resEp, resDet] = await Promise.all([melolo.episode(id), melolo.detail(id)]);
        break;
      case 'anime':
        resDet = await anime.detail(id);
        resEp = await anime.getvideo(episode);
        break;
      default:
        // Generic fallback for others that follow standard pattern
        resDet = await pinedrama.detail(id).catch(() => null) // dummy
    }
    
    epData = resEp?.data || resEp || {}
    detail = resDet?.data || resDet?.detail || resDet || {}
  } catch (e) {
    console.error("Failed to fetch episode", e)
  }

  let streamUrl = epData.url || epData.video_url || epData.stream_url || epData.m3u8 || ''
  
  if (provider === 'anime' && epData.streams && epData.streams.length > 0) {
    // Try to get a valid mp4 url from the streams list (Otakudesu scraper)
    const stream = epData.streams[0]
    streamUrl = stream.urls[0]?.url || streamUrl
  }

  const title = detail.title || detail.name || detail.book_name || 'Drama'
  const cover = detail.cover || detail.cover_img || detail.thumbnail || detail.image || ''
  
  // Try to parse totalDuration if available (some APIs return it)
  const duration = parseInt(epData.duration || '0')

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={`/watch/${provider}/${id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Episode
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-violet-400 font-medium">Episode {episode}</p>
      </div>

      {streamUrl ? (
        <VideoPlayer 
          streamUrl={streamUrl}
          provider={provider}
          dramaId={id}
          dramaTitle={title}
          dramaCover={cover}
          episodeNumber={parseInt(episode)}
          totalDuration={duration}
        />
      ) : (
        <div className="aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center border border-gray-800">
          <p className="text-red-400 mb-2">Video tidak tersedia</p>
          <p className="text-sm text-gray-500">Mungkin link episode rusak atau ini episode VIP berbayar.</p>
        </div>
      )}
    </div>
  )
}
