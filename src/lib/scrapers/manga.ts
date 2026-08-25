import * as cheerio from 'cheerio'

const BASE_URL = 'https://komikindo.id' 

export const scrapeMangaLatest = async () => {
  const res = await fetch(`${BASE_URL}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const list: any[] = []
  $('.mangapost .animepost').each((_, el) => {
    const title = $(el).find('h4').text().trim()
    const url = $(el).find('a').attr('href')
    const id = url?.split('/komik/')[1]?.replace('/', '') || url?.split('/')[3]
    const cover = $(el).find('img').attr('src') || $(el).find('img').attr('data-src')
    const chapter = $(el).find('.lsch a').text().trim()
    
    if (id && title) {
      list.push({
        id,
        title,
        cover,
        chapter,
        isNew: true
      })
    }
  })
  return list
}

export const scrapeMangaDetail = async (id: string) => {
  const res = await fetch(`${BASE_URL}/komik/${id}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('.komik_info-content-body h1').text().trim()
  const cover = $('.komik_info-content-thumbnail img').attr('src')
  const description = $('.komik_info-description-sinopsis').text().trim()
  
  const chapters: any[] = []
  $('#chapter_list li').each((_, el) => {
    const chTitle = $(el).find('a').text().trim()
    const url = $(el).find('a').attr('href')
    const chId = url?.replace(BASE_URL, '')?.replaceAll('/', '') || ''
    const date = $(el).find('.dt').text().trim()
    
    const match = chTitle.match(/Chapter\s(\d+(\.\d+)?)/i)
    const chNum = match ? parseFloat(match[1]) : chapters.length + 1
    
    if (chId) {
      chapters.push({
        id: chId,
        chapter_number: chNum,
        title: chTitle,
        date
      })
    }
  })
  
  return {
    id,
    title,
    cover,
    description,
    episodes: chapters.reverse() 
  }
}

export const scrapeMangaChapter = async (chapterId: string) => {
  const res = await fetch(`${BASE_URL}/${chapterId}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('.chapter-content h1').text().trim()
  
  const images: string[] = []
  $('#chimg-auh img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    if (src) images.push(src)
  })
  
  return {
    id: chapterId,
    title,
    images
  }
}
