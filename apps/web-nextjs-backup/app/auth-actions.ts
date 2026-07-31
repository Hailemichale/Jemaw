'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return { error: 'Please verify your email address first.' }
  }

  // FORCE Next.js to write the cookie regardless of @supabase/ssr behavior
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const projectName = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0];
  
  // Set the session cookie directly
  cookieStore.set(`sb-${projectName}-auth-token`, JSON.stringify(data.session), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Return success to the client instead of doing a server-side redirect, 
  // so the client can hard-navigate securely.
  return { success: true }
}

export async function signupAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const birthdate = formData.get('birthdate') as string
  const nationality = formData.get('nationality') as string

  if (!name || !email || !password || !birthdate || !nationality) {
    return { error: 'Please fill in all fields' }
  }

  const supabase = await createClient()

  // 1. Sign up user via Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }
  
  if (!authData.user) {
    return { error: 'Registration failed. Please try again.' }
  }

  // 2. Parse birthdate
  const dateObj = new Date(birthdate)
  const bMonth = dateObj.getMonth() + 1
  const bDay = dateObj.getDate()
  const bYear = dateObj.getFullYear()

  // 3. Insert into public.users profile
  const { error: profileError } = await supabase.from('users').upsert({
    id: authData.user.id,
    name: name,
    phone_or_email: email,
    birthday_month: bMonth,
    birthday_day: bDay,
    birthday_year_private: bYear,
    nationality: nationality
  })

  if (profileError) {
    return { error: "Profile error (Did you run the SQL migration?): " + profileError.message }
  }

  if (!authData.session) {
    return { error: 'Success! Please check your email inbox to verify your account before logging in.', success: true }
  }

  // FORCE Next.js to write the cookie regardless of @supabase/ssr behavior
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const projectName = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0];
  
  // Set the session cookie directly
  cookieStore.set(`sb-${projectName}-auth-token`, JSON.stringify(authData.session), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Return success to the client instead of doing a server-side redirect, 
  // so the client can hard-navigate securely.
  return { success: true }
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string
  
  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
