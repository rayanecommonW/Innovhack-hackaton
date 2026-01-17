import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <View>
            <Text style={{ color: '#666', fontSize: 14 }}>Welcome back</Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>BetBuddy 🎯</Text>
          </View>
          <TouchableOpacity 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 22, 
              backgroundColor: '#1A1A1A', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View 
          style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: 24, 
            padding: 24, 
            marginBottom: 24 
          }}
        >
          <Text style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>Your Balance</Text>
          <Text style={{ color: '#fff', fontSize: 42, fontWeight: 'bold' }}>€127.50</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+€45.00 this week</Text>
            </View>
          </View>
        </View>

        {/* Active Bets Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Active Bets</Text>
            <TouchableOpacity>
              <Text style={{ color: '#666', fontSize: 14 }}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bet Card 1 */}
          <View 
            style={{ 
              backgroundColor: '#1A1A1A', 
              borderRadius: 20, 
              padding: 20, 
              marginBottom: 12 
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 20 }}>📱</Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Screen Time Challenge</Text>
                  <Text style={{ color: '#666', fontSize: 13 }}>With Alex, Marie, Tom</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>On Track</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 12, height: 8, marginBottom: 12 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, height: 8, width: '65%' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#666', fontSize: 13 }}>5 days left</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>€25 at stake</Text>
            </View>
          </View>

          {/* Bet Card 2 */}
          <View 
            style={{ 
              backgroundColor: '#1A1A1A', 
              borderRadius: 20, 
              padding: 20, 
              marginBottom: 12 
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 20 }}>🏋️</Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Gym 4x/week</Text>
                  <Text style={{ color: '#666', fontSize: 13 }}>With Sarah, Jake</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#000', fontSize: 12, fontWeight: '600' }}>Behind</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 12, height: 8, marginBottom: 12 }}>
              <View style={{ backgroundColor: '#f59e0b', borderRadius: 12, height: 8, width: '35%' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#666', fontSize: 13 }}>12 days left</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>€50 at stake</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 120 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{ 
                flex: 1, 
                backgroundColor: '#fff', 
                borderRadius: 16, 
                padding: 20, 
                alignItems: 'center' 
              }}
            >
              <Ionicons name="add-circle" size={28} color="#000" />
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '600', marginTop: 8 }}>New Bet</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ 
                flex: 1, 
                backgroundColor: '#1A1A1A', 
                borderRadius: 16, 
                padding: 20, 
                alignItems: 'center' 
              }}
            >
              <Ionicons name="people" size={28} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
