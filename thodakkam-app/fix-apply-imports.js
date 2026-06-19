const fs = require('fs');

let code = fs.readFileSync('src/app/student-apply.tsx', 'utf8');

// The file was corrupted at the top, let's prepend the missing lines.
// But first, let's remove any duplicate "import StudentHeader" just in case.

// Let's replace everything from the start to `import StudentHeader` with the correct imports.
code = code.replace(/^[\s\S]*?(?=import StudentHeader)/, `import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, CloudUpload, Send, ArrowLeft, UploadCloud, CheckCircle, AlertCircle, ClipboardList
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { globalNotificationStore } from '../utils/notificationStore';
import { userStore } from '../utils/userStore';
`);

fs.writeFileSync('src/app/student-apply.tsx', code);
console.log('Fixed student-apply.tsx imports');
