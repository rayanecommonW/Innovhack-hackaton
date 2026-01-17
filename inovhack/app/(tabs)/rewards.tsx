import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const rewards = [
  {
    id: '1',
    sponsor: 'Notion',
    discount: '50% off Pro Plan',
    description: 'Complete any productivity challenge',
    icon: '📝',
    unlocked: true,
    expiresIn: '5 days',
  },
  {
    id: '2',
    sponsor: 'Nike',
    discount: '30% off purchase',
    description: 'Complete a fitness challenge',
    icon: '👟',
    unlocked: true,
    expiresIn: '12 days',
  },
  {
    id: '3',
    sponsor: 'Audible',
    discount: '3 months free',
    description: 'Read 30 mins/day for 30 days',
    icon: '🎧',
    unlocked: false,
    progress: 65,
  },
  {
    id: '4',
    sponsor: 'Headspace',
    discount: '1 year free',
    description: 'Complete meditation challenge',
    icon: '🧘',
    unlocked: false,
    progress: 0,
  },
];

export default function RewardsScreen() {
  const unlockedRewards = rewards.filter(r => r.unlocked);
  const lockedRewards = rewards.filter(r => !r.unlocked);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>Rewards</Text>
          <Text style={{ color: '#666', fontSize: 16, marginTop: 4 }}>Exclusive deals from sponsors</Text>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
          <View 
            style={{ 
              flex: 1, 
              backgroundColor: '#1A1A1A', 
              borderRadius: 20, 
              padding: 20 
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="gift" size={24} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>2</Text>
            <Text style={{ color: '#666', fontSize: 14 }}>Unlocked</Text>
          </View>
          <View 
            style={{ 
              flex: 1, 
              backgroundColor: '#1A1A1A', 
              borderRadius: 20, 
              padding: 20 
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="wallet" size={24} color="#000" />
            </View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>€127</Text>
            <Text style={{ color: '#666', fontSize: 14 }}>Saved</Text>
          </View>
        </View>

        {/* Unlocked Rewards */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Ready to Use</Text>
          </View>
          
          {unlockedRewards.map((reward) => (
            <TouchableOpacity
              key={reward.id}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: 20,
                padding: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#22c55e',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                    <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>{reward.sponsor}</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{reward.discount}</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>Expires in {reward.expiresIn}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ 
                    backgroundColor: '#fff', 
                    paddingHorizontal: 16, 
                    paddingVertical: 10, 
                    borderRadius: 12 
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>Use</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Locked Rewards */}
        <View style={{ marginBottom: 120 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="lock-closed" size={16} color="#666" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Locked</Text>
          </View>
          
          {lockedRewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: 20,
                padding: 20,
                marginBottom: 12,
                opacity: 0.7,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>{reward.sponsor}</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{reward.discount}</Text>
                  <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{reward.description}</Text>
                </View>
              </View>
              {typeof reward.progress === 'number' && reward.progress > 0 && (
                <View>
                  <View style={{ backgroundColor: '#2A2A2A', borderRadius: 8, height: 6, marginBottom: 8 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 8, height: 6, width: `${reward.progress}%` as const }} />
                  </View>
                  <Text style={{ color: '#666', fontSize: 12 }}>{reward.progress}% complete</Text>
                </View>
              )}
              {typeof reward.progress === 'number' && reward.progress === 0 && (
                <TouchableOpacity 
                  style={{ 
                    backgroundColor: '#2A2A2A', 
                    paddingVertical: 12, 
                    borderRadius: 12, 
                    alignItems: 'center' 
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Start Challenge</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
