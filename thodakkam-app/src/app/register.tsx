import React from 'react';
import {
  StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView, Image, Modal
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  GraduationCap, Lock, UploadCloud, FileText, Briefcase, Link as LinkIcon, Globe, ChevronDown, X, Sparkles, Check, LayoutGrid
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY_COLOR = '#5A279B';

const GithubIcon = (props: any) => <FontAwesome5 name="github" {...props} />;
const LinkedinIcon = (props: any) => <FontAwesome5 name="linkedin" {...props} />;

function SectionHeader({ icon: Icon, title, rightText, onRightPress }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Icon size={18} color="#4b5563" strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {rightText && (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={styles.sectionRightText}>{rightText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InputField({ label, placeholder, icon: Icon, rightIcon: RightIcon, secureTextEntry, multiline, containerStyle, prefixDivider, value, onChangeText, keyboardType, autoCapitalize }: any) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
        {Icon && (
          <View style={[styles.iconWithDivider, !prefixDivider && { marginRight: 8 }]}>
            <Icon size={18} color={prefixDivider ? "#6b7280" : "#9ca3af"} />
            {prefixDivider && <View style={styles.verticalDivider} />}
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, Icon && !prefixDivider && { paddingLeft: 8 }]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {RightIcon && <RightIcon size={18} color="#9ca3af" style={styles.inputRightIcon} />}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = React.useState<any>(null);
  const [resumeFile, setResumeFile] = React.useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  // Form Field States
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [location, setLocation] = React.useState('');

  // Education State
  const [educationInstitution, setEducationInstitution] = React.useState('');
  const [educationDegree, setEducationDegree] = React.useState('');
  const [educationStartYear, setEducationStartYear] = React.useState('');
  const [educationEndYear, setEducationEndYear] = React.useState('');
  const [educationCGPA, setEducationCGPA] = React.useState('');

  // Experience State
  const [internships, setInternships] = React.useState([
    { company: '', role: '', startDate: '', endDate: '', description: '' }
  ]);

  const addInternship = () => {
    setInternships([...internships, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  };

  const updateInternship = (index: number, field: string, value: string) => {
    const newInternships = [...internships];
    newInternships[index] = { ...newInternships[index], [field]: value };
    setInternships(newInternships);
  };

  // Social Links State
  const [portfolioUrl, setPortfolioUrl] = React.useState('');
  const [githubUrl, setGithubUrl] = React.useState('');
  const [linkedinUrl, setLinkedinUrl] = React.useState('');

  // Skills States
  const [skills, setSkills] = React.useState<string[]>(['UI Design', 'Python', 'Data Analysis', 'React.js', 'Marketing']);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [newSkillText, setNewSkillText] = React.useState('');
  const [showSkillInput, setShowSkillInput] = React.useState(false);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (newSkillText.trim()) {
      const trimmed = newSkillText.trim();
      if (!skills.includes(trimmed)) {
        setSkills([...skills, trimmed]);
      }
      if (!selectedSkills.includes(trimmed)) {
        setSelectedSkills([...selectedSkills, trimmed]);
      }
      setNewSkillText('');
      setShowSkillInput(false);
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking photo:', err);
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setResumeFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking resume:', err);
    }
  };

  const handleCompleteProfile = async () => {
    if (!fullName || !email || !password) {
      alert('Please fill out Name, Email, and Password.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', phone);
      formData.append('location', location);

      // Skills
      selectedSkills.forEach((s) => {
        formData.append('skills', s);
      });

      // Education
      formData.append('educationInstitution', educationInstitution);
      formData.append('educationDegree', educationDegree);
      formData.append('educationStartYear', educationStartYear);
      formData.append('educationEndYear', educationEndYear);
      formData.append('educationDescription', `CGPA: ${educationCGPA}`);

      // Experience
      formData.append('experienceCompany', internships[0].company);
      formData.append('experienceRole', internships[0].role);
      formData.append('experienceStartDate', internships[0].startDate);
      formData.append('experienceEndDate', internships[0].endDate);

      let finalDescription = internships[0].description;
      if (internships.length > 1) {
        finalDescription = JSON.stringify(internships);
      }
      formData.append('experienceDescription', finalDescription);

      // Socials
      formData.append('portfolioUrl', portfolioUrl);
      formData.append('githubUrl', githubUrl);
      formData.append('linkedinUrl', linkedinUrl);

      // Profile Photo
      if (profilePhoto) {
        if (Platform.OS === 'web') {
          const res = await fetch(profilePhoto.uri);
          const blob = await res.blob();
          formData.append('profilePhoto', blob, profilePhoto.fileName || 'profile.jpg');
        } else {
          const fileObj = {
            uri: profilePhoto.uri,
            name: profilePhoto.fileName || 'profile.jpg',
            type: profilePhoto.mimeType || 'image/jpeg',
          };
          formData.append('profilePhoto', fileObj as any);
        }
      }

      // Resume
      if (resumeFile) {
        if (Platform.OS === 'web') {
          const res = await fetch(resumeFile.uri);
          const blob = await res.blob();
          formData.append('resumeFile', blob, resumeFile.name || 'resume.pdf');
        } else {
          const fileObj = {
            uri: resumeFile.uri,
            name: resumeFile.name || 'resume.pdf',
            type: resumeFile.mimeType || 'application/pdf',
          };
          formData.append('resumeFile', fileObj as any);
        }
      }

      const BACKEND_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const resJson = await response.json();
      if (resJson.success) {
        setShowSuccessModal(true);
      } else {
        alert(resJson.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend database server.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconContainer}>
                <Check size={40} color="#ffffff" strokeWidth={3} />
              </View>

              <Text style={styles.modalTitle}>Profile Created!</Text>
              <Text style={styles.modalSubtitle}>
                Your profile is ready. Start applying for internships and jobs.
              </Text>

              <TouchableOpacity
                style={styles.modalDashboardButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace('/login');
                }}
              >
                <LayoutGrid size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.modalDashboardButtonText}>Go to login page</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <GraduationCap size={20} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Student{'\n'}Portal</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Texts */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Personal Details</Text>
            <Text style={styles.pageSubtitle}>Let's start with your basic information to build your profile.</Text>
          </View>

          {/* Profile Photo */}
          <View style={styles.profilePhotoSection}>
            <TouchableOpacity style={styles.avatarPlaceholder} onPress={pickProfilePhoto}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto.uri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarInner} />
              )}
            </TouchableOpacity>
            <View style={styles.profilePhotoTexts}>
              <Text style={styles.profilePhotoTitle}>Upload Profile Photo</Text>
              <Text style={styles.profilePhotoSubtitle}>Professional headshots are recommended (Max 5MB)</Text>
              <TouchableOpacity style={styles.chooseFileBtn} onPress={pickProfilePhoto}>
                <Text style={styles.chooseFileText}>{profilePhoto ? 'Change Photo' : 'Choose File'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Info Fields */}
          <InputField label="Full Name" placeholder="e.g. Shabari E S" value={fullName} onChangeText={setFullName} />
          <InputField label="Email Address" placeholder="shabariesc@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <InputField label="Password" placeholder="******" icon={Lock} secureTextEntry value={password} onChangeText={setPassword} />
          <InputField label="Phone Number" placeholder="+91 6380335633" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputField label="Location" placeholder="City, Country" value={location} onChangeText={setLocation} />

          <View style={styles.divider} />

          {/* Resume Upload */}
          <SectionHeader icon={FileText} title="Resume Upload" />
          {resumeFile ? (
            <View style={styles.uploadedFileContainer}>
              <FileText size={24} color="#5A279B" />
              <View style={styles.uploadedFileInfo}>
                <Text style={styles.uploadedFileName} numberOfLines={1}>{resumeFile.name}</Text>
                <Text style={styles.uploadedFileSize}>
                  {resumeFile.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setResumeFile(null)}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.dropzone} onPress={pickResume}>
              <UploadCloud size={28} color="#9ca3af" style={{ marginBottom: 12 }} />
              <Text style={styles.dropzoneTitle}>Drag and drop your resume here</Text>
              <Text style={styles.dropzoneSubtitle}>PDF, DOCX supported (Max 10MB)</Text>
              <TouchableOpacity onPress={pickResume}>
                <Text style={styles.browseFilesText}>Or browse files</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Skill Sets */}
          <SectionHeader icon={Sparkles} title="Skill Sets" rightText="SELECT AT LEAST 3" />
          <View style={styles.tagsContainer}>
            {skills.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={isSelected ? styles.tagTextSelected : styles.tagText}>{skill}</Text>
                  {isSelected && <X size={14} color="#ffffff" style={styles.tagIcon} />}
                </TouchableOpacity>
              );
            })}

            {showSkillInput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.inputWrapper, { width: 120, height: 36, paddingHorizontal: 8 }]}
                  placeholder="Skill name..."
                  value={newSkillText}
                  onChangeText={setNewSkillText}
                  onSubmitEditing={addCustomSkill}
                  autoFocus
                />
                <TouchableOpacity onPress={addCustomSkill} style={[styles.addTagBtn, { backgroundColor: PRIMARY_COLOR }]}>
                  <Text style={[styles.addTagText, { color: '#ffffff' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addTagBtn} onPress={() => setShowSkillInput(true)}>
                <Text style={styles.addTagText}>+ Add More</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Education Details */}
          <SectionHeader icon={GraduationCap} title="Education Details" rightText="+ Add Education" />
          <InputField label="Institution" placeholder="University Name" value={educationInstitution} onChangeText={setEducationInstitution} />
          <InputField label="Degree" placeholder="B.E. Computer Science" value={educationDegree} onChangeText={setEducationDegree} />
          <View style={styles.row}>
            <InputField label="Start Year" placeholder="2023" rightIcon={ChevronDown} containerStyle={{ flex: 1, marginRight: 12 }} value={educationStartYear} onChangeText={setEducationStartYear} />
            <InputField label="End Year (Expected)" placeholder="2027" rightIcon={ChevronDown} containerStyle={{ flex: 1 }} value={educationEndYear} onChangeText={setEducationEndYear} />
          </View>
          <InputField label="CGPA (Optional)" placeholder="8 / 10" value={educationCGPA} onChangeText={setEducationCGPA} />

          <View style={styles.divider} />

          {/* Internship Experience */}
          <SectionHeader icon={Briefcase} title="Internship Experience" rightText="+ Add Internship" onRightPress={addInternship} />
          {internships.map((internship, index) => (
            <View key={index} style={index > 0 ? { marginTop: 24 } : {}}>
              {index > 0 && <View style={styles.divider} />}
              <InputField label="Company Name" placeholder="e.g. Google, Inc." value={internship.company} onChangeText={(val: string) => updateInternship(index, 'company', val)} />
              <InputField label="Role / Title" placeholder="e.g. Software Engineer Intern" value={internship.role} onChangeText={(val: string) => updateInternship(index, 'role', val)} />
              <View style={styles.row}>
                <InputField label="Start Date" placeholder="mm/dd/yyyy" containerStyle={{ flex: 1, marginRight: 12 }} value={internship.startDate} onChangeText={(val: string) => updateInternship(index, 'startDate', val)} />
                <InputField label="End Date" placeholder="mm/dd/yyyy" containerStyle={{ flex: 1 }} value={internship.endDate} onChangeText={(val: string) => updateInternship(index, 'endDate', val)} />
              </View>
              <InputField
                label="Description"
                placeholder="Describe your key responsibilities and achievements..."
                multiline
                value={internship.description}
                onChangeText={(val: string) => updateInternship(index, 'description', val)}
              />
            </View>
          ))}

          <View style={styles.divider} />

          {/* Portfolio & Social Links */}
          <SectionHeader icon={LinkIcon} title="Portfolio & Social Links" />
          <InputField placeholder="Personal Website URL" icon={Globe} prefixDivider value={portfolioUrl} onChangeText={setPortfolioUrl} />
          <InputField placeholder="GitHub Profile" icon={GithubIcon} prefixDivider value={githubUrl} onChangeText={setGithubUrl} />
          <InputField placeholder="LinkedIn Profile" icon={LinkedinIcon} prefixDivider value={linkedinUrl} onChangeText={setLinkedinUrl} />

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteProfile}>
            <Text style={styles.completeBtnText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 16,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scrollContent: {
    padding: 24,
  },
  pageHeader: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  profilePhotoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffcf5', // Light tint for avatar bg
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7', // Inner tint
  },
  profilePhotoTexts: {
    flex: 1,
    gap: 4,
  },
  profilePhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  profilePhotoSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  chooseFileBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chooseFileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  iconWithDivider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  inputRightIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: {
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionRightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dropzone: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  browseFilesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tagSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  tagTextSelected: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
  tagIcon: {
    marginLeft: 6,
  },
  addTagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  addTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  completeBtn: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
    gap: 12,
  },
  uploadedFileInfo: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      }
    }),
  },
  modalIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#20c997', // Green color from screenshot
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#20c997',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#20c997',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      }
    }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  modalDashboardButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalDashboardButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalViewProfileBtn: {
    paddingVertical: 8,
  },
  modalViewProfileText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
