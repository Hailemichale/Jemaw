'use client'

import { useState } from 'react'
import ChatSummarizer from '@/components/ChatSummarizer'

interface ChatHeaderProps {
  groupId: string
  groupName: string
}

export default function ChatHeader({ groupId, groupName }: ChatHeaderProps) {
  const [showSummarizer, setShowSummarizer] = useState(false)

  return (
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-xl">
      <div className="flex items-center justify-between p-4 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {groupName} Chat
        </h2>
        
        <button
          onClick={() => setShowSummarizer(!showSummarizer)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all"
        >
          <span>🤖</span>
          {showSummarizer ? 'Hide Summary' : 'Catch me up'}
        </button>
      </div>

      {showSummarizer && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-purple-100 dark:border-purple-900/30">
          <ChatSummarizer groupId={groupId} />
        </div>
      )}
    </div>
  )
}
