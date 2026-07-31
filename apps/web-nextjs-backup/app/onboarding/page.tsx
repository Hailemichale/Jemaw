import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingForm from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already exists in public.users
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) {
    // Profile already exists, redirect to dashboard
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Jemaw!
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Let's get your profile set up before you join your groups.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700">
          <OnboardingForm 
            userId={user.id} 
            email={user.email || user.phone || ''} 
          />
        </div>
      </div>
    </div>
  )
}
