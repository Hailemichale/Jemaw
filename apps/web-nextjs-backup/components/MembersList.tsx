'use client'

import { useState } from 'react'
import BirthdayMessageDraft from '@/components/BirthdayMessageDraft'

export default function MembersList({ 
  members, 
  groupName, 
  groupId 
}: { 
  members: any[], 
  groupName: string, 
  groupId: string 
}) {
  const [draftingFor, setDraftingFor] = useState<string | null>(null)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-4">
      {members.map((member: any) => (
        <div key={member.id} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
              </div>
            </div>
            
            {member.birthday_month && member.birthday_day && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-800">
                  <span role="img" aria-label="birthday">🎂</span>
                  {months[member.birthday_month - 1]} {member.birthday_day}
                </div>
                <button 
                  onClick={() => setDraftingFor(draftingFor === member.id ? null : member.id)}
                  className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800/60 transition-colors"
                >
                  {draftingFor === member.id ? 'Cancel draft' : 'Draft message'}
                </button>
              </div>
            )}
          </div>
          
          {draftingFor === member.id && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900/30">
              <BirthdayMessageDraft 
                memberName={member.name} 
                groupName={groupName} 
                groupId={groupId} 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
