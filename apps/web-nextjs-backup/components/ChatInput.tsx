'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatInput({ groupId, userId, replyingTo, onCancelReply }: { groupId: string, userId: string, replyingTo: any, onCancelReply: () => void }) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '✨', '🤔', '🙌']

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSend = async () => {
    if (!content.trim() && !isSending) return
    
    setIsSending(true)
    try {
      const messageData: any = {
        group_id: groupId,
        sender_id: userId,
        content: content.trim(),
        type: 'text',
      }
      
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id
        messageData.reply_to = { content: replyingTo.content }
      }

      await supabase.from('messages').insert(messageData)
      
      setContent('')
      onCancelReply()
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSending(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${groupId}/${fileName}`

      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      await supabase.from('messages').insert({
        group_id: groupId,
        sender_id: userId,
        content: publicUrlData.publicUrl,
        type: isImage ? 'image' : 'file',
        file_name: file.name
      })
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsSending(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col w-full relative p-4">
      {replyingTo && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 text-sm px-4 py-2.5 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-700/50 mb-0">
          <div className="flex items-center gap-2 truncate text-gray-600 dark:text-gray-300">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            <span className="font-medium">{replyingTo.sender?.name || 'User'}:</span>
            <span className="truncate opacity-80">{replyingTo.content}</span>
          </div>
          <button onClick={onCancelReply} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-5 gap-1 z-20 w-52">
          {emojis.map(emoji => (
            <button 
              key={emoji}
              onClick={() => {
                setContent(prev => prev + emoji)
                setShowEmojiPicker(false)
              }}
              className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className={`flex items-end gap-2 bg-white dark:bg-gray-900 ${replyingTo ? 'rounded-b-xl rounded-t-none border-x border-b' : 'rounded-xl border'} border-gray-200 dark:border-gray-700 p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all`}>
        <div className="flex gap-1 pb-1">
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          
          <button 
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          
          <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, false)} />
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          rows={1}
          style={{ fieldSizing: 'content' } as any}
        />

        <button 
          onClick={handleSend}
          disabled={!content.trim() && !isSending}
          className="p-2 mb-1 mr-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 text-white rounded-lg transition-colors flex-shrink-0"
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          )}
        </button>
      </div>
    </div>
  )
}
