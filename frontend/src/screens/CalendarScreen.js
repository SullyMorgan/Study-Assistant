import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fetchTasks, fetchClasses } from '../api/tasks';
import { getAcceptedSessions } from '../api/planner';
import { createSchedules, fetchSchedules } from '../api/schedule';

export default function CalendarScreen({ navigation }) {
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [aiSessions, setAiSessions] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isRecurring, setIsRecurring] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [dayAgenda, setDayAgenda] = useState([]);

  const loadCalendarData = async () => {
    try {
      const fetchedTasks = await fetchTasks().catch(() => []);
      const fetchedClasses = await fetchClasses().catch(() => []);
      const fetchedSessions = await getAcceptedSessions().catch(() => []);
      const fetchedSchedules = await fetchSchedules().catch(() => []); // 🌟 Fix órák lekérése!

      const formattedAiSessions = fetchedSessions
        .map(session => {
        const startDate = new Date(session.start_time);
        const endDate = new Date(session.end_time);

        const dateKey = startDate.toISOString().split('T')[0];
        const startTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: `ai-${session.id}`,
          title: `Study for: ${session.task_title || 'Task'}`,
          className: session.class_name,
          date: dateKey,
          startTime: startTimeStr,
          endTime: endTimeStr,
          color: '#8b5cf6'
        };
      });

      setTasks(fetchedTasks);
      setClasses(fetchedClasses);
      setAiSessions(formattedAiSessions);
      setUserSchedules(fetchedSchedules);

      processCalendarEvents(fetchedTasks, fetchedClasses, formattedAiSessions, fetchedSchedules, selectedDate);

    } catch (error) {
      console.error("Hiba a naptár adatok betöltésekor:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCalendarData();
  };

  const handleSaveSchedule = async () => {
    if (!eventTitle.trim()) {
      Alert.alert(t('errorTitle'), t('fillEventTitle'));
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert(t('errorTitle'), t('invalidTimeFormat'));
      return;
    }

    try {
      const weeksToLoop = isRecurring ? 4 : 1;

      let currentTargetDate = new Date(selectedDate);

      for (let i = 0; i < weeksToLoop; i++) {
        const dateString = currentTargetDate.toISOString().split('T')[0];

        const startDateTimeISO = `${dateString}T${startTime}:00`;
        const endDateTimeISO = `${dateString}T${endTime}:00`;

        const payload = {
          title: eventTitle,
          start_time: startDateTimeISO,
          end_time: endDateTimeISO,
          is_recurring: isRecurring
        };

        await createSchedules(payload);

        currentTargetDate.setDate(currentTargetDate.getDate() + 7);
      }

      Alert.alert(t('successTitle'), t('scheduleCreatedSuccess'));
      setModalVisible(false);
      setEventTitle('');
      setStartTime('10:00');
      setEndTime('11:00');
      setIsRecurring(false);
      
      loadCalendarData();
    } catch (error) {
      console.error(error);
      Alert.alert(t('errorTitle'), error.detail || t('scheduleCreationFailed'));
    }
  };

  const processCalendarEvents = (allTasks, allClasses, allAi, allSchedules = [], targetDate) => {
    const marks = {};

    allTasks.forEach(task => {
      if (!task.deadline) return;
      if (task.is_completed || task.completed || task.status === 'completed') return;
      const dateKey = task.deadline.split('T')[0];
      
      if (!marks[dateKey]) marks[dateKey] = { dots: [] };
      
      const isExam = task.type === 'exam';
      marks[dateKey].dots.push({
        key: `task-${task.id}`,
        color: isExam ? '#ef4444' : '#3b82f6',
      });
    });

    allAi.forEach(session => {
      if (session.status === "completed") return;

      const dateKey = session.date;
      if (!marks[dateKey]) marks[dateKey] = { dots: [] };
      
      marks[dateKey].dots.push({
        key: `ai-${session.id}`,
        color: session.color || '#8b5cf6'
      });
    });

    allSchedules.forEach(sched => {
      if (!sched.start_time) return;
      const dateKey = sched.start_time.split('T')[0];
      if (!marks[dateKey]) marks[dateKey] = { dots: [] };
      
      marks[dateKey].dots.push({
        key: `sched-${sched.id}`,
        color: '#10b981'
      });
    });

    if (!marks[targetDate]) {
      marks[targetDate] = { selected: true, selectedColor: '#1e3a8a' };
    } else {
      marks[targetDate] = {
        ...marks[targetDate],
        selected: true,
        selectedColor: '#1e3a8a'
      };
    }

    setMarkedDates(marks);
    updateAgendaForDate(targetDate, allTasks, allClasses, allAi, allSchedules);
  };

  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);

    processCalendarEvents(tasks, classes, aiSessions, userSchedules, dateStr);
    updateAgendaForDate(dateStr, tasks, classes, aiSessions, userSchedules);
  };

  const updateAgendaForDate = (dateStr, allTasks, allClasses, allAi, allSchedules = []) => {
    const agenda = [];

    allTasks.forEach(t => {
      if (t.deadline && t.deadline.split('T')[0] === dateStr) {
        if (t.is_completed || t.completed || t.status === 'completed') return;
        agenda.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: t.type ? t.type.toUpperCase() : 'TASK',
          type: 'deadline',
          color: t.type === 'exam' ? '#ef4444' : '#3b82f6',
          icon: t.type === 'exam' ? 'school-outline' : 'document-text-outline'
        });
      }
    });

    allAi.forEach(s => {
      if (s.date === dateStr) {
        agenda.push({
          id: s.id,
          title: s.title,
          subtitle: `${s.startTime} - ${s.endTime}`,
          type: 'ai_session',
          color: '#8b5cf6',
          icon: 'sparkles-outline',
          className: s.className,
          startTime: s.startTime,
          endTime: s.endTime
        });
      }
    });

    allSchedules.forEach(sched => {
      if (sched.start_time && sched.start_time.split('T')[0] === dateStr) {
        const startT = sched.start_time.split('T')[1].substring(0, 5);
        const endT = sched.end_time.split('T')[1].substring(0, 5);
        
        agenda.push({
          id: `sched-${sched.id}`,
          title: sched.title,
          subtitle: `${startT} - ${endT} ${sched.is_recurring ? t('repeatWeekly') : ''}`,
          type: 'user_schedule',
          color: '#10b981',
          icon: 'calendar-outline'
        });
      }
    });

    setDayAgenda(agenda);
  };

  const formatHeaderDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markingType={'multi-dot'}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#fffdfa',
              calendarBackground: '#fffdfa',
              textSectionTitleColor: '#a8a29e',
              selectedDayBackgroundColor: '#62119f',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#16a34a',
              dayTextColor: '#44403c',
              textDisabledColor: '#e7e5e4',
              dotColor: '#f97316',
              selectedDotColor: '#ffffff',
              arrowColor: '#62119f',
              disabledArrowColor: '#e7e5e4',
              monthTextColor: '#62119f',
              indicatorColor: 'orange',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12
            }}
          />
        </View>

        {/* daily schedule */}
        <View style={styles.agendaContainer}>
          <Text style={styles.agendaTitle}>{formatHeaderDate(selectedDate)}</Text>
          
          {dayAgenda.length === 0 ? (
            <View style={styles.emptyAgendaBox}>
              <Ionicons name="cafe-outline" size={36} color="#78716c" />
              <Text style={styles.emptyAgendaText}>{t('noTasksOrStudySessions')}</Text>
            </View>
          ) : (
            dayAgenda.map((item) => {
              const isAiSession = item.type === 'ai_session' || (typeof item.id === 'string' && item.id.startsWith('ai-'));

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.agendaCard, { borderLeftColor: item.color }]}
                  disabled={!isAiSession}
                  onPress={() => {
                    const numericId = typeof item.id === 'string'
                      ? parseInt(item.id.replace('ai-', ''), 10)
                      : item.id;

                    navigation.navigate('StudySession', {
                      sessionId: numericId,
                      taskTitle: item.title,
                      className: item.className,
                      plannedDuration: item.duration || 90
                    });
                  }}
                  activeOpacity={isAiSession ? 0.7 : 1}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color || '#62119f'} />
                  </View>
                  <View style={styles.agendaInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={[styles.eventSubtitle, { color: item.color }]}>{item.subtitle}</Text>
                      </View>
                      {isAiSession && (
                        <Ionicons name="play-circle" size={26} color={item.color} style={{ marginLeft: 10 }} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addFixedProgram')}</Text>
            <Text style={{ color: '#6b7280', marginBottom: 15 }}>{t('selectedDate')}: {selectedDate}</Text>

            <TextInput 
              style={styles.input} 
              placeholder={t('programTitlePlace')} 
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>{t('startTime')} (HH:MM)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="10:00" 
                  value={startTime}
                  onChangeText={setStartTime}
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('endTime')} (HH:MM)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="11:30" 
                  value={endTime}
                  onChangeText={setEndTime}
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={{ fontWeight: '600', color: '#374151' }}>{t('repeatWeekly.')}</Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSchedule}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' },
  calendarContainer: {
    backgroundColor: '#fffdfa',
    borderRadius: 16,
    margin: 15,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: '#7c2d12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  agendaContainer: { paddingHorizontal: 20, marginTop: 5 },
  agendaTitle: { fontSize: 18, fontWeight: 'bold', color: '#62119f', marginBottom: 15, textTransform: 'capitalize' },
  
  agendaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdfa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#f5e0cf',
    borderWidth: 0,
    borderColor: '#62119f'
  },
  iconContainer: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  agendaInfo: { flex: 1, marginLeft: 15 },
  eventTitle: { fontSize: 15, fontWeight: 'bold', color: '#44403c' },
  eventSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  emptyAgendaBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fffdfa', borderRadius: 12, borderWidth: 0, borderColor: '#e7e5e4', borderStyle: 'dashed' },
  emptyAgendaText: { color: '#78716c', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#aa5ed3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#aa5ed3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(68,64,60,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fffdfa', width: '85%', padding: 25, borderRadius: 16, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#62119f', marginBottom: 5 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#78716c', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e7e5e4', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#44403c', backgroundColor: '#fff' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  cancelBtn: { padding: 12, marginRight: 15 },
  saveBtn: { backgroundColor: '#aa5ed3', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, justifyContent: 'center' }
});
