'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LiveStatusBoard({ meetingId, userId }: { meetingId: string, userId: string }) {
  const [statuses, setStatuses] = useState<any[]>([])
  const [myStatus, setMyStatus] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Initial fetch
    const fetchStatuses = async () => {
      const { data } = await supabase
        .from('live_statuses')
        .select(`
          status,
          updated_at,
          user:users(id, name, avatar_url)
        `)
        .eq('meeting_id', meetingId)
      
      if (data) {
        setStatuses(data)
        const mine = data.find((s: any) => s.user?.id === userId)
        if (mine) setMyStatus(mine.status)
      }
    }
    
    fetchStatuses()

    // Realtime subscription
    const channel = supabase
      .channel(`live_status_${meetingId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'live_statuses',
        filter: `meeting_id=eq.${meetingId}`
      }, () => {
        fetchStatuses()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [meetingId, supabase, userId])

  const updateStatus = async (status: string) => {
    setMyStatus(status)
    await supabase.from('live_statuses').upsert({
      meeting_id: meetingId,
      user_id: userId,
      status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'meeting_id,user_id' })
  }

  const statusOptions = [
    { value: 'arrived', label: 'Arrived', color: 'bg-green-500' },
    { value: 'on_the_way', label: 'On the way', color: 'bg-blue-500' },
    { value: 'late', label: 'Running late', color: 'bg-yellow-500' },
    { value: 'not_coming', label: 'Not coming', color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-8">
      {/* My Status Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Your Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                myStatus === opt.value 
                  ? `${opt.color} text-white shadow-md transform scale-105` 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statusOptions.map(group => {
          const groupStatuses = statuses.filter(s => s.status === group.value)
          return (
            <div key={group.value} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className={`text-md font-bold mb-4 uppercase tracking-wider ${group.color.replace('bg-', 'text-')}`}>
                {group.label} ({groupStatuses.length})
              </h4>
              <ul className="space-y-3">
                {groupStatuses.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500">
                      {s.user?.name?.charAt(0)}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{s.user?.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
                {groupStatuses.length === 0 && (
                  <li className="text-gray-400 text-sm italic">No one</li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
