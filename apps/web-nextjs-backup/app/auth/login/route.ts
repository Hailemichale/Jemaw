import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const actionType = formData.get('actionType') as string

  const supabase = await createClient()

  if (actionType === 'signup') {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(error.message)}`, request.url), { status: 303 })
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(error.message)}`, request.url), { status: 303 })
    }
  }

  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
