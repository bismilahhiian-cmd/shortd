import * as cheerio from 'cheerio'

const BASE_URL = 'https://otakudesu.cloud' // Fallback to otakudesu

export const scrapeAnimeLatest = async () => {
  const res = await fetch(`${BASE_URL}/ongoing-anime/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const list: any[] = []
  $('.venz ul li').each((_, el) => {
    const title = $(el).find('.jdlflm').text().trim()
    const id = $(el).find('a').attr('href')?.split('/anime/')[1]?.replace('/', '')
    const cover = $(el).find('img').attr('src')
    const episodes = $(el).find('.epz').text().trim()
    const day = $(el).find('.epztipe').text().trim()
    
    if (id && title) {
      list.push({
        id,
        title,
        cover,
        episodes,
        day,
        isNew: true
      })
    }
  })
  return list
}

export const scrapeAnimeDetail = async (id: string) => {
  const res = await fetch(`${BASE_URL}/anime/${id}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('.fotoanime .infozin .judulfact h1').text().trim()
  const cover = $('.fotoanime img').attr('src')
  const description = $('.sinopc').text().trim()
  
  const episodes: any[] = []
  $('.episodelist ul li').each((_, el) => {
    const epTitle = $(el).find('a').text().trim()
    const epId = $(el).find('a').attr('href')?.split('/episode/')[1]?.replace('/', '')
    const date = $(el).find('.zeebr').text().trim()
    
    // Extracted episode number from title
    const match = epTitle.match(/Episode\s(\d+)/i)
    const epNum = match ? parseInt(match[1]) : episodes.length + 1
    
    if (epId) {
      episodes.push({
        id: epId,
        episode_number: epNum,
        title: epTitle,
        date
      })
    }
  })
  
  return {
    id,
    title,
    cover,
    description,
    episodes: episodes.reverse() // Make it ascending 1,2,3
  }
}

export const scrapeAnimeEpisode = async (episodeId: string) => {
  const res = await fetch(`${BASE_URL}/episode/${episodeId}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('.venutama h1').text().trim()
  
  // Scrape video links
  const streams: { reso: string, urls: { provider: string, url: string }[] }[] = []
  
  $('.download ul li').each((_, el) => {
    const reso = $(el).find('strong').text().trim()
    const urls: { provider: string, url: string }[] = []
    
    $(el).find('a').each((_, a) => {
      urls.push({
        provider: $(a).text().trim(),
        url: $(a).attr('href') || ''
      })
    })
    
    streams.push({ reso, urls })
  })

  // Try to find an iframe for direct play
  const iframeSrc = $('#lightsVideo iframe').attr('src')
  
  return {
    id: episodeId,
    title,
    iframe: iframeSrc,
    streams
  }
}
