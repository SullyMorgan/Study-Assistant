import apiClient from './client';

export const getStudyPlan = async (sleepStart = 23, sleepEnd = 8, maxSessions = 3) => {
  try {
    const response = await apiClient.get('/generate/plan', {
      params: {
        sleep_start: sleepStart,
        sleep_end: sleepEnd,
        max_sessions_per_day: maxSessions,
      },
    });
    return response.data.suggested_plan;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to generate plan');
  }
};

export const acceptStudyPlan = async (plan) => {
  try {
    const response = await apiClient.post('/generate/accept-plan', {
      suggested_plan: plan
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to accept plan');
  }
};

export const getAcceptedSessions = async () => {
  try {
    const response = await apiClient.get('/generate/accepted-calendar-sessions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch accepted sessions', error);
    return [];
  }
};
