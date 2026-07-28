import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpButtons from '@/components/RsvpButtons'

export default async function MeetingPage({ params }: { params: { groupId: string, meetingId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      *,
      rsvps (
        status,
        user:users (
          id,
          name,
          avatar_url
        )
      )
    `)
    .eq('id', params.meetingId)
    .single()

  if (error || !meeting) {
    redirect(`/groups/${params.groupId}`)
  }

  // Find current user's RSVP
  const currentUserRsvp = meeting.rsvps.find((r: any) => r.user.id === user.id)?.status

  // Group RSVPs
  const going = meeting.rsvps.filter((r: any) => r.status === 'going')
  const maybe = meeting.rsvps.filter((r: any) => r.status === 'maybe')
  const no = meeting.rsvps.filter((r: any) => r.status === 'no')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href={`/groups/${params.groupId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to Dashboard
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Next Meeting</h1>
              <p className="text-lg text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                {new Date(meeting.date_time).toLocaleString()}
              </p>
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              {meeting.status}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Venue</h3>
            <p className="text-gray-900 dark:text-white text-lg">{meeting.venue_address || 'TBD'}</p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your RSVP</h3>
            <RsvpButtons meetingId={meeting.id} userId={user.id} initialStatus={currentUserRsvp} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-md font-semibold text-green-600 dark:text-green-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Going ({going.length})</h3>
            <ul className="space-y-2">
              {going.map((r: any) => (
                <li key={r.user.id} className="text-gray-800 dark:text-gray-200">{r.user.name}</li>
              ))}
              {going.length === 0 && <li className="text-gray-400 text-sm italic">No one yet</li>}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-md font-semibold text-yellow-600 dark:text-yellow-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Maybe ({maybe.length})</h3>
            <ul className="space-y-2">
              {maybe.map((r: any) => (
                <li key={r.user.id} className="text-gray-800 dark:text-gray-200">{r.user.name}</li>
              ))}
              {maybe.length === 0 && <li className="text-gray-400 text-sm italic">No one yet</li>}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-md font-semibold text-red-600 dark:text-red-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Can't Make It ({no.length})</h3>
            <ul className="space-y-2">
              {no.map((r: any) => (
                <li key={r.user.id} className="text-gray-800 dark:text-gray-200">{r.user.name}</li>
              ))}
              {no.length === 0 && <li className="text-gray-400 text-sm italic">No one yet</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
