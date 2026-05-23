import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MaterialsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Itt lesz az AI Kvíz és az PDF Összegző! 🤖</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, text: { fontSize: 18 } });
