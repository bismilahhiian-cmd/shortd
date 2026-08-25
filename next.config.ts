import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'p16-common-sign.tiktokcdn.com' },
      { protocol: 'https', hostname: 'p19-common-sign.tiktokcdn.com' },
      { protocol: 'https', hostname: 'p16-common.tiktokcdn.com' },
      { protocol: 'https', hostname: '*.tiktokcdn.com' },
      { protocol: 'https', hostname: '*.dramaboxdb.com' },
      { protocol: 'https', hostname: '*.youngjoygame.com' },
      { protocol: 'https', hostname: '*.reelshort.com' },
      { protocol: 'https', hostname: '*.shortmax.tv' },
      { protocol: 'https', hostname: '*.melolo.co' },
      { protocol: 'https', hostname: '*.freereels.com' },
      { protocol: 'https', hostname: '*.dramanova.me' },
      { protocol: 'https', hostname: '*.sansekai.my.id' },
      { protocol: 'https', hostname: 'cdn.dramabox.com' },
      { protocol: 'https', hostname: 'img.dramabox.com' },
      { protocol: 'https', hostname: '**' }, // allow all for flexibility
    ],
  },

}

export default nextConfig
