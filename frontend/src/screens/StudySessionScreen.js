import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { completeStudySession } from '../api/sessions';

export default function StudySessionScreen({ route, navigation }) {
  const { t } = useTranslation();

  const params = route.params || {};

  const rawId = params.sessionId;
  let parsedId = null;

  if (rawId !== undefined && rawId !== null) {
    const num = Number(rawId);
    parsedId = !isNaN(num) ? num : null;
  }

  const sessionId = parsedId;
  const className = params.className || '';
  const taskTitle = params.taskTitle || '';
  const plannedDuration = params.plannedDuration || 90;

  const INITIAL_SECONDS = (plannedDuration || 90) * 60;
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const currentTotalElapsed = accumulatedTimeRef.current + elapsedTime;

        const nextSecondsLeft = INITIAL_SECONDS - currentTotalElapsed;

        if (nextSecondsLeft <= 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          setSecondsLeft(0);
          handleSessionFinished(Math.round(INITIAL_SECONDS / 60));
        } else {
          setSecondsLeft(nextSecondsLeft);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);

        if (startTimeRef.current) {
          accumulatedTimeRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
        }
      }
    }
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const getActualMinutesStudied = () => {
    let totalElapsedSeconds = accumulatedTimeRef.current;
    if (isActive && startTimeRef.current) {
      totalElapsedSeconds += Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    const mins = Math.round(totalElapsedSeconds / 60);
    return mins > 0 ? mins : 1;
  };

  const handleStopSession = () => {
    setIsActive(false);
    Alert.alert(
      t('endSessionTitle'),
      t('endSessionMsg'),
      [
        { text: t('continueStudy'), style: 'cancel', onPress: () => setIsActive(true) },
        {
          text: t('endSession'),
          style: 'destructive',
          onPress: () => handleSessionFinished(getActualMinutesStudied())
        }
      ]
    );
  };

  const handleSessionFinished = async (actualMinutes) => {
    if (!sessionId) {
      Alert.alert(t('errorTitle'), t('sessionNotFound'));
      navigation.goBack();
      return;
    }

    setIsSaving(true);
    try {
      await completeStudySession(sessionId, actualMinutes);

      Alert.alert(
        t('successTitle'),
        t('sessionSavedMsg'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert(t('errorTitle'), error.message || t('failedToSaveSession'));
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercent = ((INITIAL_SECONDS - secondsLeft) / INITIAL_SECONDS) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.classText}>{className ? className.toUpperCase() : ''}</Text>
        <Text style={styles.taskText}>{taskTitle}</Text>
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.outerCircle}>
          <Text style={styles.countdownText}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.targetText}>{t('target')}: {plannedDuration} min</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStopSession} disabled={isSaving}>
          <Ionicons name="square" size={24} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, isActive ? styles.pauseActive : styles.playActive]}
          onPress={() => setIsActive(!isActive)}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={isActive ? "pause" : "play"} size={36} color="#fff" />
          )}
        </TouchableOpacity>

        <View style={styles.placeholderBtn}>
          <Ionicons name="sparkles-outline" size={24} color="#8b5cf6" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 30 },
  infoBox: { alignItems: 'center', marginTop: 20 },
  classText: { color: '#8b5cf6', fontSize: 14, fontWeight: 'bold', trackingLetter: 2 },
  taskText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  
  timerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  outerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    borderColor: '#1e293b',
    backgroundColor: '#1e293b40',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  countdownText: { color: '#fff', fontSize: 48, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  targetText: { color: '#94a3b8', fontSize: 14, marginTop: 10, fontWeight: '500' },
  
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20, width: '100%' },
  stopButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  playButton: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  playActive: { backgroundColor: '#8b5cf6' },
  pauseActive: { backgroundColor: '#64748b' },
  placeholderBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' }
});
