import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../utils/supabase';

export default function MeetingDayScreen() {
  const { groupId } = useLocalSearchParams();
  const [meeting, setMeeting] = useState<any>(null);

  useEffect(() => {
    fetchLiveMeeting();
  }, [groupId]);

  const fetchLiveMeeting = async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('group_id', groupId)
      .in('status', ['live', 'upcoming'])
      .order('date_time', { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      setMeeting(data[0]);
    }
  };

  if (!meeting) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No live meeting found today.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meeting Day Live</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Status Board</Text>
          <Text style={styles.placeholder}>Status board updates would appear here...</Text>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>Live Map</Text>
          <Text style={styles.placeholder}>Map visualization will render here. Location tracking starts when you tap 'On the way'.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#4f46e5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  content: { padding: 24, gap: 16 },
  statusCard: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  mapCard: { backgroundColor: '#eff6ff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  placeholder: { color: '#6b7280', fontSize: 14, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#6b7280', fontSize: 16 },
});
