import { createSignal, createEffect, For, Show } from 'solid-js';
import MainLayout from '../components/MainLayout';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, MapPin, AlignLeft } from 'lucide-solid';
import { supabase } from '../lib/supabase';
import { useNavigate } from '@solidjs/router';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [events, setEvents] = createSignal<any[]>([]);
  const [groups, setGroups] = createSignal<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [date, setDate] = createSignal('');
  const [groupId, setGroupId] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const fetchEvents = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

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
          .in('group_id', groupIds);
        
        if (groupEvents) setEvents(groupEvents);
      }
    }
  };

  createEffect(() => {
    fetchEvents();
  });

  const handleCreateEvent = async (e: Event) => {
    e.preventDefault();
    if (!title() || !date() || !groupId()) return;
    
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('events').insert({
      title: title(),
      date: date(),
      group_id: groupId(),
      created_by: session?.user.id
    });

    setIsSubmitting(false);
    if (!error) {
      setIsModalOpen(false);
      setTitle('');
      setDate('');
      fetchEvents(); // Refresh events
    } else {
      alert('Error creating event: ' + error.message);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() - 1, 1));
  };

  const openModalForDay = (day: number) => {
    const d = new Date(currentDate().getFullYear(), currentDate().getMonth(), day);
    // Format to YYYY-MM-DD
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
    setDate(localISOTime);
    setIsModalOpen(true);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <MainLayout title="Calendar">
      <div class="max-w-6xl mx-auto pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Create Event Modal */}
        <Show when={isModalOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsModalOpen(false)}
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">New Event</h2>
              
              <form onSubmit={handleCreateEvent} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                  <input 
                    type="text" 
                    required
                    value={title()}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                    placeholder="e.g. Dinner Party"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={date()}
                    onInput={(e) => setDate(e.currentTarget.value)}
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group</label>
                  <select 
                    required
                    value={groupId()}
                    onChange={(e) => setGroupId(e.currentTarget.value)}
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                  >
                    <option value="" disabled>Select a group...</option>
                    <For each={groups()}>
                      {(group) => <option value={group.id}>{group.name}</option>}
                    </For>
                  </select>
                </div>
                
                <div class="pt-4 mt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting()}
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isSubmitting() ? 'Saving...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        {/* Header Controls */}
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div class="flex items-center gap-4">
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
              {monthNames[currentDate().getMonth()]} {currentDate().getFullYear()}
            </h1>
            <div class="flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <button onClick={prevMonth} class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} class="px-3 py-1.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-700 dark:text-slate-200">
                Today
              </button>
              <button onClick={nextMonth} class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => { setDate(''); setIsModalOpen(true); }}
            class="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-rose-600/20 transition-colors"
          >
            <Plus size={18} /> New Event
          </button>
        </div>

        {/* Calendar Grid */}
        <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
          
          {/* Day Headers */}
          <div class="grid grid-cols-7 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50">
            {dayNames.map(day => (
              <div class="py-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div class="grid grid-cols-7 auto-rows-[140px] divide-y divide-x divide-slate-200/50 dark:divide-slate-800/50 bg-slate-100/50 dark:bg-slate-900/50">
            
            {/* Empty prefix cells */}
            {Array.from({ length: getFirstDayOfMonth(currentDate().getFullYear(), currentDate().getMonth()) }).map(() => (
              <div class="bg-slate-50/30 dark:bg-slate-950/30 p-2"></div>
            ))}
            
            {/* Day cells */}
            {Array.from({ length: getDaysInMonth(currentDate().getFullYear(), currentDate().getMonth()) }).map((_, i) => {
              const day = i + 1;
              const isToday = 
                day === new Date().getDate() && 
                currentDate().getMonth() === new Date().getMonth() && 
                currentDate().getFullYear() === new Date().getFullYear();
                
              // Format current day to check against event dates (YYYY-MM-DD)
              const d = new Date(currentDate().getFullYear(), currentDate().getMonth(), day);
              const tzoffset = d.getTimezoneOffset() * 60000;
              const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
              
              const dayEvents = events().filter(e => e.date === localISOTime);

              return (
                <div 
                  class={`p-2 transition-colors hover:bg-white/40 dark:hover:bg-slate-800/40 relative group flex flex-col ${isToday ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}
                >
                  <div class="flex justify-between items-start mb-1">
                    <span class={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${isToday ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </span>
                    <button 
                      onClick={() => openModalForDay(day)}
                      class="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all text-slate-400"
                      title="Add event on this day"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {/* Events list for this day */}
                  <div class="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    <For each={dayEvents}>
                      {(event) => (
                        <div class="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-md border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors shadow-sm">
                          <div class="font-semibold truncate">{event.title}</div>
                          <div class="text-[10px] opacity-80 truncate">{event.groups?.name}</div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
      `}</style>
    </MainLayout>
  );
}
