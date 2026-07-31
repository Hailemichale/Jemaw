import { createSignal, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { A, useLocation, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, Calendar, Settings, Bell, Search, LogOut, Menu, X } from 'lucide-solid';
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
            <img 
              src={wallpaper().value!} 
              alt="Custom Wallpaper" 
              class="w-full h-full object-cover opacity-60 dark:opacity-40 filter blur-[2px] transition-all duration-700" 
            />
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
                  class={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive() 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon size={20} class={`mr-4 ${isActive() ? 'text-rose-500' : 'opacity-70'}`} />
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
              <button class="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
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
            <div class="hidden md:flex relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} class="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search groups, events..." 
                class="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl w-64 text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 transition-all placeholder-slate-400"
              />
            </div>

            {/* Notifications */}
            <button class="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
              <Bell size={20} />
              <span class="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div class="relative">
              <button 
                class="flex items-center gap-3 p-1 pl-3 pr-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen())}
              >
                <span class="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">My Account</span>
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                  <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" class="w-full h-full rounded-full border-2 border-white dark:border-slate-950 object-cover" />
                </div>
              </button>

              <Show when={isProfileOpen()}>
                <div class="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-4">
                  <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">Logged in</p>
                    <p class="text-xs text-slate-500 truncate mt-0.5">Manage your account</p>
                  </div>
                  <A href="/profile" class="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
        <main class="flex-1 overflow-y-auto p-6 sm:p-10 z-10 relative">
          <div class="mx-auto max-w-6xl">
            {props.children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
