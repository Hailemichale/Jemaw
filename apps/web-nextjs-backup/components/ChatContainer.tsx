'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import PinnedMessages from './PinnedMessages'

export default function ChatContainer({ initialMessages, groupId, userId }: { initialMessages: any[], groupId: string, userId: string }) {
  const [messages, setMessages] = useState(initialMessages)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: sender } = await supabase
              .from('users')
              .select('*')
              .eq('id', payload.new.sender_id)
              .single()
              
            const newMessage = { ...payload.new, sender }
            setMessages((prev) => [...prev, newMessage])
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase])

  const pinnedMessages = messages.filter(m => m.pinned)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 relative">
      {pinnedMessages.length > 0 && (
        <PinnedMessages messages={pinnedMessages} />
      )}
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pt-16"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showDate = index === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString()
            return (
              <div key={msg.id || index}>
                {showDate && (
                  <div className="flex justify-center my-6">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <ChatMessage 
                  message={msg} 
                  isOwn={msg.sender_id === userId}
                  onReply={() => setReplyingTo(msg)}
                  supabase={supabase}
                />
              </div>
            )
          })
        )}
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <ChatInput 
          groupId={groupId} 
          userId={userId} 
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}
