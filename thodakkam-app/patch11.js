const fs = require('fs');
let c = fs.readFileSync('src/app/student-messages.tsx', 'utf8');

c = c.replace(
  /SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal, Animated/g,
  "SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal, Animated, Alert, Linking"
);

c = c.replace(
  /Menu, Search, Plus, Smile, Send, Briefcase, Users, LayoutDashboard, ClipboardList, MessageSquare, X/g,
  "Menu, Search, Plus, Smile, Send, Briefcase, Users, LayoutDashboard, ClipboardList, MessageSquare, X, FileText, Image as LucideImage, Paperclip, Download"
);

c = c.replace(
  /import \* as ImagePicker from 'expo-image-picker';/,
  "import * as ImagePicker from 'expo-image-picker';\nimport * as DocumentPicker from 'expo-document-picker';"
);

c = c.replace(
  /const \[message, setMessage\] = useState\(''\);/,
  "const [message, setMessage] = useState('');\n  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);\n  const [selectedImage, setSelectedImage] = useState<string | null>(null);"
);

const pickersCode = `  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    if (!activeChatId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64Img = \`data:image/jpeg;base64,\${result.assets[0].base64}\`;
      sendActualMessage(base64Img);
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);
    if (!activeChatId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        
        // Convert to base64
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          sendActualMessage(\`[DOCUMENT] \${fileName}|\${base64data}\`);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };`;

c = c.replace(
  /const handlePickImage = async \(\) => \{[\s\S]*?\n  \};/g,
  pickersCode
);

const chatRenderOld = `<View style={msg.isSentByMe ? styles.messageBubbleSent : styles.messageBubbleReceived}>
                      {msg.text.startsWith('data:image/') ? (
                        <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />
                      ) : (
                        <Text style={msg.isSentByMe ? styles.messageTextSent : styles.messageTextReceived}>{msg.text}</Text>
                      )}
                    </View>`;

const chatRenderNew = `<View style={[msg.isSentByMe ? styles.messageBubbleSent : styles.messageBubbleReceived, (msg.text.startsWith('data:image/') || msg.text.startsWith('[DOCUMENT] ') || msg.text.startsWith('Sent a document: ')) && { padding: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
                      {msg.text.startsWith('data:image/') ? (
                        <TouchableOpacity onPress={() => setSelectedImage(msg.text)}>
                          <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />
                        </TouchableOpacity>
                      ) : msg.text.startsWith('[DOCUMENT] ') || msg.text.startsWith('Sent a document: ') ? (
                        <View style={{ width: 260, backgroundColor: PRIMARY, borderRadius: 16, overflow: 'hidden' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 8 }}>
                            <Paperclip size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                              {msg.text.split('|')[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '')}
                            </Text>
                          </View>
                          <View style={{ backgroundColor: WHITE, height: 140, marginHorizontal: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                            <Paperclip size={48} color="#94a3b8" />
                          </View>
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginTop: 4 }}
                            onPress={() => {
                               const parts = msg.text.split('|');
                               const fileName = parts[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '');
                               if (parts.length > 1) {
                                 const base64Data = parts[1];
                                 if (Platform.OS === 'web') {
                                    const a = document.createElement("a");
                                    a.href = base64Data || '';
                                    a.download = fileName;
                                    a.click();
                                 } else {
                                    Linking.openURL(base64Data || '').catch(() => {
                                      Alert.alert('Download Error', 'Could not open the document.');
                                    });
                                 }
                               } else {
                                 Alert.alert('Download Started', 'Downloading ' + fileName);
                               }
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                              <Paperclip size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 6 }} />
                              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                                {msg.text.split('|')[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '')}
                              </Text>
                            </View>
                            <Download size={18} color="rgba(255,255,255,0.7)" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={msg.isSentByMe ? styles.messageTextSent : styles.messageTextReceived}>{msg.text}</Text>
                      )}
                    </View>`;

c = c.replace(chatRenderOld, chatRenderNew);

const inputAreaOld = `<View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} disabled={!activeChatId}>
              <Plus size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."`;

const inputAreaNew = `{showAttachmentMenu && (
            <View style={{ position: 'absolute', bottom: 70, left: 16, backgroundColor: WHITE, borderRadius: 12, padding: 8, width: 200, zIndex: 100, elevation: 10, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, borderWidth: 1, borderColor: '#f3e8ff' }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 }} onPress={handlePickDocument}>
                <Paperclip size={18} color="#4c1d95" style={{ marginRight: 12 }} />
                <Text style={{ color: '#4c1d95', fontSize: 15, fontWeight: '500' }}>Attach File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 }} onPress={handlePickImage}>
                <LucideImage size={18} color="#4c1d95" style={{ marginRight: 12 }} />
                <Text style={{ color: '#4c1d95', fontSize: 15, fontWeight: '500' }}>Image</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={[styles.attachBtn, { backgroundColor: '#f3e8ff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setShowAttachmentMenu(!showAttachmentMenu)} disabled={!activeChatId}>
              <Plus size={18} color="#8b5cf6" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Write a message..."`;

c = c.replace(inputAreaOld, inputAreaNew);

const modalsStr = `{/* New Conversation Modal */}`;
const newModals = `{/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setSelectedImage(null)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage || '' }} style={{ width: '100%', height: '70%' }} resizeMode="contain" />
          <TouchableOpacity 
            style={{ marginTop: 20, backgroundColor: '#5A279B', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (Platform.OS === 'web') {
                 const a = document.createElement("a");
                 a.href = selectedImage || '';
                 a.download = 'image.jpg';
                 a.click();
              } else {
                 Linking.openURL(selectedImage || '').catch(() => Alert.alert('Error', 'Could not download image.'));
              }
            }}
          >
            <Download size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Download Image</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Conversation Modal */}`;

c = c.replace(modalsStr, newModals);

fs.writeFileSync('src/app/student-messages.tsx', c);
