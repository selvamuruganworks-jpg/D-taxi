import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ children, style }) => (
  <View style={[{ backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' }, style]}>
    <Text style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 14 }}>[Web Map View Mock]</Text>
    <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }}>Live maps require Android/iOS emulator or phone</Text>
    {children}
  </View>
);

export const Marker = ({ children, coordinate }) => (
  <View style={{ position: 'absolute', padding: 4, backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1.5, borderColor: '#2e7d32' }}>
    <Text style={{ fontSize: 10, fontWeight: '700', color: '#1b5e20' }}>📍 Location</Text>
  </View>
);

export const Polyline = () => null;

export default MapView;
