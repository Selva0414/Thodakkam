import React, { useState, useEffect, createElement } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, useWindowDimensions, Image
} from 'react-native';
import { ArrowLeft, ChevronDown, FileText, Code, Users, Briefcase, Upload, Download, Save, Clock, Trash2, Calendar, HelpCircle, Sparkles, Plus, Check, ChevronUp, Info, Zap } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PRIMARY = '#662483';
const BG = '#fdfcfc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';
const BORDER = '#e2e8f0';

export default function StartupCreateAssessment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string);

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
  }, [companyName]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`https://thodakkam-backend.onrender.com/api/jobs/startup/${companyName}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Fetch Jobs Error:', err);
    }
  };
  
  // MCQ State
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState('manual'); // 'manual' or 'domain'
  const [openDifficultyId, setOpenDifficultyId] = useState<number | null>(null);
  
  // Domain config state
  const [domainConfig, setDomainConfig] = useState({
    topic: 'Auto-detect from job...',
    difficulty: 'Medium',
    questionsCount: '10'
  });
  const [openDomainMenu, setOpenDomainMenu] = useState<'topic' | 'difficulty' | null>(null);
  
  // Coding State
  const [testCases, setTestCases] = useState([{ id: 1, input: '', output: '' }]);
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

  const [interviewDuration, setInterviewDuration] = useState('45');
  const [interviewStartDate, setInterviewStartDate] = useState('');
  const [interviewStartTime, setInterviewStartTime] = useState('');
  const [interviewEndDate, setInterviewEndDate] = useState('');
  const [interviewEndTime, setInterviewEndTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const addTestCase = () => setTestCases([...testCases, { id: Date.now(), input: '', output: '' }]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), correctOption: 'A', difficulty: 'Medium' }]);
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
      const response = await fetch('https://thodakkam-backend.onrender.com/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: companyName,
          jobId: selectedJobId,
          title: selectedJobId ? (jobs.find(j => j.id === selectedJobId)?.title + ' Assessment') : description.substring(0, 50),
          description,
          selectedRounds,
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
      if (data.success) {
        alert('Assessment Saved Successfully!');
        router.back();
      } else {
        alert('Failed to save assessment: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving assessment. Check server connection.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={TEXT_GRAY} />
          {!isMobile && <Text style={styles.backBtnText}>Back to Assessments</Text>}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Assessment</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assessment Details</Text>

          <View style={[styles.inputGroup, { zIndex: 50 }]}>
            <Text style={styles.label}>Job (optional)</Text>
            <TouchableOpacity 
              style={[styles.dropdown, openJobDropdown && { borderColor: PRIMARY }]}
              onPress={() => setOpenJobDropdown(!openJobDropdown)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Briefcase size={16} color={TEXT_GRAY} />
                <Text style={[styles.dropdownText, selectedJobId && { color: TEXT_DARK }]}>
                  {selectedJobId 
                    ? jobs.find(j => j.id === selectedJobId)?.title || 'Selected Job'
                    : 'Select an available job'}
                </Text>
              </View>
              <ChevronDown size={16} color={TEXT_GRAY} />
            </TouchableOpacity>
            
            {openJobDropdown && (
              <View style={styles.difficultyMenu}>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <TouchableOpacity 
                      key={job.id}
                      style={[styles.difficultyMenuItem, selectedJobId === job.id && { backgroundColor: PRIMARY }]}
                      onPress={() => {
                        setSelectedJobId(job.id);
                        setOpenJobDropdown(false);
                      }}
                    >
                      <Text style={[styles.difficultyMenuText, selectedJobId === job.id && { color: WHITE }]}>
                        {job.title}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: TEXT_GRAY, fontSize: 14 }}>No jobs found</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={styles.subText}>Job links the title to a role and loads applicants to assign. You can save round settings without a job; title falls back to your description or "Assessment".</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe what this assessment evaluates..."
              placeholderTextColor="#94a3b8"
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
                <Text style={styles.label}>
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
                    <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '600' }}>
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
                      style={[styles.candidateCard, isSelected && { borderColor: PRIMARY, backgroundColor: '#faf5ff' }]}
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
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Check size={12} color={WHITE} />}
                        </View>
                      </View>
                      
                      <View style={styles.candidateInfo}>
                        {app.user?.profilePhoto || app.profilePhoto ? (
                          <Image source={{ uri: (app.user?.profilePhoto || app.profilePhoto)?.startsWith('data:') ? (app.user?.profilePhoto || app.profilePhoto) : `https://thodakkam-backend.onrender.com/${app.user?.profilePhoto || app.profilePhoto}` }} style={styles.candidateAvatar} />
                        ) : (
                          <View style={styles.candidateAvatarPlaceholder}>
                            <Text style={styles.candidateInitials}>{(app.fullName || app.user?.fullName || 'U').substring(0, 2).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.candidateName}>{app.fullName || app.user?.fullName || 'Unknown Candidate'}</Text>
                          <Text style={styles.candidateEmail}>{app.email || app.user?.email || 'No email'} • new</Text>
                        </View>
                        <TouchableOpacity style={styles.viewProfileBtn}>
                          <Text style={styles.viewProfileText}>View Profile</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {(!jobs.find(j => j.id === selectedJobId)?.applications || jobs.find(j => j.id === selectedJobId)?.applications.length === 0) && (
                  <View style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                    <Text style={{ color: TEXT_GRAY }}>No candidates have applied yet.</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assessment Rounds ({selectedRounds.length})</Text>
          <Text style={styles.sectionSubtitle}>Select the rounds for your assessment process</Text>

          <View style={styles.roundsContainer}>
            {rounds.map((r) => {
              const isSelected = selectedRounds.includes(r.id);
              const Icon = r.icon;
              return (
                <TouchableOpacity 
                  key={r.id} 
                  style={[styles.roundCard, isSelected && styles.roundCardSelected]}
                  onPress={() => toggleRound(r.id)}
                >
                  <Icon size={24} color={isSelected ? PRIMARY : TEXT_DARK} style={{ marginBottom: 12 }} />
                  <Text style={[styles.roundTitle, isSelected && { color: PRIMARY }]}>{r.title}</Text>
                  <Text style={styles.roundDesc}>{r.desc}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Selected Rounds Config View */}
        {selectedRounds.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 24 }}>
            <Text style={styles.sectionSubtitle}>Selected Rounds (in order)</Text>
            
            {/* Mocking the MCQ Config if 'mcq' is selected */}
            {selectedRounds.includes('mcq') && (
              <View style={styles.configContainer}>
                
                {/* Round Header Card */}
                <View style={styles.roundConfigCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.roundNumberBadge}>
                      <Text style={styles.roundNumberText}>1</Text>
                    </View>
                    <FileText size={18} color={TEXT_DARK} />
                    <Text style={styles.configRoundTitle}>MCQ Assessment</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={TEXT_GRAY} />
                    <TextInput style={styles.smallInput} value={mcqDuration} onChangeText={setMcqDuration} keyboardType="numeric" />
                    <Text style={styles.configLabelText}>min</Text>
                    
                    <Text style={[styles.configLabelText, { marginLeft: 12 }]}>Pass:</Text>
                    <TextInput style={styles.smallInput} value={mcqPass} onChangeText={setMcqPass} keyboardType="numeric" />
                    <Text style={styles.configLabelText}>%</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('mcq')}>
                      <Trash2 size={16} color={TEXT_GRAY} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Question Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>Round 1: MCQ Questions ({questions.length})</Text>
                    <ChevronUp size={20} color={TEXT_DARK} />
                  </View>
                  
                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: mcqStartDate,
                            onChange: (e: any) => setMcqStartDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: mcqStartTime,
                            onChange: (e: any) => setMcqStartTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }, { marginTop: 8 }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            value: mcqEndDate,
                            onChange: (e: any) => setMcqEndDate(e.target.value),
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            value: mcqEndTime,
                            onChange: (e: any) => setMcqEndTime(e.target.value),
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  {/* Tabs */}
                  <View style={styles.tabsRow}>
                    <TouchableOpacity 
                      style={[styles.tabBtn, questionType === 'manual' && styles.tabBtnActive]}
                      onPress={() => setQuestionType('manual')}
                    >
                      <HelpCircle size={16} color={questionType === 'manual' ? PRIMARY : TEXT_GRAY} />
                      <Text style={[styles.tabText, questionType === 'manual' && styles.tabTextActive]}>Manual Questions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tabBtn, questionType === 'domain' && styles.tabBtnActive]}
                      onPress={() => setQuestionType('domain')}
                    >
                      <Sparkles size={16} color={questionType === 'domain' ? PRIMARY : TEXT_GRAY} />
                      <Text style={[styles.tabText, questionType === 'domain' && styles.tabTextActive]}>Domain-Based</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Domain-Based Generation Block */}
                  {questionType === 'domain' && (
                    <View style={styles.domainBlock}>
                      <View style={styles.domainInfoBanner}>
                        <Info size={14} color={TEXT_GRAY} />
                        <Text style={styles.domainInfoText}>Link a job above to generate questions based on its description</Text>
                      </View>
                      
                      <View style={[isMobile ? { flexDirection: 'column', alignItems: 'stretch', gap: 16 } : { flexDirection: 'row', alignItems: 'flex-end', gap: 16 }, { zIndex: openDomainMenu ? 10 : 1 }]}>
                        
                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 2, marginBottom: 0, zIndex: openDomainMenu === 'topic' ? 10 : 1 }]}>
                          <Text style={styles.label}>Domain / Topic</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, openDomainMenu === 'topic' && { borderColor: PRIMARY }]}
                            onPress={() => setOpenDomainMenu(openDomainMenu === 'topic' ? null : 'topic')}
                          >
                            <Text style={styles.dropdownText}>{domainConfig.topic}</Text>
                            <ChevronDown size={16} color={TEXT_GRAY} />
                          </TouchableOpacity>
                          
                          {openDomainMenu === 'topic' && (
                            <View style={styles.difficultyMenu}>
                              {['Auto-detect from job...', 'Frontend', 'Backend', 'Fullstack', 'Data Science', 'Mobile'].map((topic) => (
                                <TouchableOpacity 
                                  key={topic}
                                  style={[styles.difficultyMenuItem, domainConfig.topic === topic && { backgroundColor: '#1d4ed8' }]}
                                  onPress={() => { setDomainConfig({...domainConfig, topic}); setOpenDomainMenu(null); }}
                                >
                                  <Text style={[styles.difficultyMenuText, domainConfig.topic === topic && { color: WHITE }]}>{topic}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 1, marginBottom: 0, zIndex: openDomainMenu === 'difficulty' ? 10 : 1 }]}>
                          <Text style={styles.label}>Difficulty</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, openDomainMenu === 'difficulty' && { borderColor: PRIMARY }]}
                            onPress={() => setOpenDomainMenu(openDomainMenu === 'difficulty' ? null : 'difficulty')}
                          >
                            <Text style={styles.dropdownText}>{domainConfig.difficulty}</Text>
                            <ChevronDown size={16} color={TEXT_GRAY} />
                          </TouchableOpacity>
                          
                          {openDomainMenu === 'difficulty' && (
                            <View style={styles.difficultyMenu}>
                              {['Easy', 'Medium', 'Hard'].map((diff) => (
                                <TouchableOpacity 
                                  key={diff}
                                  style={styles.difficultyMenuItem}
                                  onPress={() => { setDomainConfig({...domainConfig, difficulty: diff}); setOpenDomainMenu(null); }}
                                >
                                  <Text style={[styles.difficultyMenuText, domainConfig.difficulty === diff && { color: PRIMARY, fontWeight: '700' }]}>{diff}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={[styles.inputGroup, { flex: isMobile ? undefined : 1, marginBottom: 0, zIndex: 1 }]}>
                          <Text style={styles.label}>Questions</Text>
                          <TextInput 
                            style={styles.textInput} 
                            value={domainConfig.questionsCount} 
                            onChangeText={(text) => setDomainConfig({...domainConfig, questionsCount: text})}
                            keyboardType="numeric" 
                          />
                        </View>

                        <TouchableOpacity style={[styles.generateAiBtn, isMobile && { width: '100%' }, { zIndex: 1 }]}>
                          <Sparkles size={14} color={WHITE} />
                          <Zap size={14} color="#f59e0b" style={{ marginLeft: -4, marginRight: 4 }} />
                          <Text style={styles.generateAiBtnText}>Generate with AI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Question Builder List */}
                  {questions.map((q, index) => (
                    <View key={q.id} style={[styles.questionBuilderCard, { marginBottom: 16 }]}>
                      <View style={styles.qbHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={styles.qBadge}>
                            <Text style={styles.qBadgeText}>Q{index + 1}</Text>
                          </View>
                          <Text style={styles.qbTitle}>New Question</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={[styles.difficultyBadge, q.difficulty === 'Easy' ? { backgroundColor: '#dcfce7' } : q.difficulty === 'Hard' ? { backgroundColor: '#fee2e2' } : null]}>
                            <Text style={[styles.difficultyText, q.difficulty === 'Easy' ? { color: '#16a34a' } : q.difficulty === 'Hard' ? { color: '#ef4444' } : null]}>
                              {q.difficulty || 'Medium'}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => removeQuestion(q.id)}>
                            <Trash2 size={16} color={TEXT_GRAY} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Question *</Text>
                        <TextInput
                          style={styles.textArea}
                          placeholder="Enter your question..."
                          placeholderTextColor="#94a3b8"
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          value={q.question || ''}
                          onChangeText={(text) => updateQuestionText(q.id, text)}
                        />
                      </View>

                      <View style={[styles.row, isMobile && { flexDirection: 'column' }, { zIndex: openDifficultyId === q.id ? 10 : 1 }]}>
                        <View style={[styles.inputGroup, { flex: 1, zIndex: 10 }]}>
                          <Text style={styles.label}>Difficulty</Text>
                          <TouchableOpacity 
                            style={[styles.dropdown, openDifficultyId === q.id && { borderColor: PRIMARY }]}
                            onPress={() => setOpenDifficultyId(openDifficultyId === q.id ? null : q.id)}
                          >
                            <Text style={styles.dropdownText}>{q.difficulty || 'Medium'}</Text>
                            <ChevronDown size={16} color={TEXT_GRAY} />
                          </TouchableOpacity>
                          
                          {openDifficultyId === q.id && (
                            <View style={styles.difficultyMenu}>
                              {['Easy', 'Medium', 'Hard'].map((diff) => (
                                <TouchableOpacity 
                                  key={diff}
                                  style={styles.difficultyMenuItem}
                                  onPress={() => updateQuestionDifficulty(q.id, diff)}
                                >
                                  <Text style={[styles.difficultyMenuText, q.difficulty === diff && { color: PRIMARY, fontWeight: '700' }]}>{diff}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, zIndex: 1 }]}>
                          <Text style={styles.label}>Points</Text>
                          <TextInput style={styles.textInput} value="1" keyboardType="numeric" />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.label}>Time (sec)</Text>
                          <TextInput style={styles.textInput} value="60" keyboardType="numeric" />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Options (select the correct answer)</Text>
                        
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <View key={opt} style={styles.optionRow}>
                            <TouchableOpacity 
                              style={[styles.optionRadio, q.correctOption === opt && styles.optionRadioActive]}
                              onPress={() => updateQuestionOption(q.id, opt)}
                            >
                              {q.correctOption === opt ? (
                                <Check size={14} color={WHITE} />
                              ) : (
                                <Text style={styles.optionRadioText}>{opt}</Text>
                              )}
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.textInput, { flex: 1 }]}
                              placeholder={`Option ${opt}`}
                              placeholderTextColor="#cbd5e1"
                              value={q[`option${opt}`] || ''}
                              onChangeText={(text) => updateOptionText(q.id, opt, text)}
                            />
                          </View>
                        ))}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Explanation (shown after answer)</Text>
                        <TextInput
                          style={styles.textArea}
                          placeholder="Explain why this is the correct answer..."
                          placeholderTextColor="#94a3b8"
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  ))}

                  {/* Add Question Button */}
                  <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
                    <Plus size={16} color={TEXT_GRAY} />
                    <Text style={styles.addQuestionText}>Add Question</Text>
                  </TouchableOpacity>

                </View>
              </View>
            )}

            {/* Mocking the Coding Config if 'coding' is selected */}
            {selectedRounds.includes('coding') && (
              <View style={styles.configContainer}>
                
                {/* Round Header Card */}
                <View style={styles.roundConfigCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.roundNumberBadge}>
                      <Text style={styles.roundNumberText}>{selectedRounds.indexOf('coding') + 1}</Text>
                    </View>
                    <Code size={18} color={TEXT_DARK} />
                    <Text style={styles.configRoundTitle}>Live Coding</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={TEXT_GRAY} />
                    <TextInput style={styles.smallInput} value={codingDuration} onChangeText={setCodingDuration} keyboardType="numeric" />
                    <Text style={styles.configLabelText}>min</Text>
                    
                    <Text style={[styles.configLabelText, { marginLeft: 12 }]}>Pass:</Text>
                    <TextInput style={styles.smallInput} value={codingPass} onChangeText={setCodingPass} keyboardType="numeric" />
                    <Text style={styles.configLabelText}>%</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('coding')}>
                      <Trash2 size={16} color={TEXT_GRAY} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Coding Challenge Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Code size={20} color={TEXT_DARK} />
                      <Text style={styles.sectionTitle}>Round {selectedRounds.indexOf('coding') + 1}: Coding Challenge</Text>
                    </View>
                    <ChevronUp size={20} color={TEXT_DARK} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Problem Description *</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Write a function that solves the given problem."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }, { marginBottom: 20, zIndex: openCodingLang ? 10 : 1 }]}>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: openCodingLang ? 10 : 1 }]}>
                      <Text style={styles.label}>Programming Language</Text>
                      <TouchableOpacity 
                        style={[styles.dropdown, { borderColor: PRIMARY }]}
                        onPress={() => setOpenCodingLang(!openCodingLang)}
                      >
                        <Text style={styles.dropdownText}>{codingLang}</Text>
                        <ChevronDown size={16} color={TEXT_GRAY} />
                      </TouchableOpacity>

                      {openCodingLang && (
                        <View style={styles.difficultyMenu}>
                          {['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust'].map((lang) => (
                            <TouchableOpacity 
                              key={lang}
                              style={[styles.difficultyMenuItem, codingLang === lang && { backgroundColor: '#1d4ed8' }]}
                              onPress={() => { setCodingLang(lang); setOpenCodingLang(false); }}
                            >
                              <Text style={[styles.difficultyMenuText, codingLang === lang && { color: WHITE }]}>{lang}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: 1 }]}>
                      <Text style={styles.label}>Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: 0, zIndex: 1 }]}>
                      <Text style={styles.label}>End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Starter Code Template</Text>
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
                      <Text style={styles.sectionTitle}>Test Cases ({testCases.length})</Text>
                      <TouchableOpacity style={styles.addTestCaseBtn} onPress={addTestCase}>
                        <Plus size={14} color={TEXT_GRAY} />
                        <Text style={styles.addTestCaseText}>Add Test Case</Text>
                      </TouchableOpacity>
                    </View>

                    {testCases.map((tc, index) => (
                      <View key={tc.id} style={styles.testCaseCard}>
                        <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <Text style={styles.label}>Input</Text>
                            <TextInput 
                              style={styles.textInput} 
                              placeholder="e.g., [1, 2, 3]" 
                              placeholderTextColor="#cbd5e1" 
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <Text style={styles.label}>Expected Output</Text>
                            <TextInput 
                              style={styles.textInput} 
                              placeholder="e.g., 6" 
                              placeholderTextColor="#cbd5e1" 
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
                <View style={styles.roundConfigCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.roundNumberBadge}>
                      <Text style={styles.roundNumberText}>{selectedRounds.indexOf('interview') + 1}</Text>
                    </View>
                    <Users size={18} color={TEXT_DARK} />
                    <Text style={styles.configRoundTitle}>Interview</Text>
                  </View>
                  
                  <View style={styles.configControlsRow}>
                    <Clock size={16} color={TEXT_GRAY} />
                    <TextInput style={styles.smallInput} value={interviewDuration} onChangeText={setInterviewDuration} keyboardType="numeric" />
                    <Text style={styles.configLabelText}>min</Text>
                    
                    <Text style={[styles.configLabelText, { marginLeft: 12, color: PRIMARY, fontWeight: '600' }]}>Interview</Text>
                    
                    <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => toggleRound('interview')}>
                      <Trash2 size={16} color={TEXT_GRAY} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Interview Details Section */}
                <View style={{ marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Users size={18} color={TEXT_DARK} />
                    <Text style={styles.sectionTitle}>Round {selectedRounds.indexOf('interview') + 1}: Interview Details</Text>
                  </View>
                  <Text style={[styles.subText, { marginBottom: 20 }]}>
                    Configure the interview round. Candidates will see these details after completing prior rounds.
                  </Text>
                  
                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Duration (min)</Text>
                      <TextInput 
                        style={styles.textInput} 
                        placeholder="45"
                        value={interviewDuration}
                        onChangeText={setInterviewDuration}
                        keyboardType="numeric"
                        placeholderTextColor="#94a3b8" 
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Round Start Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Round End Time (Fixed Window)</Text>
                      {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {createElement('input', {
                            type: 'date',
                            style: {
                              flex: 1, height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                          {createElement('input', {
                            type: 'time',
                            style: {
                              width: '120px', height: '48px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid',
                              borderColor: '#e2e8f0', padding: '0 12px', backgroundColor: '#ffffff', color: '#0f172a',
                              fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                            }
                          })}
                        </View>
                      ) : (
                        <View style={styles.dateInput}>
                          <Text style={{ color: '#cbd5e1' }}>mm/dd/yyyy --:-- --</Text>
                          <Calendar size={16} color={TEXT_DARK} />
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Meeting Link</Text>
                    <TextInput 
                      style={styles.textInput} 
                      placeholder="https://meet.google.com/... or https://zoom.us/..." 
                      value={interviewLink}
                      onChangeText={setInterviewLink}
                      placeholderTextColor="#94a3b8" 
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes for Candidate</Text>
                    <TextInput 
                      style={styles.textArea} 
                      placeholder="Any instructions or details for the candidate..." 
                      value={interviewNotes}
                      onChangeText={setInterviewNotes}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor="#94a3b8" 
                    />
                  </View>

                  <Text style={[styles.subText, { marginTop: -8 }]}>
                    Tip: You can leave date/time empty now and schedule later from the Interviews page.
                  </Text>

                </View>
              </View>
            )}

          </View>
        )}

      </ScrollView>

      <View style={[styles.footer, isMobile && styles.footerMobile]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerRoundsText}>{selectedRounds.length} rounds</Text>
        </View>
        <View style={[styles.footerRight, isMobile && styles.footerRightMobile]}>
          <View style={[styles.footerActionRow, isMobile && styles.footerActionRowMobile]}>
            <TouchableOpacity style={[styles.footerSecondaryBtn, isMobile && { flex: 1, justifyContent: 'center' }]}>
              <Upload size={16} color={TEXT_GRAY} />
              {!isMobile && <Text style={styles.footerSecondaryBtnText}>Open File</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerSecondaryBtn, isMobile && { flex: 1, justifyContent: 'center' }]}>
              <Download size={16} color={TEXT_GRAY} />
              {!isMobile && <Text style={styles.footerSecondaryBtnText}>Save File</Text>}
            </TouchableOpacity>
          </View>
          <View style={[styles.footerMainRow, isMobile && styles.footerMainRowMobile]}>
            <TouchableOpacity style={[styles.footerSecondaryBtn, isMobile && { flex: 1, justifyContent: 'center' }]} onPress={() => router.back()}>
              <Text style={styles.footerSecondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerPrimaryBtn, isMobile && { flex: 2, justifyContent: 'center' }]} onPress={saveAssessment}>
              <Save size={16} color={WHITE} />
              <Text style={styles.footerPrimaryBtnText}>Save Assessment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdfcfc' },
  header: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, 
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: BORDER
  },
  headerMobile: { paddingHorizontal: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 24 },
  backBtnText: { fontSize: 14, color: TEXT_GRAY, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  card: { 
    backgroundColor: WHITE, borderRadius: 12, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  sectionSubtitle: { fontSize: 13, color: TEXT_GRAY, marginBottom: 20, marginTop: -16 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY, marginBottom: 8 },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 16 },
  
  dropdown: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 16, height: 48, backgroundColor: WHITE
  },
  dropdownText: { fontSize: 14, color: TEXT_DARK },

  textInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 14, color: TEXT_DARK,
    backgroundColor: WHITE
  },
  textArea: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16, fontSize: 14, color: TEXT_DARK,
    backgroundColor: WHITE, minHeight: 120
  },

  roundsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  roundCard: { 
    flex: 1, minWidth: 200, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, 
    borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center'
  },
  roundCardSelected: { borderColor: PRIMARY, backgroundColor: '#f5f3ff' },
  roundTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginBottom: 8, textAlign: 'center' },
  roundDesc: { fontSize: 12, color: TEXT_GRAY, textAlign: 'center', lineHeight: 18 },

  configContainer: { marginTop: 16 },
  roundConfigCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#d8b4fe', borderRadius: 12, padding: 16
  },
  roundNumberBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  roundNumberText: { color: WHITE, fontWeight: '700', fontSize: 14 },
  configRoundTitle: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  
  configControlsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  smallInput: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, backgroundColor: WHITE, width: 50, height: 36, textAlign: 'center', fontSize: 14, marginHorizontal: 8 },
  configLabelText: { fontSize: 13, color: TEXT_GRAY, fontWeight: '500' },

  row: { flexDirection: 'row', gap: 16 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 16, height: 48, backgroundColor: WHITE },
  
  tabsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE },
  tabBtnActive: { borderColor: PRIMARY, backgroundColor: '#f5f3ff' },
  tabText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  tabTextActive: { color: PRIMARY },

  domainBlock: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  domainInfoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  domainInfoText: { fontSize: 13, color: TEXT_GRAY },
  generateAiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, height: 48, borderRadius: 8, paddingHorizontal: 16 },
  generateAiBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  addQuestionBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 8,
    paddingVertical: 16, backgroundColor: '#f8fafc'
  },
  addQuestionText: { fontSize: 14, fontWeight: '500', color: TEXT_GRAY },

  codeEditorInput: {
    backgroundColor: '#1e293b', borderRadius: 8, padding: 20, minHeight: 160,
    color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, lineHeight: 22
  },

  addTestCaseBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: WHITE
  },
  addTestCaseText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  
  testCaseCard: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9'
  },

  questionBuilderCard: {
    borderWidth: 1, borderColor: '#d8b4fe', borderRadius: 12, padding: 24, backgroundColor: WHITE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  qbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qBadge: { backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  qBadgeText: { color: WHITE, fontWeight: '700', fontSize: 12 },
  qbTitle: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  difficultyBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  difficultyText: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  
  difficultyMenu: {
    position: 'absolute', top: 76, left: 0, right: 0,
    backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    zIndex: 999
  },
  difficultyMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  difficultyMenuText: { fontSize: 14, color: TEXT_DARK },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  optionRadio: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  optionRadioActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  optionRadioText: { fontSize: 13, color: TEXT_DARK, fontWeight: '600' },

  footer: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: WHITE, paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10
  },
  footerMobile: { flexDirection: 'column', gap: 16, paddingHorizontal: 16 },
  footerLeft: { flex: 1, width: '100%' },
  footerRoundsText: { fontSize: 14, color: TEXT_GRAY, fontWeight: '500' },
  
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  footerRightMobile: { width: '100%', flexDirection: 'column', gap: 12, alignItems: 'stretch' },
  
  footerActionRow: { flexDirection: 'row', gap: 12 },
  footerActionRowMobile: { width: '100%' },
  
  footerMainRow: { flexDirection: 'row', gap: 12 },
  footerMainRowMobile: { width: '100%' },
  
  footerSecondaryBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, 
    borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE 
  },
  footerSecondaryBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  
  footerPrimaryBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, 
    backgroundColor: PRIMARY 
  },
  footerPrimaryBtnText: { fontSize: 13, fontWeight: '600', color: WHITE },

  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: WHITE,
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
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  candidateEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: WHITE,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '500',
    color: PRIMARY,
  },
});
