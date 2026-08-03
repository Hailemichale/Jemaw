import { createSignal, createEffect, Show, For } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/MainLayout';
import { Users, Settings, Activity, ArrowLeft, X, Copy, Trash2, DollarSign, Calendar as CalendarIcon, FileText } from 'lucide-solid';

export default function GroupDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);
  const [currentUserId, setCurrentUserId] = createSignal('');
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = createSignal(false);
  
  // Settings state
  const [copied, setCopied] = createSignal(false);
  const [avatarInput, setAvatarInput] = createSignal('');
  const [localAvatar, setLocalAvatar] = createSignal<string | null>(null);

  // Expense form state
  const [expenseDesc, setExpenseDesc] = createSignal('');
  const [expenseAmount, setExpenseAmount] = createSignal('');
  const [expenseCurrency, setExpenseCurrency] = createSignal('USD');
  const [isSubmittingExpense, setIsSubmittingExpense] = createSignal(false);

  // Edit Expense form state
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = createSignal(false);
  const [editExpenseId, setEditExpenseId] = createSignal('');
  const [editExpenseDesc, setEditExpenseDesc] = createSignal('');
  const [editExpenseAmount, setEditExpenseAmount] = createSignal('');
  const [editExpenseCurrency, setEditExpenseCurrency] = createSignal('USD');
  const [isUpdatingExpense, setIsUpdatingExpense] = createSignal(false);

  // Feed state
  const [feed, setFeed] = createSignal<any[]>([]);
  const [expenses, setExpenses] = createSignal<any[]>([]);

  // Compute expense splits
  const expenseSummary = () => {
    const members = group()?.group_members || [];
    const exps = expenses();
    if (members.length === 0 || exps.length === 0) return null;

    const total = exps.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const perPerson = total / members.length;

    // Calculate net balance per user: positive = overpaid (is owed), negative = underpaid (owes)
    const balances: Record<string, number> = {};
    const nameMap: Record<string, string> = {};
    members.forEach((m: any) => {
      balances[m.user_id] = 0;
      nameMap[m.user_id] = m.full_name || `User ${m.user_id?.substring(0, 4)}`;
    });

    exps.forEach((e: any) => {
      if (balances[e.paid_by] !== undefined) {
        balances[e.paid_by] += e.amount || 0;
      }
    });

    // Net balance = what they paid - their fair share
    Object.keys(balances).forEach(uid => {
      balances[uid] = balances[uid] - perPerson;
    });

    // Simplify debts: people who owe pay people who are owed
    const debtors = Object.entries(balances)
      .filter(([, b]) => b < -0.01)
      .map(([uid, b]) => ({ uid, amount: -b }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([, b]) => b > 0.01)
      .map(([uid, b]) => ({ uid, amount: b }))
      .sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
      if (transfer > 0.01) {
        settlements.push({
          from: nameMap[debtors[di].uid],
          to: nameMap[creditors[ci].uid],
          amount: Math.round(transfer * 100) / 100
        });
      }
      debtors[di].amount -= transfer;
      creditors[ci].amount -= transfer;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }

    return { total, perPerson, settlements, memberCount: members.length };
  };

  const fetchFeed = async () => {
    // Fetch expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', params.id);
      
    // Fetch activities
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .eq('group_id', params.id);

    const rawExpenses = expensesData || [];
    const rawActivities = activitiesData || [];
    setExpenses(rawExpenses);

    // Standardize to a common timeline format
    const timeline = [
      ...rawExpenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: e.description,
        amount: e.amount,
        user_id: e.paid_by,
        created_at: e.created_at,
        raw_expense: e
      })),
      ...rawActivities.map(a => ({
        id: a.id,
        type: a.action_type,
        title: a.description,
        user_id: a.user_id,
        created_at: a.created_at
      }))
    ];

    timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch names for feed
    const userIds = [...new Set(timeline.map(t => t.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    const profileMap = profiles?.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name }), {}) || {};
    
    const timelineWithNames = timeline.map(t => ({
      ...t,
      full_name: profileMap[t.user_id] || `User ${t.user_id?.substring(0,4)}`
    }));

    setFeed(timelineWithNames);
  };

  createEffect(() => {
    const fetchGroup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      setCurrentUserId(session.user.id);

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

      // Fetch names for members
      const userIds = groupData.group_members.map((m: any) => m.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = profiles?.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name }), {}) || {};
      
      groupData.group_members = groupData.group_members.map((m: any) => ({
        ...m,
        full_name: profileMap[m.user_id] || `User ${m.user_id?.substring(0, 4)}`
      }));

      setGroup(groupData);
      
      const savedAvatar = localStorage.getItem(`group_avatar_${groupData.id}`);
      if (savedAvatar) setLocalAvatar(savedAvatar);

      await fetchFeed();
      setLoading(false);
    };

    fetchGroup();
  });

  const isAdmin = () => {
    return group()?.group_members?.find((m: any) => m.user_id === currentUserId())?.role === 'admin';
  };

  const saveAvatar = (data: string) => {
    if (!group()) return;
    try {
      localStorage.setItem(`group_avatar_${group()?.id}`, data);
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
        
        saveAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group()?.invite_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddExpense = async (e: Event) => {
    e.preventDefault();
    if (!expenseDesc() || !expenseAmount() || isSubmittingExpense()) return;
    
    setIsSubmittingExpense(true);
    
    const amount = parseFloat(expenseAmount());
    const finalDesc = `${expenseDesc()} (${expenseCurrency()})`;

    // 1. Insert into expenses table
    await supabase.from('expenses').insert([{
      group_id: group()?.id,
      description: finalDesc,
      amount: amount,
      paid_by: currentUserId()
    }]);

    // 2. Insert into activities table (for feed)
    await supabase.from('activities').insert([{
      group_id: group()?.id,
      user_id: currentUserId(),
      action_type: 'expense',
      description: `added an expense of ${amount.toFixed(2)} ${expenseCurrency()} for ${expenseDesc()}`
    }]);

    await fetchFeed();
    
    setExpenseDesc('');
    setExpenseAmount('');
    setIsExpenseModalOpen(false);
    setIsSubmittingExpense(false);
  };

  const openEditExpense = (expense: any) => {
    setEditExpenseId(expense.id);
    // Try to parse out the currency from description if it was added automatically
    let desc = expense.description || '';
    let curr = 'USD';
    const match = desc.match(/\((USD|ETB|EUR|GBP)\)$/);
    if (match) {
      curr = match[1];
      desc = desc.replace(/\s*\((USD|ETB|EUR|GBP)\)$/, '');
    }
    setEditExpenseDesc(desc);
    setEditExpenseAmount(expense.amount?.toString() || '');
    setEditExpenseCurrency(curr);
    setIsEditExpenseModalOpen(true);
  };

  const handleUpdateExpense = async (e: Event) => {
    e.preventDefault();
    if (!editExpenseDesc() || !editExpenseAmount() || isUpdatingExpense()) return;
    
    setIsUpdatingExpense(true);
    const amount = parseFloat(editExpenseAmount());
    const finalDesc = `${editExpenseDesc()} (${editExpenseCurrency()})`;

    await supabase.from('expenses').update({
      description: finalDesc,
      amount: amount
    }).eq('id', editExpenseId());

    await supabase.from('activities').insert([{
      group_id: group()?.id,
      user_id: currentUserId(),
      action_type: 'expense',
      description: `updated an expense to ${amount.toFixed(2)} ${editExpenseCurrency()} for ${editExpenseDesc()}`
    }]);

    await fetchFeed();
    
    setIsEditExpenseModalOpen(false);
    setIsUpdatingExpense(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense? This cannot be undone.")) return;
    
    await supabase.from('expenses').delete().eq('id', expenseId);
    
    // Also remove the corresponding activity if it exists
    await supabase.from('activities').delete().eq('group_id', params.id).eq('action_type', 'expense').like('description', `%expense%`);
    
    fetchFeed();
  };

  const handleDeleteActivity = async (activityId: string, e: Event) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this activity?")) return;
    
    await supabase.from('activities').delete().eq('id', activityId);
    fetchFeed();
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
                    value={group()?.name || ''} 
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
                      value={group()?.invite_code || ''} 
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

        {/* Add Expense Modal */}
        <Show when={isExpenseModalOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign class="text-emerald-500" /> Add Expense
              </h2>
              
              <form onSubmit={handleAddExpense} class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dinner, Uber, Groceries"
                    required
                    value={expenseDesc()}
                    onInput={(e) => setExpenseDesc(e.currentTarget.value)}
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount & Currency</label>
                  <div class="flex gap-3">
                    <select 
                      value={expenseCurrency()} 
                      onChange={(e) => setExpenseCurrency(e.currentTarget.value)}
                      class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Br)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <div class="relative flex-1">
                      <input 
                        type="number"
                        step="0.01" 
                        min="0.01"
                        placeholder="0.00"
                        required
                        value={expenseAmount()}
                        onInput={(e) => setExpenseAmount(e.currentTarget.value)}
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div class="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="submit"
                    disabled={isSubmittingExpense()}
                    class="w-full flex items-center justify-center py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmittingExpense() ? 'Adding...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        {/* Edit Expense Modal */}
        <Show when={isEditExpenseModalOpen()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditExpenseModalOpen(false)}></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsEditExpenseModalOpen(false)}
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign class="text-emerald-500" /> Edit Expense
              </h2>
              
              <form onSubmit={handleUpdateExpense} class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <input 
                    type="text" 
                    required
                    value={editExpenseDesc()}
                    onInput={(e) => setEditExpenseDesc(e.currentTarget.value)}
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount & Currency</label>
                  <div class="flex gap-3">
                    <select 
                      value={editExpenseCurrency()} 
                      onChange={(e) => setEditExpenseCurrency(e.currentTarget.value)}
                      class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Br)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <div class="relative flex-1">
                      <input 
                        type="number"
                        step="0.01" 
                        min="0.01"
                        required
                        value={editExpenseAmount()}
                        onInput={(e) => setEditExpenseAmount(e.currentTarget.value)}
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div class="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="submit"
                    disabled={isUpdatingExpense()}
                    class="w-full flex items-center justify-center py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isUpdatingExpense() ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
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
            <>
              {/* Header Banner */}
              <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12 text-white shadow-xl shadow-slate-900/10 mb-8 border border-slate-700/50">
                <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                
                <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div class="flex items-center gap-6">
                    <div class="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/20 shadow-inner overflow-hidden">
                      <Show when={localAvatar()} fallback={<span>{group()?.name?.charAt(0)}</span>}>
                        <img src={localAvatar()!} alt="Group Avatar" class="w-full h-full object-cover" />
                      </Show>
                    </div>
                    <div>
                      <h1 class="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">{group()?.name}</h1>
                      <div class="flex items-center gap-3 text-slate-300 text-sm">
                        <span class="flex items-center gap-1.5"><Users size={16} /> {group()?.group_members?.length || 1} Members</span>
                        <span>•</span>
                        <span>Invite Code: <strong class="text-white bg-white/10 px-2 py-0.5 rounded tracking-widest">{group()?.invite_code}</strong></span>
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
                  
                  {/* Quick Actions */}
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <A 
                      href={`/groups/${group()?.id}/chat`}
                      class="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group shadow-sm"
                    >
                      <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      </div>
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Group Chat</span>
                    </A>
                    
                    <button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      class="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group shadow-sm"
                    >
                      <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <DollarSign size={24} />
                      </div>
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Add Expense</span>
                    </button>

                    <A 
                      href={`/groups/${group()?.id}/events`}
                      class="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all group shadow-sm"
                    >
                      <div class="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <CalendarIcon size={24} />
                      </div>
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan Event</span>
                    </A>

                    <A 
                      href={`/groups/${group()?.id}/files`}
                      class="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-all group shadow-sm"
                    >
                      <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Shared Files</span>
                    </A>
                  </div>

                  {/* Activity Feed */}
                  <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Activity class="text-indigo-500" /> Recent Activity
                    </h2>
                    
                    <Show when={feed().length > 0} fallback={
                      <div class="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <div class="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Activity class="text-slate-400" size={24} />
                        </div>
                        <h3 class="text-slate-900 dark:text-white font-semibold mb-1">No activity yet</h3>
                        <p class="text-slate-500 text-sm">When members chat, add expenses, or plan events, they'll show up here.</p>
                      </div>
                    }>
                      <div class="space-y-6">
                        <For each={feed()}>
                          {(item) => (
                            <div class="flex gap-4 group">
                              <div class={`p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform ${
                                item.type === 'expense' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                item.type === 'event' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                item.type === 'file' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' // Join / other
                              }`}>
                                <Show when={item.type === 'expense'}><DollarSign size={20} /></Show>
                                <Show when={item.type === 'event'}><CalendarIcon size={20} /></Show>
                                <Show when={item.type === 'file'}><FileText size={20} /></Show>
                                <Show when={['join', 'other'].includes(item.type)}><Users size={20} /></Show>
                              </div>

                              <div class="flex-1 min-w-0 pt-1">
                                <p class="text-slate-900 dark:text-white text-sm font-medium">
                                  {item.full_name} {item.type !== 'expense' ? item.title : `added an expense for ${item.title}`}
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                  {new Date(item.created_at).toLocaleString()}
                                </p>
                              </div>

                              <Show when={isAdmin() && item.type !== 'expense'}>
                                <div class="pt-1 flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => handleDeleteActivity(item.id, e)}
                                    class="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </Show>

                                <Show when={item.type === 'expense'}>
                                  <div class="pt-1 flex flex-col items-end">
                                    <span class="text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                                      {item.amount?.toFixed(2)}
                                    </span>
                                    <Show when={isAdmin()}>
                                      <div class="flex gap-2">
                                        <button 
                                          onClick={() => openEditExpense(item.raw_expense)}
                                          class="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteExpense(item.id)}
                                          class="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </Show>
                                  </div>
                                </Show>

                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div class="space-y-6">
                  <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Members</h3>
                    <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      <For each={group()?.group_members || []}>
                        {(member: any) => (
                          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                {member.full_name ? member.full_name.substring(0, 2).toUpperCase() : '?'}
                              </div>
                              <span class="font-medium text-slate-700 dark:text-slate-200 text-sm truncate w-24">
                                {member.full_name}
                              </span>
                            </div>
                            <span class={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                              member.role === 'admin' 
                                ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10' 
                                : 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
                            }`}>
                              {member.role || 'member'}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>
                    <button class="w-full mt-6 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                      <Users size={16} /> Invite Members
                    </button>
                  </div>

                  {/* Expense Summary Card */}
                  <Show when={expenseSummary()}>
                    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8">
                      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign size={20} class="text-emerald-500" /> Expense Split
                      </h3>

                      {/* Totals */}
                      <div class="grid grid-cols-2 gap-3 mb-5">
                        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                          <p class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Total</p>
                          <p class="text-lg font-black text-emerald-700 dark:text-emerald-300">${expenseSummary()!.total.toFixed(2)}</p>
                        </div>
                        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
                          <p class="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">Per Person</p>
                          <p class="text-lg font-black text-indigo-700 dark:text-indigo-300">${expenseSummary()!.perPerson.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Who Owes Whom */}
                      <Show when={expenseSummary()!.settlements.length > 0} fallback={
                        <div class="text-center py-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          ✅ Everyone is settled up!
                        </div>
                      }>
                        <div class="space-y-2">
                          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Who Owes Whom</p>
                          <For each={expenseSummary()!.settlements}>
                            {(s) => (
                              <div class="flex items-center justify-between bg-rose-50 dark:bg-rose-900/15 border border-rose-200/50 dark:border-rose-800/40 rounded-xl px-4 py-3">
                                <div class="flex items-center gap-2 text-sm">
                                  <span class="font-bold text-rose-700 dark:text-rose-400">{s.from}</span>
                                  <span class="text-slate-400">→</span>
                                  <span class="font-bold text-emerald-700 dark:text-emerald-400">{s.to}</span>
                                </div>
                                <span class="font-black text-sm text-slate-900 dark:text-white">${s.amount.toFixed(2)}</span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">
                        Split equally among {expenseSummary()!.memberCount} members
                      </p>
                    </div>
                  </Show>
                </div>

              </div>
            </>
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
