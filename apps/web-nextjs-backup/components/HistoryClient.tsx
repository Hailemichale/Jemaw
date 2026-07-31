'use client'

import Link from 'next/link'

type Meeting = {
  id: string
  title: string
  scheduled_at: string
  venue: string | null
  status: string
  rsvps: { id: string; status: string; user_id: string }[]
}

export default function HistoryClient({ groupId, meetings }: { groupId: string, meetings: Meeting[] }) {
  // Stats calculation
  const totalMeetings = meetings.length
  
  let totalAttendance = 0
  let maxGoing = 0
  const userRSVPs: Record<string, number> = {}

  meetings.forEach(m => {
    const goingCount = m.rsvps.filter(r => r.status === 'going').length
    totalAttendance += goingCount
    if (goingCount > maxGoing) maxGoing = goingCount

    m.rsvps.forEach(r => {
      if (r.status === 'going') {
        userRSVPs[r.user_id] = (userRSVPs[r.user_id] || 0) + 1
      }
    })
  })

  const averageAttendance = totalMeetings > 0 ? (totalAttendance / totalMeetings).toFixed(1) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Group Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
            <div className="text-3xl mb-1">📅</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalMeetings}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meetings</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <div className="text-3xl mb-1">👥</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{averageAttendance}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Att.</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maxGoing}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Record Att.</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">---</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Streak</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4 relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        {meetings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No past meetings found.
          </div>
        ) : (
          meetings.map((meeting) => {
            const going = meeting.rsvps.filter(r => r.status === 'going').length
            const maybe = meeting.rsvps.filter(r => r.status === 'maybe').length
            const declined = meeting.rsvps.filter(r => r.status === 'declined').length

            return (
              <div key={meeting.id} className="relative pl-10">
                <div className="absolute left-[11px] top-4 w-3 h-3 bg-indigo-600 rounded-full border-4 border-white dark:border-gray-900 shadow"></div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{meeting.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(meeting.scheduled_at).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      meeting.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {meeting.status || 'completed'}
                    </span>
                  </div>
                  
                  {meeting.venue && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-1">
                      📍 {meeting.venue}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mt-3">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {going} Going
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      {maybe} Maybe
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {declined} Declined
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Link href={`/groups/${groupId}/memories?meeting=${meeting.id}`} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                      View Memories &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
