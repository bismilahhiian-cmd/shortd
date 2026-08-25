import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'WisnuDrama'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '16desember2006'
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'piodramas_admin_secret_2024'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', ADMIN_SECRET_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_token')
  return res
}
