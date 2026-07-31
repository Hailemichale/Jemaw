import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SchedulePageClient from '@/components/SchedulePageClient'

export default async function ScheduleMeetingPage(props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <SchedulePageClient groupId={params.groupId} />
    </div>
  )
}
