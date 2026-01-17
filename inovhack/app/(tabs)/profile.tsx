import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const stats = [
  { label: 'Challenges Won', value: '12', icon: 'trophy' },
  { label: 'Win Rate', value: '67%', icon: 'trending-up' },
  { label: 'Money Won', value: '€245', icon: 'cash' },
  { label: 'Friends', value: '24', icon: 'people' },
];

const achievements = [
  { id: '1', title: 'First Win', description: 'Win your first challenge', icon: '🏆', unlocked: true },
  { id: '2', title: 'Streak Master', description: '7 day winning streak', icon: '🔥', unlocked: true },
  { id: '3', title: 'Social Butterfly', description: 'Invite 10 friends', icon: '🦋', unlocked: true },
  { id: '4', title: 'Big Spender', description: 'Bet €100 in a single challenge', icon: '💰', unlocked: false },
  { id: '5', title: 'Perfect Month', description: 'Complete all challenges in a month', icon: '⭐', unlocked: false },
];

const menuItems = [
  { id: 'settings', title: 'Settings', icon: 'settings-outline' },
  { id: 'payment', title: 'Payment Methods', icon: 'card-outline' },
  { id: 'history', title: 'Bet History', icon: 'time-outline' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' },
  { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
  { id: 'logout', title: 'Log Out', icon: 'log-out-outline', danger: true },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
      >
        {/* Profile Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View 
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: '#1A1A1A', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          >
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Alex Johnson</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>@alexj • Member since 2024</Text>
          
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#1A1A1A', 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              borderRadius: 24, 
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View 
          style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12, 
            marginBottom: 32 
          }}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={{
                width: '47%',
                backgroundColor: '#1A1A1A',
                borderRadius: 20,
                padding: 20,
              }}
            >
              <Ionicons name={stat.icon as any} size={24} color="#666" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{stat.value}</Text>
              <Text style={{ color: '#666', fontSize: 13 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Achievements</Text>
            <TouchableOpacity>
              <Text style={{ color: '#666', fontSize: 14 }}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={{
                  width: 100,
                  backgroundColor: '#1A1A1A',
                  borderRadius: 20,
                  padding: 16,
                  alignItems: 'center',
                  opacity: achievement.unlocked ? 1 : 0.4,
                }}
              >
                <View 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: achievement.unlocked ? '#2A2A2A' : '#1A1A1A', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={{ marginBottom: 120 }}>
          <View 
            style={{ 
              backgroundColor: '#1A1A1A', 
              borderRadius: 20, 
              overflow: 'hidden' 
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 18,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: '#2A2A2A',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={item.danger ? '#ef4444' : '#fff'} 
                  />
                  <Text 
                    style={{ 
                      color: item.danger ? '#ef4444' : '#fff', 
                      fontSize: 16 
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
