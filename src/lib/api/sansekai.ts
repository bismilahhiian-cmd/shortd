import { createAdminClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SANSEKAI_API || 'https://api.sansekai.my.id/api'

// Cache TTL per endpoint type (in minutes)
const CACHE_TTL: Record<string, number> = {
  foryou: 30,
  trending: 20,
  latest: 15,
  homepage: 30,
  search: 10,
  detail: 60,
  episode: 120,
  allepisode: 120,
  decrypt: 60,
  recommended: 30,
  movie: 60,
  default: 20,
}

function getCacheTTL(endpoint: string): number {
  const key = Object.keys(CACHE_TTL).find(k => endpoint.includes(k))
  return CACHE_TTL[key || 'default']
}

export async function fetchWithCache(endpoint: string, params?: Record<string, string>): Promise<any> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
  const cacheKey = `${endpoint}${queryString}`.replace(/[^a-zA-Z0-9_:?=&]/g, '_')
  const fullUrl = `${BASE_URL}${endpoint}${queryString}`

  try {
    const supabase = await createAdminClient()

    // Check cache
    const { data: cached } = await supabase
      .from('drama_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached.data
    }

    // Fetch fresh data
    const res = await fetch(fullUrl, {
      headers: { 'User-Agent': 'PioDramas/1.0' },
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()

    // Store in cache
    const ttlMinutes = getCacheTTL(endpoint)
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()

    await supabase
      .from('drama_cache')
      .upsert({ cache_key: cacheKey, data, expires_at: expiresAt }, { onConflict: 'cache_key' })

    return data
  } catch (err) {
    // Fallback: fetch directly if cache fails
    const res = await fetch(fullUrl, { headers: { 'User-Agent': 'PioDramas/1.0' } })
    if (!res.ok) throw new Error(`Sansekai API error: ${res.status}`)
    return res.json()
  }
}

// ============================================================
// PineDrama
// ============================================================
export const pinedrama = {
  foryou: (cursor?: string) => fetchWithCache('/pinedrama/foryou', cursor ? { cursor } : undefined),
  trending: (cursor?: string) => fetchWithCache('/pinedrama/trending', cursor ? { cursor } : undefined),
  search: (query: string) => fetchWithCache('/pinedrama/search', { query }),
  detail: (collection_id: string) => fetchWithCache('/pinedrama/detail', { collection_id }),
  episode: (collection_id: string, episodeNumber: number) =>
    fetchWithCache('/pinedrama/episode', { collection_id, episodeNumber: String(episodeNumber) }),
}

import { DramaboxClient } from '@zhadev/dramabox'

const dbClient = new DramaboxClient()

// Helper to normalize zhadev responses to match sansekai format
const wrapDb = async (promise: Promise<any>) => {
  try {
    const res = await promise
    // @zhadev returns { success: true, data: { results: [...] } } or { data: [...] }
    // Sansekai returns { code: 200, data: [...] }
    if (!res.success) return { code: 400, msg: res.message || 'Error' }
    
    let normalizedData = res.data?.results || res.data?.list || res.data || []
    
    return {
      code: 200,
      data: normalizedData,
      detail: res.data // Sometimes detail is needed at top level
    }
  } catch (e: any) {
    return { code: 500, msg: e.message }
  }
}

// ============================================================
// DramaBox (Powered by @zhadev/dramabox native scraper)
// ============================================================
export const dramabox = {
  foryou: (page = 1, lang = 'id') => wrapDb(dbClient.getForYou(lang, page)),
  vip: (lang = 'id') => wrapDb(dbClient.getVip(lang)),
  dubindo: (classify: string, page = 1, lang = 'id') => wrapDb(dbClient.getDubIndo(lang, page)), // Assuming arg order
  randomdrama: (lang = 'id') => wrapDb(dbClient.getRandomDrama(lang)),
  latest: (lang = 'id') => wrapDb(dbClient.getLatest(lang)),
  trending: (lang = 'id') => wrapDb(dbClient.getTrending(lang)),
  populersearch: (lang = 'id') => wrapDb(dbClient.getPopularSearch(lang)),
  search: (query: string, lang = 'id') => wrapDb(dbClient.searchDrama(query, lang)),
  detail: (bookId: string, lang = 'id') => wrapDb(dbClient.getDramaDetail(bookId, lang)),
  allepisode: (bookId: string) => wrapDb(dbClient.getChapters(bookId)),
  decrypt: (url: string) => wrapDb(dbClient.getStreamUrl(url)),
}

// ============================================================
// ReelShort
// ============================================================
export const reelshort = {
  foryou: (lang = 'id', page = 1) => fetchWithCache('/reelshort/foryou', { lang, page: String(page) }),
  homepage: (lang = 'id') => fetchWithCache('/reelshort/homepage', { lang }),
  search: (query: string, lang = 'id', page = 1) =>
    fetchWithCache('/reelshort/search', { query, lang, page: String(page) }),
  detail: (bookId: string, lang = 'id') => fetchWithCache('/reelshort/detail', { bookId, lang }),
  episode: (bookId: string, episodeNumber: number, lang = 'id') =>
    fetchWithCache('/reelshort/episode', { bookId, episodeNumber: String(episodeNumber), lang }),
}

// ============================================================
// ShortMax
// ============================================================
export const shortmax = {
  foryou: (page = 1, lang = 'id') => fetchWithCache('/shortmax/foryou', { page: String(page), lang }),
  latest: (lang = 'id') => fetchWithCache('/shortmax/latest', { lang }),
  rekomendasi: (lang = 'id') => fetchWithCache('/shortmax/rekomendasi', { lang }),
  search: (query: string, lang = 'id') => fetchWithCache('/shortmax/search', { query, lang }),
  detail: (shortPlayId: string, lang = 'id') => fetchWithCache('/shortmax/detail', { shortPlayId, lang }),
  episode: (shortPlayId: string, episodeNumber: number, lang = 'id') =>
    fetchWithCache('/shortmax/episode', { shortPlayId, episodeNumber: String(episodeNumber), lang }),
}

// ============================================================
// Melolo
// ============================================================
export const melolo = {
  foryou: (offset = 20) => fetchWithCache('/melolo/foryou', { offset: String(offset) }),
  latest: () => fetchWithCache('/melolo/latest'),
  trending: () => fetchWithCache('/melolo/trending'),
  anime: (offset = 20) => fetchWithCache('/melolo/anime', { offset: String(offset) }),
  search: (query: string, limit = 10, offset = 0) =>
    fetchWithCache('/melolo/search', { query, limit: String(limit), offset: String(offset) }),
  detail: (book_id: string) => fetchWithCache('/melolo/detail', { book_id }),
  episode: (videoId: string) => fetchWithCache('/melolo/episode', { videoId }),
}

// ============================================================
// FreeReels
// ============================================================
export const freereels = {
  foryou: (offset = 20) => fetchWithCache('/freereels/foryou', { offset: String(offset) }),
  homepage: () => fetchWithCache('/freereels/homepage'),
  animepage: () => fetchWithCache('/freereels/animepage'),
  search: (query: string) => fetchWithCache('/freereels/search', { query }),
  detailAndAllEpisode: (key: string) => fetchWithCache('/freereels/detailAndAllEpisode', { key }),
}

// ============================================================
// DramaNova
// ============================================================
export const dramanova = {
  home: (page = 1) => fetchWithCache('/dramanova/home', { page: String(page) }),
  drama18: (page = 1) => fetchWithCache('/dramanova/drama18', { page: String(page) }),
  komik: (page = 1) => fetchWithCache('/dramanova/komik', { page: String(page) }),
  search: (query: string) => fetchWithCache('/dramanova/search', { query }),
  detail: (dramaId: string) => fetchWithCache('/dramanova/detail', { dramaId }),
  getvideo: (fileId: string) => fetchWithCache('/dramanova/getvideo', { fileId }),
}

// ============================================================
// Anime
// ============================================================
export const anime = {
  latest: () => fetchWithCache('/anime/latest'),
  recommended: (page = 1) => fetchWithCache('/anime/recommended', { page: String(page) }),
  movie: () => fetchWithCache('/anime/movie'),
  search: (query: string) => fetchWithCache('/anime/search', { query }),
  detail: (urlId: string) => fetchWithCache('/anime/detail', { urlId }),
  getvideo: (chapterUrlId: string, reso = '480p') =>
    fetchWithCache('/anime/getvideo', { chapterUrlId, reso }),
}

// ============================================================
// Komik
// ============================================================
export const komik = {
  recommended: (type: string) => fetchWithCache('/komik/recommended', { type }),
  latest: (type: string) => fetchWithCache('/komik/latest', { type }),
  search: (query: string) => fetchWithCache('/komik/search', { query }),
  popular: (page = 1) => fetchWithCache('/komik/popular', { page: String(page) }),
  detail: (manga_id: string) => fetchWithCache('/komik/detail', { manga_id }),
  chapterlist: (manga_id: string) => fetchWithCache('/komik/chapterlist', { manga_id }),
  getimage: (chapter_id: string) => fetchWithCache('/komik/getimage', { chapter_id }),
}

// ============================================================
// MovieBox
// ============================================================
export const moviebox = {
  homepage: () => fetchWithCache('/moviebox/homepage'),
  kdrama: () => fetchWithCache('/moviebox/k-drama'),
  indomovies: () => fetchWithCache('/moviebox/indo-movies'),
  hollywood: () => fetchWithCache('/moviebox/hollywood-movies'),
  search: (query: string) => fetchWithCache('/moviebox/search', { query }),
  detail: (subjectId: string, season = 0) =>
    fetchWithCache('/moviebox/detail', { subjectId, season: String(season) }),
  getDownloadUrl: (subjectId: string, episode = 0, season = 0) =>
    fetchWithCache('/moviebox/get-download-url', {
      subjectId, episode: String(episode), season: String(season)
    }),
}
