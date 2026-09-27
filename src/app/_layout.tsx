import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import { Colors, GameFonts } from '@/constants/theme';
import {
  selectCanHostGame,
  selectCanManageStaff,
  selectSessionStatus,
} from '@/features/auth/authSlice';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useUserRoleSync } from '@/features/auth/useUserRoleSync';
import { useJoinedQuizSync } from '@/features/game/useJoinedQuizSync';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';

// A crash in any screen shows Expo Router's error screen (with Retry) instead of
// a blank page.
export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}

const buildNavigationTheme = (isDark: boolean): Theme => {
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = isDark ? Colors.dark : Colors.light;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
    fonts: {
      regular: { fontFamily: GameFonts.regular, fontWeight: 'normal' },
      medium: { fontFamily: GameFonts.medium, fontWeight: 'normal' },
      bold: { fontFamily: GameFonts.semiBold, fontWeight: 'normal' },
      heavy: { fontFamily: GameFonts.bold, fontWeight: 'normal' },
    },
  };
};

const RootNavigator = () => {
  useAuthSession();
  useUserRoleSync();
  useJoinedQuizSync();
  const isDark = useColorScheme() === 'dark';
  const sessionStatus = useAppSelector(selectSessionStatus);
  const isSignedIn = sessionStatus === 'signedIn';
  const canManageStaff = useAppSelector(selectCanManageStaff);
  const canHostGame = useAppSelector(selectCanHostGame);
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  // A font failure falls back to system fonts rather than blocking the app.
  const isReady = sessionStatus !== 'restoring' && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // The navigator must render from the very first render (Expo Router sets up
  // linking state on mount; rendering nothing here triggers "state update on a
  // component that hasn't mounted"). The native splash stays up until the session
  // is restored and fonts are in, so the signed-out screen and the font swap
  // underneath it are never seen.
  return (
    <ThemeProvider value={buildNavigationTheme(isDark)}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: GameFonts.bold },
        }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="game" options={{ title: '' }} />
          {/* Creating and starting quizzes is for admins and moderators. */}
          <Stack.Protected guard={canHostGame}>
            <Stack.Screen name="quizzes/index" options={{ title: 'Quizzes' }} />
            <Stack.Screen name="quizzes/[quizId]" options={{ title: '' }} />
          </Stack.Protected>
          {/* Adding staff is for admins only. */}
          <Stack.Protected guard={canManageStaff}>
            <Stack.Screen name="staff/new" options={{ title: 'Staff' }} />
          </Stack.Protected>
        </Stack.Protected>
        {/* Signed out, the first screen here is the landing: player creation. */}
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="create-player" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ title: '' }} />
          <Stack.Screen name="sign-up" options={{ title: '' }} />
          <Stack.Screen name="forgot-password" options={{ title: '' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
};
