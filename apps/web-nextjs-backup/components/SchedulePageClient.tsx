'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import AIScheduleAssistant from '@/components/AIScheduleAssistant'

export default function SchedulePageClient({ groupId }: { groupId: string }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const dateStr = formData.get('date') as string
    const timeStr = formData.get('time') as string
    const venueAddress = formData.get('venue') as string
    
    const dateTime = new Date(`${dateStr}T${timeStr}`).toISOString()

    const { data, error: submitError } = await supabase
      .from('meetings')
      .insert({
        group_id: groupId,
        date_time: dateTime,
        venue_address: venueAddress,
        status: 'upcoming'
      })
      .select()
      .single()

    if (submitError || !data) {
      setError('Failed to schedule meeting')
      setLoading(false)
      return
    }

    router.push(`/groups/${groupId}/meeting/${data.id}`)
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Schedule Next Meeting</h1>
      
      <div className="mb-8">
        <AIScheduleAssistant groupId={groupId} />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="pt-4 flex items-center justify-between">
          <Link href={`/groups/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </form>
    </div>
  )
}
