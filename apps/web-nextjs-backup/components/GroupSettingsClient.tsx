'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function GroupSettingsClient({ group, members, currentUser, isAdmin }: any) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [groupName, setGroupName] = useState(group.name)
  const [inviteCode, setInviteCode] = useState(group.invite_code)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpdateName = async () => {
    if (!isAdmin) return
    setIsSaving(true)
    const { error } = await supabase
      .from('groups')
      .update({ name: groupName })
      .eq('id', group.id)
    
    setIsSaving(false)
    if (error) showToast('Failed to update group name', 'error')
    else showToast('Group name updated!', 'success')
  }

  const handleRegenerateCode = async () => {
    if (!isAdmin) return
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase
      .from('groups')
      .update({ invite_code: newCode })
      .eq('id', group.id)
    
    if (error) showToast('Failed to regenerate code', 'error')
    else {
      setInviteCode(newCode)
      showToast('New invite code generated!', 'success')
    }
  }

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
      
      if (!error) router.push('/')
    }
  }

  const handleDeleteGroup = async () => {
    if (!isAdmin) return
    const confirmText = prompt(`Type "${group.name}" to confirm group deletion:`)
    if (confirmText === group.name) {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id)
      
      if (!error) router.push('/')
      else alert('Failed to delete group')
    }
  }

  const handleRoleChange = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const { error } = await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) router.refresh()
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Remove this member?')) {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId)
      
      if (!error) router.refresh()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg text-white z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Group Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Group Information</h2>
          <p className="text-sm text-gray-500">Update your group's basic details.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!isAdmin}
                className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
              />
              {isAdmin && (
                <button
                  onClick={handleUpdateName}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Members</h2>
          <p className="text-sm text-gray-500">Share this code to let others join.</p>
        </div>
        <div className="p-6 text-center">
          <div className="text-4xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-4">
            {inviteCode}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteCode)
                showToast('Code copied to clipboard!', 'success')
              }}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Copy Code
            </button>
            {isAdmin && (
              <button
                onClick={handleRegenerateCode}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Members ({members.length})</h2>
          <p className="text-sm text-gray-500">Manage people in this group.</p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member: any) => (
            <li key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                  {member.users.avatar_url ? (
                    <img src={member.users.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    member.users.full_name?.charAt(0) || '?'
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {member.users.full_name}
                    {member.user_id === currentUser.id && <span className="text-xs text-gray-500">(You)</span>}
                  </div>
                  <div className="text-sm text-gray-500">{member.users.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {member.role}
                </span>
                
                {isAdmin && member.user_id !== currentUser.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRoleChange(member.id, member.role)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {member.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="p-6 border-b border-red-200 dark:border-red-900/50 bg-red-100/50 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
            ⚠️ Danger Zone
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Leave Group</h3>
              <p className="text-sm text-gray-500">You will lose access to all group data.</p>
            </div>
            <button
              onClick={handleLeaveGroup}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              Leave Group
            </button>
          </div>
          
          {isAdmin && (
            <div className="flex items-center justify-between pt-4 border-t border-red-200 dark:border-red-900/50">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Delete Group</h3>
                <p className="text-sm text-gray-500">Permanently delete this group and all its data. This cannot be undone.</p>
              </div>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
