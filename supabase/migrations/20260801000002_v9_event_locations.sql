-- Migration: v9_event_locations
-- Description: Create live tracking table for events

CREATE TABLE event_locations (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    is_arrived BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_locations ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for this table
-- Need to add it to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE event_locations;
ALTER TABLE event_locations REPLICA IDENTITY FULL;

-- Policies

-- Users can read event_locations if they are in the group associated with the event
CREATE POLICY "Select event_locations for group members" ON event_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            JOIN group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_locations.event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Users can insert their own location if they are in the group
CREATE POLICY "Insert event_locations for group members" ON event_locations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM events
            JOIN group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Users can update their own location
CREATE POLICY "Update own event_locations" ON event_locations
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Users can delete their own location (cleanup)
CREATE POLICY "Delete own event_locations" ON event_locations
    FOR DELETE USING (
        auth.uid() = user_id
    );
