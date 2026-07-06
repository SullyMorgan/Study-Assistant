import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStudyPlan, acceptStudyPlan } from '../api/planner';
import { useTranslation } from 'react-i18next';
import { fetchTasks } from '../api/tasks';
import { scheduleStudyReminder } from '../utils/notifications';

export default function PlannerScreen() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [plan, setPlan] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [hasActiveTasks, setHasActiveTasks] = useState(false);

  // Alapértelmezett beállítások állapota
  const [sleepStart, setSleepStart] = useState(23);
  const [sleepEnd, setSleepEnd] = useState(8);
  const [maxSessions, setMaxSessions] = useState(3);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [tempSleepStart, setTempSleepStart] = useState('23');
  const [tempSleepEnd, setTempSleepEnd] = useState('8');
  const [tempMaxSessions, setTempMaxSessions] = useState('3');

  const checkActiveTasks = async () => {
    try {
      const allTasks = await fetchTasks();
      const uncompletedTasks = allTasks.filter(task => !task.is_completed);
      setHasActiveTasks(uncompletedTasks.length > 0);
    } catch (error) {
      console.error(error);
      setHasActiveTasks(false);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    checkActiveTasks();
  }, []);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const startParam = parseInt(tempSleepStart, 10) || 23;
      const endParam = parseInt(tempSleepEnd, 10) || 8;
      const sessionsParam = parseInt(tempMaxSessions, 10) || 3;
      
      const suggestedPlan = await getStudyPlan(startParam, endParam, sessionsParam);
      setPlan(suggestedPlan || []);
      setHasGenerated(true);
    } catch (error) {
      console.error(error);
      Alert.alert(t('errorTitle'), error.message || t('failedToGeneratePlan'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPlan = async () => {
    setIsAccepting(true);
    try {
      await acceptStudyPlan(plan);

      for (const session of plan) {
        await scheduleStudyReminder(session);
      }

      Alert.alert(t('planAccepted'), t('planAcceptedMessage'));
      setPlan([]);
      setHasGenerated(false);

      checkActiveTasks();
    } catch (error) {
      console.error(error);
      Alert.alert(t('errorTitle'), error.message || t('failedToAcceptPlan'));
    } finally {
      setIsAccepting(false);
    }
  };

  const openSettings = () => {
    setTempSleepStart(sleepStart.toString());
    setTempSleepEnd(sleepEnd.toString());
    setTempMaxSessions(maxSessions.toString());
    setIsSettingsVisible(true);
  };

  const saveSettings = () => {
    const start = parseInt(tempSleepStart, 10);
    const end = parseInt(tempSleepEnd, 10);
    const sessions = parseInt(tempMaxSessions, 10);

    if (isNaN(start) || start < 0 || start > 23 || isNaN(end) || end < 0 || end > 23) {
      Alert.alert(t('errorTitle'), t('invalidSleepHours'));
      return;
    }
    if (isNaN(sessions) || sessions < 1 || sessions > 8) {
      Alert.alert(t('errorTitle'), t('invalidMaxSessions'));
      return;
    }

    setSleepStart(start);
    setSleepEnd(end);
    setMaxSessions(sessions);
    setIsSettingsVisible(false);
    Keyboard.dismiss();
  };
  
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { dateStr, timeStr };
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('studyPlan')}</Text>
        <Text style={styles.subtitle}>{t('studyPlanSubtitle')}</Text>
      </View>

      {!hasGenerated && !isLoading && (
        <View style={styles.welcomeBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={36} color="#8b5cf6" />
          </View>
          <Text style={styles.welcomeTitle}>{t('welcomeToStudyPlan')}</Text>

          <View style={styles.settingsContainer}>
            <View style={styles.settingsPreview}>
              <Text style={styles.settingsText}>{sleepStart}:00 - {sleepEnd}:00</Text>
              <Text style={styles.settingsText}>{t('maxSessions')}: {maxSessions}</Text>
            </View>
            <TouchableOpacity style={styles.editSettingsButton} onPress={openSettings}>
              <Ionicons name="settings-outline" size={16} color="#8b5cf6" />
              <Text style={styles.editSettingsText}>{t('editSettings') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

        {!hasActiveTasks ? (
          <View style={styles.noTasksWarningContainer}>
            <Ionicons name="warning-outline" size={22} color="#b45309" style={{ marginRight: 10 }} />
            <Text style={styles.noTasksWarningText}>
              {t('noActiveTasks')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePlan}>
            <Ionicons name="flash" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.generateButtonText}>{t('generatePlan')}</Text>
          </TouchableOpacity>
        )}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>{t('generatingPlan')}</Text>
        </View>
      )}

      {hasGenerated && !isLoading && (
        <View style={styles.flexActive}>
          <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false}>
            {plan.length === 0 ? (
              <View style={styles.emptyPlanBox}>
                <Ionicons name="checkmark-done-circle-outline" size={50} color="#10b981" />
                <Text style={styles.emptyPlanText}>{t('emptyPlan')}</Text>
              </View>
            ) : (
              plan.map((item, index) => {
                const { dateStr, timeStr } = formatDateTime(item.start_time);
                const endInfo = formatDateTime(item.end_time);

                return (
                  <View key={index} style={styles.timelineNode}>
                    <View style={styles.leftLineColumn}>
                      <View style={styles.timelineDot} />
                      {index !== plan.length - 1 && <View style={styles.verticalLine} />}
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{dateStr} | {timeStr} - {endInfo.timeStr}</Text>
                      </View>

                      <View style={styles.sessionCard}>
                        <Text style={styles.className}>{item.class_name}</Text>
                        <Text style={styles.taskTitle}>{item.task_title}</Text>
                        <Text style={styles.messageText}>{item.message}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {plan.length > 0 && (
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.declineButton} onPress={() => setHasGenerated(false)}>
                <Text style={styles.declineButtonText}>{t('decline')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptPlan} disabled={isAccepting}>
                {isAccepting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.acceptButtonText}>{t('acceptPlan')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>  
          )}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSettingsVisible}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.fullWidth}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('planSettings')}</Text>
                  <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('sleepStart')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={tempSleepStart}
                  onChangeText={setTempSleepStart}
                  placeholder="23"
                />

                <Text style={styles.inputLabel}>{t('sleepEnd')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={tempSleepEnd}
                  onChangeText={setTempSleepEnd}
                  placeholder="8"
                />

                <Text style={styles.inputLabel}>{t('maxSessions')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={tempMaxSessions}
                  onChangeText={setTempMaxSessions}
                  placeholder="3"
                />

                <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
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
  container: { flex: 1, backgroundColor: '#d1e9ef', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#62119f' },
  subtitle: { fontSize: 13, color: '#aa5ed3', marginTop: 6, lineHeight: 18 },
  flexActive: { flex: 1 },
  fullWidth: { width: '100%' },
  buttonIcon: { marginRight: 8 },

  // Welcome box
  welcomeBox: { backgroundColor: '#fff', borderRadius: 16, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 30, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  
  settingsContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  settingsPreview: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 8 },
  settingsText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  editSettingsButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  editSettingsText: { fontSize: 13, color: '#8b5cf6', fontWeight: 'bold', marginLeft: 5 },

  generateButton: { backgroundColor: '#aa5ed3', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 12, alignItems: 'center', elevation: 3, marginTop: 5, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#4b5563', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },

  timelineScroll: { flex: 1, marginTop: 10 },
  timelineNode: { flexDirection: 'row', minHeight: 110 },
  leftLineColumn: { alignItems: 'center', marginRight: 15, width: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#8b5cf6', borderWidth: 3, borderColor: '#fff', zIndex: 2, elevation: 2, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', position: 'absolute', top: 12, bottom: 0 },
  
  cardContainer: { flex: 1, marginBottom: 20 },
  dateBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 6 },
  dateBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#4338ca' },
  sessionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  className: { fontSize: 12, fontWeight: 'bold', color: '#8b5cf6', textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 2 },
  messageText: { fontSize: 13, color: '#4b5563', marginTop: 8, fontStyle: 'italic' },

  emptyPlanBox: { alignItems: 'center', marginTop: 50 },
  emptyPlanText: { color: '#6b7280', textAlign: 'center', marginTop: 10, fontSize: 14 },

  // Actions
  actionContainer: { flexDirection: 'row', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#f5f7fb', alignItems: 'center' },
  declineButton: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  declineButtonText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  acceptButton: { flex: 2, backgroundColor: '#aa5ed3', flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#62119f' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16, color: '#000', marginBottom: 10 },
  saveButton: { backgroundColor: '#8b5cf6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  noTasksWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#fcd34d'
  },
  noTasksWarningText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18
  },
});
