import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchSchedules = async () => {
  const headers = await getHeaders();
  const response = await apiClient.get('/schedule/', headers);
  return response.data;
};

export const createSchedules = async (scheduleData) => {
  const headers = await getHeaders();
  const response = await apiClient.post('/schedule/', scheduleData, headers);
  return response.data;
};
