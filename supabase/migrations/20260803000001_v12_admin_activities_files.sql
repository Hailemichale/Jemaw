-- Allow admins to delete activities
CREATE POLICY "Admins can delete any activity" 
ON activities FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = activities.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- Allow admins to delete shared_files
CREATE POLICY "Admins can delete any shared file" 
ON shared_files FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = shared_files.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);
