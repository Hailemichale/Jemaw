import { createSignal, createEffect, For, Show } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Download, Trash2, File as FileIcon, Loader2 } from 'lucide-solid';

export default function GroupFiles() {
  const params = useParams();
  const navigate = useNavigate();
  
  const [files, setFiles] = createSignal<any[]>([]);
  const [group, setGroup] = createSignal<any>(null);
  const [currentUserId, setCurrentUserId] = createSignal('');
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);

  // AI Memory Recap State
  const [isRecapping, setIsRecapping] = createSignal(false);
  const [recapResult, setRecapResult] = createSignal<string | null>(null);

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('shared_files')
      .select('*')
      .eq('group_id', params.id)
      .order('created_at', { ascending: false });
      
    if (data) setFiles(data);
  };

  createEffect(() => {
    const initFiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      setCurrentUserId(session.user.id);

      const { data: groupData } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(user_id, role)
        `)
        .eq('id', params.id)
        .single();
      
      if (groupData) {
        setGroup(groupData);
      } else {
        navigate('/groups');
        return;
      }

      await fetchFiles();
    };

    initFiles();
  });

  const handleFileUpload = async (e: any) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10); // Fake progress to start

    try {
      // 1. Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${params.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('jemaw-files')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(60);

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('jemaw-files')
        .getPublicUrl(fileName);
        
      // 3. Save to database
      const { error: dbError } = await supabase.from('shared_files').insert([
        {
          group_id: params.id,
          user_id: currentUserId(),
          file_name: selectedFile.name,
          file_url: publicUrlData.publicUrl,
          file_type: selectedFile.type || 'unknown',
          file_size_kb: Math.round(selectedFile.size / 1024)
        }
      ]);

      if (dbError) throw new Error(dbError.message);

      setUploadProgress(90);

      // 4. Log to activities feed
      await supabase.from('activities').insert([
        {
          group_id: params.id,
          user_id: currentUserId(),
          action_type: 'file',
          description: `uploaded a file: ${selectedFile.name}`
        }
      ]);

      await fetchFiles();
      setUploadProgress(100);

    } catch (err: any) {
      alert("Failed to upload: " + err.message + "\nMake sure you created the 'jemaw-files' bucket and made it Public!");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleRecapMemories = async () => {
    if (files().length === 0) {
      alert("There are no files shared yet! Upload some photos or documents first to generate a memory recap.");
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Missing Gemini API Key! Please add VITE_GEMINI_API_KEY to your .env.local file.");
      return;
    }

    setIsRecapping(true);
    
    // Format list of files
    const fileList = files().map(f => {
      return `- ${f.file_name} (Uploaded: ${new Date(f.created_at).toLocaleDateString()})`;
    }).join('\n');

    const prompt = `You are a helpful AI in a group app called Jemaw. Below is a list of files and photos this group has shared over time. 
Write a warm, nostalgic, and fun 2-paragraph recap of their shared journey based on these file names and dates. 
Be highly creative! If you see things like receipts, pictures, or documents, weave them into a heartwarming story about the memories they've made together.

Files Shared:
${fileList}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        let errMessage = "Failed to fetch memory recap from Gemini";
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
      setRecapResult(text);
      setIsRecapping(false);
    } catch (err: any) {
      console.error(err);
      alert("Error generating recap: " + err.message);
      setIsRecapping(false);
    }
  };

  const [previewFile, setPreviewFile] = createSignal<any>(null);

  const isAdmin = () => {
    return group()?.group_members?.find((m: any) => m.user_id === currentUserId())?.role === 'admin';
  };

  const handleDeleteFile = async (file: any, e?: Event) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this file from the group?")) return;
    
    // Attempt to delete from DB
    const { error } = await supabase.from('shared_files').delete().eq('id', file.id);
    if (error) {
      alert("Failed to delete file: " + error.message);
      return;
    }
    
    setPreviewFile(null);
    fetchFiles();
  };

  const getFileIcon = (type: string, size: number = 24) => {
    if (type.startsWith('image/')) return <ImageIcon size={size} class="text-emerald-500" />;
    if (type === 'application/pdf') return <FileText size={size} class="text-rose-500" />;
    return <FileIcon size={size} class="text-indigo-500" />;
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const closePreview = () => setPreviewFile(null);

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div class="max-w-5xl mx-auto">
        
        {/* Header */}
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <A href={`/groups/${params.id}`} class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <ArrowLeft size={24} />
            </A>
            <div>
              <h1 class="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                Shared Files
              </h1>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {group()?.name}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleRecapMemories}
            class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-pink-500/20 transition-all hover:scale-105"
            title="Generate a nostalgic story of your group's memories"
          >
            ✨ <span class="hidden sm:inline">Memory Recap</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center mb-8 shadow-sm relative overflow-hidden transition-all group hover:border-indigo-500/50">
          
          {isUploading() && (
            <div class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 size={32} class="text-indigo-600 animate-spin mb-4" />
              <p class="text-slate-700 dark:text-slate-300 font-medium">Uploading... {uploadProgress()}%</p>
              <div class="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div class="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress()}%` }}></div>
              </div>
            </div>
          )}

          <input 
            type="file" 
            onChange={handleFileUpload}
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
            disabled={isUploading()}
          />
          <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload size={28} />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Upload a File</h3>
          <p class="text-slate-500 dark:text-slate-400">Click or drag and drop any file here to share it with the group.</p>
        </div>

        {/* Files Grid */}
        <Show when={files().length > 0} fallback={
          <div class="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <FileIcon size={48} class="opacity-20 mb-4" />
            <p class="text-lg font-medium">No files shared yet</p>
            <p class="text-sm">Be the first to upload something!</p>
          </div>
        }>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <For each={files()}>
              {(file) => (
                <div 
                  onClick={() => setPreviewFile(file)}
                  class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col hover:shadow-md transition-shadow group cursor-pointer"
                >
                  
                  <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      {getFileIcon(file.file_type)}
                    </div>
                    
                    <a 
                      href={`${file.file_url}?download=`} 
                      onClick={(e) => e.stopPropagation()}
                      class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                  </div>

                  <h4 class="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate" title={file.file_name}>
                    {file.file_name}
                  </h4>
                  
                  <div class="flex items-center justify-between mt-auto pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>{formatFileSize(file.file_size_kb)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                  
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* File Preview Modal */}
        <Show when={previewFile()}>
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closePreview}>
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              
              <div class="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3 overflow-hidden">
                  {getFileIcon(previewFile().file_type)}
                  <h3 class="font-bold text-slate-900 dark:text-white truncate text-lg">
                    {previewFile().file_name}
                  </h3>
                </div>
                <button onClick={closePreview} class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div class="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 min-h-[300px]">
                <Show 
                  when={previewFile().file_type.startsWith('image/')} 
                  fallback={
                    <div class="flex flex-col items-center text-center max-w-sm">
                      <div class="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6">
                        {getFileIcon(previewFile().file_type, 48)}
                      </div>
                      <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No Preview Available</h4>
                      <p class="text-slate-500 dark:text-slate-400">This file type ({previewFile().file_type}) cannot be previewed directly in the browser. Please download it to view.</p>
                    </div>
                  }
                >
                  <img src={previewFile().file_url} alt={previewFile().file_name} class="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200/50 dark:border-slate-800/50" />
                </Show>
              </div>

              <div class="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div class="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Size: {formatFileSize(previewFile().file_size_kb)} • Uploaded: {new Date(previewFile().created_at).toLocaleDateString()}
                </div>
                <div class="flex items-center gap-3">
                  <Show when={isAdmin()}>
                    <button 
                      onClick={(e) => handleDeleteFile(previewFile(), e)}
                      class="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 px-4 py-2.5 rounded-xl font-semibold transition-colors"
                    >
                      <Trash2 size={18} />
                      <span class="hidden sm:inline">Delete</span>
                    </button>
                  </Show>
                  <a 
                    href={`${previewFile().file_url}?download=`} 
                    class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-md shadow-indigo-500/20"
                  >
                    <Download size={18} />
                    <span class="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
              
            </div>
          </div>
        </Show>

        {/* AI Memory Recap Modal */}
        <Show when={isRecapping() || recapResult()}>
          <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
              <div class="bg-gradient-to-r from-pink-500 to-rose-600 p-6 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                  ✨ Nostalgic Memory Recap
                </h3>
                <button 
                  onClick={() => { setIsRecapping(false); setRecapResult(null); }}
                  class="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div class="p-6 overflow-y-auto custom-scrollbar">
                <Show when={isRecapping()}>
                  <div class="flex flex-col items-center justify-center py-10 space-y-4">
                    <div class="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin"></div>
                    <p class="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Reflecting on your memories...</p>
                  </div>
                </Show>
                <Show when={!isRecapping() && recapResult()}>
                  <div class="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                    <For each={recapResult()!.split('\n')}>
                      {(line) => (
                        <p class="mb-3 leading-relaxed">
                          {line.startsWith('*') || line.startsWith('-') ? (
                            <span class="flex gap-2"><span class="text-rose-500 mt-1">•</span> <span innerHTML={line.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')} /></span>
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
