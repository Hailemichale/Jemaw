import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check if onboarding is complete
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch notification preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('groups(id, name)')
    .eq('user_id', user.id)

  const groups = memberships?.map(m => m.groups) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <ProfileClient 
        user={user} 
        profile={profile} 
        initialPrefs={prefs || { meeting_reminders: true, birthday_reminders: true, chat_notifications: true }}
        groups={groups}
      />
    </div>
  )
}
