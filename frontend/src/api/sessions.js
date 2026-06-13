import apiClient from './client';

export const getUserSessions = async () => {
  try {
    const response = await apiClient.get('/sessions/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch sessions');
  }
};

export const completeStudySession = async (sessionId, actualDurationMinutes) => {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/complete`, null, {
      params: {
        actual_duration_minutes: actualDurationMinutes,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to complete session');
  }
};

export const registerPushToken = async (expoPushToken) => {
  try {
    const response = await apiClient.post('/sessions/register-push', {
      token: expoPushToken,
    });
    return response.data;
  } catch (error) {
    console.log('MESSAGE:', error.message);
    console.log('CODE:', error.code);
    console.log('STATIS:', error.response?.status);
    console.log('RESPONSE:', error.response?.data);
    throw error.response ? error.response.data : new Error('Failed to register push token');
  }
};
