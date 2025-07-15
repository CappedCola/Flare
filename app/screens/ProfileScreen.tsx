import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Dimensions, View, StatusBar, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
// import PagerView from 'react-native-pager-view';
import { Bell, Settings, Shield, HelpCircle, Info, User, Camera, Trophy, Users, Flame } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';
import { User as UserType } from '../types';
import { getUserPhotos } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3;

const PhotoGridItem = ({ photoUrl, index, theme }: { photoUrl: string, index: number, theme: any }) => (
  <View style={[
    styles.photoItem,
    { 
      backgroundColor: theme['background-basic-color-3'],
      borderColor: theme['border-basic-color-2']
    }
  ]}>
    {photoUrl ? (
      <Image
        source={{ uri: photoUrl }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    ) : (
      <Text category='c2' style={[
        styles.photoText,
        { color: theme['text-secondary-color'] }
      ]}>
        Day {index + 1}
      </Text>
    )}
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
    <Text category='c2' style={[
      styles.statLabel,
      { color: theme['text-secondary-color'] }
    ]}>
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
    <Text category='s1' style={[
      styles.menuItemText,
      { color: theme['text-primary-color'] }
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [currentPage, setCurrentPage] = useState(0);
  // const pagerRef = useRef<PagerView>(null);
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMenuPress = (item: string) => {
    console.log(`Pressed ${item}`);
    
    if (item === 'FlareChains') {
      navigation.navigate('FlareHome' as never);
    }
  };

  // Load user photos
  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const userPhotos = await getUserPhotos(user.id);
      setPhotos(userPhotos);
    } catch (err) {
      setError('Failed to load profile data. Please try again.');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const renderStreaksView = () => {
    if (!user) return null;
    
    return (
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
            source={{ uri: user.avatar || 'https://via.placeholder.com/100' }}
            style={[
              styles.avatar,
              { borderColor: theme['color-primary-500'] }
            ]}
          />
          <Text category='h5' style={[
            styles.displayName,
            { color: theme['text-primary-color'] }
          ]}>
            {user.displayName}
          </Text>
          <Text category='s2' style={[
            styles.email,
            { color: theme['text-secondary-color'] }
          ]}>
            {user.email}
          </Text>
          {user.bio && (
            <Text category='p2' style={[
              styles.bio,
              { color: theme['text-secondary-color'] }
            ]}>
              {user.bio}
            </Text>
          )}
          
          {/* Friends Button */}
          <TouchableOpacity 
            style={[
              styles.friendsButton,
              { 
                backgroundColor: theme['color-primary-500'],
                borderColor: theme['color-primary-500']
              }
            ]}
            onPress={() => navigation.navigate('Friends' as never)}
          >
            <Users size={18} color={theme['text-on-primary-color']} />
            <Text category='s1' style={[
              styles.friendsButtonText,
              { color: theme['text-on-primary-color'] }
            ]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>


        {/* Photo Grid */}
        <View style={styles.photosSection}>
          <Text category='s1' style={[
            styles.sectionTitle,
            { color: theme['text-primary-color'] }
          ]}>
            Recent Streaks
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((photoUrl, index) => (
              <PhotoGridItem 
                key={index} 
                photoUrl={photoUrl} 
                index={index} 
                theme={theme} 
              />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

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
          icon={Flame}
          title="Flare Chains"
          onPress={() => handleMenuPress('FlareChains')}
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
          title="About Flare"
          onPress={() => handleMenuPress('About')}
          theme={theme}
        />
      </View>
    </ScrollView>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <ActivityIndicator size="large" color={theme['color-primary-500']} />
        <Text category='s1' style={[
          styles.loadingText,
          { color: theme['text-secondary-color'] }
        ]}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <Text category='s1' style={[
          styles.errorText,
          { color: theme['text-danger-color'] }
        ]}>
          {error}
        </Text>
        <TouchableOpacity onPress={loadUserData} style={styles.retryButton}>
          <Text category='s1' style={[
            styles.retryText,
            { color: theme['color-primary-500'] }
          ]}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // User not authenticated (shouldn't happen with navigation, but safety check)
  if (!user) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <Text category='s1' style={[
          styles.errorText,
          { color: theme['text-hint-color'] }
        ]}>
          Please sign in to view your profile
        </Text>
      </SafeAreaView>
    );
  }

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
              { color: currentPage === 0 ? theme['text-on-primary-color'] : theme['text-secondary-color'] }
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
              { color: currentPage === 1 ? theme['text-on-primary-color'] : theme['text-secondary-color'] }
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
    marginBottom: 4,
  },
  email: {},
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
    fontSize: 12,
    textAlign: 'center',
  },
  photosSection: {
    paddingHorizontal: 31,
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: '600',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: photoSize,
    height: photoSize,
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    padding: 10,
  },
  photoText: {
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
    fontSize: 16,
    fontWeight: '500',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bio: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
  },
  friendsButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});