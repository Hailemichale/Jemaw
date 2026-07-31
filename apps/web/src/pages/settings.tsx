import { createSignal, Show } from 'solid-js';
import MainLayout from '../components/MainLayout';
import { wallpaper, setWallpaper } from '../store/theme';
import { Image, Monitor, Link as LinkIcon, Upload, Check } from 'lucide-solid';

export default function SettingsPage() {
  const [urlInput, setUrlInput] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<'default' | 'upload' | 'url'>('default');

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
        
        // Compress to JPEG with 0.7 quality to save space
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
      <div class="max-w-4xl mx-auto pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div class="mb-10">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Appearance</h1>
          <p class="text-slate-600 dark:text-slate-400 text-lg">Customize how Jemaw looks on your device.</p>
        </div>

        <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
          
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
                onClick={() => { setActiveTab('default'); resetToDefault(); }}
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
                onClick={() => setActiveTab('upload')}
                class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  activeTab() === 'upload' 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div class={`p-2 rounded-xl ${activeTab() === 'upload' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Upload size={20} />
                </div>
                <div>
                  <h3 class="font-semibold">Local Upload</h3>
                  <p class="text-xs opacity-80 mt-0.5">From your device</p>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('url')}
                class={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  activeTab() === 'url' 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div class={`p-2 rounded-xl ${activeTab() === 'url' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
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
              
              <Show when={activeTab() === 'default'}>
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

              <Show when={activeTab() === 'upload'}>
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

              <Show when={activeTab() === 'url'}>
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

            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
