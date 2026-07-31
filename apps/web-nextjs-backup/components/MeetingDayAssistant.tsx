'use client';

import { useState, useRef, useEffect } from 'react';
import { queryStatusBoard } from '@/utils/ai';

interface Props {
  meetingId: string;
  groupId: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTIONS = [
  "Who's still not here?",
  "How far is everyone?",
  "What's the address?"
];

export default function MeetingDayAssistant({ meetingId, groupId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;

    const newMsgs: Message[] = [...messages, { role: 'user', text: question }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await queryStatusBoard(question, meetingId);
      setMessages([...newMsgs, { role: 'ai', text: res }]);
    } catch (err) {
      setMessages([...newMsgs, { role: 'ai', text: "I'm sorry, I couldn't process that request right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={`meeting-assistant-${meetingId}`} className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-[400px]">
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2 text-white">
        <span className="text-xl">✨</span>
        <h3 className="font-semibold text-sm">Meeting Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
            <span className="text-3xl block mb-2 opacity-50">🤖</span>
            <p>Ask me about today's meetup status!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.role === 'ai' && <span className="inline-block mr-1 text-indigo-500 text-xs">✨</span>}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200 dark:border-gray-700">
               <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {SUGGESTIONS.map((sug, i) => (
            <button 
              key={i}
              onClick={() => handleSubmit(sug)}
              className="whitespace-nowrap px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
          className="flex items-center gap-2"
        >
          <input
            id={`assistant-input-${meetingId}`}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the meetup..."
            className="flex-1 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
