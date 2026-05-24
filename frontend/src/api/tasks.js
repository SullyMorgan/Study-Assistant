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

export const fetchTasks = async () => {
  try {
    const headers = await getHeaders();
    const response = await apiClient.get('/tasks/', headers);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error.response ? error.response.data : new Error('Failed to fetch tasks');
  }
};

export const getActiveTasks = async () => {
  try {
    const headers = await getHeaders();
    const response = await apiClient.get('/tasks/', headers);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch tasks');
  }
};

export const toggleTask = async (taskId) => {
  try {
    const headers = await getHeaders();
    const response = await apiClient.put(`/tasks/${taskId}/toggle`, {}, headers);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to toggle task');
  }
};

export const createTask = async (taskData) => {
  try {
    const headers = await getHeaders();
    const response = await apiClient.post('/tasks/', taskData, headers);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to create task');
  }
};

export const fetchClasses = async () => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await apiClient.get('/classes/', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
