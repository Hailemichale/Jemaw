import { createSignal, createEffect, Show } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/MainLayout';
import { Users, Settings, Activity, ArrowLeft, X, Copy, Trash2 } from 'lucide-solid';

export default function GroupDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [avatarInput, setAvatarInput] = createSignal('');
  
  // Local avatar state for this specific group (using localStorage)
  const [localAvatar, setLocalAvatar] = createSignal<string | null>(null);

  createEffect(() => {
    const fetchGroup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: groupData, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(role, user_id)
        `)
        .eq('id', params.id)
        .single();

      if (error || !groupData) {
        navigate('/groups', { replace: true });
        return;
      }

      setGroup(groupData);
      setLoading(false);
    };

    fetchGroup();
  });

  createEffect(() => {
    if (group()) {
      // Load avatar from localStorage if it exists
      const savedAvatar = localStorage.getItem(`group_avatar_${group().id}`);
      if (savedAvatar) setLocalAvatar(savedAvatar);
    }
  });

  const saveAvatar = (data: string) => {
    if (!group()) return;
    try {
      localStorage.setItem(`group_avatar_${group().id}`, data);
      setLocalAvatar(data);
    } catch (e) {
      alert('The image is too large. Please use a smaller image or a URL.');
    }
  };

  const handleAvatarUrl = () => {
    if (avatarInput().trim()) {
      saveAvatar(avatarInput().trim());
      setAvatarInput('');
    }
  };

  const handleAvatarUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512; // Profile pics don't need to be huge
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        saveAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group()?.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout title={group() ? group().name : 'Group Details'}>
      <div class="pt-2 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Settings Modal */}
        <Show when={isSettingsOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Settings class="text-indigo-500" /> Group Settings
              </h2>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Name</label>
                  <input 
                    type="text" 
                    value={group().name} 
                    readonly
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white opacity-70 cursor-not-allowed"
                  />
                  <p class="text-xs text-slate-500 mt-1">Only the group creator can change the name.</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Avatar</label>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 overflow-hidden flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
                      <Show when={localAvatar()} fallback={<span class="text-2xl font-bold text-indigo-500">{group().name.charAt(0)}</span>}>
                        <img src={localAvatar()!} alt="Group Avatar" class="w-full h-full object-cover" />
                      </Show>
                    </div>
                    <div class="flex-1">
                      <label class="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2 rounded-xl transition-colors inline-block mb-2">
                        Upload Local Image
                        <input type="file" accept="image/*" class="hidden" onChange={handleAvatarUpload} />
                      </label>
                      <div class="flex gap-2">
                        <input 
                          type="url" 
                          placeholder="Or paste image URL..."
                          value={avatarInput()}
                          onInput={(e) => setAvatarInput(e.currentTarget.value)}
                          class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-900 dark:text-white"
                        />
                        <button 
                          onClick={handleAvatarUrl}
                          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Invite Code</label>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={group().invite_code} 
                      readonly
                      class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white tracking-widest font-mono"
                    />
                    <button 
                      onClick={copyInviteCode}
                      class="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                  <Show when={copied()}>
                    <p class="text-xs text-emerald-500 mt-1 font-medium">Copied to clipboard!</p>
                  </Show>
                </div>
                
                <div class="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-800/50">
                    <Trash2 size={18} /> Leave Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <div class="mb-6">
          <A href="/" class="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} class="mr-1" /> Back to Dashboard
          </A>
        </div>

        <Show when={!loading()} fallback={
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          
          {/* Header Banner */}
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12 text-white shadow-xl shadow-slate-900/10 mb-8 border border-slate-700/50">
            <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            
            <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div class="flex items-center gap-6">
                <div class="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/20 shadow-inner overflow-hidden">
                  <Show when={localAvatar()} fallback={<span>{group().name.charAt(0)}</span>}>
                    <img src={localAvatar()!} alt="Group Avatar" class="w-full h-full object-cover" />
                  </Show>
                </div>
                <div>
                  <h1 class="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">{group().name}</h1>
                  <div class="flex items-center gap-3 text-slate-300 text-sm">
                    <span class="flex items-center gap-1.5"><Users size={16} /> {group().group_members?.length || 1} Members</span>
                    <span>•</span>
                    <span>Invite Code: <strong class="text-white bg-white/10 px-2 py-0.5 rounded tracking-widest">{group().invite_code}</strong></span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  class="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl backdrop-blur-md transition-colors border border-white/10"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout for Group Tools */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column (Main Content) */}
            <div class="md:col-span-2 space-y-6">
              <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8 min-h-[400px]">
                <div class="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div class="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                </div>
                
                <div class="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400 text-center">
                  <p>No recent activity in this group.</p>
                  <p class="text-sm mt-1">Start by adding an event or sharing an expense!</p>
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div class="space-y-6">
              <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Members</h3>
                <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  <For each={group().group_members}>
                    {(member: any) => (
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                            {member.user_id.substring(0, 2).toUpperCase()}
                          </div>
                          <span class="font-medium text-slate-700 dark:text-slate-200 text-sm truncate w-24">
                            User {member.user_id.substring(0, 4)}
                          </span>
                        </div>
                        <span class={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                          member.role === 'admin' 
                            ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10' 
                            : 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
                <button class="w-full mt-6 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <Users size={16} /> Invite Members
                </button>
              </div>
            </div>

          </div>
        </Show>
        
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 4px; }
      `}</style>
    </MainLayout>
  );
}
