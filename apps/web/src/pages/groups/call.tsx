import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/MainLayout';
import { PhoneOff, Loader2 } from 'lucide-solid';

export default function GroupCallPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(true);
  let jitsiContainer: HTMLDivElement | undefined;
  let api: any = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    
    const roomName = `Jemaw-GroupCall-${(params.id || '').replace(/[^a-zA-Z0-9]/g, '')}`;
    const domain = 'meet.systemli.org'; // Reliable community instance without 5min timeout
    
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer,
      userInfo: {
        displayName: 'Group Member',
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
      },
    };

    const initAPI = () => {
      api = new (window as any).JitsiMeetExternalAPI(domain, options);
      api.addEventListener('videoConferenceLeft', () => {
        navigate(`/groups/${params.id}`);
      });
      setLoading(false);
    };

    if (!(window as any).JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => initAPI();
      document.body.appendChild(script);
    } else {
      initAPI();
    }
  });

  onCleanup(() => {
    if (api) api.destroy();
  });

  return (
    <MainLayout title="Group Call">
      <div class="h-[calc(100vh-8rem)] w-full max-w-6xl mx-auto relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col mt-4">
        
        {/* Header bar */}
        <div class="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <span class="text-white font-semibold tracking-wide">Live Video Room</span>
          </div>
          <button 
            onClick={() => {
              if (api) api.executeCommand('hangup');
              else navigate(`/groups/${params.id}`);
            }}
            class="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-600/20"
          >
            <PhoneOff size={18} /> Leave Call
          </button>
        </div>
        
        {/* Jitsi iframe container */}
        <div class="flex-1 relative bg-[#2a2a2a]">
          <Show when={loading()}>
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 z-20">
              <Loader2 size={48} class="animate-spin text-indigo-500 mb-6" />
              <p class="text-lg font-medium animate-pulse">Connecting to secure video server...</p>
            </div>
          </Show>
          <div ref={jitsiContainer} class="w-full h-full"></div>
        </div>
      </div>
    </MainLayout>
  );
}
