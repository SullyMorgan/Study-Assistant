import React, { useState } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { logout, changePassword } from '../api/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  
  const toggleLanguage = () => {
    let nextLanguage = 'en';

    if (i18n.language === 'en') {
      nextLanguage = 'hu';
    } else if (i18n.language === 'hu') {
      nextLanguage = 'ro';
    } else {
      nextLanguage = 'en';
    }
    i18n.changeLanguage(nextLanguage);
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logoutConfirmTitle'), // title
      t('logoutConfirmMsg'), // message
      [
        {
          text: t('cancel'),
          onPress: () => console.log('Logout cancelled'),
          style: 'cancel'
        },
        {
          text: t('logout'),
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert(t('errorTitle'), error.message || 'An error occurred while logging out.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(t('errorTitle'), t('fillAllFields'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(t('errorTitle'), t('passNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);

      Alert.alert(t('successTitle'), t('passChangedSuccess'));

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert(t('errorTitle'), error.detail || t('underDevelopment'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Ionicons name="person-circle-outline" size={80} color="#1e3a8a" />
        <Text style={styles.title}>{t('myProfile')}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="lock-closed-outline" size={20} color="#1e3a8a" />
          <Text style={styles.menuText}>{t('changePassword')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
          <Ionicons name="globe-outline" size={20} color="#1e3a8a" />
          <Text style={styles.menuText}>
            {t('changeLanguage')} ({i18n.language.toUpperCase()})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[styles.menuText, styles.logoutText]}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: '100%' }}
          >
              <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('changePassword')}</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* current password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('currentPasswordPlace')}
                  placeholderTextColor="#888"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!isCurrentVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsCurrentVisible(!isCurrentVisible)}>
                  <Ionicons name={isCurrentVisible ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* new password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('newPasswordPlace')}
                  placeholderTextColor="#888"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!isNewVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsNewVisible(!isNewVisible)}>
                  <Ionicons name={isNewVisible ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* confirm new password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('confirmNewPasswordPlace')}
                  placeholderTextColor="#888"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry={!isConfirmVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsConfirmVisible(!isConfirmVisible)}>
                  <Ionicons name={isConfirmVisible ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* save button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
                )}
              </TouchableOpacity>
            </View>  
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20 },
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', marginTop: 10 },
  menuContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuText: { fontSize: 16, marginLeft: 15, color: '#374151', fontWeight: '500' },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: '#ef4444' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, minHeight: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  
  passwordContainer: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#000' },
  eyeIcon: { paddingHorizontal: 15 },
  saveButton: { width: '100%', backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
