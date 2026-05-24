import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const fetchUserClasses = async () => {
  const headers = await getHeaders();
  const response = await apiClient.get('/classes/', headers);
  return response.data;
};

export const createClass = async (classData) => {
  const headers = await getHeaders();
  const response = await apiClient.post('/classes/', classData, headers);
  return response.data;
};
