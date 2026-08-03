import { createSignal, createEffect, Show, For } from 'solid-js';
import type { JSX } from 'solid-js';
import { A, useLocation, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, Calendar, Settings, Bell, Search, LogOut, Menu, X, DownloadCloud, Monitor } from 'lucide-solid';
import { wallpaper } from '../store/theme';

interface MainLayoutProps {
  children: JSX.Element;
  title: string;
}

export default function MainLayout(props: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);
  const [isProfileOpen, setIsProfileOpen] = createSignal(false);
  const [isDownloadOpen, setIsDownloadOpen] = createSignal(false);
  const [avatarUrl, setAvatarUrl] = createSignal<string | null>(null);

  createEffect(() => {
    const loadAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          const local = localStorage.getItem(`profile_avatar_${session.user.id}`);
          if (local) setAvatarUrl(local);
        }
      }
    };
    loadAvatar();
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Groups', path: '/groups', icon: Users },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div class="flex h-screen text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div class="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <Show 
          when={wallpaper().type !== 'default' && wallpaper().value}
          fallback={
            // Friendship Glossy Gradient Default
            <div class="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
              <div class="absolute top-0 right-0 w-[800px] h-[600px] bg-orange-300/20 dark:bg-orange-600/10 rounded-full blur-[120px] mix-blend-overlay"></div>
              <div class="absolute bottom-0 left-[20%] w-[600px] h-[500px] bg-rose-300/20 dark:bg-rose-600/10 rounded-full blur-[100px] mix-blend-overlay"></div>
              <div class="absolute top-[40%] left-0 w-[500px] h-[500px] bg-yellow-300/20 dark:bg-yellow-600/10 rounded-full blur-[120px] mix-blend-overlay"></div>
            </div>
          }
        >
          {/* Custom Wallpaper */}
          <div class="absolute inset-0 bg-slate-950">
            <Show when={wallpaper().type === 'video'} fallback={
              <img 
                src={wallpaper().value!} 
                alt="Background Wallpaper" 
                class="w-full h-full object-cover opacity-60 dark:opacity-40 filter blur-[2px] transition-opacity duration-1000"
              />
            }>
              <video 
                src={wallpaper().value!} 
                autoplay 
                loop 
                muted 
                playsinline
                class="w-full h-full object-cover opacity-60 dark:opacity-40 filter blur-[2px] transition-opacity duration-1000"
              />
            </Show>
          </div>
        </Show>
      </div>

      {/* Mobile Sidebar Overlay */}
      <Show when={isMobileMenuOpen()}>
        <div 
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      </Show>

      {/* Sidebar */}
      <aside class={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div class="flex flex-col h-full">
          
          {/* Logo Area */}
          <div class="h-20 flex items-center px-8 border-b border-slate-200/50 dark:border-slate-800/50">
            <div class="w-10 h-10 rounded-xl overflow-hidden shadow-sm mr-3 border border-slate-100 dark:border-slate-700">
              <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw" class="w-full h-full object-cover" />
            </div>
            <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-rose-500">
              Jemaw
            </span>
            <button 
              class="ml-auto lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav class="flex-1 overflow-y-auto py-8 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = () => {
                if (item.path === '/') return location.pathname === '/';
                return location.pathname.startsWith(item.path);
              };
              
              return (
                <A 
                  href={item.path}
                  class={`group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive() 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1'
                  }`}
                >
                  <item.icon size={20} class={`mr-4 transition-transform group-hover:scale-110 ${isActive() ? 'text-rose-500 scale-110' : 'opacity-70'}`} />
                  <span class="font-medium">{item.name}</span>
                </A>
              );
            })}
          </nav>

          {/* Bottom Call to Action */}
          <div class="p-4 mt-auto">
            <div class="bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-2xl p-5 text-center backdrop-blur-md">
              <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Share Jemaw</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Invite your friends and start managing expenses and memories together.
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  alert("App link copied to clipboard! Share it with your friends.");
                }}
                class="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                Invite Friends
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Topbar */}
        <header class="h-20 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between">
          <div class="flex items-center">
            <button 
              class="mr-4 lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{props.title}</h1>
          </div>
          
          <div class="flex items-center gap-4 sm:gap-6">
            
            {/* Search */}
            {(() => {
              const [searchQuery, setSearchQuery] = createSignal('');
              const [showResults, setShowResults] = createSignal(false);

              const navItems = [
                { name: 'Dashboard', path: '/' },
                { name: 'Groups', path: '/groups' },
                { name: 'Calendar & Events', path: '/calendar' },
                { name: 'Settings', path: '/settings' },
                { name: 'Create Group', path: '/groups/create' },
              ];

              const filteredItems = () => {
                const q = searchQuery().toLowerCase().trim();
                if (!q) return [];
                return navItems.filter(item => item.name.toLowerCase().includes(q));
              };

              return (
                <form onSubmit={(e) => { e.preventDefault(); const items = filteredItems(); if (items.length > 0) { navigate(items[0].path); setSearchQuery(''); setShowResults(false); } }} class="hidden md:flex relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} class="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery()}
                    onInput={(e) => { setSearchQuery(e.currentTarget.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder="Search pages..." 
                    class="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl w-64 text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 transition-all placeholder-slate-400"
                  />
                  <Show when={showResults() && filteredItems().length > 0}>
                    <div class="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <For each={filteredItems()}>
                        {(item) => (
                          <button
                            type="button"
                            onMouseDown={() => { navigate(item.path); setSearchQuery(''); setShowResults(false); }}
                            class="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2"
                          >
                            <Search size={14} class="text-slate-400" />
                            {item.name}
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </form>
              );
            })()}

            {/* Downloads Dropdown */}
            <div class="relative">
              <button 
                class="relative p-2.5 text-indigo-500 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-full transition-colors flex items-center gap-2"
                onClick={() => setIsDownloadOpen(!isDownloadOpen())}
                type="button"
                aria-label="Download Applications"
              >
                <DownloadCloud size={20} class="pointer-events-none" />
                <span class="hidden sm:inline text-sm font-medium pointer-events-none">Download App</span>
              </button>
              <Show when={isDownloadOpen()}>
                {/* Backdrop for mobile to handle outside clicks */}
                <div class="fixed inset-0 z-40 sm:hidden" onClick={() => setIsDownloadOpen(false)}></div>
                <div class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-4">
                  <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Install Jemaw Native</p>
                  </div>
                  
                  <a href="https://github.com/Hailemichale/Jemaw/releases/latest/download/Jemaw_0.1.0_x64_en-US.msi" download="Jemaw_0.1.0_x64_en-US.msi" class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left text-sm font-medium" onClick={() => setIsDownloadOpen(false)}>
                    <span class="text-xl">🪟</span>
                    <div class="flex-1">
                      <span class="block text-slate-900 dark:text-white">Windows PC</span>
                      <span class="block text-xs text-slate-500 dark:text-slate-400">.msi Installer</span>
                    </div>
                  </a>
                  
                  <a href="https://github.com/Hailemichale/Jemaw/releases/latest/download/app-debug.apk" download="app-debug.apk" class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left text-sm font-medium" onClick={() => setIsDownloadOpen(false)}>
                    <span class="text-xl">🤖</span>
                    <div class="flex-1">
                      <span class="block text-slate-900 dark:text-white">Android</span>
                      <span class="block text-xs text-slate-500 dark:text-slate-400">.apk Application</span>
                    </div>
                  </a>

                  <div class="w-full flex items-center gap-3 px-4 py-2.5 opacity-50 cursor-not-allowed text-left text-sm font-medium">
                    <span class="text-xl">🍎</span>
                    <div class="flex-1">
                      <span class="block text-slate-900 dark:text-white">iOS & Mac</span>
                      <span class="block text-xs text-slate-500 dark:text-slate-400">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </Show>
            </div>

            {/* Notifications */}
            <div class="relative group hidden sm:block">
              <button class="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
                <Bell size={20} />
              </button>
              <div class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                <p class="text-sm font-semibold text-slate-900 dark:text-white mb-1">Notifications</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">You're all caught up! 🎉</p>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div class="relative">
              <button 
                class="flex items-center gap-3 p-1 pl-3 pr-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen())}
              >
                <span class="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">My Account</span>
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] flex-shrink-0">
                  <Show when={avatarUrl()} fallback={<img src="https://i.pravatar.cc/150?img=32" alt="Avatar" class="w-full h-full rounded-full border-2 border-white dark:border-slate-950 object-cover" />}>
                    <img src={avatarUrl()!} alt="Avatar" class="w-full h-full rounded-full border-2 border-white dark:border-slate-950 object-cover" />
                  </Show>
                </div>
              </button>

              <Show when={isProfileOpen()}>
                <div class="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-4">
                  <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">Logged in</p>
                    <p class="text-xs text-slate-500 truncate mt-0.5">Manage your account</p>
                  </div>
                  <A href="/settings" class="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsProfileOpen(false)}>
                    <Settings size={16} class="mr-3 text-slate-400" />
                    Account Settings
                  </A>
                  <button 
                    onClick={handleSignOut}
                    class="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut size={16} class="mr-3 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </Show>
            </div>

          </div>
        </header>

        {/* Scrollable Page Content */}
        <main class="flex-1 overflow-y-auto p-6 sm:p-10 z-10 relative animate-in fade-in duration-500">
          <div class="mx-auto max-w-6xl">
            {props.children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
