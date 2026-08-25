import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Navbar from '@/components/layout/Navbar'
import AdblockDetector from '@/components/AdblockDetector'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PioDramas - Nonton Drama Asia, Dapat Uang!',
  description: 'Platform streaming drama Asia, anime, dan komik terlengkap. Nonton episode, kumpulkan poin, dan tukarkan dengan saldo e-wallet!',
  keywords: 'drama asia, nonton drama, short drama, anime, komik, reward, poin, cashback',
  openGraph: {
    title: 'PioDramas - Nonton Drama, Dapat Uang!',
    description: 'Streaming drama + reward system. Nonton = dapat poin = dapat uang!',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <AdblockDetector />
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
