import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Briefcase, Layers, Settings, FileText, ChevronDown, Calendar, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupEditJob() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  const jobId = params.jobId as string;
  const { colors, isDark } = useAppTheme();

  // 1. Basic Info
  const [title, setTitle] = useState((params.title as string) || '');
  const [department, setDepartment] = useState((params.department as string) || '');
  const [employmentType, setEmploymentType] = useState((params.type as string) || 'Full-time');
  const [workMode, setWorkMode] = useState((params.workMode as string) || 'Onsite');
  const [location, setLocation] = useState((params.location as string) || '');

  // 2. Job Details
  const [experience, setExperience] = useState((params.experience as string) || '');
  const [education, setEducation] = useState((params.education as string) || 'Any Degree');
  const [openings, setOpenings] = useState((params.openings as string) || '1');
  const [skills, setSkills] = useState((params.requirements as string) || '');

  // 3. Application Settings
  const [deadline, setDeadline] = useState((params.deadline as string) || '');
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [applicationMethod, setApplicationMethod] = useState((params.applicationMethod as string) || 'Apply on platform');

  // 4. Description
  const [description, setDescription] = useState((params.description as string) || '');

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Parse existing date from deadline string if possible
  useEffect(() => {
    if (deadline) {
      const parsed = new Date(deadline);
      if (!isNaN(parsed.getTime())) {
        setDateObj(parsed);
      }
    }
  }, []);

  // Dropdown State
  const [pickerConfig, setPickerConfig] = useState<{ visible: boolean, type: string, options: string[] }>({
    visible: false,
    type: '',
    options: []
  });

  const departmentOptions = ['Engineering', 'Design', 'Marketing', 'Sales', 'Product', 'HR', 'Finance', 'Operations'];
  const employmentTypeOptions = ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance'];
  const experienceOptions = ['Fresher', '1-3 years', '3-5 years', '5-8 years', '8+ years'];
  const educationOptions = ['Any Degree', 'B.E/B.Tech', 'B.Sc', 'BCA', 'MCA', 'M.E/M.Tech', 'MBA'];

  const openPicker = (type: string, options: string[]) => {
    setPickerConfig({ visible: true, type, options });
  };

  const handleSelectOption = (option: string) => {
    if (pickerConfig.type === 'department') {
      setDepartment(option);
      setErrors(prev => ({...prev, department: false}));
    } else if (pickerConfig.type === 'employmentType') {
      setEmploymentType(option);
    } else if (pickerConfig.type === 'experience') {
      setExperience(option);
    } else if (pickerConfig.type === 'education') {
      setEducation(option);
    }
    setPickerConfig({ ...pickerConfig, visible: false });
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObj(selectedDate);
      setDeadline(selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
    }
  };

  const validate = () => {
    let newErrors: { [key: string]: boolean } = {};
    if (!title.trim()) newErrors.title = true;
    if (!department.trim()) newErrors.department = true;
    if (!location.trim()) newErrors.location = true;
    if (!skills.trim()) newErrors.skills = true;
    if (!description.trim()) newErrors.description = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateJob = async () => {
    if (!validate()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://thodakkam-1.onrender.com/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          title,
          location,
          type: employmentType,
          salary: '',
          description,
          requirements: skills.split(',').map(r => r.trim()).filter(r => r.length > 0),
          department,
          workMode,
          experience,
          education,
          openings,
          deadline,
          applicationMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Job updated successfully!');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push({ pathname: '/startup-jobs' as any, params: { companyName } });
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to update job.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network request failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (icon: any, num: string, title: string, subtitle: string) => {
    const Icon = icon;
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.inputBg }]}>
          <Icon size={16} color={colors.text} />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{num}. {title}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push({ pathname: '/startup-jobs' as any, params: { companyName } });
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          
          {/* Section 1: Basic Info */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSectionHeader(Briefcase, '1', 'Basic Info', 'Define the role and where it will be performed.')}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Job Title <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.title && { borderColor: isDark ? colors.danger : '#ef4444' }]} 
                placeholder="e.g. Senior Full Stack Engineer"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(val) => { setTitle(val); setErrors(prev => ({...prev, title: false})); }}
              />
              {errors.title && <Text style={[styles.errorText, { color: isDark ? colors.danger : '#ef4444' }]}>Job title is required</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Department <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }, errors.department && { borderColor: isDark ? colors.danger : '#ef4444' }]}
                  onPress={() => openPicker('department', departmentOptions)}
                >
                  <Text style={[styles.inputText, { color: colors.text }, !department && { color: colors.textSecondary }]}>{department || 'Select department'}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {errors.department && <Text style={[styles.errorText, { color: isDark ? colors.danger : '#ef4444' }]}>Department is required</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Employment Type <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openPicker('employmentType', employmentTypeOptions)}
                >
                  <Text style={[styles.inputText, { color: colors.text }]}>{employmentType}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Work Mode <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <View style={styles.chipsRow}>
                  {['Onsite', 'Remote', 'Hybrid'].map(mode => (
                    <TouchableOpacity 
                      key={mode} 
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, workMode === mode && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#faf5ff' }]}
                      onPress={() => setWorkMode(mode)}
                    >
                      <Text style={[styles.chipText, { color: colors.text }, workMode === mode && { color: colors.primary }]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Location <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.location && { borderColor: isDark ? colors.danger : '#ef4444' }]} 
                  placeholder="e.g. Bangalore, India"
                  placeholderTextColor={colors.textSecondary}
                  value={location}
                  onChangeText={(val) => { setLocation(val); setErrors(prev => ({...prev, location: false})); }}
                />
              </View>
            </View>
          </View>

          {/* Section 2: Job Details */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSectionHeader(Layers, '2', 'Job Details', 'Capture candidate profile requirements and qualifications.')}
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Experience Required <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openPicker('experience', experienceOptions)}
                >
                  <Text style={[styles.inputText, { color: colors.text }, !experience && { color: colors.textSecondary }]}>{experience || 'Select experience'}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Education <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openPicker('education', educationOptions)}
                >
                  <Text style={[styles.inputText, { color: colors.text }]}>{education}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Number of Openings <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                keyboardType="numeric"
                value={openings}
                onChangeText={setOpenings}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Skills Required <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, errors.skills && { borderColor: isDark ? colors.danger : '#ef4444' }]} 
                placeholder="Type a skill and press Enter or ✓"
                placeholderTextColor={colors.textSecondary}
                value={skills}
                onChangeText={(val) => { setSkills(val); setErrors(prev => ({...prev, skills: false})); }}
              />
              {errors.skills && <Text style={[styles.errorText, { color: isDark ? colors.danger : '#ef4444' }]}>Add at least one required skill</Text>}
            </View>
          </View>

          {/* Section 3: Application Settings */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSectionHeader(Settings, '3', 'Application Settings', 'Control how candidates can apply and until when.')}
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Application Deadline <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[{ flex: 1, fontSize: 13, color: colors.text }, !deadline && { color: colors.textSecondary }]}>
                    {deadline || 'mm/dd/yyyy'}
                  </Text>
                  <Calendar size={16} color={colors.text} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Application Method <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
                <View style={styles.chipsRow}>
                  {['Apply on platform', 'External link'].map(method => (
                    <TouchableOpacity 
                      key={method} 
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, applicationMethod === method && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#faf5ff' }]}
                      onPress={() => setApplicationMethod(method)}
                    >
                      <Text style={[styles.chipText, { color: colors.text }, applicationMethod === method && { color: colors.primary }]}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Description */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSectionHeader(FileText, '4', 'Description', 'Provide a clear and complete role description.')}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Job Description <Text style={[styles.asterisk, { color: isDark ? colors.danger : '#ef4444' }]}>*</Text></Text>
              
              <View style={[styles.richTextContainer, { borderColor: colors.border }, errors.description && { borderColor: isDark ? colors.danger : '#ef4444' }]}>
                <View style={[styles.richTextToolbar, { backgroundColor: colors.inputBg, borderBottomColor: colors.border }]}>
                  <Text style={[styles.toolbarIcon, { color: colors.textSecondary }]}>B</Text>
                  <Text style={[styles.toolbarIcon, { fontStyle: 'italic', color: colors.textSecondary }]}>I</Text>
                  <Text style={[styles.toolbarIcon, { color: colors.textSecondary }]}>⋮≡</Text>
                  <Text style={[styles.toolbarIcon, { color: colors.textSecondary }]}>🔗</Text>
                  <Text style={[styles.toolbarIcon, { color: colors.textSecondary }]}>{'<>'}</Text>
                </View>
                <TextInput 
                  style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]} 
                  placeholder="Responsibilities, role impact, qualifications, hiring process, and expectations..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={(val) => { setDescription(val); setErrors(prev => ({...prev, description: false})); }}
                />
              </View>
              {errors.description && <Text style={[styles.errorText, { color: isDark ? colors.danger : '#ef4444' }]}>Job description is required</Text>}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleUpdateJob} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      <Modal visible={pickerConfig.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Option</Text>
              <TouchableOpacity onPress={() => setPickerConfig({ ...pickerConfig, visible: false })} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {pickerConfig.options.map(opt => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectOption(opt)}
                >
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16,
    borderBottomWidth: 1
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  card: {
    borderRadius: 12, padding: 20, marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  asterisk: { },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 13 
  },
  errorText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { fontSize: 13 },

  row: { flexDirection: 'row' },
  
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { 
    paddingHorizontal: 12, height: 36, borderRadius: 18, 
    borderWidth: 1, 
    justifyContent: 'center', alignItems: 'center' 
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  richTextContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  richTextToolbar: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, gap: 16 },
  toolbarIcon: { fontSize: 14, fontWeight: '700' },
  textArea: { padding: 12, fontSize: 13, minHeight: 120 },
  
  footer: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 16, borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16, gap: 12
  },
  primaryBtn: { 
    width: '100%', height: 48, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center'
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 15 }
});
