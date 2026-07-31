import { createSignal, createEffect, For, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/MainLayout';
import { Users, Plus, Key, X, ArrowRight } from 'lucide-solid';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  
  // Join Modal State
  const [isJoinModalOpen, setIsJoinModalOpen] = createSignal(false);
  const [inviteCode, setInviteCode] = createSignal('');
  const [joinError, setJoinError] = createSignal('');
  const [isJoining, setIsJoining] = createSignal(false);

  const fetchGroups = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    const { data: userGroups } = await supabase
      .from('groups')
      .select(`*, group_members!inner(role)`)
      .eq('group_members.user_id', session.user.id);
      
    if (userGroups) setGroups(userGroups);
    setLoading(false);
  };

  createEffect(() => {
    fetchGroups();
  });

  const handleJoinGroup = async (e: Event) => {
    e.preventDefault();
    setJoinError('');
    setIsJoining(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const code = inviteCode().trim().toUpperCase();
      if (!code) throw new Error("Please enter an invite code");

      // Find the group by invite code
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (fetchError || !group) {
        throw new Error("Invalid invite code or group not found.");
      }

      // Join the group
      const { error: joinErr } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id,
          role: 'member'
        });

      if (joinErr) {
        // Handle unique constraint error if they are already in the group
        if (joinErr.code === '23505') {
          throw new Error("You are already a member of this group!");
        }
        throw new Error(joinErr.message);
      }

      // Success
      setIsJoinModalOpen(false);
      setInviteCode('');
      navigate(`/groups/${group.id}`);
      
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <MainLayout title="My Groups">
      <div class="pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Join Group Modal */}
        <Show when={isJoinModalOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsJoinModalOpen(false)}
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Key size={24} />
              </div>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join a Group</h2>
              <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter the 8-character invite code shared by the group creator.</p>
              
              <form onSubmit={handleJoinGroup} class="space-y-4">
                <Show when={joinError()}>
                  <div class="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800/50">
                    {joinError()}
                  </div>
                </Show>

                <div>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. J5OMP5WL"
                    value={inviteCode()}
                    onInput={(e) => setInviteCode(e.currentTarget.value.toUpperCase())}
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono tracking-widest text-center text-lg focus:ring-2 focus:ring-indigo-500 transition-shadow uppercase placeholder:tracking-normal"
                    maxLength={8}
                  />
                </div>
                
                <div class="pt-4 mt-2">
                  <button 
                    type="submit"
                    disabled={isJoining()}
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isJoining() ? 'Joining...' : 'Join Group'} <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">All Groups</h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">Manage and view all the groups you are a part of.</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              class="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <Key size={18} /> Join via Code
            </button>
            <A href="/groups/create" class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition-colors">
              <Plus size={18} /> New Group
            </A>
          </div>
        </div>

        <Show when={!loading()} fallback={<div class="text-center py-20 animate-pulse text-slate-500">Loading groups...</div>}>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <For each={groups()}>
              {(group) => (
                <A 
                  href={`/groups/${group.id}`}
                  class="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/30 transition-colors pointer-events-none"></div>
                  
                  <div class="flex items-start justify-between mb-4 relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold shadow-inner border border-indigo-200/50 dark:border-indigo-800/50 overflow-hidden">
                      {localStorage.getItem(`group_avatar_${group.id}`) ? (
                        <img src={localStorage.getItem(`group_avatar_${group.id}`)!} class="w-full h-full object-cover" />
                      ) : (
                        group.name.charAt(0)
                      )}
                    </div>
                  </div>
                  
                  <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {group.name}
                  </h4>
                  <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 relative z-10">
                    Role: {group.group_members[0].role}
                  </p>
                </A>
              )}
            </For>
            
            <Show when={groups().length === 0}>
              <div class="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
                <Users size={40} class="text-slate-400 mb-4" />
                <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">No groups yet</h3>
                <p class="text-slate-500 mt-2 mb-6">Create a group to start sharing with friends.</p>
                <A href="/groups/create" class="text-indigo-600 font-semibold hover:underline">Create a group &rarr;</A>
              </div>
            </Show>
          </div>
        </Show>
        
      </div>
    </MainLayout>
  );
}
