'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GroupNav({ groupId, groupName }: { groupId: string, groupName: string }) {
  const pathname = usePathname()
  
  const tabs = [
    { name: 'Home', href: `/groups/${groupId}` },
    { name: 'Chat', href: `/groups/${groupId}/chat` },
    { name: 'Memories', href: `/groups/${groupId}/memories` },
    { name: 'Files', href: `/groups/${groupId}/files` },
    { name: 'Members', href: `/groups/${groupId}/members` },
    { name: 'History', href: `/groups/${groupId}/history` },
    { name: 'Settings', href: `/groups/${groupId}/settings` },
  ]

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              &larr; <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{groupName}</h1>
          </div>
        </div>
        <div className="overflow-x-auto -mb-px hide-scrollbar">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'}
                  `}
                >
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
