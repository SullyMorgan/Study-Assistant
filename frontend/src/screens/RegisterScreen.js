import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('errorTitle'), t('fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errorTitle'), t('passNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Érdemes lehet ezt is kiszervezni egy külön '../api/auth' fájlba, mint a logouthoz!
      const response = await axios.post('http://172.20.10.8:8000/auth/register', {
        name: name,
        email: email,
        password: password,
      });

      Alert.alert(t('successTitle'), t('regSuccess'), [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(t('regFailed'), error.response?.data?.detail || t('regError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          <View style={styles.headerBox}>
            <Text style={styles.logo}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('joinToday')}</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('namePlace')}
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder={t('emailPlace')}
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('passwordPlace')}
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirmPasswordPlace')}
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              >
                <Ionicons
                  name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('register')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>{t('alreadyAccount')}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#bde9f3' },
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25 },
  headerBox: { alignItems: 'center', marginBottom: 25 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#62119f', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#62119f', textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 15 },
  
  input: { 
    width: '100%', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 10, 
    fontSize: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    color: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1
  },
  
  passwordContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  button: { 
    width: '100%', 
    backgroundColor: '#aa5ed3', //537731
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#aa5ed3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 22, paddingVertical: 5 },
  linkText: { color: '#62119f', fontSize: 14, fontWeight: '600' }
});
