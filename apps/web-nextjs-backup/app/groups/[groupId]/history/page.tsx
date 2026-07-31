import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage(props: {
  params: Promise<{ groupId: string }>
}) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch past meetings for this group
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id,
      title,
      scheduled_at,
      venue,
      status,
      rsvps (
        id,
        status,
        user_id
      )
    `)
    .eq('group_id', params.groupId)
    .lt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: false })

  return <HistoryClient groupId={params.groupId} meetings={meetings || []} />
}
