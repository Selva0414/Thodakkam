import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, Keyboard
} from 'react-native';
import {
  ArrowLeft, Sparkles, History, MoreVertical, Paperclip, Send, X, File as FileIcon
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { userStore } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';

const AI_URL = 'https://ai-agent-v01.onrender.com/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

export default function StudentAICoach() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      text: `Hello ${userStore.name ? userStore.name.toUpperCase() : 'MUKESH'}! I'm Vetri, an AI agent from Thodakkam. I'm here to help you with career advice, resume building, and ATS analysis. How can I assist your journey today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    "Help me with my resume",
    "How to prepare for a technical interview?",
    "Find internship tips for freshers",
    "Check my ATS score"
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  const handleSend = async (text: string) => {
    if ((!text.trim() && !selectedFile) || loading) return;

    const userMessageText = text.trim() || (selectedFile ? `Attached: ${selectedFile.name}` : '');
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setLoading(true);

    try {
      const formData = new FormData();
      
      const instruction = "System Instructions: You are Vetri, an AI agent from Thodakkam. You are a helpful career coach providing resume advice, interview prep, and ATS analysis. IMPORTANT: Never break character. Never mention you are ChatGPT or OpenAI. You are exclusively Vetri.\n\nUser Message: ";
      
      formData.append('message', instruction + userMessageText);

      if (fileToUpload) {
        if (Platform.OS === 'web' && fileToUpload.file) {
          formData.append('file', fileToUpload.file);
        } else {
          formData.append('file', {
            uri: fileToUpload.uri,
            name: fileToUpload.name,
            type: fileToUpload.mimeType || 'application/pdf',
          } as any);
        }
      }

      const response = await fetch(AI_URL, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.reply || data.response || data.message || data.text || data.answer || data.result || JSON.stringify(data),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: "Sorry, I am having trouble connecting to the server right now. Please try again later.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="#f59e0b" />
                <Text style={[styles.headerTitle, { color: colors.text }]}>AI Career Coach</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>ONLINE & READY</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <History size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <ScrollView 
          style={styles.chatArea} 
          contentContainerStyle={styles.chatContent}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageWrapper, 
                msg.role === 'user' ? styles.messageUser : styles.messageBot
              ]}
            >
              {msg.role === 'bot' && (
                <View style={styles.botIcon}>
                  <Sparkles size={16} color="#f59e0b" />
                </View>
              )}
              <View style={[
                { flexShrink: 1 },
                msg.role === 'user' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
              ]}>
                <View style={[
                  styles.messageBubble,
                  msg.role === 'user' 
                    ? [styles.bubbleUser, { backgroundColor: colors.primary }] 
                    : [styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border }]
                ]}>
                  <Text style={[styles.messageText, msg.role === 'user' ? { color: '#ffffff' } : { color: colors.text }]}>{msg.text}</Text>
                </View>
                {msg.role === 'bot' && (
                  <Text style={[styles.messageTime, { color: colors.textSecondary }]}>COACH • {msg.time}</Text>
                )}
                {msg.role === 'user' && (
                  <Text style={[styles.messageTime, { color: colors.textSecondary, alignSelf: 'flex-end', marginRight: 16 }]}>YOU • {msg.time}</Text>
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageWrapper, styles.messageBot]}>
              <View style={styles.botIcon}>
                <Sparkles size={16} color="#f59e0b" />
              </View>
              <View style={[styles.messageBubble, styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 16, paddingHorizontal: 20 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        <View style={styles.quickPromptsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
            <View style={styles.promptsRow}>
              {quickPrompts.map((prompt, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.promptPill, { backgroundColor: isDark ? colors.background : colors.card, borderColor: colors.border }]}
                  onPress={() => handleSend(prompt)}
                >
                  <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: colors.background }]}>
          {selectedFile && (
            <View style={[styles.fileIndicator, { backgroundColor: isDark ? colors.card : '#e2e8f0', borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
                <FileIcon size={16} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, flex: 1 }} numberOfLines={1} ellipsizeMode="middle">
                  {selectedFile.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Message your AI Career Coach... (attach PDF for ATS analysis)"
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={() => {
                handleSend(input);
                Keyboard.dismiss();
              }}
            />
            <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
              <Paperclip size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() && !selectedFile || loading) && { opacity: 0.5 }]}
              onPress={() => handleSend(input)}
              disabled={(!input.trim() && !selectedFile) || loading}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981', // green dot
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  messageBot: {
    justifyContent: 'flex-start',
    marginRight: 40,
  },
  messageUser: {
    justifyContent: 'flex-end',
    marginLeft: 40,
  },
  botIcon: {
    width: 28,
    height: 28,
    marginTop: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bubbleBot: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleUser: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickPromptsScroll: {
    paddingRight: 16,
  },
  promptsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promptPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: 12,
  },
  attachBtn: {
    padding: 8,
  },
  fileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});
