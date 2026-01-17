import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: 'all', name: 'All', icon: '🔥' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️' },
  { id: 'productivity', name: 'Productivity', icon: '📱' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'learning', name: 'Learning', icon: '📚' },
];

const challenges = [
  {
    id: '1',
    title: 'No Social Media for 7 Days',
    category: 'productivity',
    participants: 234,
    avgBet: '€15',
    successRate: '42%',
    icon: '📵',
    sponsor: 'Notion',
    discount: '50% off Pro',
  },
  {
    id: '2',
    title: '10K Steps Daily Challenge',
    category: 'fitness',
    participants: 892,
    avgBet: '€20',
    successRate: '67%',
    icon: '🚶',
    sponsor: 'Nike',
    discount: '30% off',
  },
  {
    id: '3',
    title: 'Cold Approach Challenge',
    category: 'social',
    participants: 156,
    avgBet: '€25',
    successRate: '28%',
    icon: '💪',
    sponsor: null,
    discount: null,
  },
  {
    id: '4',
    title: 'Read 30 mins/day',
    category: 'learning',
    participants: 445,
    avgBet: '€10',
    successRate: '71%',
    icon: '📖',
    sponsor: 'Audible',
    discount: '3 months free',
  },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChallenges = challenges.filter(c => 
    selectedCategory === 'all' || c.category === selectedCategory
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>Explore</Text>
          <Text style={{ color: '#666', fontSize: 16, marginTop: 4 }}>Discover new challenges & sponsors</Text>
        </View>

        {/* Search Bar */}
        <View 
          style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: 16, 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            marginBottom: 24 
          }}
        >
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={{ flex: 1, color: '#fff', paddingVertical: 16, paddingHorizontal: 12, fontSize: 16 }}
            placeholder="Search challenges..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginBottom: 24 }}
          contentContainerStyle={{ gap: 10 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={{
                backgroundColor: selectedCategory === cat.id ? '#fff' : '#1A1A1A',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
              <Text 
                style={{ 
                  color: selectedCategory === cat.id ? '#000' : '#fff', 
                  fontWeight: '600' 
                }}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Sponsor Banner */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: 20, 
            padding: 20, 
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#2A2A2A',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                  <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>SPONSOR</Text>
                </View>
                <Text style={{ color: '#666', fontSize: 12 }}>Featured</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Complete any challenge</Text>
              <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '600' }}>Get 50% off Notion Pro</Text>
            </View>
            <View style={{ width: 60, height: 60, backgroundColor: '#2A2A2A', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>✨</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Challenge Cards */}
        <View style={{ marginBottom: 120 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Popular Challenges</Text>
          
          {filteredChallenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: 20,
                padding: 20,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 24 }}>{challenge.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{challenge.title}</Text>
                    <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{challenge.participants} participants</Text>
                  </View>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View>
                    <Text style={{ color: '#666', fontSize: 12 }}>Avg Bet</Text>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{challenge.avgBet}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#666', fontSize: 12 }}>Success</Text>
                    <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '600' }}>{challenge.successRate}</Text>
                  </View>
                </View>
                {challenge.sponsor && (
                  <View style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>🎁 {challenge.discount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
