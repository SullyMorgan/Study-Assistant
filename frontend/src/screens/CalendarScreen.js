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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fetchSchedules, createSchedules } from '../api/schedule';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000));

  const [pickerMode, setPickerMode] = useState('date');
  const [activeTarget, setActiveTarget] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const loadSchedules = async () => {
    try {
      const data = await fetchSchedules();
      const sortedData = data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      setEvents(sortedData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSchedules();
  };

  const combineDateAndTime = (dateObj, timeObj) => {
    const combined = new Date(dateObj);
    combined.setHours(timeObj.getHours());
    combined.setMinutes(timeObj.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const handleCreateSchedules = async () => {
    if (!title.trim()) {
      alert(t('fillAllFields'));
      return;
    }

    const finalStart = combineDateAndTime(selectedDate, startTime);
    const finalEnd = combineDateAndTime(selectedDate, endTime);

    if (finalEnd <= finalStart) {
      alert(t('endTimeError'));
      return;
    }

    setIsSaving(true);
    try {
      const newEvent = await createSchedules({
        title: title,
        start_time: finalStart.toISOString(),
        end_time: finalEnd.toISOString(),
        is_recurring: false
      });

      setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      setTitle('');
      setIsModalVisible(false);
    } catch (error) {
      console.error(error);
      alert(t('scheduleCreateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const onPickerChange = (event, date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (!date) return;

    if (activeTarget === 'dateOnly') {
      setShowPicker(false);
      setSelectedDate(date);
    } else if (activeTarget === 'start') {
      if (pickerMode === 'date') {
        setSelectedDate(date);
        setPickerMode('time');
      } else {
        setShowPicker(false);
        setStartTime(date);
      }
    } else if (activeTarget === 'end') {
      if (pickerMode === 'date') {
        setSelectedDate(date);
        setPickerMode('time');
      } else {
        setShowPicker(false);
        setEndTime(date);
      }
    }
  };

  const openPicker = (target, mode) => {
    setActiveTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} @ ${timeStr}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fb' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.screenTitle}>{t('calendar')}</Text>
        <Text style={styles.subTitle}>{t('setYourSchedule')}</Text>

        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>{t('yourEvents')}</Text>

          {events.length === 0 ? (
            <Text style={styles.emptyText}>{t('noEvents')}</Text>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.dateText}>{new Date(event.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                </View>
                <View style={styles.timelineDivider}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDuration}>
                    Until: {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    {new Date(event.end_time).getDate() !== new Date(event.start_time).getDate() ? ' (+1 day)' : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="calendar-number-outline" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={{ width: '100%' }}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('createSchedule') || 'Add Busy Block'}</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('taskTitle') || 'Activity/Routine Title'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('taskTitlePlace') || 'e.g., Working shift, Linear Algebra Exam'}
                  placeholderTextColor="#9ca3af"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>{t('whichDay')}</Text>
                <TouchableOpacity style={styles.fullWidthPickerBtn} onPress={() => openPicker('dateOnly', 'date')}>
                  <Ionicons name="calendar-outline" size={20} color="#1e3a8a" style={{ marginRight: 10 }} />
                  <Text style={styles.pickerBtnText}>
                    {selectedDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('whatTime')}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                  <TouchableOpacity style={styles.timePickerBtn} onPress={() => openPicker('start', 'time')}>
                    <Text style={styles.timePickerLabel}>{t('startTime')}</Text>
                    <Text style={styles.timePickerValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.timePickerBtn} onPress={() => openPicker('end', 'time')}>
                    <Text style={styles.timePickerLabel}>{t('endTime')}</Text>
                    <Text style={styles.timePickerValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                </View>

                {showPicker && (
                  <DateTimePicker
                    value={activeTarget === 'start' ? startTime : activeTarget === 'end' ? endTime : selectedDate}
                    mode={pickerMode}
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickerChange}
                  />
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleCreateSchedules} disabled={isSaving}>
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
  screenTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e3a8a', marginTop: 30 },
  subTitle: { fontSize: 14, color: '#6b7280', marginTop: 5, marginBottom: 25, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 20 },
  
  timelineContainer: { marginTop: 10 },
  timelineItem: { flexDirection: 'row', height: 85 },
  timeBlock: { width: 70, justifyContent: 'flex-start', paddingTop: 4 },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  dateText: { fontSize: 11, color: '#6b7280', marginTop: 2, fontWeight: '500' },
  
  timelineDivider: { alignItems: 'center', marginHorizontal: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563eb', zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginTop: -4 },
  
  eventCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, height: 68, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center' },
  eventTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  eventDuration: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  
  emptyText: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1e3a8a', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 8, marginTop: 5 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16, color: '#000', marginBottom: 15 },
  
  fullWidthPickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 14, borderRadius: 8, marginBottom: 15 },
  pickerBtnText: { fontSize: 15, color: '#1f2937', fontWeight: '500' },

  timePickerBtn: { flex: 1, backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  timePickerLabel: { fontSize: 11, fontWeight: 'bold', color: '#6b7280' },
  timePickerValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  
  saveButton: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
