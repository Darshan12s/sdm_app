import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { useIsDarkMode } from '@/stores/appStore';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  modal: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Border colors
  border: string;
  borderLight: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Tab colors
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Header colors
  headerBackground: string;
  headerTint: string;

  // Shadow colors
  shadow: string;
}

const lightTheme: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  modal: '#ffffff',

  text: '#000000',
  textSecondary: '#424242',
  textMuted: '#666666',

  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  primary: '#3ace9f',
  primaryLight: '#5ed4a8',
  primaryDark: '#2ab086',

  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FF9800',
  info: '#22c55e',

  inputBackground: '#ffffff',
  inputBorder: '#cccccc',
  inputPlaceholder: '#999999',

  tabBarBackground: '#ffffff',
  tabBarActive: '#2dd4bf',
  tabBarInactive: '#64748b',

  headerBackground: '#2dd4bf',
  headerTint: '#ffffff',

  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2a2a2a',
  modal: '#2a2a2a',

  text: '#ffffff',
  textSecondary: '#e0e0e0',
  textMuted: '#b0b0b0',

  border: '#333333',
  borderLight: '#404040',

  primary: '#3ace9f',
  primaryLight: '#5ed4a8',
  primaryDark: '#2ab086',

  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#22c55e',

  inputBackground: '#2a2a2a',
  inputBorder: '#555555',
  inputPlaceholder: '#888888',

  tabBarBackground: '#1e1e1e',
  tabBarActive: '#2dd4bf',
  tabBarInactive: '#888888',

  headerBackground: '#2a2a2a',
  headerTint: '#ffffff',

  shadow: '#000000',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightTheme,
  isDark: false,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = React.memo(({ children }) => {
  const isDarkMode = useIsDarkMode();
  const systemColorScheme = useColorScheme();

  // Use app theme preference, fallback to system preference
  const isDark = useMemo(() => isDarkMode ?? (systemColorScheme === 'dark'), [isDarkMode, systemColorScheme]);
  const colors = useMemo(() => isDark ? darkTheme : lightTheme, [isDark]);

  useEffect(() => {
    // Update status bar style based on theme
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(colors.headerBackground);
  }, [isDark, colors.headerBackground]);

  const value = useMemo(() => ({
    colors,
    isDark,
  }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
});

export default ThemeProvider;