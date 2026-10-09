import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeMode } from '@rneui/themed';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, useAppContext } from './src/context/AppContext';
import { initializeDatabase } from './src/db/database';
import { restoreSession } from './src/services/session';
import { appTheme, colors } from './src/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const darkNavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.maize,
    background: '#101820',
    card: '#17212B',
    border: '#253443',
  },
};

function AppContent({ initialSession }) {
  const { preferences } = useAppContext();
  const { setMode } = useThemeMode();

  // Keep the UI library's theme in sync with the dark theme setting.
  useEffect(() => {
    setMode(preferences.darkTheme ? 'dark' : 'light');
  }, [preferences.darkTheme]);

  return (
    <>
      <StatusBar style={preferences.darkTheme ? 'light' : 'dark'} />
      <NavigationContainer
        theme={preferences.darkTheme ? darkNavigationTheme : NavigationDefaultTheme}
      >
        <AppNavigator initialSession={initialSession} />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialSession, setInitialSession] = useState(null);

  useEffect(() => {
    Promise.all([initializeDatabase(), restoreSession()])
      .then(([, session]) => setInitialSession(session))
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={appTheme}>
        <AppContextProvider initialSession={initialSession}>
          <AppContent initialSession={initialSession} />
        </AppContextProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.cream,
    flex: 1,
    justifyContent: 'center',
  },
});
