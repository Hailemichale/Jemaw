import { createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/MainLayout';
import { Users, ArrowRight } from 'lucide-solid';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [name, setName] = createSignal('');
  const [errorMsg, setErrorMsg] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const handleCreateGroup = async (e: Event) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name: name(), invite_code: inviteCode, created_by: user.id })
        .select()
        .single();

      if (groupError || !group) {
        throw new Error(groupError?.message || 'Failed to create group');
      }

      // 2. Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

      if (memberError) {
        throw new Error(memberError.message || 'Failed to add admin member');
      }

      // Success
      navigate('/', { replace: true });

    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Create Group">
      <div class="max-w-2xl mx-auto w-full pt-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Header Section */}
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm border border-indigo-200 dark:border-indigo-800">
            <Users size={32} />
          </div>
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Start something new
          </h1>
          <p class="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Create a dedicated space to manage events, track expenses, and share moments with your favorite people.
          </p>
        </div>

        {/* Form Card */}
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          
          <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div class="p-8 sm:p-12 relative z-10">
            <form onSubmit={handleCreateGroup} class="space-y-8">
              
              <Show when={errorMsg()}>
                <div class="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in">
                  {errorMsg()}
                </div>
              </Show>

              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" for="name">
                  What should we call this group?
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="block w-full rounded-2xl border-0 py-4 pl-5 pr-5 text-lg text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 bg-slate-50 dark:bg-slate-950 transition-all"
                  placeholder="e.g., Weekend Ski Trip 🏂"
                />
              </div>
              
              <div class="flex items-center gap-4 pt-4">
                <A 
                  href="/" 
                  class="flex-1 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  Cancel
                </A>
                <button
                  type="submit"
                  disabled={loading()}
                  class="flex-2 flex items-center justify-center gap-2 py-4 px-8 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ "flex": "2" }}
                >
                  <Show 
                    when={!loading()} 
                    fallback={
                      <div class="flex items-center gap-2">
                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </div>
                    }
                  >
                    Create Group <ArrowRight size={18} />
                  </Show>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
