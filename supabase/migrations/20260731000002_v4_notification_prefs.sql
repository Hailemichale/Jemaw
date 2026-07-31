-- Notification preferences per user
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  meeting_reminders BOOLEAN DEFAULT TRUE,
  birthday_reminders BOOLEAN DEFAULT TRUE,
  chat_notifications BOOLEAN DEFAULT TRUE,
  push_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());
