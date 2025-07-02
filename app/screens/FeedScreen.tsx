import React from 'react';
import { FlatList, StyleSheet, View, StatusBar, Image, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Expand } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';

const FeedPost = ({ username, timeAgo }: { username: string; timeAgo: string }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Avatar
          size='small'
          source={{ uri: 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text category='s1' style={styles.username}>
            {username}
          </Text>
          <Text category='c2' style={styles.timeText}>
            {timeAgo}
          </Text>
        </View>
      </View>
      
      <View style={[
        styles.imageContainer,
        { backgroundColor: theme['background-basic-color-3'] }
      ]}>
        <Text category='h6' style={styles.imagePlaceholderText}>
          Photo Placeholder
        </Text>
        <Text category='c2' style={styles.imageSubtext}>
          Streak Day 12
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Heart size={24} color={theme['color-basic-600']} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={24} color={theme['color-basic-600']} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Expand size={24} color={theme['color-basic-600']} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FeedScreen = () => {
  const theme = useTheme();
  const mockData = [
    { username: 'alice_smith', timeAgo: '2 hours ago' },
    { username: 'john_doe', timeAgo: '4 hours ago' },
    { username: 'sarah_wilson', timeAgo: '6 hours ago' },
    { username: 'mike_jones', timeAgo: '8 hours ago' },
  ];

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
          <View style={styles.headerSpacer} />
          <Text category='h4' style={styles.title}>
            Keepr
          </Text>
        </View>
      
      <FlatList
        data={mockData}
        renderItem={({ item }) => (
          <FeedPost
            username={item.username}
            timeAgo={item.timeAgo}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: pillNavHeight + 16 }
        ]}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontSize: 24,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 32,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 15,
  },
  timeText: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  imageContainer: {
    aspectRatio: 4/5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  imageSubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
  },
  actionButton: {
    padding: 8,
  },
});