'use client';

import { useState } from 'react';
import { suggestMeetingDate } from '@/utils/ai';

interface Props {
  groupId: string;
  onUseDate?: (dateText: string) => void;
}

export default function AIScheduleAssistant({ groupId, onUseDate }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await suggestMeetingDate(groupId);
      setSuggestion(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setError(null);
  };

  return (
    <div id={`ai-schedule-${groupId}`} className="w-full">
      {!suggestion && !loading && (
        <button
          id={`ai-schedule-btn-${groupId}`}
          onClick={handleSuggest}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-md transition-all duration-300 dark:from-indigo-500 dark:to-purple-500"
        >
          ✨ AI Suggest Date
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Analyzing your group's schedule...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
          {error}
          <button onClick={handleDismiss} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {suggestion && !loading && (
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">AI Suggestion</h3>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
            {suggestion}
          </div>
          <div className="flex items-center gap-3">
            {onUseDate && (
              <button
                id={`ai-schedule-use-${groupId}`}
                onClick={() => onUseDate(suggestion)}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Use this date
              </button>
            )}
            <button
              id={`ai-schedule-dismiss-${groupId}`}
              onClick={handleDismiss}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
