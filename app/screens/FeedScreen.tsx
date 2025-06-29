import React from 'react';
import { FlatList, StyleSheet, View, StatusBar } from 'react-native';
import { Text, Card, Avatar, Button, Icon } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

const HeartIcon = (props: any) => <Icon {...props} name='heart-outline' />;
const MessageIcon = (props: any) => <Icon {...props} name='message-circle-outline' />;
const ShareIcon = (props: any) => <Icon {...props} name='share-outline' />;

const FeedCard = ({ username, timeAgo }: { username: string; timeAgo: string }) => (
  <Card style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.userInfo}>
        <Avatar
          size='small'
          source={{ uri: 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userText}>
          <Text category='s1' style={styles.username}>
            {username}
          </Text>
          <Text category='c2' style={styles.timeText}>
            {timeAgo}
          </Text>
        </View>
      </View>
    </View>
    
    <View style={styles.photoPlaceholder}>
      <Text category='h6' style={styles.photoPlaceholderText}>
        Photo Placeholder
      </Text>
      <Text category='c2' style={styles.photoSubtext}>
        Streak Day 12
      </Text>
    </View>
    
    <View style={styles.cardActions}>
      <Button
        appearance='ghost'
        status='basic'
        accessoryLeft={HeartIcon}
        style={styles.actionButton}
      />
      <Button
        appearance='ghost'
        status='basic'
        accessoryLeft={MessageIcon}
        style={styles.actionButton}
      />
      <Button
        appearance='ghost'
        status='basic'
        accessoryLeft={ShareIcon}
        style={styles.actionButton}
      />
    </View>
  </Card>
);

export const FeedScreen = () => {
  const mockData = [
    { username: 'alice_smith', timeAgo: '2 hours ago' },
    { username: 'john_doe', timeAgo: '4 hours ago' },
    { username: 'sarah_wilson', timeAgo: '6 hours ago' },
    { username: 'mike_jones', timeAgo: '8 hours ago' },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text category='h4' style={styles.title}>
            Keepr
          </Text>
        </View>
      
      <FlatList
        data={mockData}
        renderItem={({ item }) => (
          <FeedCard
            username={item.username}
            timeAgo={item.timeAgo}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatar: {
    marginRight: 12,
  },
  userText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  username: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoPlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  timeText: {
    color: '#AAAAAA',
  },
  photoPlaceholderText: {
    color: '#FFFFFF',
  },
  photoSubtext: {
    color: '#AAAAAA',
  },
  actionButton: {
    width: 28,
    height: 28,
  },
});