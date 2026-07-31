import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// In-memory rate limit map (groupId or userId -> limit info)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(id: string) {
  const now = Date.now();
  const limitInfo = rateLimit.get(id);

  if (!limitInfo || now > limitInfo.resetAt) {
    rateLimit.set(id, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (limitInfo.count >= 20) {
    return false;
  }

  limitInfo.count++;
  return true;
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to call Gemini API');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, groupId, meetingId, question, memberName, groupName, messageCount = 50, prompt, context } = body;

    const rateLimitKey = groupId || user.id;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 20 requests per hour.' }, { status: 429 });
    }

    let result = '';

    if (action === 'ask') {
      const sysPrompt = "You are an AI assistant for the Jemaw app, helping users coordinate meetups and groups.";
      result = await callGemini(sysPrompt, `Context: ${JSON.stringify(context)}\nPrompt: ${prompt}`);
    } 
    else if (action === 'suggest_date') {
      const { data: meetings } = await supabase.from('meetings').select('meeting_time').eq('group_id', groupId).order('meeting_time', { ascending: false }).limit(10);
      const { count: memberCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId);
      
      const sysPrompt = "You are a smart scheduling assistant. Given the history of past meetings and member count, suggest a good upcoming date and time for the next meetup. Briefly explain why.";
      const userPrompt = `Past meeting times: ${JSON.stringify(meetings)}. Number of members: ${memberCount}. Suggest the next date.`;
      
      result = await callGemini(sysPrompt, userPrompt);
    }
    else if (action === 'summarize_chat') {
      const { data: messages } = await supabase.from('messages').select('content, user_id, created_at').eq('group_id', groupId).order('created_at', { ascending: false }).limit(messageCount);
      
      const sysPrompt = "You are a chat summarization assistant. Summarize the provided chat messages as a bulleted list of key points and highlight any decisions or action items.";
      const userPrompt = `Chat messages: ${JSON.stringify(messages)}`;
      
      result = await callGemini(sysPrompt, userPrompt);
    }
    else if (action === 'memory_recap') {
      const { data: memories } = await supabase.from('memories').select('caption, created_at').eq('meeting_id', meetingId);
      
      const sysPrompt = "You are a warm, nostalgic AI writer. Write a summary recap of a meetup based on memory captions. Keep it warm, highlighted key moments, and fun.";
      const userPrompt = `Memories: ${JSON.stringify(memories)}`;
      
      result = await callGemini(sysPrompt, userPrompt);
    }
    else if (action === 'birthday_message') {
      const sysPrompt = "You are an AI assistant helping a group draft a birthday message for a member. Provide 3 different warm, personalized, and fun options separated by '---'.";
      const userPrompt = `Draft a birthday message for ${memberName} in the group ${groupName}.`;
      
      result = await callGemini(sysPrompt, userPrompt);
    }
    else if (action === 'status_query') {
      const { data: statuses } = await supabase.from('live_statuses').select('status, location, updated_at, user_id').eq('meeting_id', meetingId);
      
      const sysPrompt = "You are an assistant answering questions about a current meetup based on live status updates. Be concise and helpful.";
      const userPrompt = `Live statuses: ${JSON.stringify(statuses)}\n\nUser Question: ${question}`;
      
      result = await callGemini(sysPrompt, userPrompt);
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
