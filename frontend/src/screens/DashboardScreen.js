import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../api/auth';
import { useTranslation } from 'react-i18next';
import { fetchTasks, toggleTask, fetchClasses, createTask } from '../api/tasks';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotifications } from './ProfileScreen';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedType, setSelectedType] = useState('assignment');
  
  const [taskDeadline, setTaskDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const loadDashboardData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }

      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);

      const fetchedClasses = await fetchClasses().catch(() => []);
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0].id.toString());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // notification test
    registerForPushNotifications();
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const handleToggleTask = async (taskId) => {
    try {
      const updated = await toggleTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle || !selectedClassId) {
      alert(t('fillAllFields'));
      return;
    }

    setIsSaving(true);
    try {
      const taskData = {
        title: newTitle,
        deadline: taskDeadline.toISOString(),
        type: selectedType,
        class_id: parseInt(selectedClassId)
      };

      const createdTask = await createTask(taskData);
      setTasks(prev => [createdTask, ...prev]);

      setNewTitle('');
      setTaskDeadline(new Date());
      setIsModalVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error(error);
      alert(t('failedToCreateTask'));
    } finally {
      setIsSaving(false);
    }
  };

  const getClassNameById = (classId) => {
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : `${t('class')} ${classId}`;
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setTaskDeadline(selectedDate);
      }
    }
    else if (Platform.OS === 'ios') {
      if (selectedDate) {
        setTaskDeadline(selectedDate);
      }
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const deadlines = tasks
    .filter(t => !t.is_completed && new Date(t.deadline) >= todayStart)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

    return new Date(a.deadline) - new Date(b.deadline);
  });

  const getCategoryDetails = (type) => {
    switch (type) {
      case 'exam': return { color: '#ef4444', icon: 'school-outline', label: t('exam') };
      case 'project': return { color: '#f59e0b', icon: 'code-working-outline', label: t('project') };
      default: return { color: '#3b82f6', icon: 'document-text-outline', label: t('assignment') };
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t('hello')},</Text>
          <Text style={styles.nameText}>{userName || t('user')}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('urgentDeadlines')}</Text>
          {deadlines.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle" size={40} color="#16a34a" />
              <Text style={styles.emptyText}>{t('noUrgentTasks')}</Text>
            </View>
          ) : (
            <FlatList
              data={deadlines}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const details = getCategoryDetails(item.type);
                return (
                  <View style={[styles.deadlineCard, { borderLeftColor: details.color }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.badge, { backgroundColor: details.color + '15' }]}>
                        <Ionicons name={details.icon} size={14} color={details.color} />
                        <Text style={[styles.badgeText, { color: details.color }]}>{details.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.cardFooter}>
                      <Ionicons name="calendar-outline" size={16} color="#78716c" />
                      <Text style={styles.cardDate}>{formatDate(item.deadline)}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('yourTasks')}</Text>
          {sortedTasks.length === 0 ? (
            <Text style={styles.noTasksText}>{t('noTasks')}</Text>
          ) : (
            sortedTasks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.taskItem, item.is_completed && styles.taskItemCompleted]}
                onPress={() => handleToggleTask(item.id)}
              >
                <Ionicons
                  name={item.is_completed ? "checkbox" : "square-outline"}
                  size={24}
                  color={item.is_completed ? "#16a34a" : "#62119f"}
                />
                <View style={styles.taskTextContainer}>
                  <Text style={[styles.taskText, item.is_completed && styles.taskTextCompleted]}>
                    {item.title}
                  </Text>
                  <Text style={styles.taskSubtext}>
                    {getClassNameById(item.class_id)} | {formatDate(item.deadline)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
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
                  <Text style={styles.modalTitle}>{t('addNewTask')}</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#78716c" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('taskTitle')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('taskTitlePlace')}
                  placeholderTextColor="#a8a29e"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={styles.inputLabel}>{t('taskType')}</Text>
                <View style={styles.typeSelectorContainer}>
                  {['assignment', 'exam', 'project'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        selectedType === type && { backgroundColor: getCategoryDetails(type).color }
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[styles.typeButtonText, selectedType === type && { color: '#fff' }]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>{t('deadline')}</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#62119f" style={{ marginRight: 10 }} />
                  <Text style={styles.datePickerButtonText}>
                    {formatDate(taskDeadline)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={taskDeadline}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.inputLabel}>{t('selectClass')}</Text>
                {classes.length === 0 ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t('enterClassId')}
                    placeholderTextColor="#a8a29e"
                    keyboardType="numeric"
                    value={selectedClassId}
                    onChangeText={setSelectedClassId}
                  />
                ) : (
                  <View style={styles.classSelector}>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        style={[styles.classOption, selectedClassId === cls.id.toString() && styles.classOptionSelected]}
                        onPress={() => setSelectedClassId(cls.id.toString())}
                      >
                        <Text style={[styles.classOptionText, selectedClassId === cls.id.toString() && { color: '#fff' }]}>
                          {cls.name || `Class ${cls.id}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateTask}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('createTask')}</Text>}
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
  header: { marginTop: 30, marginBottom: 25 },
  welcomeText: { fontSize: 18, color: '#aa5ed3', fontWeight: '500' },
  nameText: { fontSize: 26, fontWeight: 'bold', color: '#62119f' },
  sectionContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#62119f', marginBottom: 15 },
  
  deadlineCard: { backgroundColor: '#fffdfa', width: 220, borderRadius: 12, padding: 15, marginRight: 15, borderWidth: 1, borderColor: '#62119f', borderLeftWidth: 5 },
  cardHeader: { flexDirection: 'row', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#44403c', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { fontSize: 13, color: '#78716c', marginLeft: 6, fontWeight: '500' },
  emptyCard: { backgroundColor: '#fffdfa', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#62119f', borderStyle: 'dashed' },
  emptyText: { color: '#57534e', marginTop: 8, fontWeight: '500', fontSize: 14 },

  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdfa', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#62119f' },
  taskItemCompleted: { backgroundColor: '#f5f5f4', borderColor: '#e7e5e4' },
  taskTextContainer: { marginLeft: 15, flex: 1 },
  taskText: { fontSize: 16, fontWeight: '500', color: '#44403c' },
  taskTextCompleted: { textDecorationLine: 'line-through', color: '#a8a29e' },
  taskSubtext: { fontSize: 12, color: '#78716c', marginTop: 2 },
  noTasksText: { color: '#78716c', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#aa5ed3', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#ea580c', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(68,64,60,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fffdfa', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#62119f' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#57534e', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f5f5f4', padding: 12, borderRadius: 8, fontSize: 16, color: '#44403c', marginBottom: 15 },
  
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f4', padding: 12, borderRadius: 8, marginBottom: 15 },
  datePickerButtonText: { fontSize: 16, color: '#44403c', fontWeight: '500' },

  typeSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeButton: { flex: 1, paddingVertical: 10, backgroundColor: '#e7e5e4', borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  typeButtonText: { fontSize: 12, fontWeight: 'bold', color: '#57534e' },
  
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  classOption: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e7e5e4', borderRadius: 20, marginRight: 8, marginBottom: 8 },
  classOptionSelected: { backgroundColor: '#aa5ed3' },
  classOptionText: { fontSize: 14, color: '#57534e' },

  saveButton: { backgroundColor: '#62119f', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
