import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import MainLayout from '../components/MainLayout';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, List, Image as ImageIcon, MessageSquare, Loader2, Play, Megaphone } from 'lucide-solid';
import { supabase } from '../lib/supabase';
import { useNavigate } from '@solidjs/router';
import LiveTracker from '../components/LiveTracker';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = createSignal('');
  
  // Views & Data
  const [viewMode, setViewMode] = createSignal<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [events, setEvents] = createSignal<any[]>([]);
  const [groups, setGroups] = createSignal<any[]>([]);
  
  // Create Event Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [date, setDate] = createSignal('');
  const [groupId, setGroupId] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Event Detail / Memory Box Modal
  const [selectedEvent, setSelectedEvent] = createSignal<any>(null);
  const [memories, setMemories] = createSignal<any[]>([]);
  const [newThought, setNewThought] = createSignal('');
  const [isUploadingMemory, setIsUploadingMemory] = createSignal(false);
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const [showGifPicker, setShowGifPicker] = createSignal(false);

  // AI Features State
  const [isAnnouncing, setIsAnnouncing] = createSignal<string | null>(null); // Stores event ID being announced
  
  // Slideshow State
  const [slideshowEvent, setSlideshowEvent] = createSignal<any>(null);
  const [slideshowPhotos, setSlideshowPhotos] = createSignal<any[]>([]);
  const [slideshowCaptions, setSlideshowCaptions] = createSignal<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = createSignal(0);
  const [isGeneratingSlideshow, setIsGeneratingSlideshow] = createSignal(false);
  const [slideshowTimer, setSlideshowTimer] = createSignal<any>(null);

  const FUN_GIFS = [
    'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    'https://media.giphy.com/media/l0HlOBZcl7mbV6VgI/giphy.gif',
    'https://media.giphy.com/media/xT0xeJpnrWC4XWblWQ/giphy.gif',
    'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
    'https://media.giphy.com/media/3o6ozh46EBu2EQvzws/giphy.gif',
    'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
    'https://media.giphy.com/media/l2JIdnF6aJnAqzDgY/giphy.gif',
    'https://media.giphy.com/media/xUPGcxpCV81ebhq7cI/giphy.gif'
  ];

  const handlePostGif = async (gifUrl: string) => {
    const event = selectedEvent();
    if (!event) return;
    
    setIsUploadingMemory(true);
    const { error } = await supabase.from('event_memories').insert({
      event_id: event.id,
      user_id: currentUserId(),
      memory_type: 'photo',
      content: gifUrl
    });

    if (!error) {
      fetchMemories(event.id);
    } else {
      alert("Failed to post GIF: " + error.message);
    }
    setIsUploadingMemory(false);
    setShowGifPicker(false);
  };

  const fetchEvents = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setCurrentUserId(session.user.id);

    // 1. Get user's groups
    const { data: userGroups } = await supabase
      .from('groups')
      .select(`id, name, group_members!inner(user_id)`)
      .eq('group_members.user_id', session.user.id);

    if (userGroups) {
      setGroups(userGroups);
      const groupIds = userGroups.map((g: any) => g.id);

      // 2. Fetch events for those groups
      if (groupIds.length > 0) {
        const { data: groupEvents } = await supabase
          .from('events')
          .select('*, groups(name)')
          .in('group_id', groupIds)
          .order('date', { ascending: true });
        
        if (groupEvents) setEvents(groupEvents);
      }
    }
  };

  createEffect(() => {
    fetchEvents();
  });

  // Fetch memories when an event is selected
  createEffect(() => {
    const event = selectedEvent();
    if (event && isEventPast(event.date)) {
      fetchMemories(event.id);
    } else {
      setMemories([]);
    }
  });

  const fetchMemories = async (eventId: string) => {
    const { data } = await supabase
      .from('event_memories')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (data) setMemories(data);
  };

  const handleCreateEvent = async (e: Event) => {
    e.preventDefault();
    if (!title() || !date() || !groupId()) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('events').insert({
      title: title(),
      date: date(),
      group_id: groupId(),
      created_by: currentUserId()
    });

    setIsSubmitting(false);
    if (!error) {
      setIsCreateModalOpen(false);
      setTitle('');
      setDate('');
      fetchEvents();
    } else {
      alert('Error creating event: ' + error.message);
    }
  };

  const handleAddThought = async (e: Event) => {
    e.preventDefault();
    if (!newThought().trim() || !selectedEvent()) return;
    
    const event = selectedEvent();
    setIsUploadingMemory(true);
    
    const { error } = await supabase.from('event_memories').insert({
      event_id: event.id,
      user_id: currentUserId(),
      memory_type: 'thought',
      content: newThought().trim()
    });

    if (!error) {
      setNewThought('');
      fetchMemories(event.id);
    } else {
      alert("Failed to save thought: " + error.message);
    }
    setIsUploadingMemory(false);
  };

  const handleMemoryPhotoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !selectedEvent()) return;

    const event = selectedEvent();
    setIsUploadingMemory(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `memories/${event.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('jemaw-files')
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('jemaw-files')
        .getPublicUrl(fileName);
        
      const { error: dbError } = await supabase.from('event_memories').insert({
        event_id: event.id,
        user_id: currentUserId(),
        memory_type: 'photo',
        content: publicUrlData.publicUrl
      });

      if (dbError) throw new Error(dbError.message);

      fetchMemories(event.id);
    } catch (err: any) {
      alert("Failed to upload photo: " + err.message);
    } finally {
      setIsUploadingMemory(false);
    }
  };

  const handleAnnounceEvent = async (event: any, e: Event) => {
    e.stopPropagation();
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key! Please add VITE_GEMINI_API_KEY to your .env.local file.");
      return;
    }

    setIsAnnouncing(event.id);
    const prompt = `Write a super energetic, highly attractive, and fun 2-sentence announcement for an upcoming group event called "${event.title}" happening on ${new Date(event.date).toLocaleDateString()}. Use lots of emojis. Do not use quotes. Get everyone hyped!`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error("Failed to generate announcement");
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      const randomGif = FUN_GIFS[Math.floor(Math.random() * FUN_GIFS.length)];
      const messageContent = `${text}\n\n![Hype GIF](${randomGif})`;

      const { error } = await supabase.from('messages').insert({
        group_id: event.group_id,
        user_id: currentUserId(),
        content: messageContent
      });

      if (error) throw error;
      
      alert("✅ Announcement and GIF posted to the group chat!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsAnnouncing(null);
    }
  };

  const startSlideshow = () => {
    if (slideshowTimer()) clearInterval(slideshowTimer());
    setCurrentSlideIndex(0);
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        if (prev >= slideshowPhotos().length - 1) {
          clearInterval(timer);
          setTimeout(() => closeSlideshow(), 2000); // Close shortly after last slide
          return prev;
        }
        return prev + 1;
      });
    }, 4000); // 4 seconds per slide
    setSlideshowTimer(timer);
  };

  const closeSlideshow = () => {
    if (slideshowTimer()) clearInterval(slideshowTimer());
    setSlideshowEvent(null);
    setSlideshowPhotos([]);
    setSlideshowCaptions([]);
  };

  const handlePlayAiMemory = async () => {
    const event = selectedEvent();
    if (!event) return;
    
    const photos = memories().filter(m => m.memory_type === 'photo');
    if (photos.length === 0) {
      alert("Upload some photos to this memory box first!");
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key!");
      return;
    }

    setIsGeneratingSlideshow(true);

    const prompt = `We are creating a nostalgic slideshow for a past event called "${event.title}". There are ${photos.length} photos in the album. Generate exactly ${photos.length} short, poetic, and heartwarming captions (one for each photo). Separate each caption exactly by a double newline (\\n\\n). Do NOT use bullet points or numbers. Make it sound like a beautiful memory.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error("Failed to generate captions");
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      let captions = text.split('\n\n').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      
      // Fallback if AI didn't format correctly
      while (captions.length < photos.length) captions.push("A beautiful moment...");
      
      setSlideshowPhotos(photos);
      setSlideshowCaptions(captions);
      setSlideshowEvent(event);
      
      startSlideshow();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGeneratingSlideshow(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const nextMonth = () => setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() - 1, 1));

  const openCreateModalForDay = (day: number) => {
    const d = new Date(currentDate().getFullYear(), currentDate().getMonth(), day);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
    setDate(localISOTime);
    setIsCreateModalOpen(true);
  };

  const isEventPast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(dateStr);
    return eventDate < today;
  };

  const upcomingEvents = () => events().filter(e => !isEventPast(e.date));
  const pastEvents = () => events().filter(e => isEventPast(e.date)).reverse();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <MainLayout title="Calendar">
      <div class="max-w-6xl mx-auto pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Create Event Modal */}
        <Show when={isCreateModalOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsCreateModalOpen(false)} class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">New Event</h2>
              
              <form onSubmit={handleCreateEvent} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                  <input type="text" required value={title()} onInput={(e) => setTitle(e.currentTarget.value)} placeholder="e.g. Dinner Party" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input type="date" required value={date()} onInput={(e) => setDate(e.currentTarget.value)} class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group</label>
                  <select required value={groupId()} onChange={(e) => setGroupId(e.currentTarget.value)} class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none">
                    <option value="" disabled>Select a group...</option>
                    <For each={groups()}>{(group) => <option value={group.id}>{group.name}</option>}</For>
                  </select>
                </div>
                <div class="pt-4 mt-2">
                  <button type="submit" disabled={isSubmitting()} class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50">
                    {isSubmitting() ? 'Saving...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        {/* Event Detail / Memory Box Modal */}
        <Show when={selectedEvent()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 overflow-hidden">
              
              <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedEvent().title}</h2>
                  <div class="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span class="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(selectedEvent().date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span class="text-indigo-600 dark:text-indigo-400">{selectedEvent().groups?.name}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                <Show when={isEventPast(selectedEvent().date)} fallback={
                  <div class="flex flex-col items-center justify-center py-10 text-center">
                    <div class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon size={32} />
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Upcoming Event!</h3>
                    <p class="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                      Once this event passes, this space will turn into a Memory Box where you can upload photos and share thoughts from the day.
                    </p>
                    
                    {/* Live Tracker only active on the day of the event */}
                    <Show when={new Date(selectedEvent().date).toDateString() === new Date().toDateString()}>
                      <div class="w-full text-left">
                        <LiveTracker 
                          eventId={selectedEvent().id} 
                          groupId={selectedEvent().group_id} 
                          currentUserId={currentUserId()} 
                        />
                      </div>
                    </Show>
                  </div>
                }>
                  {/* Memory Box UI */}
                  <div>
                    <div class="flex items-center justify-between mb-6">
                      <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon class="text-rose-500" size={24} />
                        Memory Gallery
                      </h3>
                      
                      {/* Photo Upload Button */}
                      <label class="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        {isUploadingMemory() ? <Loader2 size={16} class="animate-spin" /> : <Plus size={16} />}
                        Add Photo
                        <input type="file" accept="image/*" class="hidden" onChange={handleMemoryPhotoUpload} disabled={isUploadingMemory()} />
                      </label>
                    </div>

                    <div class="mb-6">
                      <button 
                        onClick={handlePlayAiMemory}
                        disabled={isGeneratingSlideshow()}
                        class="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        <Show when={isGeneratingSlideshow()} fallback={<><Play size={18} fill="currentColor" /> Play AI Memory Slideshow</>}>
                          <Loader2 size={18} class="animate-spin" /> Generating Magic...
                        </Show>
                      </button>
                    </div>

                    {/* Memories Grid/Feed */}
                    <Show when={memories().length > 0} fallback={
                      <div class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 border-dashed dark:border-slate-800 mb-6">
                        <p class="text-slate-500 dark:text-slate-400">No memories shared yet. Be the first!</p>
                      </div>
                    }>
                      <div class="columns-1 sm:columns-2 gap-4 mb-6 space-y-4">
                        <For each={memories()}>
                          {(memory) => (
                            <div class="break-inside-avoid bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                              <Show when={memory.memory_type === 'photo'}>
                                <img src={memory.content} class="w-full rounded-xl" alt="Memory" />
                              </Show>
                              <Show when={memory.memory_type === 'thought'}>
                                <div class="p-4 sm:p-5">
                                  <MessageSquare class="text-indigo-500 mb-3" size={20} />
                                  <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    {/* Write a Thought Box */}
                    <div class="relative mt-2">
                      {/* Emoji Picker Popover */}
                      <Show when={showEmojiPicker()}>
                        <div class="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 w-64 z-20 animate-in slide-in-from-bottom-2">
                          <div class="grid grid-cols-5 gap-2">
                            <For each={['😂','❤️','😍','🔥','🎉','🥺','😊','😭','✨','🥰','👏','🙌','👍','🤔','😎']}>
                              {(emoji) => (
                                <button type="button" onClick={() => setNewThought(prev => prev + emoji)} class="text-xl hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                                  {emoji}
                                </button>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>

                      {/* GIF Picker Popover */}
                      <Show when={showGifPicker()}>
                        <div class="absolute bottom-full mb-2 left-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 w-72 z-20 animate-in slide-in-from-bottom-2">
                          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">Default Reactions</div>
                          <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            <For each={[
                              'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
                              'https://media.giphy.com/media/l0HlOBZcl7mbV6VgI/giphy.gif',
                              'https://media.giphy.com/media/xT0xeJpnrWC4XWblWQ/giphy.gif',
                              'https://media.giphy.com/media/l2JIdnF6aJnAqzDgY/giphy.gif',
                              'https://media.giphy.com/media/xUPGcxpCV81ebhq7cI/giphy.gif'
                            ]}>
                              {(gif) => (
                                <button type="button" onClick={() => handlePostGif(gif)} class="rounded-lg overflow-hidden border border-transparent hover:border-indigo-500 transition-all focus:outline-none">
                                  <img src={gif} class="w-full h-20 object-cover" alt="GIF" />
                                </button>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>

                      <form onSubmit={handleAddThought} class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-3 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all relative z-10">
                        <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker()); setShowGifPicker(false); }} class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors" title="Add Emoji">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                        </button>
                        <button type="button" onClick={() => { setShowGifPicker(!showGifPicker()); setShowEmojiPicker(false); }} class="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors font-bold text-xs" title="Add GIF">
                          GIF
                        </button>
                        
                        <input 
                          type="text" 
                          value={newThought()}
                          onInput={(e) => setNewThought(e.currentTarget.value)}
                          onFocus={() => { setShowEmojiPicker(false); setShowGifPicker(false); }}
                          placeholder="Write a memory..." 
                          class="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-2"
                          disabled={isUploadingMemory()}
                        />
                        <button 
                          type="submit"
                          disabled={!newThought().trim() || isUploadingMemory()}
                          class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <Show when={isUploadingMemory()} fallback="Post">
                            <Loader2 size={16} class="animate-spin" />
                          </Show>
                        </button>
                      </form>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Header Controls */}
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          
          <div class="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-1 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <button 
              onClick={() => setViewMode('calendar')} 
              class={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode() === 'calendar' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <CalendarIcon size={16} /> Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              class={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode() === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <List size={16} /> List & Memories
            </button>
          </div>
          
          <button 
            onClick={() => { setDate(''); setIsCreateModalOpen(true); }}
            class="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-rose-600/20 transition-colors"
          >
            <Plus size={18} /> New Event
          </button>
        </div>

        {/* Dynamic View rendering */}
        <Show when={viewMode() === 'calendar'}>
          <div class="mb-4 flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm max-w-sm mx-auto sm:mx-0">
            <button onClick={prevMonth} class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
              <ChevronLeft size={20} />
            </button>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white text-center flex-1">
              {monthNames[currentDate().getMonth()]} {currentDate().getFullYear()}
            </h2>
            <button onClick={nextMonth} class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
              <ChevronRight size={20} />
            </button>
          </div>

          <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
            <div class="grid grid-cols-7 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50">
              {dayNames.map(day => (
                <div class="py-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">{day}</div>
              ))}
            </div>

            <div class="grid grid-cols-7 auto-rows-[140px] divide-y divide-x divide-slate-200/50 dark:divide-slate-800/50 bg-slate-100/50 dark:bg-slate-900/50">
              {Array.from({ length: getFirstDayOfMonth(currentDate().getFullYear(), currentDate().getMonth()) }).map(() => (
                <div class="bg-slate-50/30 dark:bg-slate-950/30 p-2"></div>
              ))}
              
              {Array.from({ length: getDaysInMonth(currentDate().getFullYear(), currentDate().getMonth()) }).map((_, i) => {
                const day = i + 1;
                const d = new Date(currentDate().getFullYear(), currentDate().getMonth(), day);
                const isToday = d.toDateString() === new Date().toDateString();
                const tzoffset = d.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
                
                const dayEvents = events().filter(e => e.date === localISOTime);

                return (
                  <div class={`p-2 transition-colors hover:bg-white/40 dark:hover:bg-slate-800/40 relative group flex flex-col ${isToday ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                    <div class="flex justify-between items-start mb-1">
                      <span class={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${isToday ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                      </span>
                      <button onClick={() => openCreateModalForDay(day)} class="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all text-slate-400">
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      <For each={dayEvents}>
                        {(event) => {
                          const past = isEventPast(event.date);
                          return (
                            <div 
                              onClick={() => setSelectedEvent(event)}
                              class={`px-2 py-1.5 text-xs rounded-md border cursor-pointer transition-colors shadow-sm ${
                                past 
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40' 
                                  : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                              }`}
                            >
                              <div class="font-semibold truncate">{event.title}</div>
                              <div class="text-[10px] opacity-80 truncate">{event.groups?.name}</div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Show>

        <Show when={viewMode() === 'list'}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Upcoming Events */}
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CalendarIcon class="text-indigo-500" size={20} /> Upcoming Events
              </h2>
              <div class="space-y-3">
                <Show when={upcomingEvents().length > 0} fallback={<div class="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">No upcoming events. Schedule something!</div>}>
                  <For each={upcomingEvents()}>
                    {(event) => (
                      <div onClick={() => setSelectedEvent(event)} class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group relative">
                        <div class="flex justify-between items-start mb-2 pr-10">
                          <h3 class="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                          <span class="text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CalendarIcon size={14} /> {event.groups?.name}</p>
                        
                        <div class="absolute right-4 bottom-4">
                          <button 
                            onClick={(e) => handleAnnounceEvent(event, e)}
                            disabled={isAnnouncing() === event.id}
                            class="p-2 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                            title="Announce to Chat"
                          >
                            <Show when={isAnnouncing() === event.id} fallback={<Megaphone size={16} />}>
                              <Loader2 size={16} class="animate-spin" />
                            </Show>
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>

            {/* Past Events (Memories) */}
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon class="text-amber-500" size={20} /> Past Memories
              </h2>
              <div class="space-y-3">
                <Show when={pastEvents().length > 0} fallback={<div class="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">No memories yet.</div>}>
                  <For each={pastEvents()}>
                    {(event) => (
                      <div onClick={() => setSelectedEvent(event)} class="bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-md border border-amber-200/50 dark:border-amber-800/50 p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
                        <div class="flex justify-between items-start mb-2">
                          <h3 class="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{event.title}</h3>
                          <span class="text-xs font-semibold bg-white dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CalendarIcon size={14} /> {event.groups?.name}</p>
                        <div class="mt-4 pt-3 border-t border-amber-200/50 dark:border-amber-800/50 text-xs font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-1">
                          Click to view or add memories 📸
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>

          </div>
        </Show>

      </div>
      
      {/* Fullscreen AI Slideshow Player */}
      <Show when={slideshowEvent() && slideshowPhotos().length > 0}>
        <div class="fixed inset-0 z-[200] bg-black flex flex-col justify-between animate-in fade-in duration-500">
          
          <div class="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
            <div>
              <h2 class="text-white text-2xl font-bold font-serif">{slideshowEvent().title}</h2>
              <p class="text-white/70 text-sm">{slideshowEvent().groups?.name}</p>
            </div>
            <button onClick={closeSlideshow} class="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors">
              <X size={24} />
            </button>
          </div>

          <div class="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* The Photos */}
            <For each={slideshowPhotos()}>
              {(photo, index) => (
                <img 
                  src={photo.content} 
                  class={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${index() === currentSlideIndex() ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                  style="transition: opacity 1s ease-in-out, transform 4s ease-out;"
                  alt="Memory slide"
                />
              )}
            </For>
            
            {/* The Caption */}
            <div class="absolute bottom-16 left-0 right-0 p-8 text-center z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p class="text-white text-xl md:text-3xl font-serif font-medium leading-relaxed drop-shadow-xl max-w-4xl mx-auto transition-all duration-500">
                {slideshowCaptions()[currentSlideIndex()] || "A beautiful memory..."}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div class="absolute top-0 left-0 right-0 h-1 flex gap-1 z-20 px-2 pt-2">
            <For each={slideshowPhotos()}>
              {(_, index) => (
                <div class="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div class={`h-full bg-white transition-all duration-[4000ms] ease-linear ${index() < currentSlideIndex() ? 'w-full' : index() === currentSlideIndex() ? 'w-full' : 'w-0'}`} style={index() === currentSlideIndex() ? '' : 'transition: none;'}></div>
                </div>
              )}
            </For>
          </div>

        </div>
      </Show>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 4px; }
      `}</style>
    </MainLayout>
  );
}
