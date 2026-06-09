import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert
} from 'react-native';
import { fetchUserClasses, createClass, deleteClass } from '../api/classes';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ClassesScreen({ navigation }) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [className, setClassName] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const loadClasses = async () => {
    try {
      const data = await fetchUserClasses();
      setClasses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadClasses();
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert(t('fillAllFields'));
      return;
    }

    setIsSaving(true);
    try {
      const newClass = await createClass({
        name: className,
        difficulty: difficulty.toString()
      });
      setClasses(prev => [...prev, newClass]);
      setClassName('');
      setDifficulty(5);
      setIsModalVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error(error);
      alert(t('classCreateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async (id) => {
    Alert.alert(
      t('deleteClassTitle'),
      t('deleteClassMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClass(id);
              setClasses(prev => prev.filter(c => c.id !== id));
            } catch (error) {
              console.error(error);
              Alert.alert(t('errorTitle'), t('deleteClassFailed'));
            }
          }
        }
      ]
    );
  };

  const getDifficultyDetails = (diffStr) => {
    const diff = parseInt(diffStr) || 5;
    if (diff <= 3) return '#10b981';
    if (diff <= 7) return '#f5930b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#62119f" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#d1e9ef' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.screenTitle}>{t('myClasses')}</Text>
        <Text style={styles.subTitle}>
          {t('classSubtitle')}
        </Text>

        {classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={50} color="#a8a29e" />
            <Text style={styles.emptyText}>{t('noClasses')}</Text>
          </View>
        ) : (
          classes.map((item) => {
            const cardColor = getDifficultyDetails(item.difficulty);
            return (
              <View key={item.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="journal-outline" size={24} color="#62119f" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.className}>{item.name}</Text>
                    <View style={[styles.badge, { backgroundColor: cardColor + '15', alignSelf: 'flex-start', marginTop: 4 }]}>
                      <Text style={[styles.badgeText, { color: cardColor }]}>
                        {t('difficulty')}: {item.difficulty}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteClass(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('addNewClass')}</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#78716c" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('className')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('classNamePlace')}
                  placeholderTextColor="#a8a29e"
                  value={className}
                  onChangeText={setClassName}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.inputLabel}>{t('difficulty')}</Text>
                  <Text style={{ fontSize: 12, color: getDifficultyDetails(difficulty), fontWeight: 'bold' }}>
                    {difficulty <= 3 ? t('easy') : difficulty <= 7 ? t('medium') : t('hard')}
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.numberSelectorContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = difficulty === num;
                    const btnColor = getDifficultyDetails(num);
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.numberButton,
                          isSelected && { backgroundColor: btnColor, borderColor: btnColor }
                        ]}
                        onPress = {() => setDifficulty(num)}
                      >
                        <Text style={[styles.numberButtonText, isSelected && { color: '#fff' }]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateClass}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' },
  screenTitle: { fontSize: 26, fontWeight: 'bold', color: '#62119f', marginTop: 30 },
  subTitle: { fontSize: 14, color: '#78716c', marginTop: 5, marginBottom: 25, lineHeight: 20 },
  
  classCard: { backgroundColor: '#fffdfa', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: '#62119f' },
  classInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { backgroundColor: '#fff7ed', width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 14, flex: 1 },
  className: { fontSize: 16, fontWeight: 'bold', color: '#44403c' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#78716c', marginTop: 10, fontSize: 15, fontStyle: 'italic' },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#aa5ed3', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(68,64,60,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fffdfa', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#62119f' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#57534e', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f4', padding: 12, borderRadius: 8, fontSize: 16, color: '#44403c', marginBottom: 15 },
  
  numberSelectorContainer: { flexDirection: 'row', marginBottom: 25, paddingVertical: 5 },
  numberButton: { width: 40, height: 40, backgroundColor: '#f5f5f4', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#e7e5e4' },
  numberButtonText: { fontSize: 15, fontWeight: 'bold', color: '#57534e' },
  
  deleteBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  saveButton: { backgroundColor: '#aa5ed3', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
