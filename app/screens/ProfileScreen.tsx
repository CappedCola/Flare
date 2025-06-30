import React from 'react';
import { ScrollView, StyleSheet, Dimensions, View, StatusBar } from 'react-native';
import { Text, Avatar, Button, Icon, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pillNavHeight } from '../constants/navigation';

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3;

const SettingsIcon = (props: any) => <Icon {...props} name='settings-outline' />;
const AddIcon = (props: any) => <Icon {...props} name='plus-outline' />;

const PhotoGridItem = ({ index }: { index: number }) => (
  <View style={styles.photoItem}>
    <Text category='c2' style={styles.photoText}>
      Day {index + 1}
    </Text>
  </View>
);

export const ProfileScreen = () => {
  const theme = useTheme();
  const mockPhotos = Array.from({ length: 12 }, (_, i) => i);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={[
          styles.header,
          { borderBottomColor: theme['border-basic-color-2'] }
        ]}>
          <Text category='h6' style={styles.username}>
            @johndoe
          </Text>
          <Button
            appearance='ghost'
            status='basic'
            accessoryLeft={SettingsIcon}
            size='small'
            style={styles.settingsButton}
          />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: pillNavHeight + 16 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.profileSection}>
              <Avatar
                size='giant'
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={[
                  styles.avatar,
                  { borderColor: theme['color-primary-500'] }
                ]}
              />
              
              <View style={styles.userInfo}>
                <Text category='h6' style={styles.displayName}>
                  John Doe
                </Text>
                <Text category='s2' style={styles.bio}>
                  Keeping my daily streak alive 🔥
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text category='h6' style={[
                    styles.statNumber,
                    { color: theme['color-primary-500'] }
                  ]}>
                    42
                  </Text>
                  <Text category='c2' style={styles.statLabel}>
                    Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text category='h6' style={[
                    styles.statNumber,
                    { color: theme['color-primary-500'] }
                  ]}>
                    156
                  </Text>
                  <Text category='c2' style={styles.statLabel}>
                    Friends
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text category='h6' style={[
                    styles.statNumber,
                    { color: theme['color-primary-500'] }
                  ]}>
                    1.2k
                  </Text>
                  <Text category='c2' style={styles.statLabel}>
                    Likes
                  </Text>
                </View>
              </View>

              <Button
                size='small'
                style={[
                  styles.editButton,
                  { borderColor: theme['color-primary-500'] }
                ]}
                appearance='outline'
              >
                Edit Profile
              </Button>
            </View>

            <View style={styles.photosSection}>
              <View style={styles.sectionHeader}>
                <Text category='s1' style={styles.sectionTitle}>
                  My Streaks
                </Text>
                <Button
                  appearance='ghost'
                  status='primary'
                  accessoryLeft={AddIcon}
                  size='tiny'
                  style={styles.addButton}
                >
                  Add Photo
                </Button>
              </View>

              <View style={styles.photoGrid}>
                {mockPhotos.map((_, index) => (
                  <PhotoGridItem key={index} index={index} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  username: {
    fontWeight: '600',
    textAlign: 'left',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    marginBottom: 20,
    borderWidth: 3,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 28,
  },
  displayName: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  bio: {
    textAlign: 'center',
    maxWidth: 200,
    color: '#CCCCCC',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    color: '#AAAAAA',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 40,
  },
  photosSection: {
    paddingTop: 32,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    borderRadius: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  photoItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#444444',
  },
  photoText: {
    color: '#AAAAAA',
  },
});