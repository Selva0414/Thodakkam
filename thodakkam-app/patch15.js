const fs = require('fs');
let c = fs.readFileSync('src/app/student-messages.tsx', 'utf8');

const regex = /<View style=\{styles\.inputContainer\}>\s*<View style=\{styles\.inputWrapper\}>\s*<TouchableOpacity style=\{styles\.attachBtn\} onPress=\{handlePickImage\} disabled=\{!activeChatId\}>\s*<Plus size=\{20\} color=\{TEXT_GRAY\} \/>\s*<\/TouchableOpacity>\s*<TextInput\s*style=\{styles\.textInput\}\s*placeholder="Type a message..."/;

const replaceStr = `<View style={styles.inputContainer}>
          {showAttachmentMenu && (
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

if (regex.test(c)) {
  c = c.replace(regex, replaceStr);
  fs.writeFileSync('src/app/student-messages.tsx', c);
  console.log("Success regex match");
} else {
  console.log("Failed regex match");
}
