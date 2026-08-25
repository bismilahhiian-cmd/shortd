# PioDramas 🎬💰

Platform streaming drama Asia, anime, & komik dengan sistem **Reward Cash** — nonton episode = dapat poin = dapat uang!

## Fitur Utama

- 🎬 **10+ Provider Drama**: DramaBox, PineDrama, ReelShort, ShortMax, Melolo, FreeReels, DramaNova, Anime, Komik, MovieBox
- 💰 **Watch-to-Earn**: Nonton episode dapat poin, tukar ke GoPay/OVO/Dana
- 🛡️ **Anti-Cheat**: Server-side session timer, heartbeat ping, daily limit
- 🚫 **Anti-AdBlock**: Deteksi adblock, blokir akses jika aktif
- 👥 **Anti-Clone Referral**: Device fingerprint + IP check
- 🔐 **Auth**: Google OAuth + Email + Phone (Supabase)
- 👨‍💼 **Admin Panel**: Kelola user, blokir, hapus, approve/reject penarikan
- 📱 **Responsive**: Mobile-first design

## Reward System

| Aksi | Poin |
|------|------|
| Nonton 80%+ episode | +10 poin |
| Streak 5 episode | +50 poin bonus |
| Daily Check-in | +5 poin |
| Referral teman | +100 poin |
| Batas harian | Max 200 poin |
| **Min. Withdraw** | 5.000 poin = Rp 50.000 |

## Setup

### 1. Clone & Install

```bash
cd piodramas
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan isi file `supabase/schema.sql`
3. Di **Authentication > Providers**, aktifkan:
   - Email (sudah default aktif)
   - Google OAuth (butuh Google Console credentials)

### 3. Environment Variables

Copy `.env.local` dan isi dengan nilai dari Supabase project kamu:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Untuk production (Vercel), set env vars di Vercel dashboard.

### 4. Jalankan

```bash
npm run dev
# → http://localhost:3000
```

### 5. Admin Panel

Akses di: **http://localhost:3000/admin/login**

```
Username: WisnuDrama
Password: 16desember2006
```

## Deploy ke Vercel

```bash
npx vercel --prod
```

Isi semua environment variables di Vercel dashboard sebelum deploy.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx              ← Homepage
│   ├── search/               ← Global search
│   ├── wallet/               ← Dompet poin & withdrawal
│   ├── auth/login/           ← Login & register
│   ├── admin/                ← Admin dashboard
│   └── api/
│       ├── drama/            ← Proxy ke Sansekai API (with cache)
│       ├── watch/            ← Session start/ping/complete
│       ├── rewards/          ← Withdrawal & check-in
│       └── admin/            ← Admin API
├── components/
│   ├── layout/Navbar.tsx
│   ├── drama/DramaCard.tsx
│   ├── home/HeroBanner.tsx
│   ├── player/VideoPlayer.tsx
│   ├── providers/AuthProvider.tsx
│   └── AdblockDetector.tsx
└── lib/
    ├── api/sansekai.ts       ← Full API wrapper (10 providers)
    ├── rewards/engine.ts     ← Reward logic + anti-cheat
    ├── supabase/             ← Client & server clients
    └── utils.ts
```

## API Caching

Semua request ke Sansekai API di-cache di Supabase database dengan TTL:
- Detail: 60 menit
- Episode: 120 menit  
- Trending/Foryou: 20-30 menit

Ini membypass rate limit 10 req/menit dari Sansekai API.
