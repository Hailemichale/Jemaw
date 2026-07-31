-- Migration: v2_chat_memories_files
-- Description: Create tables for chat messages, reactions, memories, and shared files

-- 1. messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT,
    type TEXT DEFAULT 'text', -- (text | image | system | file | voice)
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_group_created ON messages (group_id, created_at DESC);

-- 2. message_reactions table
CREATE TABLE message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

-- 3. memories table
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id),
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. memory_media table
CREATE TABLE memory_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- (image | video)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. shared_files table
CREATE TABLE shared_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 6. Enable RLS on ALL new tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies for each table

-- messages policies
CREATE POLICY "Select messages for group members" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = messages.group_id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert messages for group members" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_id 
            AND group_members.user_id = auth.uid()
        )
    );

-- message_reactions policies
CREATE POLICY "Select message_reactions for group members" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            JOIN group_members ON group_members.group_id = messages.group_id
            WHERE messages.id = message_reactions.message_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert message_reactions for group members" ON message_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages
            JOIN group_members ON group_members.group_id = messages.group_id
            WHERE messages.id = message_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Delete message_reactions for group members" ON message_reactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM messages
            JOIN group_members ON group_members.group_id = messages.group_id
            WHERE messages.id = message_id
            AND group_members.user_id = auth.uid()
        )
    );

-- memories policies
CREATE POLICY "Select memories for group members" ON memories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = memories.group_id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert memories for group members" ON memories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_id 
            AND group_members.user_id = auth.uid()
        )
    );

-- memory_media policies
CREATE POLICY "Select memory_media for group members" ON memory_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memories
            JOIN group_members ON group_members.group_id = memories.group_id
            WHERE memories.id = memory_media.memory_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert memory_media for group members" ON memory_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories
            JOIN group_members ON group_members.group_id = memories.group_id
            WHERE memories.id = memory_id
            AND group_members.user_id = auth.uid()
        )
    );

-- shared_files policies
CREATE POLICY "Select shared_files for group members" ON shared_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = shared_files.group_id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert shared_files for group members" ON shared_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Delete shared_files for uploader only" ON shared_files
    FOR DELETE USING (
        uploaded_by = auth.uid()
    );

-- 8. Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
