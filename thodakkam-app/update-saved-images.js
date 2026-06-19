const fs = require('fs');

let code = fs.readFileSync('src/app/saved-posts.tsx', 'utf8');

// 1. Update the parsing logic in fetchPosts
const oldParsing = `        const processedPosts = data.posts.map((post) => {
          let pImageUrl = post.imageUrl;
          if (pImageUrl) {
            try {
              const parsed = JSON.parse(pImageUrl);
              if (Array.isArray(parsed) && parsed.length > 0) pImageUrl = parsed[0];
            } catch(e){}
            if (pImageUrl && !pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
              const filename = pImageUrl.split(/[\\/\\\\]/).pop();
              pImageUrl = \`\${baseUrl}/uploads/\${filename}\`;
            }
          }`;

const newParsing = `        const processedPosts = data.posts.map((post) => {
          let pImageUrl = post.imageUrl;
          let parsedImages = [];
          if (pImageUrl) {
            try {
              const parsed = JSON.parse(pImageUrl);
              if (Array.isArray(parsed)) {
                parsedImages = parsed.map(url => {
                  if (!url.startsWith('http') && !url.startsWith('data:image')) {
                    const filename = url.split(/[\\/\\\\]/).pop();
                    return \`\${baseUrl}/uploads/\${filename}\`;
                  }
                  return url;
                });
              } else {
                if (!pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
                  const filename = pImageUrl.split(/[\\/\\\\]/).pop();
                  parsedImages = [\`\${baseUrl}/uploads/\${filename}\`];
                } else {
                  parsedImages = [pImageUrl];
                }
              }
            } catch (e) {
              if (!pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
                const filename = pImageUrl.split(/[\\/\\\\]/).pop();
                parsedImages = [\`\${baseUrl}/uploads/\${filename}\`];
              } else {
                parsedImages = [pImageUrl];
              }
            }
          }`;

code = code.replace(oldParsing, newParsing);

// Update the return statement of processedPosts map
code = code.replace(/return \{ \.\.\.post, imageUrl: pImageUrl, user: post\.user \? \{ \.\.\.post\.user, profilePhoto: uPhoto \} : null \};/, 
                    'return { ...post, imageUrls: parsedImages, user: post.user ? { ...post.user, profilePhoto: uPhoto } : null };');

// 2. Import Modal and Dimensions if missing
if (!code.includes("import { Dimensions, Modal } from 'react-native';")) {
  code = code.replace(/import \{ useAppTheme \} from '\.\.\/context\/ThemeContext';/, 
    "import { useAppTheme } from '../context/ThemeContext';\nimport { Dimensions, Modal } from 'react-native';\nconst { width: SCREEN_WIDTH } = Dimensions.get('window');");
}

// 3. Add state variables for the image viewer to PostItem
if (!code.includes('const [viewerVisible, setViewerVisible]')) {
  code = code.replace(/const \[hasSaved, setHasSaved\] = useState\(initiallySaved\);/, 
    "const [hasSaved, setHasSaved] = useState(initiallySaved);\n  const [viewerVisible, setViewerVisible] = useState(false);\n  const [viewerIndex, setViewerIndex] = useState(0);");
}

// 4. Replace the old Image block with the grid logic
const oldImageBlock = `      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="contain" />
      )}`;

const newImageBlock = `      {post.imageUrls && post.imageUrls.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          {post.imageUrls.length === 1 ? (
            <TouchableOpacity onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
              <Image source={{ uri: post.imageUrls[0] }} style={[styles.postImage, { backgroundColor: '#ffffff', marginBottom: 0 }]} resizeMode="contain" />
            </TouchableOpacity>
          ) : post.imageUrls.length === 2 ? (
            <View style={{ flexDirection: 'row', gap: 4, height: 220 }}>
              {post.imageUrls.map((img, idx) => (
                <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => { setViewerIndex(idx); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: img }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          ) : post.imageUrls.length === 3 ? (
            <View style={{ flexDirection: 'row', gap: 4, height: 220 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
                <Image source={{ uri: post.imageUrls[0] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(1); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[1] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(2); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[2] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 4, height: 220 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[0] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(2); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[2] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(1); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[1] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, position: 'relative' }} onPress={() => { setViewerIndex(3); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[3] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                  {post.imageUrls.length > 4 && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>+{post.imageUrls.length - 4}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}`;

code = code.replace(oldImageBlock, newImageBlock);

// 5. Add Modal code at the end of PostItem before the final `</View>`
const modalCode = `
      {/* Full Screen Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, zIndex: 10 }}>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 8 }}>
                <Text style={{ color: '#fff', fontSize: 32, lineHeight: 32 }}>×</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {viewerIndex + 1} / {post.imageUrls?.length || 0}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setViewerIndex(newIndex);
              }}
              contentOffset={{ x: viewerIndex * SCREEN_WIDTH, y: 0 }}
              style={{ flex: 1 }}
            >
              {post.imageUrls?.map((img, idx) => (
                <View key={idx} style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 8 }}>
              {post.imageUrls?.map((_, idx) => (
                <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: viewerIndex === idx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}`;

if (!code.includes("Modal visible={viewerVisible}")) {
  code = code.replace(/    <\/View>\r?\n  \);\r?\n\}/, modalCode);
}

fs.writeFileSync('src/app/saved-posts.tsx', code);
console.log('Done!');
