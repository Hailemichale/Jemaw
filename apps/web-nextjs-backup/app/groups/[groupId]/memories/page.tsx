import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MemoriesClient from '@/components/MemoriesClient'

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const resolvedParams = await params
  const groupId = resolvedParams.groupId
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch memories with their media and creator info
  const { data: memories, error } = await supabase
    .from('memories')
    .select(`
      *,
      creator:users!memories_creator_id_fkey(id, full_name, avatar_url),
      media:memory_media(*),
      meeting:meetings(id, title)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching memories:', error)
  }

  // Process "On this day"
  const today = new Date()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()
  
  const onThisDay = memories?.filter(m => {
    const date = new Date(m.created_at)
    return (
      date.getMonth() === todayMonth &&
      date.getDate() === todayDay &&
      date.getFullYear() !== today.getFullYear() // Not from this year
    )
  }) || []

  // Group by month
  const groupedByMonth = (memories || []).reduce((acc: any, memory: any) => {
    const date = new Date(memory.created_at)
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!acc[monthYear]) acc[monthYear] = []
    acc[monthYear].push(memory)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <MemoriesClient
        groupId={groupId}
        memories={memories || []}
        groupedByMonth={groupedByMonth}
        onThisDay={onThisDay}
      />
    </div>
  )
}
