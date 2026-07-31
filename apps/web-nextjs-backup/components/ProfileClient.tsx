'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfileClient({ user, profile, initialPrefs, groups }: any) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [birthMonth, setBirthMonth] = useState(profile?.birth_month || '')
  const [birthDay, setBirthDay] = useState(profile?.birth_day || '')
  const [birthYear, setBirthYear] = useState(profile?.birth_year || '')
  const [prefs, setPrefs] = useState(initialPrefs)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}-${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      showToast('Error uploading avatar', 'error')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    setAvatarUrl(publicUrl)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('users')
      .update({ 
        full_name: fullName, 
        avatar_url: avatarUrl,
        birth_month: birthMonth ? parseInt(birthMonth) : null,
        birth_day: birthDay ? parseInt(birthDay) : null,
        birth_year: birthYear ? parseInt(birthYear) : null
      })
      .eq('id', user.id)

    // Update preferences (upsert)
    const { error: prefsError } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        meeting_reminders: prefs.meeting_reminders,
        birthday_reminders: prefs.birthday_reminders,
        chat_notifications: prefs.chat_notifications,
        updated_at: new Date().toISOString()
      })

    setIsSaving(false)

    if (profileError || prefsError) {
      showToast('Error saving changes', 'error')
    } else {
      showToast('Profile updated successfully!', 'success')
      router.refresh()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg text-white z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <Link href="/" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-bold overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  fullName.charAt(0) || '?'
                )}
              </div>
              <label className="absolute bottom-0 right-0 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md hover:bg-indigo-700 transition-colors border-2 border-white dark:border-gray-800">
                <span className="sr-only">Upload avatar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm cursor-not-allowed"
                />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birthday</label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Month</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                    ))}
                  </select>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Day</option>
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="number"
                      placeholder="Year"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Year is private. Only you can see this.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Meeting Reminders</div>
                <div className="text-sm text-gray-500">Get notified about upcoming meetings and RSVPs.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={prefs.meeting_reminders} onChange={(e) => setPrefs({...prefs, meeting_reminders: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Birthday Reminders</div>
                <div className="text-sm text-gray-500">Never miss a group member's special day.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={prefs.birthday_reminders} onChange={(e) => setPrefs({...prefs, birthday_reminders: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Chat Notifications</div>
                <div className="text-sm text-gray-500">New messages in your groups.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={prefs.chat_notifications} onChange={(e) => setPrefs({...prefs, chat_notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* My Groups */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Groups</h2>
          {groups.length === 0 ? (
            <p className="text-gray-500">You haven't joined any groups yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group: any) => (
                <Link key={group.id} href={`/groups/${group.id}`} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{group.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
