import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GroupNav from './GroupNav'

export default async function GroupLayout(props: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) {
  const { children } = props;
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', params.groupId)
    .single()

  if (!group) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GroupNav groupId={params.groupId} groupName={group.name} />
      <main>
        {children}
      </main>
    </div>
  )
}
