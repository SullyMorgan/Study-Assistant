import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response.data.access_token) {
      await AsyncStorage.setItem('userToken', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('userToken');
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const response = await apiClient.put(
      '/auth/change-password',
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Password change failed');
  }
};
