import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { ArrowLeft, Briefcase, MapPin, DollarSign, FileText } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';
const BORDER = '#e2e8f0';

export default function StartupEditJob() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  const jobId = params.jobId as string;

  const [title, setTitle] = useState((params.title as string) || '');
  const [location, setLocation] = useState((params.location as string) || '');
  const [type, setType] = useState((params.type as string) || 'Full-time');
  const [salary, setSalary] = useState((params.salary as string) || '');
  const [description, setDescription] = useState((params.description as string) || '');
  const [requirements, setRequirements] = useState((params.requirements as string) || '');
  
  const [loading, setLoading] = useState(false);

  const handleUpdateJob = async () => {
    if (!title || !location || !description) {
      Alert.alert('Missing Fields', 'Please fill in the required fields: Title, Location, and Description.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          title,
          location,
          type,
          salary,
          description,
          requirements: requirements.split(',').map(r => r.trim()).filter(r => r.length > 0)
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Job updated successfully!');
        router.back();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title *</Text>
          <View style={styles.inputContainer}>
            <Briefcase size={20} color={TEXT_GRAY} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Senior Frontend Engineer"
              placeholderTextColor={TEXT_GRAY}
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={TEXT_GRAY} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="e.g. San Francisco, CA (Remote)"
              placeholderTextColor={TEXT_GRAY}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Job Type</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Full-time"
                placeholderTextColor={TEXT_GRAY}
                value={type}
                onChangeText={setType}
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Salary Range</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color={TEXT_GRAY} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="e.g. $120k - $150k"
                placeholderTextColor={TEXT_GRAY}
                value={salary}
                onChangeText={setSalary}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Description *</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <FileText size={20} color={TEXT_GRAY} style={styles.inputIconTop} />
            <TextInput 
              style={styles.textArea} 
              placeholder="Describe the role and responsibilities..."
              placeholderTextColor={TEXT_GRAY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requirements (Comma separated)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput 
              style={styles.textArea} 
              placeholder="e.g. 5+ years React, Node.js, GraphQL..."
              placeholderTextColor={TEXT_GRAY}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={requirements}
              onChangeText={setRequirements}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.postBtn} onPress={handleUpdateJob} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.postBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: BORDER
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 8 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, 
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 16, height: 52 
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: TEXT_DARK },
  
  row: { flexDirection: 'row' },
  
  textAreaContainer: { height: 120, alignItems: 'flex-start', paddingTop: 16 },
  inputIconTop: { marginRight: 12, marginTop: 2 },
  textArea: { flex: 1, fontSize: 15, color: TEXT_DARK, minHeight: 88 },
  
  footer: { 
    padding: 20, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  postBtn: { 
    backgroundColor: PRIMARY, height: 56, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  postBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' }
});
