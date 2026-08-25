import { NextRequest, NextResponse } from 'next/server'
import { fetchWithCache } from '@/lib/api/sansekai'

// GET /api/drama?provider=dramabox&endpoint=foryou&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const provider = searchParams.get('provider')
  const endpoint = searchParams.get('endpoint')
  const params = Object.fromEntries(searchParams.entries())
  delete params.provider
  delete params.endpoint

  if (!provider || !endpoint) {
    return NextResponse.json({ error: 'Missing provider or endpoint' }, { status: 400 })
  }

  try {
    const data = await fetchWithCache(`/${provider}/${endpoint}`, params as Record<string, string>)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
