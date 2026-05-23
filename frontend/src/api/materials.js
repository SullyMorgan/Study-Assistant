import apiClient from './client';

export const uploadMaterial = async (title, fileUri, fileName, fileType, classId = null, taskId = null) => {
  try {
    const formData = new FormData();
    formData.append('title', title);

    if (classId) formData.append('class_id', classId);
    if (taskId) formData.append('task_id', taskId);

    formData.append('file', {
      uri: fileUri,
      name: fileName || 'upload.pdf',
      type: fileType || 'application/pdf',
    });

    const response = await apiClient.post('/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to upload material');
  }
};

export const getMaterials = async (classId = null) => {
  try {
    const params = classId ? { class_id: classId } : {};
    const response = await apiClient.get('/materials/', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch materials');
  }
};

export const getMaterialSummary = async (materialId) => {
  try {
    const response = await apiClient.get(`/materials/${materialId}/summary`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to generate summary');
  }
};

export const getMaterialQuiz = async (materialId) => {
  try {
    const response = await apiClient.get(`/materials/${materialId}/quiz`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to generate quiz');
  }
};

export const deleteMaterial = async (materialId) => {
  try {
    await apiClient.delete(`/materials/${materialId}`);
    return true;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to delete material');
  }
};
