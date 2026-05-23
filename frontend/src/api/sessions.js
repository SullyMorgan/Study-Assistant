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
      value: expoPushToken,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to register push token');
  }
};
