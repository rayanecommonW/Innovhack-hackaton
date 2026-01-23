/**
 * PACT Logo Component
 *
 * The distinctive PACT logo with the terracotta "A"
 * Usage: <PactLogo size={32} /> or <PactLogo size="large" />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type LogoSize = 'small' | 'medium' | 'large' | 'xlarge' | number;

interface PactLogoProps {
  size?: LogoSize;
  color?: string;
  accentColor?: string;
  style?: any;
}

const sizeMap: Record<string, number> = {
  small: 20,
  medium: 28,
  large: 36,
  xlarge: 48,
};

export function PactLogo({
  size = 'medium',
  color = Colors.textPrimary,
  accentColor = Colors.accent,
  style,
}: PactLogoProps) {
  const fontSize = typeof size === 'number' ? size : sizeMap[size] || 28;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, { fontSize, color }]}>
        P<Text style={{ color: accentColor }}>A</Text>CT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'System', // Will use SF Pro on iOS, which is close to Instrument Serif
    fontWeight: '400',
    letterSpacing: -1,
  },
});

export default PactLogo;
