export interface User {
  id: string;
  name: string;
  avatar_url?: string;
  phone_or_email: string;
  birthday_month?: number;
  birthday_day?: number;
  birthday_year_private?: number;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
}

export interface Meeting {
  id: string;
  group_id: string;
  date_time: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  status: 'upcoming' | 'live' | 'past';
}

export interface Rsvp {
  meeting_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'no';
  responded_at: string;
}

export interface LiveStatus {
  meeting_id: string;
  user_id: string;
  status: 'arrived' | 'on_the_way' | 'late' | 'not_coming';
  lat?: number;
  lng?: number;
  eta_shared: boolean;
  updated_at: string;
}

export interface Reminder {
  id: string;
  group_id: string;
  type: 'meeting' | 'birthday';
  target_date: string;
  sent_at?: string;
}
