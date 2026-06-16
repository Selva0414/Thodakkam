const fs = require('fs');
let c = fs.readFileSync('src/app/startup-messages.tsx', 'utf8');

c = c.replace(
  /const \[companyLogo, setCompanyLogo\] = useState<string \| null>\(null\);/,
  "const [companyLogo, setCompanyLogo] = useState<string | null>(null);\n  const [selectedImage, setSelectedImage] = useState<string | null>(null);"
);

c = c.replace(
  /<Image source=\{\{ uri: msg\.text \}\} style=\{\{ width: 200, height: 200, borderRadius: 8 \}\} resizeMode="cover" \/>/,
  `<TouchableOpacity onPress={() => setSelectedImage(msg.text)}>\n                          <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />\n                        </TouchableOpacity>`
);

const modalCode = `      {/* Image Viewer Modal */}
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
            style={{ marginTop: 20, backgroundColor: '#662483', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (Platform.OS === 'web') {
                 const a = document.createElement("a");
                 a.href = selectedImage;
                 a.download = 'image.jpg';
                 a.click();
              } else {
                 Linking.openURL(selectedImage).catch(() => Alert.alert('Error', 'Could not download image.'));
              }
            }}
          >
            <Download size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Download Image</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Conversation Modal */}`;

c = c.replace(/\{\/\* New Conversation Modal \*\/\}/, modalCode);

fs.writeFileSync('src/app/startup-messages.tsx', c);
