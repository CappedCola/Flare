import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './app/navigation/RootNavigator';
import * as eva from '@eva-design/eva';
import { flareThemeLogoBased } from './app/theme/newflaretheme';
import { AuthProvider } from './app/context/AuthContext';
import { NavigationProvider } from './app/context/NavigationContext';
import { NotificationProvider } from './app/context/NotificationContext';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={flareThemeLogoBased}>
        <AuthProvider>
          <NavigationProvider>
            <NotificationProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </NotificationProvider>
          </NavigationProvider>
        </AuthProvider>
      </ApplicationProvider>
    </>
  );
}