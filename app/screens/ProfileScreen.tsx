import React, { useState } from 'react';
import { ScrollView, StyleSheet, Dimensions, View, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
// import PagerView from 'react-native-pager-view';
import { Bell, Settings, Shield, HelpCircle, Info, User, Camera, Trophy } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3;

const PhotoGridItem = ({ index }: { index: number }) => (
  <View style={styles.photoItem}>
    <Text category='c2' style={styles.photoText}>
      Day {index + 1}
    </Text>
  </View>
);

const StatCard = ({ icon: Icon, value, label, theme }: { 
  icon: any, 
  value: string, 
  label: string, 
  theme: any 
}) => (
  <View style={[
    styles.statCard,
    { backgroundColor: theme['background-basic-color-2'] }
  ]}>
    <Icon size={20} color={theme['color-primary-500']} />
    <Text category='h6' style={[styles.statValue, { color: theme['color-primary-500'] }]}>
      {value}
    </Text>
    <Text category='c2' style={styles.statLabel}>
      {label}
    </Text>
  </View>
);

const MenuItem = ({ icon: Icon, title, onPress, theme }: {
  icon: any,
  title: string,
  onPress: () => void,
  theme: any
}) => (
  <TouchableOpacity 
    style={[
      styles.menuItem,
      { borderBottomColor: theme['border-basic-color-3'] }
    ]}
    onPress={onPress}
  >
    <Icon size={24} color={theme['color-basic-600']} />
    <Text category='s1' style={styles.menuItemText}>
      {title}
    </Text>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  // const pagerRef = useRef<PagerView>(null);
  const mockPhotos = Array.from({ length: 9 }, (_, i) => i);

  const handleMenuPress = (item: string) => {
    console.log(`Pressed ${item}`);
  };

  const renderStreaksView = () => (
    <ScrollView 
      style={styles.pageContainer}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: pillNavHeight + 20 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar
          size='giant'
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={[
            styles.avatar,
            { borderColor: theme['color-primary-500'] }
          ]}
        />
        <Text category='h5' style={styles.displayName}>
          John Doe
        </Text>
        <Text category='s2' style={styles.email}>
          john.doe@keepr.app
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsCards}>
        <StatCard 
          icon={Trophy}
          value="42"
          label="Current Streak"
          theme={theme}
        />
        <StatCard 
          icon={Camera}
          value="156"
          label="Total Photos"
          theme={theme}
        />
        <StatCard 
          icon={User}
          value="89"
          label="Friends"
          theme={theme}
        />
      </View>

      {/* Photo Grid */}
      <View style={styles.photosSection}>
        <Text category='s1' style={styles.sectionTitle}>
          Recent Streaks
        </Text>
        <View style={styles.photoGrid}>
          {mockPhotos.map((_, index) => (
            <PhotoGridItem key={index} index={index} />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsView = () => (
    <ScrollView 
      style={styles.pageContainer}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: pillNavHeight + 20 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.settingsContainer}>
        <MenuItem 
          icon={Bell}
          title="Notifications"
          onPress={() => handleMenuPress('Notifications')}
          theme={theme}
        />
        <MenuItem 
          icon={Shield}
          title="Privacy & Security"
          onPress={() => handleMenuPress('Privacy')}
          theme={theme}
        />
        <MenuItem 
          icon={Settings}
          title="Account Settings"
          onPress={() => handleMenuPress('Account')}
          theme={theme}
        />
        <MenuItem 
          icon={HelpCircle}
          title="Help & Support"
          onPress={() => handleMenuPress('Help')}
          theme={theme}
        />
        <MenuItem 
          icon={Info}
          title="About Keepr"
          onPress={() => handleMenuPress('About')}
          theme={theme}
        />
      </View>
    </ScrollView>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        {/* Tab Indicators */}
        <View style={styles.tabIndicators}>
          <TouchableOpacity
            style={[
              styles.tabIndicator,
              currentPage === 0 && {
                backgroundColor: theme['color-primary-500']
              }
            ]}
            onPress={() => {
              setCurrentPage(0);
              // pagerRef.current?.setPage(0);
            }}
          >
            <Text style={[
              styles.tabText,
              { color: currentPage === 0 ? '#FFFFFF' : theme['color-basic-600'] }
            ]}>
              Streaks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabIndicator,
              currentPage === 1 && {
                backgroundColor: theme['color-primary-500']
              }
            ]}
            onPress={() => {
              setCurrentPage(1);
              // pagerRef.current?.setPage(1);
            }}
          >
            <Text style={[
              styles.tabText,
              { color: currentPage === 1 ? '#FFFFFF' : theme['color-basic-600'] }
            ]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Simple Tab Content */}
        <View style={styles.contentContainer}>
          {currentPage === 0 ? renderStreaksView() : renderSettingsView()}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIndicators: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tabIndicator: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 15,
  },
  contentContainer: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    marginBottom: 20,
    borderWidth: 3,
  },
  displayName: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    color: '#AAAAAA',
  },
  statsCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 20,
  },
  statLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'center',
  },
  photosSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    fontSize: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  photoItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: photoSize,
    height: photoSize,
    borderWidth: 1,
    borderColor: '#444444',
  },
  photoText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    gap: 16,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});