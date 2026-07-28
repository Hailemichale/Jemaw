'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function RsvpButtons({ meetingId, userId, initialStatus }: { meetingId: string, userId: string, initialStatus?: string }) {
  const [status, setStatus] = useState<string | null>(initialStatus || null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRsvp = async (newStatus: 'going' | 'maybe' | 'no') => {
    setIsLoading(true)
    const { error } = await supabase
      .from('rsvps')
      .upsert({
        meeting_id: meetingId,
        user_id: userId,
        status: newStatus,
        responded_at: new Date().toISOString()
      }, { onConflict: 'meeting_id,user_id' })

    if (!error) {
      setStatus(newStatus)
      router.refresh()
    }
    setIsLoading(false)
  }

  const buttons = [
    { value: 'going', label: "I'm Going", color: 'bg-green-100 text-green-800 border-green-300', active: 'bg-green-500 text-white' },
    { value: 'maybe', label: 'Maybe', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', active: 'bg-yellow-500 text-white' },
    { value: 'no', label: "Can't Make It", color: 'bg-red-100 text-red-800 border-red-300', active: 'bg-red-500 text-white' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.value}
          onClick={() => handleRsvp(btn.value as any)}
          disabled={isLoading}
          className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
            status === btn.value ? btn.active : `${btn.color} hover:opacity-80`
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
