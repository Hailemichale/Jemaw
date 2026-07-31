import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChatContainer from '@/components/ChatContainer'

export default async function ChatPage(props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  const { groupId } = await params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch group to verify membership
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) {
    redirect('/')
  }

  // Fetch the last 50 messages with sender info
  const { data: initialMessages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <ChatContainer 
          initialMessages={initialMessages || []} 
          groupId={groupId} 
          userId={user.id} 
        />
      </div>
    </div>
  )
}
