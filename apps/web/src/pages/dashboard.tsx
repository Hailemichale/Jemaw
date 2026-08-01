import { createSignal, createEffect, Show, For } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import MainLayout from '../components/MainLayout';
import { Plus, Users, Calendar, Activity, Key, X, ArrowRight } from 'lucide-solid';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = createSignal<any>(null);
  const [userProfile, setUserProfile] = createSignal<any>(null);
  const [groups, setGroups] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [isMyBirthday, setIsMyBirthday] = createSignal(false);

  // Join Group Modal State
  const [isJoinModalOpen, setIsJoinModalOpen] = createSignal(false);
  const [inviteCode, setInviteCode] = createSignal('');
  const [isJoining, setIsJoining] = createSignal(false);
  const [joinError, setJoinError] = createSignal('');
  createEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      setUser(session.user);
      
      // Fetch user profile from DB to get the most up-to-date name
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setUserProfile(profileData || {});

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
        
        // Check if it's user's birthday today
        if (session.user.user_metadata?.birthdate) {
          const bd = new Date(session.user.user_metadata.birthdate);
          const today = new Date();
          if (bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate()) {
            setIsMyBirthday(true);
          }
        }

        // Fire and forget background tasks
        syncBirthdaysToEvents(session.user.id, session.user.user_metadata, userGroups).catch(console.error);
        checkAndSendReminders(session.user.id, userGroups).catch(console.error);
      }
      setLoading(false);
    };

    const syncBirthdaysToEvents = async (userId: string, userMeta: any, userGroups: any[]) => {
      const birthdateStr = userMeta.birthdate;
      const fullName = userMeta.full_name;
      if (!birthdateStr || !fullName || userGroups.length === 0) return;

      const birthdate = new Date(birthdateStr);
      const today = new Date();
      let nextBirthday = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      
      if (nextBirthday < today && (nextBirthday.getMonth() !== today.getMonth() || nextBirthday.getDate() !== today.getDate())) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const yyyy = nextBirthday.getFullYear();
      const mm = String(nextBirthday.getMonth() + 1).padStart(2, '0');
      const dd = String(nextBirthday.getDate()).padStart(2, '0');
      const eventDateStr = `${yyyy}-${mm}-${dd}`;
      const title = `${fullName}'s Birthday 🎉`;

      for (const group of userGroups) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('group_id', group.id)
          .eq('title', title)
          .eq('date', eventDateStr);
          
        if (!existing || existing.length === 0) {
          await supabase.from('events').insert({
            group_id: group.id,
            title: title,
            date: eventDateStr,
            user_id: userId
          });
        }
      }
    };

    const checkAndSendReminders = async (userId: string, userGroups: any[]) => {
      const groupIds = userGroups.map(g => g.id);
      if (groupIds.length === 0) return;

      const today = new Date();
      today.setHours(0,0,0,0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*, groups(name)')
        .in('group_id', groupIds)
        .gte('date', today.toISOString())
        .lte('date', nextWeek.toISOString());

      if (!upcomingEvents || upcomingEvents.length === 0) return;

      const eventIds = upcomingEvents.map(e => e.id);
      const { data: sentActivities } = await supabase
        .from('activities')
        .select('action_type, description')
        .in('action_type', ['reminder_7d', 'birthday_wish_today'])
        .in('description', eventIds);

      const sentReminders = sentActivities?.filter(a => a.action_type === 'reminder_7d').map(a => a.description) || [];
      const sentWishes = sentActivities?.filter(a => a.action_type === 'birthday_wish_today').map(a => a.description) || [];

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;

      const FUN_GIFS = [
        'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
        'https://media.giphy.com/media/l0HlOBZcl7mbV6VgI/giphy.gif',
        'https://media.giphy.com/media/xT0xeJpnrWC4XWblWQ/giphy.gif',
        'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
        'https://media.giphy.com/media/3o6ozh46EBu2EQvzws/giphy.gif',
        'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif'
      ];
      
      const BDAY_GIFS = [
        'https://media.giphy.com/media/l4KibWpBGWchSqCRy/giphy.gif',
        'https://media.giphy.com/media/26FPpSuhgHvU6hP32/giphy.gif',
        'https://media.giphy.com/media/3o6MbhYjXivpe320qQ/giphy.gif'
      ];

      for (const event of upcomingEvents) {
        const eventDate = new Date(event.date);
        eventDate.setHours(0,0,0,0);
        
        const isToday = eventDate.getTime() === today.getTime();
        const isFuture = eventDate.getTime() > today.getTime();
        const isBirthdayEvent = event.title.toLowerCase().includes('birthday');

        // Logic 1: Exact Day Birthday Wish
        if (isToday && isBirthdayEvent && !sentWishes.includes(event.id)) {
          const prompt = `Write a deeply personal, heartwarming, and highly energetic 2-sentence birthday wish for a group member whose birthday is today! The event is called "${event.title}". Use lots of emojis. Do not use quotes. Make it sound like it's coming from the whole friend group.`;
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) continue;
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const bdayGif = BDAY_GIFS[Math.floor(Math.random() * BDAY_GIFS.length)];
            
            await supabase.from('messages').insert({
              group_id: event.group_id,
              user_id: userId,
              content: `🎂 **[AI BIRTHDAY WISH]**\n\n${text}\n\n![Birthday GIF](${bdayGif})`
            });
            await supabase.from('activities').insert({
              group_id: event.group_id,
              user_id: userId,
              action_type: 'birthday_wish_today',
              description: event.id
            });
          } catch (e) { console.error(e); }
        }

        // Logic 2: 7-Day Reminder
        if (isFuture && !sentReminders.includes(event.id)) {
          const prompt = `Write a super energetic, highly attractive, and fun 2-sentence reminder for an upcoming group event called "${event.title}" happening on ${new Date(event.date).toLocaleDateString()} (which is coming up soon!). Use lots of emojis. Do not use quotes. Remind the group to get ready!`;
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) continue;
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const randomGif = FUN_GIFS[Math.floor(Math.random() * FUN_GIFS.length)];
            
            await supabase.from('messages').insert({
              group_id: event.group_id,
              user_id: userId,
              content: `🤖 **[AI AUTO-REMINDER]**\n\n${text}\n\n![Hype GIF](${randomGif})`
            });
            await supabase.from('activities').insert({
              group_id: event.group_id,
              user_id: userId,
              action_type: 'reminder_7d',
              description: event.id
            });
          } catch (e) { console.error(e); }
        }
      }
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

  const handleJoinGroup = async (e: Event) => {
    e.preventDefault();
    const code = inviteCode().trim().toUpperCase();
    if (!code || code.length !== 8) {
      setJoinError("Please enter a valid 8-character invite code.");
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

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
        if (joinErr.code === '23505') {
          throw new Error("You are already a member of this group!");
        }
        throw new Error(joinErr.message);
      }

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
    <MainLayout title="Dashboard">
      {/* Join Group Modal */}
      <Show when={isJoinModalOpen()}>
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)}></div>
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setIsJoinModalOpen(false)} 
              class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div class="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
              <Key size={24} />
            </div>
            
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join a Group</h2>
            <p class="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Enter the 8-character invite code shared by the group creator.
            </p>

            <form onSubmit={handleJoinGroup}>
              <Show when={joinError()}>
                <div class="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
                  {joinError()}
                </div>
              </Show>

              <div class="mb-6">
                <input
                  type="text"
                  required
                  value={inviteCode()}
                  onInput={(e) => setInviteCode(e.currentTarget.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  maxLength={8}
                  class="w-full text-center text-2xl tracking-widest font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase"
                />
              </div>

              <button 
                type="submit" 
                disabled={isJoining() || inviteCode().trim().length !== 8}
                class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isJoining() ? 'Joining...' : 'Join Group'} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </Show>

      <Show when={!loading()} fallback={
        <div class="space-y-8 animate-in fade-in p-2">
          {/* Welcome Banner Skeleton */}
          <div class="h-48 md:h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          
          {/* Widgets Row Skeleton */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="h-28 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
            <div class="h-28 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
            <div class="h-28 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          </div>

          {/* Groups Grid Skeleton */}
          <div class="pt-4 space-y-6">
            <div class="h-8 w-40 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
              <div class="h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
              <div class="h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
            </div>
          </div>
        </div>
      }>
          <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Birthday Banner */}
          <Show when={isMyBirthday()}>
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 p-8 sm:p-12 text-white shadow-2xl shadow-rose-500/30">
               <div class="absolute inset-0 bg-[url('https://media.giphy.com/media/26FPpSuhgHvU6hP32/giphy.gif')] opacity-20 mix-blend-overlay bg-cover bg-center"></div>
               <div class="relative z-10 flex flex-col items-center text-center">
                 <h1 class="text-4xl sm:text-6xl font-black mb-4 tracking-tight drop-shadow-lg">🎉 HAPPY BIRTHDAY! 🎂</h1>
                 <p class="text-xl font-medium drop-shadow-md">Wishing you the most amazing day ever, {userProfile()?.full_name?.split(' ')?.[0] || user()?.user_metadata?.full_name?.split(' ')?.[0] || ''}!</p>
               </div>
            </div>
          </Show>

          {/* Welcome Banner */}
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 sm:p-10 text-white shadow-lg shadow-indigo-500/20">
            <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div class="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            
            <div class="relative z-10">
              <h2 class="text-3xl sm:text-4xl font-bold mb-2">
                Welcome back{userProfile()?.full_name ? `, ${userProfile()?.full_name?.split(' ')?.[0]}!` : (user()?.user_metadata?.full_name ? `, ${user()?.user_metadata?.full_name?.split(' ')?.[0]}!` : '!')}
              </h2>
              <p class="text-indigo-100 max-w-xl text-lg">
                You have 2 upcoming events this week. Dive into your groups and see what's happening.
              </p>
              
              <div class="mt-8 flex gap-4">
                <A href="/groups/create" class="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md">
                  <Plus size={18} />
                  New Group
                </A>
                <button onClick={() => setIsJoinModalOpen(true)} class="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md border border-indigo-500/30">
                  <Key size={18} />
                  Join Group
                </button>
              </div>
            </div>
          </div>

          {/* Widgets Row */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
              <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Groups</p>
                <h3 class="text-3xl font-bold text-slate-900 dark:text-white">{groups().length}</h3>
              </div>
            </div>
            
            <div class="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:-translate-y-1 hover:shadow-md hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300">
              <div class="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Upcoming Events</p>
                <h3 class="text-3xl font-bold text-slate-900 dark:text-white">2</h3>
              </div>
            </div>

            <div class="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 lg:col-span-1 md:col-span-2 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
              <div class="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
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
                    class="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                    
                    <div class="flex items-start justify-between mb-4 relative z-10">
                      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold shadow-inner">
                        {group?.name?.charAt(0) || '?'}
                      </div>
                      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                        {group?.group_members?.[0]?.role || 'member'}
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
                            <img src={`https://i.pravatar.cc/100?img=${i * 5 + (group?.name?.length || 0)}`} class="w-full h-full object-cover" />
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
                class="group flex flex-col items-center justify-center min-h-[220px] bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
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
      </Show>
    </MainLayout>
  );
}
