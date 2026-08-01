import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Send, Settings, Image as ImageIcon, X, Pencil, Trash2, CornerDownLeft, Paperclip, Heart, Smile, Mic, Square, FileText, Loader2 } from 'lucide-solid';
import 'emoji-picker-element';

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      'emoji-picker': any;
    }
  }
}

const renderMessageContent = (content: string) => {
  if (!content) return '';
  
  // Basic XSS escape
  let escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Replace bold
  let html = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace Markdown Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (match, alt, url) => {
    return `<span class="block mt-2"><img src="${url}" alt="${alt}" class="max-w-full rounded-xl max-h-64 object-contain inline-block border border-black/5 dark:border-white/5" /></span>`;
  });
  
  return html;
};

export default function GroupChat() {
  const params = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = createSignal<any[]>([]);
  const [newMessage, setNewMessage] = createSignal('');
  const [currentUserId, setCurrentUserId] = createSignal('');
  const [group, setGroup] = createSignal<any>(null);
  const [profileMap, setProfileMap] = createSignal<Record<string, { full_name: string, avatar_url: string | null }>>({});
  
  // Rich Chat Input State
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const [isRecording, setIsRecording] = createSignal(false);
  const [recordingTime, setRecordingTime] = createSignal(0);
  const [isUploading, setIsUploading] = createSignal(false);
  
  let fileInputRef: HTMLInputElement | undefined;
  
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordingInterval: any;
  
  // Settings / Wallpaper state
  const [showSettings, setShowSettings] = createSignal(false);
  const [wallpaper, setWallpaper] = createSignal<string | null>(null);
  const [customBgColor, setCustomBgColor] = createSignal<string>('#ffffff'); // Default fallback

  // AI Summary State
  const [isSummarizing, setIsSummarizing] = createSignal(false);
  const [summaryResult, setSummaryResult] = createSignal<string | null>(null);

  // Latecomer Alert State
  const [latecomerAlert, setLatecomerAlert] = createSignal<{ name: string, roast: string, avatar: string } | null>(null);

  // Cinema Mode State
  const [isCinemaMode, setIsCinemaMode] = createSignal(false);
  let jitsiContainer: HTMLDivElement | undefined;
  let api: any = null;

  // Edit / Delete state
  const [editingMessageId, setEditingMessageId] = createSignal<string | null>(null);
  const [editingContent, setEditingContent] = createSignal('');
  const [contextMenuMsgId, setContextMenuMsgId] = createSignal<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });

  const PRESET_WALLPAPERS = [
    { name: 'Cinematic Rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&q=80' },
    { name: 'Neon Street', url: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=1920&q=80' },
    { name: 'Anime Street', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80' },
    { name: 'Serene Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80' },
    { name: 'Deep Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
    { name: 'Software Dev', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80' }
  ];

  let chatContainerRef: HTMLDivElement | undefined;

  createEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      setCurrentUserId(session.user.id);

      // Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(user_id)
        `)
        .eq('id', params.id)
        .single();
      
      if (groupData) {
        setGroup(groupData);
        // fetch their profiles
        if (groupData.group_members && groupData.group_members.length > 0) {
          const userIds = groupData.group_members.map((m: any) => m.user_id);
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
          const map = profiles?.reduce((acc: any, p: any) => ({ ...acc, [p.id]: { full_name: p.full_name, avatar_url: p.avatar_url } }), {}) || {};
          setProfileMap(map);
        }
      } else {
        navigate('/groups');
        return;
      }

      // Load wallpaper setting from local storage
      const savedWallpaper = localStorage.getItem(`chat_wallpaper_${params.id}`);
      if (savedWallpaper) {
        setWallpaper(savedWallpaper);
      }
      
      const savedBgColor = localStorage.getItem(`chat_bg_color_${params.id}`);
      if (savedBgColor) {
        setCustomBgColor(savedBgColor);
      }

      // Fetch initial messages
      const { data: initialMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', params.id)
        .order('created_at', { ascending: true });
        
      if (initialMessages) {
        setMessages(initialMessages);
        scrollToBottom();
      }

      // Subscribe to real-time messages (INSERT, UPDATE, DELETE)
      const channel = supabase
        .channel(`public:messages:group_id=eq.${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `group_id=eq.${params.id}`
          },
          (payload) => {
            if (payload.new.content?.startsWith('🚨 **[LAST TO ARRIVE ALERT:')) {
              // Parse the alert to show popup
              try {
                const nameMatch = payload.new.content.match(/ALERT:\s(.*?)]/);
                const name = nameMatch ? nameMatch[1] : 'Someone';
                const parts = payload.new.content.split('\n\n');
                const roast = parts[1] || 'Late as usual!';
                const avatarPart = parts[2] || '';
                const avatarMatch = avatarPart.match(/!\[Avatar\]\((.*?)\)/);
                const avatar = avatarMatch ? avatarMatch[1] : 'https://i.pravatar.cc/150?u=late';
                
                setLatecomerAlert({ name, roast, avatar });
                
                // Auto close popup after 8 seconds
                setTimeout(() => setLatecomerAlert(null), 8000);
              } catch (e) { console.error(e); }
            }

            if (payload.new.user_id === currentUserId()) return;
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `group_id=eq.${params.id}`
          },
          (payload) => {
            setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `group_id=eq.${params.id}`
          },
          (payload) => {
            setMessages((prev) => prev.map(m => m.id === payload.old.id ? { ...m, content: null, is_deleted: true } : m));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            const updatedProfile = payload.new;
            setProfileMap((prev) => {
              if (prev[updatedProfile.id]) {
                return {
                  ...prev,
                  [updatedProfile.id]: {
                    ...prev[updatedProfile.id],
                    full_name: updatedProfile.full_name,
                    avatar_url: updatedProfile.avatar_url
                  }
                };
              }
              return prev;
            });
          }
        )
        .subscribe();

      onCleanup(() => {
        supabase.removeChannel(channel);
      });
    };

    initChat();
  });

  createEffect(() => {
    if (!isCinemaMode()) {
      if (api) {
        api.dispose();
        api = null;
      }
      return;
    }
    
    const roomName = `Jemaw-GroupCall-${(params.id || '').replace(/[^a-zA-Z0-9]/g, '')}`;
    const domain = 'meet.systemli.org';
    
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer,
      userInfo: {
        displayName: profileMap()[currentUserId()]?.full_name || 'Group Member',
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
    if (api) api.dispose();
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef) {
        chatContainerRef.scrollTop = chatContainerRef.scrollHeight;
      }
    }, 100);
  };

  const sendMessageText = async (content: string, type: string = 'text') => {
    if (!content.trim()) return;

    let finalContent = content;
    if (type === 'voice') finalContent = `[VOICE_MSG]${content}`;
    if (type === 'file') finalContent = `[FILE_MSG]${content}`;

    // Optimistically add to UI immediately
    const tempMessage = {
      id: 'temp-' + Date.now(),
      group_id: params.id,
      user_id: currentUserId(),
      content: finalContent,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    // Send to database
    const { error } = await supabase.from('messages').insert([
      {
        group_id: params.id,
        user_id: currentUserId(),
        content: finalContent
      }
    ]);

    if (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const sendMessage = async (e: Event) => {
    e.preventDefault();
    if (newMessage().trim()) {
      await sendMessageText(newMessage(), 'text');
      setNewMessage('');
    }
  };

  const sendHeart = () => {
    sendMessageText('❤️', 'text');
  };

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage.from('jemaw-files').upload(fileName, file);
      if (error) {
        console.error("Upload error:", error);
        return;
      }
      
      if (data) {
        const { data: publicUrlData } = supabase.storage.from('jemaw-files').getPublicUrl(fileName);
        if (publicUrlData) {
          // Format: [filename](url)
          await sendMessageText(`[${file.name}](${publicUrlData.publicUrl})`, 'file');
        }
      }
    } finally {
      setIsUploading(false);
      // Reset input
      input.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `audio-${Date.now()}-${currentUserId()}.webm`;
        
        const { data, error } = await supabase.storage.from('jemaw-files').upload(fileName, audioBlob);
        if (data) {
          const { data: urlData } = supabase.storage.from('jemaw-files').getPublicUrl(fileName);
          sendMessageText(urlData.publicUrl, 'voice');
        } else {
          alert("Error uploading audio: " + error?.message);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) {
      alert("Microphone access denied or not available.");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        mediaRecorder?.stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.stop();
    }
    setIsRecording(false);
    clearInterval(recordingInterval);
  };

  const stopAndSendRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    clearInterval(recordingInterval);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Close context menu on any click
  const handleGlobalClick = () => setContextMenuMsgId(null);
  createEffect(() => {
    document.addEventListener('click', handleGlobalClick);
    onCleanup(() => document.removeEventListener('click', handleGlobalClick));
  });

  const openContextMenu = (e: MouseEvent, msgId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuMsgId(msgId);
  };

  const startEditing = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
    setContextMenuMsgId(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEdit = async () => {
    const msgId = editingMessageId();
    const content = editingContent().trim();
    if (!msgId || !content) return;

    // Optimistic update
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, content, is_edited: true } : m));
    cancelEditing();

    await supabase.from('messages').update({ content, is_edited: true }).eq('id', msgId);
  };

  const deleteMessage = async (msgId: string) => {
    setContextMenuMsgId(null);
    // Optimistic update — mark as deleted
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, content: null, is_deleted: true } : m));
    await supabase.from('messages').update({ content: '🚫 This message was deleted', is_deleted: true }).eq('id', msgId);
  };

  const handleWallpaperUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920; // 1080p roughly
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setWallpaper(dataUrl);
        localStorage.setItem(`chat_wallpaper_${params.id}`, dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeWallpaper = () => {
    setWallpaper(null);
    localStorage.removeItem(`chat_wallpaper_${params.id}`);
  };

  const handleSummarizeChat = async () => {
    if (messages().length === 0) {
      alert("There are no messages to summarize yet!");
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key! Please create a .env.local file with VITE_GEMINI_API_KEY to use this feature.");
      return;
    }

    setIsSummarizing(true);
    
    // Format transcript
    const transcript = messages().slice(-50).map(m => {
      const senderName = profileMap()[m.user_id] || `User ${m.user_id.substring(0,4)}`;
      const sender = m.user_id === currentUserId() ? "Me" : senderName;
      return `[${new Date(m.created_at).toLocaleTimeString()}] ${sender}: ${m.content}`;
    }).join('\n');

    const prompt = `You are a helpful AI assistant in a group chat app called Jemaw. Below is a transcript of recent messages. Please provide a brief, bulleted summary of the key decisions, events, or topics discussed. Be concise and friendly.\n\nTranscript:\n${transcript}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        let errMessage = "Failed to fetch summary from Gemini";
        try {
          const errData = await response.json();
          if (errData.error?.message) {
            errMessage = errData.error.message;
          }
        } catch (e) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      setSummaryResult(text);
      setIsSummarizing(false);
    } catch (err: any) {
      console.error(err);
      alert("Error summarizing chat: " + err.message);
      setIsSummarizing(false);
    }
  };

  const handleCinemaToggle = async () => {
    if (isCinemaMode()) {
      setIsCinemaMode(false);
    } else {
      setIsCinemaMode(true);
      await supabase.from('messages').insert({
        group_id: params.id,
        user_id: currentUserId(),
        content: "started Cinema Mode - Click here to join"
      });
    }
  };

  return (
    <div class="h-screen w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      
      {/* Cinema Mode Player (Left on desktop, Top on mobile) */}
      <Show when={isCinemaMode()}>
        <div class="w-full h-[45vh] lg:h-full lg:w-[60%] xl:w-[70%] bg-black relative flex flex-col shadow-2xl z-40 transition-all duration-500 shrink-0">
           <div class="h-10 bg-slate-900 flex items-center px-4 justify-between shrink-0 border-b border-slate-800">
             <div class="flex items-center gap-3">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span class="text-white text-xs font-bold uppercase tracking-wider">Cinema Mode</span>
             </div>
             <button onClick={() => setIsCinemaMode(false)} class="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1 rounded-md">
               <X size={16} />
             </button>
           </div>
           <div ref={jitsiContainer!} class="flex-1 w-full bg-[#2a2a2a]"></div>
        </div>
      </Show>

      {/* Chat Section */}
      <div class={`flex-1 flex flex-col h-full relative transition-all duration-500 overflow-hidden ${isCinemaMode() ? 'lg:w-[40%] xl:w-[30%]' : 'w-full'}`}>
        
        {/* Background Layer */}
      <div 
        class="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
        style={{
          "background-image": wallpaper() ? `url(${wallpaper()})` : 'none',
          "background-color": wallpaper() ? 'transparent' : customBgColor()
        }}
      >
        {/* Fallback pattern if no wallpaper */}
        <Show when={!wallpaper()}>
          <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
        </Show>
        {/* Overlay to ensure text readability if needed */}
        <div class="absolute inset-0 bg-black/5 dark:bg-black/20"></div>
      </div>

      {/* Latecomer Alert Modal */}
      <Show when={latecomerAlert()}>
        <div class="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 relative border border-slate-200 dark:border-slate-800 text-center">
            
            {/* Pulsing Alert Icon */}
            <div class="absolute -top-6 left-1/2 -translate-x-1/2">
              <div class="relative">
                <div class="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-50"></div>
                <div class="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg relative z-10 text-xl">
                  🚨
                </div>
              </div>
            </div>

            <div class="mt-8 mb-6 relative inline-block">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900 mx-auto shadow-inner">
                <img src={latecomerAlert()?.avatar} alt={latecomerAlert()?.name} class="w-full h-full object-cover" />
              </div>
              <div class="absolute -bottom-3 -right-3 text-4xl animate-bounce">🐌</div>
            </div>

            <h2 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              {latecomerAlert()?.name} IS HERE!
            </h2>
            <p class="text-sm font-semibold text-rose-500 mb-6 uppercase tracking-widest">Last to arrive</p>

            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 relative">
              <div class="absolute -top-3 left-4 text-3xl text-indigo-300 dark:text-indigo-700/50">"</div>
              <p class="text-slate-700 dark:text-slate-300 text-lg italic font-medium leading-relaxed relative z-10">
                {latecomerAlert()?.roast}
              </p>
              <div class="absolute -bottom-5 right-4 text-3xl text-indigo-300 dark:text-indigo-700/50">"</div>
            </div>

            <button 
              onClick={() => setLatecomerAlert(null)}
              class="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-sm tracking-wide"
            >
              DISMISS
            </button>
          </div>
        </div>
      </Show>

      {/* Header */}
      <div class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 relative z-20">
        <div class="flex items-center gap-4">
          <A href={`/groups/${params.id}`} class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
            <ArrowLeft size={20} />
          </A>
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">{group()?.name}</h2>
            <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time Chat
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            onClick={handleCinemaToggle}
            class={`flex items-center gap-1.5 px-3 py-1.5 ${isCinemaMode() ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'} text-white rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-105 mr-1`}
            title="Cinema Mode"
          >
            🍿 <span class="hidden sm:inline">{isCinemaMode() ? 'Close Cinema' : 'Cinema Mode'}</span>
          </button>
          <button 
            onClick={handleSummarizeChat}
            class="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-105 mr-1"
            title="Summarize Chat with AI"
          >
            ✨ <span class="hidden lg:inline">Summarize</span>
          </button>
          <A 
            href={`/groups/${params.id}/call`} 
            class="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded-xl transition-all mr-2"
            title="Join Video Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          </A>
          <div class="flex -space-x-2">
            <For each={group()?.group_members?.slice(0, 3) || []}>
              {(member: any) => {
                const profile = profileMap()[member.user_id];
                const name = profile?.full_name || member.user_id;
                return (
                  <div class="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold" title={name}>
                    {name.substring(0, 2).toUpperCase()}
                  </div>
                );
              }}
            </For>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings())}
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300 relative"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel Dropdown */}
      <Show when={showSettings()}>
        <div class="absolute top-16 right-4 sm:right-6 z-20 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Chat Settings</h3>
          
          <div class="space-y-4">
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Chat Wallpaper</p>
              <div class="flex flex-col gap-2">
                <label class="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800/50 text-sm">
                  <ImageIcon size={16} /> Upload Image
                  <input type="file" accept="image/*" class="hidden" onChange={handleWallpaperUpload} />
                </label>
                <Show when={wallpaper()}>
                  <button onClick={removeWallpaper} class="w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                    Remove Wallpaper
                  </button>
                </Show>
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Background Color</p>
              <div class="flex gap-2">
                <button onClick={() => { setCustomBgColor('#ffffff'); localStorage.setItem(`chat_bg_color_${params.id}`, '#ffffff')}} class="w-8 h-8 rounded-full bg-white border border-slate-300"></button>
                <button onClick={() => { setCustomBgColor('#f8fafc'); localStorage.setItem(`chat_bg_color_${params.id}`, '#f8fafc')}} class="w-8 h-8 rounded-full bg-slate-50 border border-slate-300"></button>
                <button onClick={() => { setCustomBgColor('#e0e7ff'); localStorage.setItem(`chat_bg_color_${params.id}`, '#e0e7ff')}} class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200"></button>
                <button onClick={() => { setCustomBgColor('#0f172a'); localStorage.setItem(`chat_bg_color_${params.id}`, '#0f172a')}} class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700"></button>
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Preset Wallpapers</p>
              <div class="grid grid-cols-3 gap-2">
                <For each={PRESET_WALLPAPERS}>
                  {(preset) => (
                    <button 
                      onClick={() => {
                        setWallpaper(preset.url);
                        localStorage.setItem(`chat_wallpaper_${params.id}`, preset.url);
                      }}
                      class={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        wallpaper() === preset.url 
                          ? 'border-indigo-500 shadow-sm' 
                          : 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} class="w-full h-full object-cover" />
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Messages Area */}
      <div 
        class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative z-10 custom-scrollbar" 
        ref={chatContainerRef}
      >
        <For each={messages()}>
          {(msg) => {
            const isMe = msg.user_id === currentUserId();
            const isDeleted = () => msg.is_deleted;
            const isEdited = () => msg.is_edited && !msg.is_deleted;
            return (
              <div class={`flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div class={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Sender ID */}
                  <Show when={!isMe}>
                    <div class="flex items-center gap-1.5 mb-1 ml-1">
                      <div class="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 shrink-0">
                        <Show when={profileMap()[msg.user_id]?.avatar_url} fallback={<img src="https://i.pravatar.cc/150?u=32" class="w-full h-full object-cover" />}>
                          <img src={profileMap()[msg.user_id]?.avatar_url || undefined} class="w-full h-full object-cover" />
                        </Show>
                      </div>
                      <span class="text-[10px] text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-full backdrop-blur-sm font-medium shadow-sm">
                        {profileMap()[msg.user_id]?.full_name || `User ${msg.user_id.substring(0, 4)}`}
                      </span>
                    </div>
                  </Show>

                  {/* Message Bubble */}
                  <Show when={editingMessageId() === msg.id} fallback={
                    <div 
                      class={`px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur-md relative group/msg ${
                        isDeleted()
                          ? 'bg-slate-200/70 dark:bg-slate-800/70 italic'
                          : isMe 
                            ? 'bg-indigo-600/90 text-white rounded-br-sm' 
                            : 'bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50 rounded-bl-sm'
                      }`}
                      onContextMenu={(e: MouseEvent) => isMe && !isDeleted() ? openContextMenu(e, msg.id) : undefined}
                      onClick={(e: MouseEvent) => {
                        if (isMe && !isDeleted() && e.detail === 2) {
                          e.preventDefault();
                          startEditing(msg);
                        }
                      }}
                    >
                      <Show when={isDeleted()} fallback={
                        <>
                          <Show when={msg.content?.startsWith('[VOICE_MSG]')}>
                            <div class="mt-2 mb-1 flex items-center justify-center">
                              <audio controls src={msg.content.replace('[VOICE_MSG]', '')} class="h-10 max-w-[200px] rounded-full custom-audio-player" />
                            </div>
                          </Show>
                          
                          <Show when={msg.content?.startsWith('[FILE_MSG]')}>
                            <div class="mt-2 mb-1">
                              <a 
                                href={msg.content.match(/\((.*?)\)/)?.[1] || msg.content.replace('[FILE_MSG]', '')} 
                                target="_blank" 
                                class="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/5 dark:border-white/5"
                              >
                                <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                  <FileText size={20} />
                                </div>
                                <span class="text-sm font-medium underline underline-offset-2 break-all line-clamp-2">
                                  {msg.content.match(/\[(.*?)\]/)?.[1] || 'Download Attachment'}
                                </span>
                              </a>
                            </div>
                          </Show>

                          <Show when={!msg.content?.startsWith('[VOICE_MSG]') && !msg.content?.startsWith('[FILE_MSG]')}>
                            <Show when={msg.content === "started Cinema Mode - Click here to join"} fallback={
                              <div class={`text-[15px] leading-relaxed break-words ${msg.content === '❤️' ? 'text-4xl' : ''}`} innerHTML={msg.content === '❤️' ? '❤️' : renderMessageContent(msg.content)}></div>
                            }>
                              <div class="mt-1 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex flex-col items-center justify-center gap-3">
                                <p class="font-bold text-rose-600 dark:text-rose-400">🍿 Cinema Mode is active!</p>
                                <button onClick={() => setIsCinemaMode(true)} class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold shadow-sm transition-transform hover:scale-105">
                                  Join Cinema
                                </button>
                              </div>
                            </Show>
                          </Show>
                          <Show when={isEdited()}>
                            <span class={`text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'} ml-1`}>(edited)</span>
                          </Show>
                        </>
                      }>
                        <div class={`flex items-center gap-1.5 text-[13px] ${isMe ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                          <Trash2 size={12} /> <span>This message was deleted</span>
                        </div>
                      </Show>

                      {/* Context menu trigger for own messages (3-dot on hover) */}
                      <Show when={isMe && !isDeleted()}>
                        <button 
                          class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50"
                          onClick={(e: MouseEvent) => { e.stopPropagation(); openContextMenu(e, msg.id); }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </button>
                      </Show>
                    </div>
                  }>
                    {/* Inline Edit Mode */}
                    <div class="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingContent()}
                        onInput={(e) => setEditingContent(e.currentTarget.value)}
                        onKeyDown={(e: KeyboardEvent) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        class="flex-1 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        autofocus
                      />
                      <button onClick={saveEdit} class="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors" title="Save">
                        <CornerDownLeft size={16} />
                      </button>
                      <button onClick={cancelEditing} class="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  </Show>
                  
                  {/* Timestamp */}
                  <span class={`text-[9px] text-slate-500 dark:text-slate-400 mt-1 drop-shadow-sm font-medium ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          }}
        </For>

        {/* Floating Context Menu */}
        <Show when={contextMenuMsgId()}>
          <div 
            class="fixed z-[200] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
            style={`left: ${contextMenuPos().x}px; top: ${contextMenuPos().y}px;`}
          >
            <button 
              onClick={() => { const msg = messages().find(m => m.id === contextMenuMsgId()); if (msg) startEditing(msg); }}
              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Pencil size={14} /> Edit
            </button>
            <button 
              onClick={() => { const id = contextMenuMsgId(); if (id) deleteMessage(id); }}
              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </Show>
      </div>

      {/* Input Area */}
      <div class="relative z-10 flex-shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 p-4">
        <div class="max-w-5xl mx-auto flex gap-3 relative">
          
          <Show when={showEmojiPicker()}>
            <div class="absolute bottom-16 right-0 z-50 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <emoji-picker 
                class="dark"
                on:emoji-click={(e: any) => {
                  setNewMessage(prev => prev + e.detail.unicode);
                  setShowEmojiPicker(false);
                }}
              ></emoji-picker>
            </div>
          </Show>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            class="hidden" 
            onChange={handleFileUpload} 
          />

          <Show when={!isRecording()} fallback={
            <div class="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-6 py-3 flex items-center justify-between">
              <div class="flex items-center gap-3 text-rose-500 animate-pulse">
                <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                <span class="font-medium">{formatRecordingTime(recordingTime())}</span>
              </div>
              <div class="flex items-center gap-4">
                <button onClick={cancelRecording} class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                  Cancel
                </button>
                <button 
                  onClick={stopAndSendRecording}
                  class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20"
                >
                  <Send size={18} class="ml-1" />
                </button>
              </div>
            </div>
          }>
            <form onSubmit={sendMessage} class="flex-1 flex gap-3 relative">
              <div class="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center px-4 relative transition-colors focus-within:ring-2 focus-within:ring-indigo-500/50">
                {/* Paperclip Attachment */}
                <button 
                  type="button" 
                  onClick={() => !isUploading() && fileInputRef?.click()}
                  disabled={isUploading()}
                  class="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                >
                  <Show when={isUploading()} fallback={<Paperclip size={20} />}>
                    <Loader2 size={20} class="animate-spin text-indigo-500" />
                  </Show>
                </button>
                
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  value={newMessage()}
                  onInput={(e) => setNewMessage(e.currentTarget.value)}
                  class="flex-1 bg-transparent border-none px-2 py-3 text-sm text-slate-900 dark:text-white focus:ring-0 outline-none placeholder:text-slate-500"
                />
                
                <div class="flex items-center gap-1 text-slate-400">
                  <button 
                    type="button" 
                    onClick={sendHeart}
                    class="p-2 hover:text-rose-500 transition-colors"
                  >
                    <Heart size={20} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker())}
                    class={`p-2 hover:text-indigo-500 transition-colors ${showEmojiPicker() ? 'text-indigo-500' : ''}`}
                  >
                    <Smile size={20} />
                  </button>
                </div>
              </div>
              
              <Show when={newMessage().trim()} fallback={
                <button 
                  type="button"
                  onClick={startRecording}
                  class="w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20"
                >
                  <Mic size={20} />
                </button>
              }>
                <button 
                  type="submit"
                  class="w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20"
                >
                  <Send size={18} class="ml-1" />
                </button>
              </Show>
            </form>
          </Show>
        </div>
      </div>

      {/* AI Summary Modal */}
      <Show when={isSummarizing() || summaryResult()}>
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex justify-between items-center shrink-0">
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                ✨ AI Chat Summary
              </h3>
              <button 
                onClick={() => { setIsSummarizing(false); setSummaryResult(null); }}
                class="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto custom-scrollbar">
              <Show when={isSummarizing()}>
                <div class="flex flex-col items-center justify-center py-10 space-y-4">
                  <div class="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                  <p class="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Gemini is reading the chat...</p>
                </div>
              </Show>
              <Show when={!isSummarizing() && summaryResult()}>
                <div class="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                  <For each={summaryResult()!.split('\n')}>
                    {(line) => (
                      <p class="mb-2 leading-relaxed min-h-[1rem]">
                        {line.startsWith('*') || line.startsWith('-') ? (
                          <span class="flex gap-2"><span class="text-indigo-500 mt-1">•</span> <span innerHTML={line.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')} /></span>
                        ) : (
                          <span innerHTML={line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')} />
                        )}
                      </p>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Show>
      
      </div>
    </div>
  );
}
