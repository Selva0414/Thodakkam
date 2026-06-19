const fs = require('fs');

let code = fs.readFileSync('src/app/saved-posts.tsx', 'utf8');

const regex = /\{\s*post\.imageUrl\s*&&\s*\(\s*<Image\s+source=\{\{\s*uri:\s*post\.imageUrl\s*\}\}\s+style=\{styles\.postImage\}\s+resizeMode="contain"\s*\/>\s*\)\s*\}/g;

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

if (regex.test(code)) {
  code = code.replace(regex, newImageBlock);
  fs.writeFileSync('src/app/saved-posts.tsx', code);
  console.log('Replaced correctly!');
} else {
  console.log('Regex did not match');
}
