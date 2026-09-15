import React from 'react';
import { View, Text, Svg, Path, Circle, Defs, LinearGradient, Stop, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#0f172a',
  },
});

export const TradeFlowLogoPdf = () => (
  <View style={styles.container}>
    <Svg viewBox="0 0 100 100" width={32} height={32}>
      <Defs>
        <LinearGradient id="gradient1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3b82f6" />
          <Stop offset="1" stopColor="#8b5cf6" />
        </LinearGradient>
        <LinearGradient id="gradient2" x1="1" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#06b6d4" />
          <Stop offset="1" stopColor="#3b82f6" />
        </LinearGradient>
      </Defs>
      <Path
        d="M30 20 C 60 20, 80 40, 80 70 C 80 80, 70 80, 70 70 C 70 50, 50 35, 30 35 C 20 35, 20 20, 30 20 Z"
        fill="url(#gradient1)"
      />
      <Path
        d="M70 80 C 40 80, 20 60, 20 30 C 20 20, 30 20, 30 30 C 30 50, 50 65, 70 65 C 80 65, 80 80, 70 80 Z"
        fill="url(#gradient2)"
      />
      <Circle cx="50" cy="50" r="10" fill="#ffffff" />
    </Svg>
    <Text style={styles.text}>TradeFlow</Text>
  </View>
);
