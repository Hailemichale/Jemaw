'use client';

import { useState } from 'react';
import { draftBirthdayMessage } from '@/utils/ai';

interface Props {
  memberName: string;
  groupName: string;
  groupId: string;
}

export default function BirthdayMessageDraft({ memberName, groupName, groupId }: Props) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleDraft = async () => {
    try {
      setLoading(true);
      const res = await draftBirthdayMessage(memberName, groupName);
      // Split by --- to get array of drafts
      const splitDrafts = res.split('---').map(d => d.trim()).filter(Boolean);
      setDrafts(splitDrafts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  return (
    <div id={`birthday-draft-${groupId}`} className="w-full">
      {drafts.length === 0 && !loading && (
        <button
          onClick={handleDraft}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl hover:shadow-md transition-shadow w-full sm:w-auto"
        >
          🎂 Draft message
        </button>
      )}

      {loading && (
        <div className="flex gap-2 items-center justify-center py-4 text-orange-500">
          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
          <span className="text-sm font-medium ml-2">Drafting fun messages...</span>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              ✨ Suggested Birthday Messages
            </h4>
            <button onClick={() => setDrafts([])} className="text-xs text-gray-500">Clear</button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {drafts.map((draft, i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/30">
                {editingIndex === i ? (
                  <div className="space-y-3">
                    <textarea 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const newDrafts = [...drafts];
                        newDrafts[i] = editText;
                        setDrafts(newDrafts);
                        setEditingIndex(null);
                      }} className="px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg">Save</button>
                      <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{draft}</p>
                    <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <button onClick={() => copyToClipboard(draft)} className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Copy</button>
                      <button onClick={() => handleEdit(i, draft)} className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Edit</button>
                      <button className="px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg ml-auto transition-colors">Send to chat</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
