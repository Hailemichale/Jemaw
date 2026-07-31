import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GroupSettingsClient from '@/components/GroupSettingsClient'

export default async function GroupSettingsPage(props: {
  params: Promise<{ groupId: string }>
}) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch group data
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.groupId)
    .single()

  if (!group) {
    redirect('/')
  }

  // Fetch members
  const { data: members } = await supabase
    .from('group_members')
    .select(`
      id,
      role,
      joined_at,
      user_id,
      users (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('group_id', params.groupId)
    .order('role', { ascending: true }) // admin first usually

  // Check if current user is admin
  const currentUserMember = members?.find(m => m.user_id === user.id)
  const isAdmin = currentUserMember?.role === 'admin'

  return <GroupSettingsClient group={group} members={members || []} currentUser={user} isAdmin={isAdmin} />
}
