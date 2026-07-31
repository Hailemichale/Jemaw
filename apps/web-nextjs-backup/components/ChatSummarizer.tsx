'use client';

import { useState } from 'react';
import { summarizeChat } from '@/utils/ai';

interface Props {
  groupId: string;
}

export default function ChatSummarizer({ groupId }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleSummarize = async () => {
    try {
      setLoading(true);
      const res = await summarizeChat(groupId);
      setSummary(res);
    } catch (err) {
      console.error(err);
      setSummary("Failed to generate summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mb-4" id={`chat-summarizer-${groupId}`}>
      {!summary && !loading && (
        <button
          onClick={handleSummarize}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800"
        >
          🤖 Catch me up
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl w-fit">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">AI is catching you up</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}

      {summary && !loading && (
        <div className="relative p-5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-transparent bg-clip-padding before:absolute before:inset-0 before:-z-10 before:m-[-2px] before:rounded-2xl before:bg-gradient-to-r before:from-purple-500 before:to-indigo-500 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              ✨
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Chat Summary</h4>
            <button 
              onClick={() => setSummary(null)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            {summary.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
