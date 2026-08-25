'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, Coins, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatPoints } from '@/lib/utils'

interface VideoPlayerProps {
  streamUrl: string
  provider: string
  dramaId: string
  dramaTitle: string
  dramaCover: string
  episodeNumber: number
  totalDuration?: number
  subtitleUrl?: string
}

export default function VideoPlayer({
  streamUrl, provider, dramaId, dramaTitle, dramaCover, episodeNumber, totalDuration = 0, subtitleUrl
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(totalDuration)
  const [loading, setLoading] = useState(true)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [hlsInstance, setHlsInstance] = useState<any>(null)
  const pingInterval = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  // Initialize watch session
  useEffect(() => {
    if (!user) return
    initSession()
    return () => {
      if (pingInterval.current) clearInterval(pingInterval.current)
    }
  }, [user, dramaId, episodeNumber])

  async function initSession() {
    const res = await fetch('/api/watch/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, dramaId, episodeNumber }),
    })
    const data = await res.json()
    setSessionToken(data.sessionToken)

    // Start pinging every 30 seconds to validate watching
    pingInterval.current = setInterval(() => {
      if (data.sessionToken) {
        fetch('/api/watch/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: data.sessionToken }),
        })
      }
    }, 30000)
  }

  // Load HLS stream
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    async function initPlayer() {
      const video = videoRef.current!
      setLoading(true)

      if (streamUrl.includes('.m3u8')) {
        // HLS stream
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
          hls.loadSource(streamUrl)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false))
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) setLoading(false)
          })
          setHlsInstance(hls)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl
          setLoading(false)
        }
      } else {
        // Direct MP4
        video.src = streamUrl
        setLoading(false)
      }
    }

    initPlayer()

    return () => {
      if (hlsInstance) hlsInstance.destroy()
    }
  }, [streamUrl])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    setDuration(video.duration || totalDuration)

    // Claim reward when 80% watched
    const percentage = (video.currentTime / (video.duration || 1)) * 100
    if (percentage >= 80 && !rewardClaimed && sessionToken && user) {
      claimReward(percentage, video.duration || totalDuration)
    }
  }, [rewardClaimed, sessionToken, user, totalDuration])

  async function claimReward(percentage: number, dur: number) {
    setRewardClaimed(true)
    const res = await fetch('/api/watch/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        watchPercentage: percentage,
        totalDuration: dur,
        dramaMeta: { provider, dramaId, title: dramaTitle, cover: dramaCover, episodeNumber },
      }),
    })
    const data = await res.json()
    if (data.pointsEarned > 0) {
      setPointsEarned(data.pointsEarned)
      toast.success(`🎉 ${data.message}`, { duration: 4000 })
    }
  }

  function togglePlay() {
    if (!videoRef.current) return
    if (isPlaying) videoRef.current.pause()
    else videoRef.current.play()
    setIsPlaying(!isPlaying)
  }

  function toggleMute() {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  function toggleFullscreen() {
    if (!videoRef.current) return
    if (document.fullscreenElement) document.exitFullscreen()
    else videoRef.current.requestFullscreen()
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative bg-black rounded-xl overflow-hidden group">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setLoading(false)}
        onClick={togglePlay}
        playsInline
      >
        {subtitleUrl && (
          <track
            kind="subtitles"
            src={subtitleUrl}
            srcLang="id"
            label="Indonesia"
            default
          />
        )}
      </video>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        </div>
      )}

      {/* Reward Notification */}
      {rewardClaimed && pointsEarned > 0 && (
        <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Coins className="w-4 h-4 text-yellow-300" />
          +{formatPoints(pointsEarned)} poin earned!
        </div>
      )}

      {/* Login to earn notice */}
      {!user && (
        <div className="absolute top-4 left-4 bg-violet-600/80 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs">
          Login untuk dapat poin reward! 💰
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const p = (e.clientX - rect.left) / rect.width
            if (videoRef.current) videoRef.current.currentTime = p * duration
          }}>
          <div className="absolute top-0 left-0 h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          {/* 80% marker */}
          <div className="absolute top-0 h-full w-0.5 bg-yellow-400/70" style={{ left: '80%' }} title="Reward threshold" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-violet-300 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-violet-300 transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-white text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {progress >= 80 ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <span>{Math.max(0, 80 - Math.floor(progress))}% lagi untuk reward</span>
              )}
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-violet-300 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
