import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Icon } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const HomeIcon = (props: any) => <Icon {...props} name='home-outline' />;
const CameraIcon = (props: any) => <Icon {...props} name='camera-outline' />;
const PersonIcon = (props: any) => <Icon {...props} name='person-outline' />;

interface FloatingTabBarProps {
  navigation: any;
  currentRoute: string;
}

export const FloatingTabBar = ({ navigation, currentRoute }: FloatingTabBarProps) => {
  const insets = useSafeAreaInsets();

  const navigateToTab = (routeName: string) => {
    navigation.navigate(routeName as never);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.tabBar}>
        {/* Feed Tab */}
        <TouchableOpacity
          style={styles.sideTab}
          onPress={() => navigateToTab('Feed')}
        >
          <View style={[styles.tab, currentRoute === 'Feed' && styles.activeTab]}>
            <HomeIcon 
              style={[
                styles.tabIcon,
                { color: currentRoute === 'Feed' ? '#5D5FEF' : '#8A8A8A' }
              ]} 
            />
          </View>
        </TouchableOpacity>

        {/* Camera Tab - Elevated */}
        <View style={styles.centerTabContainer}>
          <TouchableOpacity
            style={styles.cameraTab}
            onPress={() => navigateToTab('Camera')}
          >
            <CameraIcon style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.sideTab}
          onPress={() => navigateToTab('Profile')}
        >
          <View style={[styles.tab, currentRoute === 'Profile' && styles.activeTab]}>
            <PersonIcon 
              style={[
                styles.tabIcon,
                { color: currentRoute === 'Profile' ? '#5D5FEF' : '#8A8A8A' }
              ]} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: width * 0.75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeTab: {
    backgroundColor: 'rgba(93, 95, 239, 0.15)',
  },
  tabIcon: {
    width: 30,
    height: 30,
  },
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -45,
  },
  cameraTab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5D5FEF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D5FEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    width: 32,
    height: 32,
    color: '#FFFFFF',
  },
});