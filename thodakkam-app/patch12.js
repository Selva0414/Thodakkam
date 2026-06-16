const fs = require('fs');
let c = fs.readFileSync('src/app/student-messages.tsx', 'utf8');

c = c.replace(
  /<View style=\{msg\.isSentByMe \? styles\.messageBubbleSent : styles\.messageBubbleReceived\}>[\s\S]*?<\/View>/m,
  `<View style={[msg.isSentByMe ? styles.messageBubbleSent : styles.messageBubbleReceived, (msg.text.startsWith('data:image/') || msg.text.startsWith('[DOCUMENT] ') || msg.text.startsWith('Sent a document: ')) && { padding: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
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
                    </View>`
);

fs.writeFileSync('src/app/student-messages.tsx', c);
