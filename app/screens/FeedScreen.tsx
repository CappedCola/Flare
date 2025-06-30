import React from 'react';
import { FlatList, StyleSheet, View, StatusBar } from 'react-native';
import { Text, Card, Avatar, Button, Icon, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navBarHeight } from '../constants/navigation';

const HeartIcon = (props: any) => <Icon {...props} name='heart-outline' />;
const MessageIcon = (props: any) => <Icon {...props} name='message-circle-outline' />;
const ShareIcon = (props: any) => <Icon {...props} name='share-outline' />;

const FeedCard = ({ username, timeAgo }: { username: string; timeAgo: string }) => {
  const theme = useTheme();
  
  return (
    <Card style={[
      styles.card,
      { 
        borderColor: theme['border-basic-color-2'],
        backgroundColor: theme['background-basic-color-2']
      }
    ]}>
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
      
      <View style={[
        styles.photoPlaceholder,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: navBarHeight + 20,
  },
  card: {
    marginBottom: 24,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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