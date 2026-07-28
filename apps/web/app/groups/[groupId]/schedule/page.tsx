import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function scheduleMeeting(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const groupId = formData.get('group_id') as string
  const dateStr = formData.get('date') as string
  const timeStr = formData.get('time') as string
  const venueAddress = formData.get('venue') as string
  
  // Basic combine
  const dateTime = new Date(`${dateStr}T${timeStr}`).toISOString()

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      group_id: groupId,
      date_time: dateTime,
      venue_address: venueAddress,
      status: 'upcoming'
    })
    .select()
    .single()

  if (error || !data) {
    redirect(`/groups/${groupId}/schedule?error=Failed to schedule meeting`)
  }

  // Set up initial RSVP for creator (Optional)
  // And maybe schedule reminders (in a real app, trigger edge function or use cron)

  redirect(`/groups/${groupId}/meeting/${data.id}`)
}

export default async function ScheduleMeetingPage({ params, searchParams }: { params: { groupId: string }, searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Schedule Next Meeting</h1>
        
        <form action={scheduleMeeting} className="space-y-4">
          <input type="hidden" name="group_id" value={params.groupId} />
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Venue (Address or Name)
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              required
              placeholder="e.g. 123 Main St or Central Park"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {searchParams.error && (
            <p className="text-red-500 text-sm">{searchParams.error}</p>
          )}

          <div className="pt-4 flex items-center justify-between">
            <Link href={`/groups/${params.groupId}`} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
