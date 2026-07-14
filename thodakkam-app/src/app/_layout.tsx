import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';


import { AppThemeProvider, useAppTheme } from '../context/ThemeContext';

function RootNavigation() {
  const { isDark } = useAppTheme();
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="student-dashboard" />
        <Stack.Screen name="startup-register" />
        <Stack.Screen name="startup-login" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigation />
    </AppThemeProvider>
  );
}
