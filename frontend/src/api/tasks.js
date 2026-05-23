import apiClient from './client';

export const getActiveTasks = async () => {
  try {
    const response = await apiClient.get('/tasks/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch tasks');
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await apiClient.post('/tasks/', taskData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to create task');
  }
};
