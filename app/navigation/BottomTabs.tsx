import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '../screens/FeedScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FloatingTabBar } from '../components/FloatingTabBar';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ navigation, state }: any) => {
  const currentRoute = state.routeNames[state.index];
  return <FloatingTabBar navigation={navigation} currentRoute={currentRoute} />;
};

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ 
        headerShown: false
      }}
    >
      <Tab.Screen name='Feed' component={FeedScreen} />
      <Tab.Screen name='Camera' component={CameraScreen} />
      <Tab.Screen name='Profile' component={ProfileScreen} />
    </Tab.Navigator>
  );
};