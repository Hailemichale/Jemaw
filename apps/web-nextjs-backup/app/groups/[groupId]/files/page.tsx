import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FilesClient from '@/components/FilesClient'

export default async function FilesPage({
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

  // Fetch shared files
  const { data: files, error } = await supabase
    .from('shared_files')
    .select(`
      *,
      uploader:users!shared_files_uploader_id_fkey(id, full_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching files:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <FilesClient groupId={groupId} initialFiles={files || []} currentUser={user} />
    </div>
  )
}
