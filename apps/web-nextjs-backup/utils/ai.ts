export interface AIContext {
  [key: string]: any;
}

export async function askAI(prompt: string, context?: AIContext): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'ask', prompt, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to call AI');
  }

  const data = await response.json();
  return data.result;
}

export async function suggestMeetingDate(groupId: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'suggest_date', groupId }),
  });
  if (!response.ok) throw new Error('Failed to fetch suggestion');
  const data = await response.json();
  return data.result;
}

export async function summarizeChat(groupId: string, messageCount: number = 50): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'summarize_chat', groupId, messageCount }),
  });
  if (!response.ok) throw new Error('Failed to summarize chat');
  const data = await response.json();
  return data.result;
}

export async function generateMemoryRecap(groupId: string, meetingId: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'memory_recap', groupId, meetingId }),
  });
  if (!response.ok) throw new Error('Failed to generate memory recap');
  const data = await response.json();
  return data.result;
}

export async function draftBirthdayMessage(memberName: string, groupName: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'birthday_message', memberName, groupName }),
  });
  if (!response.ok) throw new Error('Failed to draft message');
  const data = await response.json();
  return data.result;
}

export async function queryStatusBoard(question: string, meetingId: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'status_query', question, meetingId }),
  });
  if (!response.ok) throw new Error('Failed to query status');
  const data = await response.json();
  return data.result;
}
