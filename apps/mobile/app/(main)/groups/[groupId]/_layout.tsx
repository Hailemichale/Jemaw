import { Tabs } from 'expo-router';

export default function GroupTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4f46e5' }}>
      <Tabs.Screen 
        name="home" 
        options={{ title: 'Home' }} 
      />
      <Tabs.Screen 
        name="meeting-day" 
        options={{ title: 'Meeting Day' }} 
      />
      <Tabs.Screen 
        name="members" 
        options={{ title: 'Members' }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ title: 'Settings' }} 
      />
    </Tabs>
  );
}
