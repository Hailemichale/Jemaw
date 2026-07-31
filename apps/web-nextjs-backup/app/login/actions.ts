'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('SignIn Data:', data?.session ? 'Session exists' : 'No session', 'Error:', error)

  if (error) {
    console.error('Login Error:', error)
    redirect(`/login?message=${encodeURIComponent(error.message || 'Could not authenticate user')}`)
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  console.log('SignUp Data:', data?.session ? 'Session exists' : 'No session', 'Error:', error)

  if (error) {
    console.error('Signup Error:', error)
    redirect(`/login?message=${encodeURIComponent(error.message || 'Could not sign up')}`)
  }

  // After signup, redirect to dashboard or login
  redirect('/')
}
