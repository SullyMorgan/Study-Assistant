import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../api/auth';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Szeretlek HENIIII</Text>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' }, 
  text: { fontSize: 18, color: '#1e3a8a', fontWeight: '500' }
});
