import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SolSplashScreen } from './src/screens/auth/SolSplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
          {showSplash ? (
            <SolSplashScreen onFinish={() => setShowSplash(false)} durationMs={2000} />
          ) : null}
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
