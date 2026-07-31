'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function FilesClient({
  groupId,
  initialFiles,
  currentUser
}: {
  groupId: string
  initialFiles: any[]
  currentUser: any
}) {
  const [files, setFiles] = useState(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${groupId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('shared_files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: fileRecord, error: dbError } = await supabase
        .from('shared_files')
        .insert({
          group_id: groupId,
          uploader_id: currentUser.id,
          file_name: file.name,
          file_path: filePath,
          size: file.size,
          mime_type: file.type
        })
        .select(`
          *,
          uploader:users!shared_files_uploader_id_fkey(id, full_name, avatar_url)
        `)
        .single()

      if (dbError) throw dbError

      setFiles(prev => [fileRecord, ...prev])
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (file: any) => {
    const { data } = supabase.storage.from('shared_files').getPublicUrl(file.file_path)
    window.open(data.publicUrl, '_blank')
  }

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    await supabase.storage.from('shared_files').remove([filePath])
    await supabase.from('shared_files').delete().eq('id', id)
    
    setFiles(prev => prev.filter(f => f.id !== id))
    router.refresh()
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return '📄' // red doc conceptually
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('document') || mimeType.includes('msword')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    return '📁'
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isExpiringSoon = (dateString: string) => {
    const uploadDate = new Date(dateString)
    const expiryDate = new Date(uploadDate.setDate(uploadDate.getDate() + 30))
    const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    return daysLeft <= 5 && daysLeft > 0
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shared Files</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
        >
          {isUploading ? (
            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          )}
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])} 
        />
      </div>

      <div 
        className={`mb-8 border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-900/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Drag and drop files here</h3>
        <p className="text-gray-500 dark:text-gray-400">or click the upload button above to browse</p>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No files shared yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">File Name</th>
                <th className="p-4 font-medium hidden md:table-cell">Size</th>
                <th className="p-4 font-medium hidden sm:table-cell">Uploaded By</th>
                <th className="p-4 font-medium hidden lg:table-cell">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white break-all line-clamp-1">{file.file_name}</p>
                        {isExpiringSoon(file.created_at) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mt-1">
                            Expires soon
                          </span>
                        )}
                        <p className="text-xs text-gray-500 md:hidden mt-0.5">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                    {formatSize(file.size)}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {file.uploader?.avatar_url ? (
                        <img src={file.uploader.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-medium">
                          {file.uploader?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{file.uploader?.full_name || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell whitespace-nowrap">
                    {new Date(file.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleDownload(file)}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </button>
                      {currentUser.id === file.uploader_id && (
                        <button 
                          onClick={() => handleDelete(file.id, file.file_path)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
