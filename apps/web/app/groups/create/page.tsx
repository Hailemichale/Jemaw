import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function createGroup(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  // 1. Create Group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (groupError || !group) {
    console.error('Error creating group:', groupError)
    redirect('/groups/create?error=Failed to create group')
  }

  // 2. Add creator as admin
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) {
    console.error('Error adding member:', memberError)
    redirect('/groups/create?error=Failed to add admin member')
  }

  revalidatePath('/')
  redirect(`/groups/${group.id}`)
}

export default function CreateGroupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Group</h1>
        
        <form action={createGroup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Monthly Brunch Crew"
            />
          </div>
          
          {searchParams.error && (
            <p className="text-red-500 text-sm">{searchParams.error}</p>
          )}

          <div className="pt-4 flex items-center justify-between">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </a>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
