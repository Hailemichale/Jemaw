'use client';

import { useState } from 'react';
import { generateMemoryRecap } from '@/utils/ai';

interface Props {
  groupId: string;
  meetingId: string;
  meetingDate?: string;
}

export default function MemoryRecap({ groupId, meetingId, meetingDate }: Props) {
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateMemoryRecap(groupId, meetingId);
      setRecap(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={`memory-recap-${meetingId}`} className="w-full">
      {!recap && !loading && (
        <button
          onClick={handleGenerate}
          className="w-full py-3 flex justify-center items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-indigo-600 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        >
          ✨ Generate Recap
        </button>
      )}

      {loading && (
        <div className="w-full p-6 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="inline-block mb-3 text-2xl animate-pulse">✨</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
            Creating your meetup highlights...
          </p>
        </div>
      )}

      {recap && (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900/30 shadow-md">
          <div className="bg-gradient-to-r from-pink-500/10 to-indigo-600/10 dark:from-pink-500/5 dark:to-indigo-600/5 px-6 py-4 border-b border-purple-100 dark:border-purple-900/30">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <span>✨</span> Memory Recap
            </h3>
            {meetingDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{meetingDate}</p>
            )}
          </div>
          <div className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
              {recap.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? "mb-3" : ""}>{line}</p>
              ))}
            </div>
            <button 
              onClick={() => setRecap(null)}
              className="mt-6 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
