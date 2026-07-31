'use client'

import { useState } from 'react'

export default function PinnedMessages({ messages }: { messages: any[] }) {
  const [expanded, setExpanded] = useState(false)

  if (messages.length === 0) return null

  const displayMessages = expanded ? messages : [messages[messages.length - 1]]

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-amber-50/95 dark:bg-amber-900/40 border-b border-amber-200/50 dark:border-amber-700/50 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-start p-3 px-4 gap-3">
        <div className="text-amber-500 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {displayMessages.map((msg, i) => (
            <div key={msg.id || i} className={`text-sm ${i > 0 ? 'mt-2 pt-2 border-t border-amber-200/30 dark:border-amber-700/30' : ''}`}>
              <div className="font-semibold text-amber-800 dark:text-amber-300 text-[11px] mb-0.5 uppercase tracking-wide">
                {msg.sender?.name || 'User'}
              </div>
              <div className="text-gray-700 dark:text-gray-300 truncate text-sm">
                {msg.type === 'image' ? '📸 Image' : msg.type === 'file' ? '📎 File attachment' : msg.content}
              </div>
            </div>
          ))}
        </div>

        {messages.length > 1 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-md text-amber-600 dark:text-amber-400 transition-colors flex-shrink-0"
          >
            <span className="text-xs font-medium mr-1">{messages.length}</span>
            <svg className={`w-4 h-4 inline-block transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
