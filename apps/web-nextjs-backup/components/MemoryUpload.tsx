'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function MemoryUpload({ groupId, onClose }: { groupId: string, onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create memory record
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          group_id: groupId,
          creator_id: user?.id,
          caption: caption || null
        })
        .select()
        .single()

      if (memoryError) throw memoryError

      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${groupId}/${memory.id}/${fileName}`
        
        // Simulating progress
        setProgress(prev => ({ ...prev, [file.name]: 10 }))

        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        setProgress(prev => ({ ...prev, [file.name]: 100 }))

        await supabase.from('memory_media').insert({
          memory_id: memory.id,
          file_path: filePath,
          media_type: file.type.startsWith('video/') ? 'video' : 'image'
        })
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Memories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6">
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer group mb-6"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <svg className="w-12 h-12 mx-auto text-gray-400 group-hover:text-indigo-500 transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Drag and drop files here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse</p>
          </div>

          {files.length > 0 && (
            <div className="mb-6 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-48 overflow-y-auto pr-2">
              {files.map((file, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-indigo-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end">
                      <div className="h-1 bg-gray-200">
                        <div className="h-full bg-indigo-500" style={{ width: `${progress[file.name] || 0}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caption (Optional)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              rows={3}
              placeholder="Write a caption for these memories..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} disabled={isUploading} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button 
            onClick={handleUpload} 
            disabled={isUploading || files.length === 0} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-sm transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Uploading...
              </>
            ) : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
