import { BASE_URL } from '@/config/api';
import React, { useState, useEffect, createElement } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, useWindowDimensions, Image, ActivityIndicator
} from 'react-native';
import { ArrowLeft, ChevronDown, FileText, Code, Users, Briefcase, Upload, Download, Save, Clock, Trash2, Calendar, HelpCircle, Sparkles, Plus, Check, ChevronUp, Info, Zap } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StartupCreateAssessment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string);
  const editId = (params.editId as string);
  const { colors, isDark } = useAppTheme();

  const [description, setDescription] = useState('');
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);
  
  // Job Data
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [openJobDropdown, setOpenJobDropdown] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  useEffect(() => {
    if (companyName) {
      fetchJobs();
    }
    if (editId) {
      fetchAssessmentForEdit();
    }
  }, [companyName, editId]);

  const fetchJobs = async () => {
    try {
      const token = await AsyncStorage.getItem('startupToken');
      const response = await fetch(`${BASE_URL}/api/startup/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs || data.data || []);
      } else if (Array.isArray(data)) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Fetch Jobs Error:', err);
    }
  };

  const fetchAssessmentForEdit = async () => {
    try {
      const token = await AsyncStorage.getItem('startupToken');
      const response = await fetch(`${BASE_URL}/api/startup/assessments/${editId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.success && data.assessment) {
        const a = data.assessment;
        setDescription(a.description || '');
        setSelectedRounds(a.selectedRounds || []);
        setSelectedJobId(a.jobId);
        setSelectedCandidates(a.assignedCandidates || []);

        if (a.mcqConfig) {
          setMcqDuration(a.mcqConfig.durationMin?.toString() || '30');
          setMcqPass(a.mcqConfig.passPercentage?.toString() || '60');
          setMcqStartDate(a.mcqConfig.startDate || '');
          setMcqStartTime(a.mcqConfig.startTime || '');
          setMcqEndDate(a.mcqConfig.endDate || '');
          setMcqEndTime(a.mcqConfig.endTime || '');
          setQuestions(a.mcqConfig.questions || []);
          setQuestionType(a.mcqConfig.questionType || 'manual');
          if (a.mcqConfig.domainConfig) setDomainConfig(a.mcqConfig.domainConfig);
        }

        if (a.codingConfig) {
          setCodingDuration(a.codingConfig.durationMin?.toString() || '45');
          setCodingPass(a.codingConfig.passPercentage?.toString() || '70');
          setCodingLang(a.codingConfig.programmingLanguage || 'JavaScript');
          setCodingStartDate(a.codingConfig.startDate || '');
          setCodingStartTime(a.codingConfig.startTime || '');
          setCodingEndDate(a.codingConfig.endDate || '');
          setCodingEndTime(a.codingConfig.endTime || '');
          setStarterCode(a.codingConfig.starterCode || '');
          setTestCases(a.codingConfig.testCases || [{ id: 1, input: '', output: '' }]);
        }

        if (a.interviewConfig) {
          setInterviewDuration(a.interviewConfig.durationMin?.toString() || '30');
          setInterviewStartDate(a.interviewConfig.startDate || '');
          setInterviewStartTime(a.interviewConfig.startTime || '');
          setInterviewEndDate(a.interviewConfig.endDate || '');
          setInterviewEndTime(a.interviewConfig.endTime || '');
          setInterviewLink(a.interviewConfig.meetingLink || '');
          setInterviewNotes(a.interviewConfig.notes || '');
        }
      }
    } catch (err) {
      console.error('Fetch Assessment Error:', err);
    }
  };
  
  // MCQ State
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState('manual'); // 'manual' or 'domain'
  const [openDifficultyId, setOpenDifficultyId] = useState<number | null>(null);
  const [isGeneratingMcq, setIsGeneratingMcq] = useState(false);
  
  // Domain config state
  const [domainConfig, setDomainConfig] = useState({
    topic: 'Auto-detect from job...',
    difficulty: 'Medium',
    questionsCount: '10'
  });
  const [openDomainMenu, setOpenDomainMenu] = useState<'topic' | 'difficulty' | null>(null);
  
  // Coding State
  const [testCases, setTestCases] = useState([{ id: 1, input: '', output: '' }]);
  const [isGeneratingStarterCode, setIsGeneratingStarterCode] = useState(false);
  const [codingLang, setCodingLang] = useState('JavaScript');
  const [openCodingLang, setOpenCodingLang] = useState(false);
  const [starterCode, setStarterCode] = useState(`// Write your solution here\nfunction solution(input) {\n  // Your code here\n  return result;\n}`);
  
  // Config States for Header Cards
  const [mcqDuration, setMcqDuration] = useState('30');
  const [mcqPass, setMcqPass] = useState('60');
  const [mcqStartDate, setMcqStartDate] = useState('');
  const [mcqStartTime, setMcqStartTime] = useState('');
  const [mcqEndDate, setMcqEndDate] = useState('');
  const [mcqEndTime, setMcqEndTime] = useState('');

  const [codingDuration, setCodingDuration] = useState('60');
  const [codingPass, setCodingPass] = useState('60');
  const [codingStartDate, setCodingStartDate] = useState('');
  const [codingStartTime, setCodingStartTime] = useState('');
  const [codingEndDate, setCodingEndDate] = useState('');
  const [codingEndTime, setCodingEndTime] = useState('');

  const [interviewDuration, setInterviewDuration] = useState('45');
  const [interviewStartDate, setInterviewStartDate] = useState('');
  const [interviewStartTime, setInterviewStartTime] = useState('');
  const [interviewEndDate, setInterviewEndDate] = useState('');
  const [interviewEndTime, setInterviewEndTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
    // Auto-calculate MCQ End Time
  React.useEffect(() => {
    // 1. Sync Date
    if (mcqStartDate && !mcqEndDate) {
      setMcqEndDate(mcqStartDate);
    }
    
    // 2. Sync Time (independent of date)
    if (mcqStartTime && mcqDuration) {
      try {
        const dummyDate = mcqStartDate || new Date().toISOString().split('T')[0];
        // Ensure time format is HH:mm. HTML time input might sometimes add seconds (HH:mm:ss).
        const timePart = mcqStartTime.length === 5 ? mcqStartTime + ':00' : mcqStartTime;
        
        const start = new Date(`${dummyDate}T${timePart}`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(mcqDuration) * 60000);
          
          if (mcqStartDate) {
            const y = end.getFullYear();
            const m = String(end.getMonth() + 1).padStart(2, '0');
            const d = String(end.getDate()).padStart(2, '0');
            setMcqEndDate(`${y}-${m}-${d}`);
          }
          
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          setMcqEndTime(`${hh}:${mm}`);
        }
      } catch (e) {}
    }
  }, [mcqStartDate, mcqStartTime, mcqDuration]);

      const handleCodingLangChange = async (lang: string) => {
    setCodingLang(lang);
    setOpenCodingLang(false);
    setIsGeneratingStarterCode(true);

    try {
      const formData = new FormData();
      const prompt = `System Instructions: You are a coding assistant. Provide ONLY the raw starter code template for ${lang}. Do not use markdown backticks, do not explain, just return the code. Ensure the function signature is generic.

User Message: Give me a starter code template for ${lang}`;
      
      formData.append('message', prompt);

      const response = await fetch('https://ai-agent-v01.onrender.com/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      const aiResponse = data.reply || data.response || data.message || data.text || data.answer || data.result;
      if (aiResponse) {
        setStarterCode(aiResponse.trim());
      }
    } catch (err) {
      console.error('Error generating starter code:', err);
    } finally {
      setIsGeneratingStarterCode(false);
    }
  };

  // Auto-calculate Coding End Time
  React.useEffect(() => {
    if (codingStartDate && !codingEndDate) {
      setCodingEndDate(codingStartDate);
    }
    if (codingStartTime && codingDuration) {
      const dummyDate = codingStartDate || new Date().toISOString().split('T')[0];
      const timePart = codingStartTime.length === 5 ? codingStartTime + ':00' : codingStartTime;
      const start = new Date(`${dummyDate}T${timePart}`);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + Number(codingDuration) * 60000);
        if (codingStartDate) {
          const y = end.getFullYear();
          const m = String(end.getMonth() + 1).padStart(2, '0');
          const d = String(end.getDate()).padStart(2, '0');
          setCodingEndDate(`${y}-${m}-${d}`);
        }
        const hh = String(end.getHours()).padStart(2, '0');
        const mm = String(end.getMinutes()).padStart(2, '0');
        setCodingEndTime(`${hh}:${mm}`);
      }
    }
  }, [codingStartDate, codingStartTime, codingDuration]);

  // Auto-calculate Interview End Time
  React.useEffect(() => {
    // 1. Sync Date
    if (interviewStartDate && !interviewEndDate) {
      setInterviewEndDate(interviewStartDate);
    }
    
    // 2. Sync Time
    if (interviewStartTime && interviewDuration) {
      try {
        const dummyDate = interviewStartDate || new Date().toISOString().split('T')[0];
        const timePart = interviewStartTime.length === 5 ? interviewStartTime + ':00' : interviewStartTime;
        
        const start = new Date(`${dummyDate}T${timePart}`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(interviewDuration) * 60000);
          
          if (interviewStartDate) {
            const y = end.getFullYear();
            const m = String(end.getMonth() + 1).padStart(2, '0');
            const d = String(end.getDate()).padStart(2, '0');
            setInterviewEndDate(`${y}-${m}-${d}`);
          }
          
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          setInterviewEndTime(`${hh}:${mm}`);
        }
      } catch (e) {}
    }
  }, [interviewStartDate, interviewStartTime, interviewDuration]);


  const addTestCase = () => setTestCases([...testCases, { id: Date.now(), input: '', output: '' }]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), correctOption: 'A', difficulty: 'Medium', points: '1', time: '60' }]);
  };

  const updateQuestionOption = (id: number, correctOption: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, correctOption } : q));
  };

  const updateQuestionDifficulty = (id: number, difficulty: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, difficulty } : q));
    setOpenDifficultyId(null);
  };

  const updateQuestionText = (id: number, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, question: text } : q));
  };

  const updateOptionText = (id: number, optLabel: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [`option${optLabel}`]: text } : q));
  };

  const updateQuestionPoints = (id: number, points: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, points } : q));
  };

  const updateQuestionTime = (id: number, time: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, time } : q));
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const toggleRound = (round: string) => {
    if (selectedRounds.includes(round)) {
      setSelectedRounds(selectedRounds.filter(r => r !== round));
    } else {
      setSelectedRounds([...selectedRounds, round]);
    }
  };

  const rounds = [
    { id: 'mcq', title: 'MCQ Assessment', desc: 'Multiple choice questions to test knowledge', icon: FileText },
    { id: 'coding', title: 'Live Coding', desc: 'Real-time coding challenge', icon: Code },
    { id: 'interview', title: 'Interview', desc: 'Face-to-face or video interview', icon: Users },
  ];

  const saveAssessment = async () => {
    if (!description.trim() && !selectedJobId) {
      alert('Please provide a description or select a job.');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('startupToken');
      const url = editId ? `${BASE_URL}/api/startup/assessments/${editId}` : `${BASE_URL}/api/startup/assessments`;
      const method = editId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: selectedJobId ? (jobs.find(j => j.id === selectedJobId)?.title + ' Assessment') : (description.substring(0, 50) || 'New Assessment'),
          description,
          total_rounds: selectedRounds.length,
          rounds: selectedRounds,
          field: 'General',
          startupId: companyName,
          jobId: selectedJobId,
          selectedCandidates,
          mcqConfig: selectedRounds.includes('mcq') ? {
            durationMin: Number(mcqDuration),
            passPercentage: Number(mcqPass),
            startDate: mcqStartDate,
            startTime: mcqStartTime,
            endDate: mcqEndDate,
            endTime: mcqEndTime,
            questions,
            questionType,
            domainConfig: questionType === 'domain' ? domainConfig : undefined
          } : undefined,
          codingConfig: selectedRounds.includes('coding') ? {
            durationMin: Number(codingDuration),
            passPercentage: Number(codingPass),
            programmingLanguage: codingLang,
            starterCode,
            testCases
          } : undefined,
          interviewConfig: selectedRounds.includes('interview') ? {
            durationMin: Number(interviewDuration),
            startDate: interviewStartDate,
            startTime: interviewStartTime,
            endDate: interviewEndDate,
            endTime: interviewEndTime,
            meetingLink: interviewLink,
            notes: interviewNotes
          } : undefined
        })
      });
      const data = await response.json();
      if (data.success || response.ok) {
        alert('Assessment Saved Successfully!');
        router.back();
      } else {
        alert('Failed to save assessment: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving assessment. Check server connection.');
    }
  };

  
  const handleGenerateMcqAI = async () => {
    if (!domainConfig.topic || domainConfig.topic === 'Auto-detect from job...') {
      alert('Please select a valid domain/topic to generate questions.');
      return;
    }
    
    setIsGeneratingMcq(true);
    try {
      const prompt = `System Instructions: You are Vetri, an AI question generator. You must return ONLY a JSON array of objects representing multiple choice questions. No markdown, no conversational text.
Generate ${domainConfig.questionsCount} multiple choice questions about ${domainConfig.topic} at ${domainConfig.difficulty} difficulty level.
The array should be in this exact format:
[
  {
    "question": "The actual question text?",
    "difficulty": "${domainConfig.difficulty}",
    "points": 1,
    "time": 60,
    "optionA": "First option",
    "optionB": "Second option",
    "optionC": "Third option",
    "optionD": "Fourth option",
    "correctOption": "A/B/C/D",
    "explanation": "Brief explanation of the answer"
  }
]`;

      const formData = new FormData();
      formData.append('message', prompt);

      const response = await fetch('https://ai-agent-v01.onrender.com/chat', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      const aiReply = data.reply || data.response || data.message || data.text || data.answer || data.result;
      
      let jsonStr = aiReply;
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonStr = match[1];
      }
      
      const parsedQuestions = JSON.parse(jsonStr.trim());
      
      if (Array.isArray(parsedQuestions)) {
        const newQs = parsedQuestions.map((q: any, i: number) => ({
          ...q,
          id: Date.now() + i
        }));
        setQuestions(prev => [...prev, ...newQs]);
      } else {
        alert("Failed to parse generated questions correctly.");
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      alert('Failed to generate questions using AI. Please try again.');
    } finally {
      setIsGeneratingMcq(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isMobile && styles.headerMobile]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={colors.textSecondary} />
          {!isMobile && <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back to Assessments</Text>}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{editId ? 'Update Assessment' : 'Create Assessment'}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Assessment Details</Text>

          <View style={[styles.inputGroup, { zIndex: 50 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Job (optional)</Text>
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }, openJobDropdown && { borderColor: colors.primary }]}
              onPress={() => setOpenJobDropdown(!openJobDropdown)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Briefcase size={16} color={colors.textSecondary} />
                <Text style={[styles.dropdownText, { color: colors.textSecondary }, selectedJobId && { color: colors.text }]}>
                  {selectedJobId 
                    ? jobs.find(j => j.id === selectedJobId)?.title || 'Selected Job'
                    : 'Select an available job'}
                </Text>
              </View>
              <ChevronDown size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            {openJobDropdown && (
              <View style={[styles.difficultyMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <TouchableOpacity 
                      key={job.id}
                      style={[styles.difficultyMenuItem, { borderBottomColor: colors.border }, selectedJobId === job.id && { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setSelectedJobId(job.id);
                        setOpenJobDropdown(false);
                      }}
                    >
                      <Text style={[styles.difficultyMenuText, { color: colors.text }, selectedJobId === job.id && { color: '#ffffff' }]}>
                        {job.title}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No jobs found</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Job links the title to a role and loads applicants to assign. You can save round settings without a job; title falls back to your description or "Assessment".</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe what this assessment evaluates..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Applied Candidates Section */}
          {selectedJobId && (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Applied Candidates ({jobs.find(j => j.id === selectedJobId)?.applications?.length || 0})
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => {
                    const apps = jobs.find(j => j.id === selectedJobId)?.applications || [];
                    if (apps.length > 0 && selectedCandidates.length === apps.length) {
                      setSelectedCandidates([]);
                    } else {
                      setSelectedCandidates(apps.map((a: any) => a.id));
                    }
                  }}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                      {jobs.find(j => j.id === selectedJobId)?.applications?.length > 0 && selectedCandidates.length === jobs.find(j => j.id === selectedJobId)?.applications?.length ? 'Clear' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {(jobs.find(j => j.id === selectedJobId)?.applications || []).map((app: any) => {
                  const isSelected = selectedCandidates.includes(app.id);
                  return (
                    <TouchableOpacity 
                      key={app.id} 
                      style={[styles.candidateCard, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#faf5ff' }]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedCandidates(selectedCandidates.filter(id => id !== app.id));
                        } else {
                          setSelectedCandidates([...selectedCandidates, app.id]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                          {isSelected && <Check size={12} color="#ffffff" />}
                        </View>
                      </View>
                      
                      <View style={styles.candidateInfo}>
                        {app.user?.profilePhoto || app.profilePhoto ? (
                          <Image source={{ uri: (app.user?.profilePhoto || app.profilePhoto)?.startsWith('data:') ? (app.user?.profilePhoto || app.profilePhoto) : `${BASE_URL}/${app.user?.profilePhoto || app.profilePhoto}` }} style={styles.candidateAvatar} />
                        ) : (
                          <View style={[styles.candidateAvatarPlaceholder, { backgroundColor: colors.inputBg }]}>
                            <Text style={[styles.candidateInitials, { color: colors.textSecondary }]}>{(app.fullName || app.user?.fullName || 'U').substring(0, 2).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.candidateName, { color: colors.text }]}>{app.fullName || app.user?.fullName || 'Unknown Candidate'}</Text>
                          <Text style={[styles.candidateEmail, { color: colors.textSecondary }]}>{app.email || app.user?.email || 'No email'} • new</Text>
                        </View>
                        <TouchableOpacity style={[styles.viewProfileBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}>
                          <Text style={[styles.viewProfileText, { color: colors.primary }]}>View Profile</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {(!jobs.find(j => j.id === selectedJobId)?.applications || jobs.find(j => j.id === selectedJobId)?.applications.length === 0) && (
                  <View style={{ padding: 16, backgroundColor: colors.inputBg, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.textSecondary }}>No candidates have applied yet.</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Assessment Rounds ({selectedRounds.length})</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Select the rounds for your assessment process</Text>

          <View style={[styles.roundsContainer, isMobile && { flexDirection: 'column' }]}>
            {rounds.map((r) => {
              const isSelected = selectedRounds.includes(r.id);
              const Icon = r.icon;
              return (
                <TouchableOpacity 
                  key={r.id} 
                  style={[styles.roundCard, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff' }]}
                  onPress={() => toggleRound(r.id)}
                >
                  <Icon size={24} color={isSelected ? colors.primary : colors.text} style={{ marginBottom: 12 }} />
                  <Text style={[styles.roundTitle, { color: colors.text }, isSelected && { color: colors.primary }]}>{r.title}</Text>
                  <Text style={[styles.roundDesc, { color: colors.textSecondary }]}>{r.desc}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Selected Rounds Config View */}
        {selectedRounds.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 24 }}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Selected Rounds (in order)</Text>
            
            {/* Mocking the MCQ Config if 'mcq' is selected */}
            {selectedRounds.includes('mcq') && (
              <View style={styles.configContainer}>
                
                {/* Round Header Card */}
                <View style={[styles.roundConfigCard, { backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff', borderColor: isDark ? colors.primary + '40' : '#d8b4fe' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.roundNumberBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.roundNumberText}>1</Text>
                    </View>
                    <FileText size={18} color={colors.text} />
                    <Text style={[styles.configRoundTitle, { color: colors.text }]}>MCQ Assessment</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={mcqDuration} onChangeText={setMcqDuration} keyboardType="numeric" />
                    <Text style={[styles.configLabelText, { color: colors.textSecondary }]}>min</Text>
                    
                    <Text style={[styles.configLabelText, { color: colors.textSecondary, marginLeft: 12 }]}>Pass:</Text>
                    <TextInput style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={mcqPass} onChangeText={setMcqPass} keyboardType="numeric" />
                    <Text style={[styles.configLabelText, { color: colors.textSecondary }]}>%</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('mcq')}>
                      <Trash2 size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Question Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Round 1: MCQ Questions ({questions.length})</Text>
                    <ChevronUp size={20} color={colors.text} />
                  </View>
                  
                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: mcqStartDate,
                            onChange: (e: any) => setMcqStartDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: mcqStartTime,
                            onChange: (e: any) => setMcqStartTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }, { marginTop: 8 }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: mcqEndDate,
                            onChange: (e: any) => setMcqEndDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: mcqEndTime,
                            onChange: (e: any) => setMcqEndTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  {/* Tabs */}
                  <View style={styles.tabsRow}>
                    <TouchableOpacity 
                      style={[styles.tabBtn, { backgroundColor: colors.card, borderColor: colors.border }, questionType === 'manual' && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff' }]}
                      onPress={() => setQuestionType('manual')}
                    >
                      <HelpCircle size={16} color={questionType === 'manual' ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.tabText, { color: colors.textSecondary }, questionType === 'manual' && { color: colors.primary }]}>Manual Questions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tabBtn, { backgroundColor: colors.card, borderColor: colors.border }, questionType === 'domain' && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff' }]}
                      onPress={() => setQuestionType('domain')}
                    >
                      <Sparkles size={16} color={questionType === 'domain' ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.tabText, { color: colors.textSecondary }, questionType === 'domain' && { color: colors.primary }]}>Domain-Based</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Domain-Based Generation Block */}
                  {questionType === 'domain' && (
                    <View style={[styles.domainBlock, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <View style={[styles.domainInfoBanner, { backgroundColor: isDark ? colors.card : '#f1f5f9', borderColor: colors.border }]}>
                        <Info size={14} color={colors.textSecondary} />
                        <Text style={[styles.domainInfoText, { color: colors.textSecondary }]}>Link a job above to generate questions based on its description</Text>
                      </View>
                      
                      <View style={[isMobile ? { flexDirection: 'column', alignItems: 'stretch', gap: 16 } : { flexDirection: 'row', alignItems: 'flex-end', gap: 16 }, { zIndex: openDomainMenu ? 10 : 1 }]}>
                        
                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 2, marginBottom: 0, zIndex: openDomainMenu === 'topic' ? 10 : 1 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Domain / Topic</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }, openDomainMenu === 'topic' && { borderColor: colors.primary }]}
                            onPress={() => setOpenDomainMenu(openDomainMenu === 'topic' ? null : 'topic')}
                          >
                            <Text style={[styles.dropdownText, { color: colors.text }]}>{domainConfig.topic}</Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                          
                          {openDomainMenu === 'topic' && (
                            <View style={[styles.difficultyMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                              {['Auto-detect from job...', 'Frontend', 'Backend', 'Fullstack', 'Data Science', 'Mobile'].map((topic) => (
                                <TouchableOpacity 
                                  key={topic}
                                  style={[styles.difficultyMenuItem, { borderBottomColor: colors.border }, domainConfig.topic === topic && { backgroundColor: isDark ? colors.primary : '#1d4ed8' }]}
                                  onPress={() => { setDomainConfig({...domainConfig, topic}); setOpenDomainMenu(null); }}
                                >
                                  <Text style={[styles.difficultyMenuText, { color: colors.text }, domainConfig.topic === topic && { color: '#ffffff' }]}>{topic}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 1, marginBottom: 0, zIndex: openDomainMenu === 'difficulty' ? 10 : 1 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }, openDomainMenu === 'difficulty' && { borderColor: colors.primary }]}
                            onPress={() => setOpenDomainMenu(openDomainMenu === 'difficulty' ? null : 'difficulty')}
                          >
                            <Text style={[styles.dropdownText, { color: colors.text }]}>{domainConfig.difficulty}</Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                          
                          {openDomainMenu === 'difficulty' && (
                            <View style={[styles.difficultyMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                              {['Easy', 'Medium', 'Hard'].map((diff) => (
                                <TouchableOpacity 
                                  key={diff}
                                  style={[styles.difficultyMenuItem, { borderBottomColor: colors.border }]}
                                  onPress={() => { setDomainConfig({...domainConfig, difficulty: diff}); setOpenDomainMenu(null); }}
                                >
                                  <Text style={[styles.difficultyMenuText, { color: colors.text }, domainConfig.difficulty === diff && { color: colors.primary, fontWeight: '700' }]}>{diff}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 1, marginBottom: 0, zIndex: 1 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Questions</Text>
                          <TextInput 
                            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                            value={domainConfig.questionsCount} 
                            onChangeText={(text) => setDomainConfig({...domainConfig, questionsCount: text})}
                            keyboardType="numeric" 
                          />
                        </View>

                        <TouchableOpacity 
    style={[styles.generateAiBtn, { backgroundColor: colors.primary }, isMobile && { width: '100%' }, { zIndex: 1 }, isGeneratingMcq && { opacity: 0.7 }]}
    onPress={handleGenerateMcqAI}
    disabled={isGeneratingMcq}
  >
    {isGeneratingMcq ? (
      <ActivityIndicator size="small" color="#ffffff" />
    ) : (
      <>
        <Sparkles size={14} color="#ffffff" />
        <Zap size={14} color={isDark ? colors.warning : "#f59e0b"} style={{ marginLeft: -4, marginRight: 4 }} />
        <Text style={styles.generateAiBtnText}>Generate with AI</Text>
      </>
    )}
  </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Question Builder List */}
                  {questions.map((q, index) => (
                    <View key={q.id} style={[styles.questionBuilderCard, { backgroundColor: colors.card, borderColor: isDark ? colors.primary + '40' : '#d8b4fe', marginBottom: 16 }]}>
                      <View style={styles.qbHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.qBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.qBadgeText}>Q{index + 1}</Text>
                          </View>
                          <Text style={[styles.qbTitle, { color: colors.text }]}>New Question</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={[styles.difficultyBadge, q.difficulty === 'Easy' ? { backgroundColor: isDark ? colors.success + '20' : '#dcfce7' } : q.difficulty === 'Hard' ? { backgroundColor: isDark ? colors.danger + '20' : '#fee2e2' } : { backgroundColor: isDark ? colors.warning + '20' : '#fef3c7' }]}>
                            <Text style={[styles.difficultyText, q.difficulty === 'Easy' ? { color: isDark ? colors.success : '#16a34a' } : q.difficulty === 'Hard' ? { color: isDark ? colors.danger : '#ef4444' } : { color: isDark ? colors.warning : '#d97706' }]}>
                              {q.difficulty || 'Medium'}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => removeQuestion(q.id)}>
                            <Trash2 size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Question *</Text>
                        <TextInput
                          style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                          placeholder="Enter your question..."
                          placeholderTextColor={colors.textSecondary}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          value={q.question || ''}
                          onChangeText={(text) => updateQuestionText(q.id, text)}
                        />
                      </View>

                      <View style={[styles.row, isMobile && { flexDirection: 'column' }, { zIndex: openDifficultyId === q.id ? 10 : 1 }]}>
                        <View style={[styles.inputGroup, { flex: 1, zIndex: 10 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }, openDifficultyId === q.id && { borderColor: colors.primary }]}
                            onPress={() => setOpenDifficultyId(openDifficultyId === q.id ? null : q.id)}
                          >
                            <Text style={[styles.dropdownText, { color: colors.text }]}>{q.difficulty || 'Medium'}</Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                          
                          {openDifficultyId === q.id && (
                            <View style={[styles.difficultyMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                              {['Easy', 'Medium', 'Hard'].map((diff) => (
                                <TouchableOpacity 
                                  key={diff}
                                  style={[styles.difficultyMenuItem, { borderBottomColor: colors.border }]}
                                  onPress={() => updateQuestionDifficulty(q.id, diff)}
                                >
                                  <Text style={[styles.difficultyMenuText, { color: colors.text }, q.difficulty === diff && { color: colors.primary, fontWeight: '700' }]}>{diff}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, zIndex: 1 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Points</Text>
                          <TextInput style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={q.points !== undefined ? String(q.points) : "1"} onChangeText={(text) => updateQuestionPoints(q.id, text)} keyboardType="numeric" />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={[styles.label, { color: colors.textSecondary }]}>Time (sec)</Text>
                          <TextInput style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={q.time !== undefined ? String(q.time) : "60"} onChangeText={(text) => updateQuestionTime(q.id, text)} keyboardType="numeric" />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Options (select the correct answer)</Text>
                        
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <View key={opt} style={styles.optionRow}>
                            <TouchableOpacity 
                              style={[styles.optionRadio, { backgroundColor: colors.card, borderColor: colors.border }, q.correctOption === opt && { backgroundColor: isDark ? colors.success : '#22c55e', borderColor: isDark ? colors.success : '#22c55e' }]}
                              onPress={() => updateQuestionOption(q.id, opt)}
                            >
                              {q.correctOption === opt ? (
                                <Check size={14} color="#ffffff" />
                              ) : (
                                <Text style={[styles.optionRadioText, { color: colors.text }]}>{opt}</Text>
                              )}
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.textInput, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                              placeholder={`Option ${opt}`}
                              placeholderTextColor={colors.textSecondary}
                              value={q[`option${opt}`] || ''}
                              onChangeText={(text) => updateOptionText(q.id, opt, text)}
                            />
                          </View>
                        ))}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Explanation (shown after answer)</Text>
                        <TextInput
                          style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                          placeholder="Explain why this is the correct answer..."
                          placeholderTextColor={colors.textSecondary}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  ))}

                  {/* Add Question Button */}
                  <TouchableOpacity style={[styles.addQuestionBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={addQuestion}>
                    <Plus size={16} color={colors.textSecondary} />
                    <Text style={[styles.addQuestionText, { color: colors.textSecondary }]}>Add Question</Text>
                  </TouchableOpacity>

                </View>
              </View>
            )}

            {/* Mocking the Coding Config if 'coding' is selected */}
            {selectedRounds.includes('coding') && (
              <View style={styles.configContainer}>
                
                {/* Round Header Card */}
                <View style={[styles.roundConfigCard, { backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff', borderColor: isDark ? colors.primary + '40' : '#d8b4fe' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.roundNumberBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.roundNumberText}>{selectedRounds.indexOf('coding') + 1}</Text>
                    </View>
                    <Code size={18} color={colors.text} />
                    <Text style={[styles.configRoundTitle, { color: colors.text }]}>Live Coding</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={codingDuration} onChangeText={setCodingDuration} keyboardType="numeric" />
                    <Text style={[styles.configLabelText, { color: colors.textSecondary }]}>min</Text>
                    
                    <Text style={[styles.configLabelText, { color: colors.textSecondary, marginLeft: 12 }]}>Pass:</Text>
                    <TextInput style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={codingPass} onChangeText={setCodingPass} keyboardType="numeric" />
                    <Text style={[styles.configLabelText, { color: colors.textSecondary }]}>%</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('coding')}>
                      <Trash2 size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Coding Challenge Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Code size={20} color={colors.text} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Round {selectedRounds.indexOf('coding') + 1}: Coding Challenge</Text>
                    </View>
                    <ChevronUp size={20} color={colors.text} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Problem Description *</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="Write a function that solves the given problem."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }, { marginBottom: 20, zIndex: openCodingLang ? 10 : 1 }]}>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: openCodingLang ? 10 : 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Programming Language</Text>
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.primary }]}
                        onPress={() => setOpenCodingLang(!openCodingLang)}
                      >
                        <Text style={[styles.dropdownText, { color: colors.text }]}>{codingLang}</Text>
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {openCodingLang && (
                        <View style={[styles.difficultyMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          {['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust'].map((lang) => (
                            <TouchableOpacity 
                              key={lang}
                              style={[styles.difficultyMenuItem, { borderBottomColor: colors.border }, codingLang === lang && { backgroundColor: isDark ? colors.primary : '#1d4ed8' }]}
                              onPress={() => handleCodingLangChange(lang)}
                            >
                              <Text style={[styles.difficultyMenuText, { color: colors.text }, codingLang === lang && { color: '#ffffff' }]}>{lang}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: codingStartDate,
                            onChange: (e: any) => setCodingStartDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: codingStartTime,
                            onChange: (e: any) => setCodingStartTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: codingEndDate,
                            onChange: (e: any) => setCodingEndDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: codingEndTime,
                            onChange: (e: any) => setCodingEndTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>Starter Code Template</Text>
                      {isGeneratingStarterCode && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>
                    <TextInput
                      style={styles.codeEditorInput}
                      multiline
                      textAlignVertical="top"
                      value={starterCode}
                      onChangeText={setStarterCode}
                    />
                  </View>

                  {/* Test Cases */}
                  <View style={{ marginTop: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Cases ({testCases.length})</Text>
                      <TouchableOpacity style={[styles.addTestCaseBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={addTestCase}>
                        <Plus size={14} color={colors.textSecondary} />
                        <Text style={[styles.addTestCaseText, { color: colors.textSecondary }]}>Add Test Case</Text>
                      </TouchableOpacity>
                    </View>

                    {testCases.map((tc, index) => (
                      <View key={tc.id} style={[styles.testCaseCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Input</Text>
                            <TextInput 
                              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                              placeholder="e.g., [1, 2, 3]" 
                              placeholderTextColor={colors.textSecondary} 
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Expected Output</Text>
                            <TextInput 
                              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                              placeholder="e.g., 6" 
                              placeholderTextColor={colors.textSecondary} 
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                </View>
              </View>
            )}

            {/* Mocking the Interview Config if 'interview' is selected */}
            {selectedRounds.includes('interview') && (
              <View style={styles.configContainer}>
                
                {/* Round Header Card */}
                <View style={[styles.roundConfigCard, { backgroundColor: isDark ? colors.primary + '20' : '#f5f3ff', borderColor: isDark ? colors.primary + '40' : '#d8b4fe' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.roundNumberBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.roundNumberText}>{selectedRounds.indexOf('interview') + 1}</Text>
                    </View>
                    <Users size={18} color={colors.text} />
                    <Text style={[styles.configRoundTitle, { color: colors.text }]}>Interview</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={interviewDuration} onChangeText={setInterviewDuration} keyboardType="numeric" />
                    <Text style={[styles.configLabelText, { color: colors.textSecondary }]}>min</Text>
                    
                    <Text style={[styles.configLabelText, { marginLeft: 12, color: colors.primary, fontWeight: '600' }]}>Interview</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('interview')}>
                      <Trash2 size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Interview Details Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Users size={18} color={colors.text} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Round {selectedRounds.indexOf('interview') + 1}: Interview Details</Text>
                  </View>
                  <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 20 }]}>
                    Configure the interview round. Candidates will see these details after completing prior rounds.
                  </Text>
                  
                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (min)</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                        placeholder="45"
                        value={interviewDuration}
                        onChangeText={setInterviewDuration}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary} 
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Round Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: interviewStartDate,
                            onChange: (e: any) => setInterviewStartDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: interviewStartTime,
                            onChange: (e: any) => setInterviewStartTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Round End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: interviewEndDate,
                            onChange: (e: any) => setInterviewEndDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: interviewEndTime,
                            onChange: (e: any) => setInterviewEndTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: colors.border, padding: '0 12px', backgroundColor: colors.card, color: colors.text,
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <Text style={{ color: colors.textSecondary }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={colors.text} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Meeting Link</Text>
                    <TextInput 
                      style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                      placeholder="https://meet.google.com/... or https://zoom.us/..." 
                      value={interviewLink}
                      onChangeText={setInterviewLink}
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Notes for Candidate</Text>
                    <TextInput 
                      style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                      placeholder="Any instructions or details for the candidate..." 
                      value={interviewNotes}
                      onChangeText={setInterviewNotes}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <Text style={[styles.subText, { color: colors.textSecondary, marginTop: -8 }]}>
                    Tip: You can leave date/time empty now and schedule later from the Interviews page.
                  </Text>

                </View>
              </View>
            )}

          </View>
        )}

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }, isMobile && styles.footerMobile]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerRoundsText, { color: colors.textSecondary }]}>{selectedRounds.length} rounds</Text>
        </View>
        <View style={[styles.footerRight, isMobile && styles.footerRightMobile]}>
          <View style={[styles.footerActionRow, isMobile && styles.footerActionRowMobile]}>
            <TouchableOpacity style={[styles.footerSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }, isMobile && { flex: 1, justifyContent: 'center' }]}>
              <Upload size={16} color={colors.textSecondary} />
              {!isMobile && <Text style={[styles.footerSecondaryBtnText, { color: colors.text }]}>Open File</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }, isMobile && { flex: 1, justifyContent: 'center' }]}>
              <Download size={16} color={colors.textSecondary} />
              {!isMobile && <Text style={[styles.footerSecondaryBtnText, { color: colors.text }]}>Save File</Text>}
            </TouchableOpacity>
          </View>
          <View style={[styles.footerMainRow, isMobile && styles.footerMainRowMobile]}>
            <TouchableOpacity style={[styles.footerSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }, isMobile && { flex: 1, justifyContent: 'center' }]} onPress={() => router.back()}>
              <Text style={[styles.footerSecondaryBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerPrimaryBtn, { backgroundColor: colors.primary }, isMobile && { flex: 2, justifyContent: 'center' }]} onPress={saveAssessment}>
              <Save size={16} color="#ffffff" />
              <Text style={styles.footerPrimaryBtnText}>Save Assessment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    borderBottomWidth: 1
  },
  headerMobile: { paddingHorizontal: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 24 },
  backBtnText: { fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  card: { 
    borderRadius: 12, padding: 24, marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { fontSize: 13, marginBottom: 20, marginTop: -16 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  subText: { fontSize: 11, marginTop: 8, lineHeight: 16 },
  
  dropdown: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, height: 48
  },
  dropdownText: { fontSize: 14 },

  textInput: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 14,
  },
  textArea: {
    borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 14,
    minHeight: 120
  },

  roundsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  roundCard: { 
    flex: 1, minWidth: 200, borderWidth: 1, 
    borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center'
  },
  roundTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  roundDesc: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  configContainer: { marginTop: 16 },
  roundConfigCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    borderWidth: 1, borderRadius: 12, padding: 16
  },
  roundNumberBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  roundNumberText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  configRoundTitle: { fontSize: 16, fontWeight: '600' },
  
  configControlsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  smallInput: { borderWidth: 1, borderRadius: 6, width: 50, height: 36, textAlign: 'center', fontSize: 14, marginHorizontal: 8 },
  configLabelText: { fontSize: 13, fontWeight: '500' },

  row: { flexDirection: 'row', gap: 16 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, height: 48 },
  
  tabsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },

  domainBlock: { borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1 },
  domainInfoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  domainInfoText: { fontSize: 13 },
  generateAiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 8, paddingHorizontal: 16 },
  generateAiBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  addQuestionBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderStyle: 'dashed', borderRadius: 8,
    paddingVertical: 16
  },
  addQuestionText: { fontSize: 14, fontWeight: '500' },

  codeEditorInput: {
    backgroundColor: '#1e293b', borderRadius: 8, padding: 20, minHeight: 160,
    color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, lineHeight: 22
  },

  addTestCaseBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    borderWidth: 1, borderStyle: 'dashed', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8
  },
  addTestCaseText: { fontSize: 13, fontWeight: '600' },
  
  testCaseCard: {
    borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1
  },

  questionBuilderCard: {
    borderWidth: 1, borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  qbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  qBadgeText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  qbTitle: { fontSize: 16, fontWeight: '600' },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  
  difficultyMenu: {
    position: 'absolute', top: 76, left: 0, right: 0,
    borderWidth: 1, borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    zIndex: 999
  },
  difficultyMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  difficultyMenuText: { fontSize: 14 },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  optionRadio: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  optionRadioText: { fontSize: 13, fontWeight: '600' },

  footer: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10
  },
  footerMobile: { flexDirection: 'column', gap: 16, paddingHorizontal: 16 },
  footerLeft: { flex: 1, width: '100%' },
  footerRoundsText: { fontSize: 14, fontWeight: '500' },
  
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  footerRightMobile: { width: '100%', flexDirection: 'column', gap: 12, alignItems: 'stretch' },
  
  footerActionRow: { flexDirection: 'row', gap: 12 },
  footerActionRowMobile: { width: '100%' },
  
  footerMainRow: { flexDirection: 'row', gap: 12 },
  footerMainRowMobile: { width: '100%' },
  
  footerSecondaryBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, 
    borderWidth: 1
  },
  footerSecondaryBtnText: { fontSize: 13, fontWeight: '600' },
  
  footerPrimaryBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8
  },
  footerPrimaryBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  checkboxContainer: {
    padding: 4,
    marginRight: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  candidateAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateInitials: {
    fontSize: 14,
    fontWeight: '600',
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '600',
  },
  candidateEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
