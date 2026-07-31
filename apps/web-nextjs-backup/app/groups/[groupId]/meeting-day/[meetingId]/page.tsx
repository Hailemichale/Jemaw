import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LiveStatusBoard from '@/components/LiveStatusBoard'
import MeetingDayAssistant from '@/components/MeetingDayAssistant'

export default async function MeetingDayPage(props: { params: Promise<{ groupId: string, meetingId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', params.meetingId)
    .single()

  if (error || !meeting) {
    redirect(`/groups/${params.groupId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href={`/groups/${params.groupId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to Dashboard
        </Link>
        
        <div className="bg-indigo-600 rounded-xl p-8 shadow-md text-white">
          <div className="flex items-center gap-4 mb-2">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
            <h1 className="text-3xl font-bold">Meeting Day Live</h1>
          </div>
          <p className="text-indigo-200 text-lg">{new Date(meeting.date_time).toLocaleDateString()}</p>
          
          <div className="mt-6 p-4 bg-indigo-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-1">Venue</h3>
            <p className="text-lg">{meeting.venue_address || 'TBD'}</p>
            {/* Note: Google Maps link or embed would go here */}
          </div>
        </div>

        <LiveStatusBoard meetingId={meeting.id} userId={user.id} />
        
        <MeetingDayAssistant meetingId={params.meetingId} groupId={params.groupId} />
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Live Map (Coming to Mobile)</h3>
          <p className="text-blue-700 dark:text-blue-400 text-sm">
            ETA and live location sharing will be available in the Jemaw mobile app for users who are "On the way".
          </p>
        </div>
      </div>
    </div>
  )
}
