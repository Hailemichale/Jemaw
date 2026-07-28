import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../utils/supabase';

export default function GroupHome() {
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [nextMeeting, setNextMeeting] = useState<any>(null);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (g) setGroup(g);

    const { data: m } = await supabase
      .from('meetings')
      .select('*')
      .eq('group_id', groupId)
      .in('status', ['upcoming', 'live'])
      .order('date_time', { ascending: true })
      .limit(1);

    if (m && m.length > 0) setNextMeeting(m[0]);
  };

  if (!group) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Next Meeting</Text>
        
        {nextMeeting ? (
          <View style={styles.card}>
            <Text style={styles.dateText}>{new Date(nextMeeting.date_time).toLocaleString()}</Text>
            <Text style={styles.venueText}>Venue: {nextMeeting.venue_address || 'TBD'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{nextMeeting.status.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming meetings scheduled.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  dateText: { fontSize: 18, fontWeight: '500', color: '#111827', marginBottom: 4 },
  venueText: { fontSize: 15, color: '#6b7280', marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: '#4338ca', fontSize: 12, fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  emptyText: { color: '#6b7280' },
});
