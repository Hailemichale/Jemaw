import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GroupDashboardPage({ params }: { params: { groupId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.groupId)
    .single()

  if (groupError || !group) {
    redirect('/')
  }

  // Fetch upcoming meeting
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('group_id', group.id)
    .in('status', ['upcoming', 'live'])
    .order('date_time', { ascending: true })
    .limit(1)

  const nextMeeting = meetings?.[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Groups
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Next Meeting</h2>
          {nextMeeting ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {new Date(nextMeeting.date_time).toLocaleString()}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Venue: {nextMeeting.venue_address || 'TBD'}
                  </p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                  {nextMeeting.status.toUpperCase()}
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <Link 
                  href={`/groups/${group.id}/meeting/${nextMeeting.id}`} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  View Details & RSVP
                </Link>
                {nextMeeting.status === 'live' && (
                  <Link 
                    href={`/groups/${group.id}/meeting-day/${nextMeeting.id}`} 
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    Live Status Board
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming meetings scheduled.</p>
              <Link 
                href={`/groups/${group.id}/schedule`}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Schedule Meeting
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href={`/groups/${group.id}/members`}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 transition-colors block"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Members</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">View group members, roles, and birthdays.</p>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invite Code</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Share this code to invite friends.</p>
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md font-mono text-center tracking-widest text-lg font-bold text-gray-800 dark:text-gray-200">
              {group.invite_code}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
