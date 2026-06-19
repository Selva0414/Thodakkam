const fs = require('fs');

let code = fs.readFileSync('src/app/student-assessments.tsx', 'utf8');

// 1. Fix the BottomTabBar call
code = code.replace(/<BottomTabBar activeTab="Tests" \/>/g, '<BottomTabBar activeTab="Test" />');

// 2. Fix the routing logic
code = code.replace(/activeTab === 'Tests'/g, "activeTab === 'Test'");

// 3. Update tabBarStyles
code = code.replace(/const tabBarStyles = StyleSheet\.create\(\{[\s\S]*?\}\);/m, `const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '500' },
});`);

// 4. Update scrollContent paddingBottom from 100 to 32
code = code.replace(/scrollContent:\s*\{\s*padding:\s*24,\s*paddingBottom:\s*100\s*\}/g, 'scrollContent: { padding: 24, paddingBottom: 32 }');

fs.writeFileSync('src/app/student-assessments.tsx', code);
console.log('Fixed student-assessments.tsx');
