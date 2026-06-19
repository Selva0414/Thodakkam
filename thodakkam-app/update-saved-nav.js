const fs = require('fs');

let code = fs.readFileSync('src/app/saved-posts.tsx', 'utf8');

// 1. Add missing imports
code = code.replace(
  /LayoutDashboard, Briefcase,/,
  'LayoutDashboard, Briefcase, LayoutGrid, Calendar,'
);

// 2. Replace BottomTabBar component
const oldTabBar = /function BottomTabBar\(\) \{[\s\S]*?\}\s*export default function SavedPosts/m;
const newTabBar = `function BottomTabBar({ role, identifier }: { role: string, identifier: string }) {
  const { colors, isDark } = useAppTheme();
  const tabBarStyles = getTabBarStyles(colors, isDark);
  const router = useRouter();
  
  const studentTabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs', icon: Briefcase, path: '/student-jobs' },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ];

  const startupTabs = [
    { label: 'Dashboard', icon: LayoutGrid, path: { pathname: '/startup-dashboard', params: { companyName: identifier } } },
    { label: 'Jobs', icon: Briefcase, path: { pathname: '/startup-jobs', params: { companyName: identifier } } },
    { label: 'Candidates', icon: Users, path: { pathname: '/startup-candidates', params: { companyName: identifier } } },
    { label: 'Interviews', icon: Calendar, path: { pathname: '/startup-interviews', params: { companyName: identifier } } },
    { label: 'Community', icon: MessageSquare, path: { pathname: '/startup-community', params: { companyName: identifier } } }
  ];

  const tabs = role === 'startup' ? startupTabs : studentTabs;
  // Make "Feed" or "Community" active or none active, since Saved Posts isn't explicitly on the bar
  const activeLabel = ''; 

  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = activeLabel === label;
        return (
          <TouchableOpacity
            key={label}
            style={tabBarStyles.tab}
            onPress={() => {
              if (path) router.push(path as any);
            }}
          >
            <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
            <Text style={[tabBarStyles.label, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SavedPosts`;

code = code.replace(oldTabBar, newTabBar);

// 3. Pass props in the usage
code = code.replace(/<BottomTabBar \/>/g, '<BottomTabBar role={role} identifier={identifier} />');

fs.writeFileSync('src/app/saved-posts.tsx', code);
console.log('Done!');
