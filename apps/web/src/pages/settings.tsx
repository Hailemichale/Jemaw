import { createSignal, createEffect, Show, For } from 'solid-js';
import MainLayout from '../components/MainLayout';
import { wallpaper, setWallpaper } from '../store/theme';
import { Image, Monitor, Link as LinkIcon, Upload, Check, User, Mail, Shield } from 'lucide-solid';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const [urlInput, setUrlInput] = createSignal('');
  const [activeThemeTab, setActiveThemeTab] = createSignal<'default' | 'upload' | 'url' | 'preset'>('default');
  
  // Main Settings Tabs
  const [activeSection, setActiveSection] = createSignal<'profile' | 'appearance'>('appearance');

  // Curated Preset Wallpapers
  const PRESET_WALLPAPERS = [
    { name: 'Cinematic Rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&q=80', isVideo: false },
    { name: 'Neon City', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1920', isVideo: false },
    { name: 'Anime Street', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80', isVideo: false },
    { name: 'Cyberpunk Tokyo', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1920&q=80', isVideo: false },
    { name: 'Serene Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80', isVideo: false },
    { name: 'Misty Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', isVideo: false },
    { name: 'Deep Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', isVideo: false },
    { name: 'Hacker Code', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80', isVideo: false },
    { name: 'Software Dev', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80', isVideo: false },
    { name: 'Modern Arch', url: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1920&q=80', isVideo: false },
    { name: 'Glass Building', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', isVideo: false }
  ];

  // Profile state
  const [fullName, setFullName] = createSignal('');
  const [userEmail, setUserEmail] = createSignal('');
  const [profileAvatar, setProfileAvatar] = createSignal<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = createSignal(false);
  const [newPassword, setNewPassword] = createSignal('');

  createEffect(() => {
    // Load initial profile data
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        const meta = session.user.user_metadata || {};
        
        // Default to auth metadata
        setFullName(meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim());
        
        // Fetch from DB to ensure it is in sync
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.avatar_url) setProfileAvatar(profile.avatar_url);
        } else {
          // Fallback to local storage if DB avatar doesn't exist yet
          const savedAvatar = localStorage.getItem(`profile_avatar_${session.user.id}`);
          if (savedAvatar) setProfileAvatar(savedAvatar);
        }
      }
    };
    loadProfile();
  });

  const handleProfileAvatarUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512;
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfileAvatar(dataUrl);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            localStorage.setItem(`profile_avatar_${session.user.id}`, dataUrl);
          } catch(e) {}
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    let successMessage = "Profile saved successfully!";
    
    // Update Auth Metadata
    const { data } = await supabase.auth.updateUser({
      data: {
        full_name: fullName()
      }
    });
    
    // Update Password if provided
    if (newPassword().trim().length >= 6) {
      const { error } = await supabase.auth.updateUser({ password: newPassword().trim() });
      if (error) {
        alert("Error updating password: " + error.message);
      } else {
        successMessage = "Profile and password updated successfully!";
        setNewPassword('');
      }
    } else if (newPassword().trim().length > 0) {
      alert("Password must be at least 6 characters long.");
      setIsSavingProfile(false);
      return;
    }
    
    // Sync to public profiles table
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName(),
        avatar_url: profileAvatar(), // Save the new avatar URL to DB!
        birthdate: data.user.user_metadata?.birthdate || null
      });
    }
    
    alert(successMessage);
    setIsSavingProfile(false);
  };

  const handleUrlSubmit = (e: Event) => {
    e.preventDefault();
    if (urlInput().trim()) {
      setWallpaper('url', urlInput().trim());
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setWallpaper('image', dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetToDefault = () => {
    setWallpaper('default', null);
  };

  return (
    <MainLayout title="Settings">
      <div class="max-w-5xl mx-auto pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div class="mb-10">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
          <p class="text-slate-600 dark:text-slate-400 text-lg">Manage your account and app preferences.</p>
        </div>

        <div class="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div class="w-full md:w-64 flex flex-col gap-2">
            <button 
              onClick={() => setActiveSection('profile')}
              class={`flex items-center gap-3 p-3 rounded-xl transition-all text-left font-medium ${
                activeSection() === 'profile' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <User size={18} /> My Profile
            </button>
            <button 
              onClick={() => setActiveSection('appearance')}
              class={`flex items-center gap-3 p-3 rounded-xl transition-all text-left font-medium ${
                activeSection() === 'appearance' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Monitor size={18} /> Appearance
            </button>
          </div>

          {/* Main Content Area */}
          <div class="flex-1">
            
            <Show when={activeSection() === 'profile'}>
              <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div class="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50">
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <User class="text-indigo-500" size={24} />
                    Personal Information
                  </h2>
                  <p class="text-slate-500 dark:text-slate-400">Update your personal details and how others see you.</p>
                </div>
                
                <div class="p-6 sm:p-8 space-y-6">
                  {/* Profile Picture Placeholder */}
                  <div class="flex items-center gap-6">
                    <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 flex-shrink-0">
                      <Show when={profileAvatar()} fallback={<img src="https://i.pravatar.cc/150?img=32" alt="Avatar" class="w-full h-full rounded-full border-4 border-white dark:border-slate-900 object-cover" />}>
                        <img src={profileAvatar()!} alt="Avatar" class="w-full h-full rounded-full border-4 border-white dark:border-slate-900 object-cover" />
                      </Show>
                    </div>
                    <div>
                      <label class="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-4 py-2 rounded-xl transition-colors mb-2 inline-block">
                        Change Picture
                        <input type="file" accept="image/*" class="hidden" onChange={handleProfileAvatarUpload} />
                      </label>
                      <p class="text-xs text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                      <input type="text" value={fullName()} onInput={(e) => setFullName(e.currentTarget.value)} placeholder="John Doe" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                      <div class="relative">
                        <Mail class="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input type="email" value={userEmail()} disabled class="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>

                  <div class="pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Shield class="text-indigo-500" size={20} />
                      Security
                    </h3>
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password (optional)</label>
                      <input type="password" value={newPassword()} onInput={(e) => setNewPassword(e.currentTarget.value)} placeholder="Leave blank to keep current password" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                      <p class="text-xs text-slate-500 mt-2">Must be at least 6 characters.</p>
                    </div>
                  </div>

                  <div class="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-8">
                    <button 
                      onClick={saveProfile}
                      disabled={isSavingProfile()}
                      class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {isSavingProfile() ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={activeSection() === 'appearance'}>
              <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Header */}
                <div class="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50">
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <Monitor class="text-rose-500" size={24} />
                    Background Theme
                  </h2>
                  <p class="text-slate-500 dark:text-slate-400">Choose a default gradient or upload a custom wallpaper.</p>
                </div>

                <div class="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
                  
                  {/* Options Tabs */}
                  <div class="w-full md:w-1/3 flex flex-col gap-3">
                    <button 
                      onClick={() => { setActiveThemeTab('default'); resetToDefault(); }}
                      class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        wallpaper().type === 'default' 
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div class={`p-2 rounded-xl ${wallpaper().type === 'default' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Image size={20} />
                      </div>
                      <div>
                        <h3 class="font-semibold">Friendship Gradient</h3>
                        <p class="text-xs opacity-80 mt-0.5">Warm, glossy colors</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveThemeTab('preset')}
                      class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        activeThemeTab() === 'preset' 
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div class={`p-2 rounded-xl ${activeThemeTab() === 'preset' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Image size={20} />
                      </div>
                      <div>
                        <h3 class="font-semibold">Preset Wallpapers</h3>
                        <p class="text-xs opacity-80 mt-0.5">Choose from curated images</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveThemeTab('upload')}
                      class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        activeThemeTab() === 'upload' 
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div class={`p-2 rounded-xl ${activeThemeTab() === 'upload' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Upload size={20} />
                      </div>
                      <div>
                        <h3 class="font-semibold">Local Upload</h3>
                        <p class="text-xs opacity-80 mt-0.5">From your device</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveThemeTab('url')}
                      class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        activeThemeTab() === 'url' 
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div class={`p-2 rounded-xl ${activeThemeTab() === 'url' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <LinkIcon size={20} />
                      </div>
                      <div>
                        <h3 class="font-semibold">Image URL</h3>
                        <p class="text-xs opacity-80 mt-0.5">From the internet</p>
                      </div>
                    </button>
                  </div>

                  {/* Display Area */}
                  <div class="flex-1">
                    
                    <Show when={activeThemeTab() === 'default'}>
                      <div class="h-full min-h-[300px] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
                        <div class="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-400/20 dark:bg-orange-600/20 rounded-full blur-[80px]"></div>
                        <div class="absolute bottom-0 left-[10%] w-[300px] h-[200px] bg-rose-400/20 dark:bg-rose-600/20 rounded-full blur-[60px]"></div>
                        
                        <div class="relative z-10 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl inline-flex mb-4 border border-white/20 dark:border-slate-800/50">
                          <Check class="text-rose-500" size={32} />
                        </div>
                        <h3 class="relative z-10 text-xl font-bold text-slate-900 dark:text-white">Active Theme</h3>
                        <p class="relative z-10 text-slate-500 dark:text-slate-400 mt-2">The default glossy gradient is currently active across the app.</p>
                      </div>
                    </Show>

                    <Show when={activeThemeTab() === 'upload'}>
                      <div class="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors relative">
                        
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload}
                          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        
                        <div class="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                          <Upload size={32} />
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Click or drag image</h3>
                        <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                          Upload a high-resolution image from your computer to use as your background.
                        </p>
                        
                        <Show when={wallpaper().type === 'image'}>
                          <p class="mt-6 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                            <Check size={16} /> Custom local wallpaper active
                          </p>
                        </Show>
                      </div>
                    </Show>

                    <Show when={activeThemeTab() === 'url'}>
                      <div class="h-full min-h-[300px] rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
                        <div class="w-full max-w-md">
                          <div class="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-6 w-16 h-16 mx-auto flex items-center justify-center">
                            <LinkIcon size={24} />
                          </div>
                          <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">Set via Image URL</h3>
                          
                          <form onSubmit={handleUrlSubmit} class="flex gap-2">
                            <input 
                              type="url" 
                              required
                              placeholder="https://example.com/image.jpg"
                              value={urlInput()}
                              onInput={(e) => setUrlInput(e.currentTarget.value)}
                              class="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-shadow"
                            />
                            <button 
                              type="submit"
                              class="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md shadow-rose-500/20"
                            >
                              Set
                            </button>
                          </form>

                          <Show when={wallpaper().type === 'url'}>
                            <p class="mt-6 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                              <Check size={16} /> Custom URL wallpaper active
                            </p>
                          </Show>
                        </div>
                      </div>
                    </Show>

                    <Show when={activeThemeTab() === 'preset'}>
                      <div class="h-full min-h-[300px] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Curated Wallpapers</h3>
                        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <For each={PRESET_WALLPAPERS}>
                            {(preset) => {
                              const isActive = () => wallpaper().value === preset.url;
                              return (
                                <button 
                                  onClick={() => setWallpaper(preset.isVideo ? 'video' : 'url', preset.url)}
                                  class={`relative group overflow-hidden rounded-xl aspect-[16/9] border-2 transition-all ${
                                    isActive()
                                      ? 'border-rose-500 shadow-md shadow-rose-500/20' 
                                      : 'border-transparent hover:border-rose-300 dark:hover:border-rose-700'
                                  }`}
                                >
                                  <Show when={preset.isVideo} fallback={
                                    <img src={preset.url} alt={preset.name} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  }>
                                    <video src={preset.url} autoplay loop muted playsinline class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                                  </Show>
                                  
                                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                                    <span class="text-white text-sm font-semibold truncate">{preset.name}</span>
                                  </div>
                                  <Show when={isActive()}>
                                    <div class="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-sm">
                                      <Check size={14} />
                                    </div>
                                  </Show>
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    </Show>

                  </div>

                </div>
                
                {/* Save Button (Full Width Footer) */}
                <div class="p-6 sm:p-8 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/30">
                  <div class="flex justify-end">
                    <button 
                      onClick={() => alert("Theme saved! Your wallpaper preferences have been remembered.")}
                      class="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-rose-500/20 hover:-translate-y-0.5"
                    >
                      Save Theme Preferences
                    </button>
                  </div>
                </div>
              </div>
            </Show>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
