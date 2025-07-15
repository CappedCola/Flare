import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@ui-kitten/components';
import { FlareStackParamList } from '../types';

// Import Flare screens
import { FlareHomeScreen } from '../screens/flare/FlareHomeScreen';
import { FlarePromptScreen } from '../screens/flare/FlarePromptScreen';
import { FlareCreationScreen } from '../screens/flare/FlareCreationScreen';
import { FlareResponseScreen } from '../screens/flare/FlareResponseScreen';
import { FlareChainViewScreen } from '../screens/flare/FlareChainViewScreen';
import { FlareHistoryScreen } from '../screens/flare/FlareHistoryScreen';
import { FlareChatScreen } from '../screens/flare/FlareChatScreen';
import { FlareCompletionScreen } from '../screens/flare/FlareCompletionScreen';
import { FlareDiscoveryScreen } from '../screens/flare/FlareDiscoveryScreen';
import { FlareLeaderboardScreen } from '../screens/flare/FlareLeaderboardScreen';

const Stack = createNativeStackNavigator<FlareStackParamList>();

export const FlareNavigator = () => {
  const theme = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme['background-basic-color-1'],
      borderBottomWidth: 1,
      borderBottomColor: theme['border-basic-color-3'],
    },
    headerTitleStyle: {
      color: theme['text-basic-color'],
      fontSize: 18,
      fontWeight: '600' as const,
    },
    headerTintColor: theme['color-primary-500'],
    headerBackTitleVisible: false,
    cardStyle: {
      backgroundColor: theme['background-basic-color-1'],
    },
  };

  return (
    <Stack.Navigator
      initialRouteName="FlareHome"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="FlareHome"
        component={FlareHomeScreen}
        options={{
          title: 'Flare Chains',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlarePrompt"
        component={FlarePromptScreen}
        options={{
          title: 'Choose Prompt',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareCreation"
        component={FlareCreationScreen}
        options={{
          title: 'Create Chain',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareResponse"
        component={FlareResponseScreen}
        options={{
          title: 'Your Turn',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareChainView"
        component={FlareChainViewScreen}
        options={{
          title: 'Chain Details',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareHistory"
        component={FlareHistoryScreen}
        options={{
          title: 'History',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareChat"
        component={FlareChatScreen}
        options={{
          title: 'Chain Chat',
          headerShown: false, // Custom header in component
        }}
      />
      
      <Stack.Screen
        name="FlareCompletion"
        component={FlareCompletionScreen}
        options={{
          title: 'Chain Complete!',
          headerShown: true,
          gestureEnabled: false, // Prevent swipe back
        }}
      />
      
      <Stack.Screen
        name="FlareDiscovery"
        component={FlareDiscoveryScreen}
        options={{
          title: 'Discover',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="FlareLeaderboard"
        component={FlareLeaderboardScreen}
        options={{
          title: 'Leaderboard',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};