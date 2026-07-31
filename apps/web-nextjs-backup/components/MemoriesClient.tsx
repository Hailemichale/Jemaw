'use client'

import { useState } from 'react'
import MemoryUpload from './MemoryUpload'
import MediaLightbox from './MediaLightbox'
import { createBrowserClient } from '@supabase/ssr'

export default function MemoriesClient({
  groupId,
  memories,
  groupedByMonth,
  onThisDay
}: {
  groupId: string
  memories: any[]
  groupedByMonth: any
  onThisDay: any[]
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<{ group: string, memoryIdx: number, mediaIdx: number } | null>(null)
  
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const allMediaFlat = memories.flatMap(m => m.media.map((med: any) => ({ ...med, memory: m })))

  const openLightbox = (group: string, memoryIdx: number, mediaIdx: number) => {
    setLightboxIndex({ group, memoryIdx, mediaIdx })
  }

  const closeLightbox = () => setLightboxIndex(null)

  const getMediaUrl = (path: string) => {
    return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl
  }

  const renderGrid = (groupMemories: any[], groupName: string) => (
    <div key={groupName} className="mb-12">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">{groupName}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
        {groupMemories.map((memory, mIdx) => (
          memory.media.map((media: any, mediaIdx: number) => (
            <div
              key={media.id}
              className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ${mediaIdx === 0 && memory.media.length === 1 ? 'col-span-2 row-span-2' : ''}`}
              onClick={() => openLightbox(groupName, mIdx, mediaIdx)}
            >
              {media.media_type === 'video' ? (
                <video src={getMediaUrl(media.file_path)} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" muted loop />
              ) : (
                <img src={getMediaUrl(media.file_path)} alt="Memory" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
              )}
              {memory.caption && mediaIdx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm truncate">
                  {memory.caption}
                </div>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  )

  // Find the exact item for lightbox
  let currentMedia = null
  let allLightBoxItems: any[] = []
  if (lightboxIndex) {
    let sourceMemories = groupedByMonth[lightboxIndex.group] || []
    if (lightboxIndex.group === 'On This Day') sourceMemories = onThisDay
    allLightBoxItems = sourceMemories.flatMap((m: any) => m.media.map((med: any) => ({ ...med, memory: m })))
    
    // We need to calculate flat index
    let currentFlatIndex = 0;
    for(let i = 0; i < lightboxIndex.memoryIdx; i++) {
        currentFlatIndex += sourceMemories[i].media.length;
    }
    currentFlatIndex += lightboxIndex.mediaIdx;
    
    currentMedia = allLightBoxItems[currentFlatIndex]
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Memories</h1>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Memories
        </button>
      </div>

      {onThisDay.length > 0 && (
        <div className="mb-12 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            On This Day
          </h2>
          {renderGrid(onThisDay, 'On This Day')}
        </div>
      )}

      <div>
        {Object.keys(groupedByMonth).map(month => renderGrid(groupedByMonth[month], month))}
      </div>

      {Object.keys(groupedByMonth).length === 0 && onThisDay.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No memories yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Upload photos and videos to start building your group's album.</p>
        </div>
      )}

      {isUploadOpen && (
        <MemoryUpload groupId={groupId} onClose={() => setIsUploadOpen(false)} />
      )}

      {lightboxIndex && currentMedia && (
        <MediaLightbox
          items={allLightBoxItems}
          initialIndex={allLightBoxItems.findIndex(i => i.id === currentMedia.id)}
          onClose={closeLightbox}
          getMediaUrl={getMediaUrl}
        />
      )}
    </div>
  )
}
