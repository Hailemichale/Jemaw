'use client'

import { useState } from 'react'

export default function ChatMessage({ message, isOwn, onReply, supabase }: { message: any, isOwn: boolean, onReply: () => void, supabase: any }) {
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥']

  const handleReact = async (emoji: string) => {
    const reactions = message.reactions || []
    if (!reactions.includes(emoji)) {
      const updatedReactions = [...reactions, emoji]
      await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', message.id)
    }
    setShowEmojiPicker(false)
  }

  const handlePin = async () => {
    await supabase.from('messages').update({ pinned: !message.pinned }).eq('id', message.id)
  }

  const senderName = message.sender?.name || 'Unknown'
  const initial = senderName.charAt(0).toUpperCase()
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <span className="text-xs text-gray-500 dark:text-gray-400 italic px-4 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={`flex flex-col group relative animate-slide-up mt-4 ${isOwn ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowEmojiPicker(false)
      }}
    >
      <div className={`flex items-end max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-medium text-sm shadow-sm border border-indigo-200 dark:border-indigo-800/50">
            {initial}
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1 mb-1">
              {senderName}
            </span>
          )}
          
          <div className={`relative px-4 py-2.5 shadow-sm ${
            isOwn 
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-sm border border-gray-200/50 dark:border-gray-700/50'
          }`}>
            {message.reply_to && (
              <div className={`text-xs mb-2 p-2 rounded-lg ${isOwn ? 'bg-indigo-700/40' : 'bg-gray-200/50 dark:bg-gray-700/50'} border-l-2 ${isOwn ? 'border-indigo-300' : 'border-gray-400'} truncate opacity-90`}>
                <span className="font-medium mr-1">Reply:</span>
                {message.reply_to.content}
              </div>
            )}
            
            {message.type === 'image' && (
              <img src={message.content} alt="Attachment" className="max-w-xs sm:max-w-sm rounded-lg mb-2 cursor-pointer hover:opacity-95 transition-opacity border border-black/10" />
            )}
            
            {message.type === 'file' && (
              <a href={message.content} download className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span className="truncate underline">{message.file_name || 'Download file'}</span>
              </a>
            )}
            
            {message.type !== 'image' && message.type !== 'file' && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1 mx-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {time}
            </span>
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 mx-1">
              {message.reactions.map((r: string, i: number) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${isOwn ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`absolute ${isOwn ? 'left-0 -translate-x-full pr-3' : 'right-0 translate-x-full pl-3'} top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-200 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-1'}`}>
        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible relative">
          <button onClick={onReply} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors rounded-l-lg" title="Reply">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors border-l border-gray-100 dark:border-gray-700" title="React">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={handlePin} className={`p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-100 dark:border-gray-700 rounded-r-lg ${message.pinned ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`} title="Pin">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>

          {showEmojiPicker && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-20`}>
              {emojis.map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
