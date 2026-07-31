import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MembersList from '@/components/MembersList'

export default async function MembersPage(props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
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

          <MembersList 
            members={members} 
            groupName={group.name} 
            groupId={params.groupId} 
          />
        </div>
      </div>
    </div>
  )
}
