import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  console.log('Dashboard Server Cookies:', cookieStore.getAll())
  console.log('Dashboard Server User:', user?.id, 'Error:', getUserError)

  if (!user) {
    redirect('/login')
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch user's groups
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(role)
    `)
    .eq('group_members.user_id', user.id)

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 bg-gray-50 dark:bg-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Jemaw Groups</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => (
            <Link 
              key={group.id} 
              href={`/groups/${group.id}`}
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-500"
            >
              <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
                {group.name}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-2 text-indigo-500">
                  -&gt;
                </span>
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50 text-gray-600 dark:text-gray-400">
                Manage meetings and connect with the group.
              </p>
            </Link>
          ))}

          <Link 
            href={`/groups/create`}
            className="group rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-5 py-6 transition-colors hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-col items-center justify-center text-center h-full min-h-[140px]"
          >
            <h2 className="mb-2 text-xl font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              + Create Group
            </h2>
          </Link>
        </div>
      </div>
    </main>
  )
}
