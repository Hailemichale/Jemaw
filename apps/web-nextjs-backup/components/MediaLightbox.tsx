'use client'

import { useEffect, useState } from 'react'

export default function MediaLightbox({ 
  items, 
  initialIndex, 
  onClose,
  getMediaUrl
}: { 
  items: any[], 
  initialIndex: number, 
  onClose: () => void,
  getMediaUrl: (path: string) => string
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items.length])

  const currentItem = items[currentIndex]

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center opacity-100 transition-opacity duration-300">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 p-2 bg-black/20 hover:bg-black/40 rounded-full"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      {items.length > 1 && (
        <>
          <button onClick={goToPrev} className="absolute left-6 text-white/70 hover:text-white transition-colors z-50 p-3 bg-black/20 hover:bg-black/40 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button onClick={goToNext} className="absolute right-6 text-white/70 hover:text-white transition-colors z-50 p-3 bg-black/20 hover:bg-black/40 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </>
      )}

      <div className="relative w-full h-full flex flex-col items-center justify-center p-12">
        <div className="relative max-h-[80vh] max-w-[90vw] flex items-center justify-center">
          {currentItem.media_type === 'video' ? (
            <video 
              src={getMediaUrl(currentItem.file_path)} 
              controls 
              autoPlay 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <img 
              src={getMediaUrl(currentItem.file_path)} 
              alt="Memory" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
            />
          )}
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center px-6">
          <div className="inline-block bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-2xl max-w-2xl mx-auto shadow-xl">
            {currentItem.memory?.caption ? (
              <p className="text-lg">{currentItem.memory.caption}</p>
            ) : (
              <p className="text-white/50 italic">No caption</p>
            )}
            <div className="flex items-center justify-center gap-3 mt-2 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                {currentItem.memory?.creator?.full_name || 'Unknown'}
              </span>
              <span>•</span>
              <span>{new Date(currentItem.memory?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
