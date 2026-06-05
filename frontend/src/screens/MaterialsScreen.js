import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import {
  uploadMaterial,
  getMaterials,
  getMaterialSummary,
  getMaterialQuiz,
  deleteMaterial
} from '../api/materials';

export default function MaterialsScreen() {
  const { t } = useTranslation();

  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiQuiz, setAiQuiz] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const [selectedAnswers, setSelectedAnswers] = useState({}); // { 0: 2, 1: 0 } -> kérdésIndex: választottIndex
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMaterials();
  };

  const loadSummary = async (materialId) => {
    if (aiSummary) return;
    setIsAiLoading(true);
    try {
      const summaryData = await getMaterialSummary(materialId);
      setAiSummary(summaryData.summary || t('noSummary'));
    } catch (error) {
      console.error('Failed to fetch material summary', error);
      Alert.alert(t('errorTitle'), error.message || t('summaryFailed'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);

        if (!uploadTitle) {
          setUploadTitle(file.name.replace('.pdf', ''));
        }
      }
    } catch (error) {
      console.error('Document pick failed', error);
      Alert.alert(t('errorTitle'), t('filePickFailed'));
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !selectedFile) {
      Alert.alert(t('errorTitle'), t('pickPdf'));
      return;
    }

    setIsUploading(true);
    try {
      await uploadMaterial(
        uploadTitle,
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType
      );

      Alert.alert(t('successTitle'), t('uploadSuccess'));
      setIsUploadModalVisible(false);
      setUploadTitle('');
      setSelectedFile(null);
      loadMaterials();
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert(t('errorTitle'), error.message || t('uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      t('deleteConfirmTitle'),
      t('deleteConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel'},
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMaterial(id);
              setMaterials(prev => prev.filter(m => m.id !== id));
              if (selectedMaterial?.id === id) setIsDetailsModalVisible(false);
            } catch (error) {
              console.error(error);
              Alert.alert(t('errorTitle'), error.message || t('deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = async (material) => {
    setSelectedMaterial(material);
    setAiSummary('');
    setAiQuiz([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);

    setActiveTab('menu');
    setIsDetailsModalVisible(true);
    setIsAiLoading(true);

    try {
      const summaryData = await getMaterialSummary(material.id);
      setAiSummary(summaryData.summary || t('noSummary'));
    } catch (error) {
      console.error('Failed to fetch material summary', error);
      Alert.alert(t('errorTitle'), error.message || t('summaryFailed'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (!selectedMaterial) return;

    if (tab === 'summary') {
      await loadSummary(selectedMaterial.id);
    } else if (tab === 'quiz' && (!aiQuiz || aiQuiz.length === 0)) {
      setIsAiLoading(true);
      try {
        const quizData = await getMaterialQuiz(selectedMaterial.id);
        console.log('Received quiz data:', quizData);
        setAiQuiz(quizData.quiz || []);
        setSelectedAnswers({});
        setQuizSubmitted(false);
      } catch (error) {
        console.error(error);
        Alert.alert(t('errorTitle'), error.message || t('quizFailed'));
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const handleSelectOption = (qIndex, oIdx) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: oIdx
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    aiQuiz.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_option_index) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fb' }}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>{t('myMaterials')}</Text>
        <Text style={styles.subTitle}>{t('materialsSubtitle')}</Text>

        <FlatList
          data={materials}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-attach-outline" size={50} color="#9ca3af" />
              <Text style={styles.emptyText}>{t('noMaterials')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.materialCard} onPress={() => handleViewDetails(item)}>
              <View style={styles.materialIconContainer}>
                <Ionicons name="document-text" size={28} color="#ef4444" />
              </View>
              <View style={styles.materialInfo}>
                <Text style={styles.materialTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.materialMeta}>{t('pdfDoc')}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setIsUploadModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* UPLOAD MODAL */}
      <Modal visible={isUploadModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('uploadMaterial')}</Text>
                <TouchableOpacity onPress={() => setIsUploadModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>{t('materialTitle')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('materialTitlePlace')}
                placeholderTextColor="#9ca3af"
                value={uploadTitle}
                onChangeText={setUploadTitle}
              />

              <Text style={styles.inputLabel}>{t('selectPdf')}</Text>
              <TouchableOpacity
                style={[styles.filePickerBox, selectedFile && styles.filePickerBoxSelected]}
                onPress={handlePickDocument}
              >
                <Ionicons
                  name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"}
                  size={32}
                  color={selectedFile ? "#10b981" : "#1e3a8a"}
                />
                <Text style={[styles.filePickerText, selectedFile && { color: '#10b981', fontWeight: 'bold' }]}>
                  {selectedFile ? selectedFile.name : t('pickPdf')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleUpload} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('uploadAndProcess')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal visible={isDetailsModalVisible} animationType="slide" transparent={false}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              onPress={() => {
                if (activeTab === 'menu') {
                  setIsDetailsModalVisible(false);
                } else {
                  setActiveTab('menu');
                }
              }}
              style={styles.closeDetailsBtn}
            >
              <Ionicons name={activeTab === 'menu' ? "close" : "arrow-back"} size={24} color="#1f2937" />
              <Text style={styles.detailsHeaderTitle} numberOfLines={1}>
                {activeTab === 'menu' ? selectedMaterial?.title : (activeTab === 'summary' ? t('summary') : t('quiz'))}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab !== 'menu' && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
                onPress={() => handleTabChange('summary')}
              >
                <Ionicons name="list-circle-outline" size={20} color={activeTab === 'summary' ? '#1e3a8a' : '#6b7280'} />
                <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>{t('summary')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'quiz' && styles.activeTab]}
                onPress={() => handleTabChange('quiz')}
              >
                <Ionicons name="help-circle-outline" size={20} color={activeTab === 'quiz' ? '#1e3a8a' : '#6b7280'} />
                <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>{t('quiz')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.detailsBody} showsVerticalScrollIndicator={false}>
            {isAiLoading ? (
              <View style={styles.aiLoadingBox}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.aiLoadingText}>{t('aiProcessing')}</Text>
              </View>
            ) : activeTab === 'menu' ? (
              <View style={styles.menuDashboard}>
                <Text style={styles.menuDashboardTitle}>{t('whatWouldYouLikeToDo')}</Text>

                <TouchableOpacity style={styles.menuLaunchBtn} onPress={() => handleTabChange('summary')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="list-circle" size={32} color="#1e3a8a" />
                  </View>
                  <View style={styles.menuBtnTextBox}>
                    <Text style={styles.menuBtnTitle}>{t('summary')}</Text>
                    <Text style={styles.menuBtnDesc}>{t('summaryDesc')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuLaunchBtn} onPress={() => handleTabChange('quiz')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
                    <Ionicons name="help-circle" size={32} color="#10b981" />
                  </View>
                  <View style={styles.menuBtnTextBox}>
                    <Text style={styles.menuBtnTitle}>{t('quiz')}</Text>
                    <Text style={styles.menuBtnDesc}>{t('quizDesc')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ) : activeTab === 'summary' ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryHeadline}>{t('keySummaryPoint')}</Text>
                <Text style={styles.summaryText}>{aiSummary}</Text>
              </View>
            ) : (
              <View style={styles.quizBox}>
                <Text style={styles.summaryHeadline}>{t('testYourKnowledge')}</Text>

                {quizSubmitted && (
                  <View style={styles.scoreBanner}>
                    <Ionicons name="trophy" size={24} color="#f59e0b" />
                    <Text style={styles.scoreText}>{t('yourScore')}: {calculateScore()} / {aiQuiz.length} ({Math.round((calculateScore() / aiQuiz.length) * 100)}%)</Text>
                  </View>
                )}

                {aiQuiz && aiQuiz.length > 0 ? (
                  aiQuiz.map((q, index) => {
                    const questionText = q.question_text || q.text;
                    return (
                      <View key={index} style={styles.quizCard}>
                        <Text style={styles.quizQuestion}>{index + 1}. {questionText}</Text>

                        {(q.options || []).map((opt, oIdx) => {
                          const isSelected = selectedAnswers[index] === oIdx;
                          const isCorrect = q.correct_option_index === oIdx;

                          let optionStyle = styles.quizOptionBox;
                          let optionTextStyle = styles.quizOptionText;

                          if (quizSubmitted) {
                            if (isCorrect) {
                              optionStyle = [styles.quizOptionBox, styles.correctOption];
                              optionTextStyle = styles.correctOptionText;
                            } else if (isSelected && !isCorrect) {
                              optionStyle = [styles.quizOptionBox, styles.wrongOption];
                              optionTextStyle = styles.wrongOptionText;
                            }
                          } else if (isSelected) {
                            optionStyle = [styles.quizOptionBox, styles.selectedOption];
                            optionTextStyle = styles.selectedOptionText;
                          }

                          return (
                            <TouchableOpacity
                              key={oIdx}
                              style={optionStyle}
                              onPress={() => handleSelectOption(index, oIdx)}
                              disabled={quizSubmitted}
                            >
                              <View style={styles.optionRow}>
                                <Text style={optionTextStyle}>{opt}</Text>
                                {quizSubmitted && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                                {quizSubmitted && isSelected && !isCorrect && <Ionicons name="close-circle" size={18} color="#ef4444" />}
                              </View>
                            </TouchableOpacity>
                          );
                        })}

                        {quizSubmitted && q.explanation && (
                          <View style={styles.explanationBox}>
                            <Text style={styles.explanationTitle}>{t('answerExplanation')}</Text>
                            <Text style={styles.explanationText}>{q.explanation}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>{t('noQuiz')}</Text>
                )}

                {aiQuiz && aiQuiz.length > 0 && (
                  !quizSubmitted ? (
                    <TouchableOpacity
                      style={[styles.submitQuizBtn, Object.keys(selectedAnswers).length < aiQuiz.length && styles.disabledBtn]}
                      onPress={() => setQuizSubmitted(true)}
                    >
                      <Text style={styles.submitQuizBtnText}>{t('submitQuiz')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.restartQuizBtn} onPress={handleRestartQuiz}>
                      <Ionicons name="refresh" size={20} color="#1e3a8a" style={{ marginRight: 6 }} />
                      <Text style={styles.restartQuizBtnText}>{t('restartQuiz')}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' },
  screenTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e3a8a', marginTop: 10 },
  subTitle: { fontSize: 13, color: '#6b7280', marginTop: 5, marginBottom: 20, lineHeight: 18 },
  
  materialCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  materialIconContainer: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 10 },
  materialInfo: { flex: 1, marginLeft: 15 },
  materialTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  materialMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  deleteBtn: { padding: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1e3a8a', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16, color: '#000', marginBottom: 15 },
  
  filePickerBox: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#3b82f6', backgroundColor: '#eff6ff', borderRadius: 8, padding: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  filePickerBoxSelected: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  filePickerText: { marginTop: 8, fontSize: 14, color: '#1e3a8a' },
  
  saveButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  detailsContainer: { flex: 1, backgroundColor: '#f5f7fb', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  detailsHeader: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  closeDetailsBtn: { flexDirection: 'row', alignItems: 'center' },
  detailsHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginLeft: 10, flex: 1 },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1e3a8a' },
  tabText: { fontSize: 14, color: '#6b7280', marginLeft: 6, fontWeight: '500' },
  activeTabText: { color: '#1e3a8a', fontWeight: 'bold' },
  
  detailsBody: { flex: 1, padding: 20 },
  aiLoadingBox: { alignItems: 'center', marginTop: 60 },
  aiLoadingText: { marginTop: 15, color: '#4b5563', fontSize: 14, textAlign: 'center' },
  
  summaryBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  summaryHeadline: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 15 },
  summaryText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  
  quizBox: { marginBottom: 50 },
  quizCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
  quizQuestion: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, lineHeight: 20 },
  
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizOptionBox: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  quizOptionText: { fontSize: 14, color: '#4b5563', flex: 1 },
  
  selectedOption: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  selectedOptionText: { color: '#1e40af', fontWeight: '600' },
  
  correctOption: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  correctOptionText: { color: '#065f46', fontWeight: 'bold' },
  
  wrongOption: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  wrongOptionText: { color: '#991b1b', fontWeight: '600' },

  scoreBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#fde68a' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: '#92400e', marginLeft: 10 },

  explanationBox: { marginTop: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  explanationTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 2 },
  explanationText: { fontSize: 13, color: '#4b5563', lineHeight: 18, fontStyle: 'italic' },

  submitQuizBtn: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 2 },
  disabledBtn: { backgroundColor: '#9ca3af', elevation: 0 },
  submitQuizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  restartQuizBtn: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: '#1e3a8a' },
  restartQuizBtnText: { color: '#1e3a8a', fontSize: 16, fontWeight: 'bold' },

  menuDashboard: { marginTop: 10, paddingBottom: 30 },
  menuDashboardTitle: { fontSize: 16, fontWeight: '600', color: '#4b5563', marginBottom: 20, textAlign: 'center' },
  menuLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconBox: { padding: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuBtnTextBox: { flex: 1, marginLeft: 15, paddingRight: 10 },
  menuBtnTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  menuBtnDesc: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 18 }
});
