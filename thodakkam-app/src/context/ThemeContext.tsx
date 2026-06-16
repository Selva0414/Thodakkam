import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  inputBg: string;
  success: string;
  danger: string;
  warning: string;
  headerTitle: string;
  overlay: string;
}

interface ThemeContextValue {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  background: '#f4f5f7', // Based on dashboard BG
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  primary: '#5A279B',
  inputBg: '#f8fafc',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  headerTitle: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  primary: '#7c3aed', // Slightly lighter primary for dark mode visibility
  inputBg: '#0f172a',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  headerTitle: '#ffffff',
  overlay: 'rgba(0,0,0,0.7)',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>(systemColorScheme === 'dark' ? 'dark' : 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('appTheme').then(savedTheme => {
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
      setIsLoaded(true);
    });
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) return null; // Prevent flicker while loading

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a AppThemeProvider');
  }
  return context;
}
