import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number): string {
  return points.toLocaleString('id-ID')
}

export function pointsToRupiah(points: number): string {
  const idr = points * 10
  return `Rp ${idr.toLocaleString('id-ID')}`
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return views.toString()
}

export function truncate(text: string, length: number): string {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

export const PROVIDER_LABELS: Record<string, string> = {
  pinedrama: 'PineDrama',
  dramabox: 'DramaBox',
  reelshort: 'ReelShort',
  shortmax: 'ShortMax',
  melolo: 'Melolo',
  freereels: 'FreeReels',
  dramanova: 'DramaNova',
  anime: 'Anime',
  komik: 'Komik',
  moviebox: 'MovieBox',
}

export const PROVIDER_COLORS: Record<string, string> = {
  pinedrama: 'bg-pink-500',
  dramabox: 'bg-purple-600',
  reelshort: 'bg-blue-600',
  shortmax: 'bg-orange-500',
  melolo: 'bg-green-600',
  freereels: 'bg-cyan-600',
  dramanova: 'bg-red-600',
  anime: 'bg-yellow-500',
  komik: 'bg-indigo-600',
  moviebox: 'bg-gray-700',
}
