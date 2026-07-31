import { createSignal, createEffect, Show, For } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import MainLayout from '../components/MainLayout';
import { Plus, Users, Calendar, Activity } from 'lucide-solid';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = createSignal<any>(null);
  const [groups, setGroups] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      setUser(session.user);

      // Fetch user's groups
      const { data: userGroups } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(role)
        `)
        .eq('group_members.user_id', session.user.id);
        
      if (userGroups) {
        setGroups(userGroups);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login', { replace: true });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  return (
    <Show when={!loading()} fallback={
      <div class="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <MainLayout title="Dashboard">
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Welcome Banner */}
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 sm:p-10 text-white shadow-lg shadow-indigo-500/20">
            <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div class="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            
            <div class="relative z-10">
              <h2 class="text-3xl sm:text-4xl font-bold mb-2">Welcome back!</h2>
              <p class="text-indigo-100 max-w-xl text-lg">
                You have 2 upcoming events this week. Dive into your groups and see what's happening.
              </p>
              
              <div class="mt-8 flex gap-4">
                <A href="/groups/create" class="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold transition-colors">
                  <Plus size={18} />
                  New Group
                </A>
              </div>
            </div>
          </div>

          {/* Widgets Row */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Users size={24} />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Groups</p>
                <h3 class="text-3xl font-bold text-slate-900 dark:text-white">{groups().length}</h3>
              </div>
            </div>
            
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div class="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl">
                <Calendar size={24} />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Upcoming Events</p>
                <h3 class="text-3xl font-bold text-slate-900 dark:text-white">2</h3>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 lg:col-span-1 md:col-span-2">
              <div class="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Activity size={24} />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Recent Activity</p>
                <p class="text-sm text-slate-900 dark:text-slate-300 font-medium">Sarah uploaded 3 photos in "Weekend Trip"</p>
                <p class="text-xs text-slate-400 mt-1">2 hours ago</p>
              </div>
            </div>
          </div>

          {/* Groups Section */}
          <div class="pt-4">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={20} class="text-indigo-500" />
                My Groups
              </h3>
              <A href="/groups" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                View all &rarr;
              </A>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <For each={groups()}>
                {(group) => (
                  <A 
                    href={`/groups/${group.id}`}
                    class="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                    
                    <div class="flex items-start justify-between mb-4 relative z-10">
                      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold shadow-inner">
                        {group.name.charAt(0)}
                      </div>
                      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                        {group.group_members[0].role}
                      </span>
                    </div>
                    
                    <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {group.name}
                    </h4>
                    
                    <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 relative z-10">
                      Manage events, share expenses, and stay connected with everyone.
                    </p>
                    
                    <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative z-10">
                      <div class="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i * 5 + group.name.length}`} class="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <span class="text-indigo-600 dark:text-indigo-400 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                        Open <span class="ml-1">&rarr;</span>
                      </span>
                    </div>
                  </A>
                )}
              </For>

              {/* Create New Group Card */}
              <A 
                href="/groups/create"
                class="group flex flex-col items-center justify-center min-h-[220px] bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all duration-300"
              >
                <div class="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all mb-4">
                  <Plus size={28} />
                </div>
                <h4 class="text-lg font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Create New Group
                </h4>
              </A>
            </div>
          </div>
        </div>
      </MainLayout>
    </Show>
  );
}
