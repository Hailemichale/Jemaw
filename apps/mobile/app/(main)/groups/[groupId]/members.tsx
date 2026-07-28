import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../utils/supabase';

export default function MembersScreen() {
  const { groupId } = useLocalSearchParams();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('group_members')
      .select(`
        role,
        user:users (id, name, birthday_month, birthday_day)
      `)
      .eq('group_id', groupId);

    if (data) {
      setMembers(data.map((m: any) => ({ ...m.user, role: m.role })));
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.role}</Text>
              </View>
            </View>
            {item.birthday_month && item.birthday_day && (
              <View style={styles.birthdayBadge}>
                <Text style={styles.birthdayText}>
                  🎂 {months[item.birthday_month - 1]} {item.birthday_day}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  list: { padding: 24, gap: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4338ca', fontWeight: 'bold', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  role: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  birthdayBadge: { backgroundColor: '#fce7f3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  birthdayText: { color: '#be185d', fontSize: 12, fontWeight: '500' },
});
