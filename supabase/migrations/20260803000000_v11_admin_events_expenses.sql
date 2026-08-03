-- Migration: v11_admin_events_expenses
-- Description: Add description and reminder_schedule to events, and enforce Admin policies on events and expenses

-- 1. Add columns to events table
ALTER TABLE public.events ADD COLUMN description TEXT;
ALTER TABLE public.events ADD COLUMN reminder_schedule TEXT DEFAULT 'None';

-- 2. Add admin update/delete policies for events
-- Allow users with role 'admin' in the group to update events
CREATE POLICY "Admins can update events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Allow users with role 'admin' in the group to delete events
CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- 3. Add admin update/delete policies for expenses
-- Allow users with role 'admin' in the group to update expenses
CREATE POLICY "Admins can update expenses" ON expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Allow users with role 'admin' in the group to delete expenses
CREATE POLICY "Admins can delete expenses" ON expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );
