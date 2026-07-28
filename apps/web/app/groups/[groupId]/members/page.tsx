import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MembersPage({ params }: { params: { groupId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        role,
        user:users (
          id,
          name,
          birthday_month,
          birthday_day
        )
      )
    `)
    .eq('id', params.groupId)
    .single()

  if (error || !group) {
    redirect('/')
  }

  const members = group.group_members.map((gm: any) => ({
    ...gm.user,
    role: gm.role
  }))

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href={`/groups/${params.groupId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to Dashboard
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Members</h1>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {members.length} members
            </div>
          </div>

          <div className="space-y-4">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
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
                  <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-800">
                    <span role="img" aria-label="birthday">🎂</span>
                    {months[member.birthday_month - 1]} {member.birthday_day}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
