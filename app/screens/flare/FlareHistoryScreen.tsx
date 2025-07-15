import React, { useState } from 'react';
import { Layout, Text, Card, Button, Tab, TabView } from '@ui-kitten/components';
import { StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Clock, Users, Trophy, TrendingUp, Eye } from 'lucide-react-native';

export const FlareHistoryScreen = () => {
  const navigation = useNavigation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Mock history data
  const completedChains = [
    {
      id: 'chain-1',
      prompt: { title: 'Adventure', description: 'Show something new', color: '#4ECDC4' },
      participants: 6,
      photos: 6,
      completedAt: new Date('2024-01-14T18:30:00'),
      yourPosition: 3,
      status: 'completed',
    },
    {
      id: 'chain-2',
      prompt: { title: 'Creativity', description: 'Make something artistic', color: '#A8E6CF' },
      participants: 4,
      photos: 4,
      completedAt: new Date('2024-01-12T15:45:00'),
      yourPosition: 2,
      status: 'completed',
    },
    {
      id: 'chain-3',
      prompt: { title: 'Emotions', description: 'Share your mood', color: '#FF6B6B' },
      participants: 5,
      photos: 3,
      completedAt: new Date('2024-01-10T12:20:00'),
      yourPosition: 1,
      status: 'expired',
    },
  ];

  const createdChains = [
    {
      id: 'chain-4',
      prompt: { title: 'Connection', description: 'Show friendship', color: '#FFD93D' },
      participants: 7,
      photos: 7,
      completedAt: new Date('2024-01-13T20:15:00'),
      status: 'completed',
    },
    {
      id: 'chain-5',
      prompt: { title: 'Growth', description: 'Learning moment', color: '#FF8B94' },
      participants: 3,
      photos: 2,
      completedAt: new Date('2024-01-09T14:30:00'),
      status: 'expired',
    },
  ];

  const userStats = {
    totalChainsCreated: 8,
    totalChainsCompleted: 12,
    totalPhotosContributed: 24,
    averageResponseTime: 23, // minutes
    currentStreak: 5,
    favoriteCategory: 'Adventure',
    completionRate: 85,
  };

  const handleViewChain = (chainId: string) => {
    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const ChainCard = ({ chain, showPosition = false }: { chain: any, showPosition?: boolean }) => (
    <Card style={[styles.chainCard, { borderLeftColor: chain.prompt.color }]} onPress={() => handleViewChain(chain.id)}>
      <Layout style={styles.chainContent}>
        <Layout style={styles.chainHeader}>
          <Layout style={styles.chainInfo}>
            <Text category="h6" style={styles.chainTitle}>
              {chain.prompt.title}
            </Text>
            <Text category="c1" appearance="hint" style={styles.chainDescription}>
              "{chain.prompt.description}"
            </Text>
          </Layout>
          <Layout style={[
            styles.statusBadge,
            { backgroundColor: chain.status === 'completed' ? '#E8F5E8' : '#FFE8E8' }
          ]}>
            <Text category="c2" style={[
              styles.statusText,
              { color: chain.status === 'completed' ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {chain.status.toUpperCase()}
            </Text>
          </Layout>
        </Layout>
        
        <Layout style={styles.chainStats}>
          <Layout style={styles.statItem}>
            <Users size={14} color="#666" />
            <Text category="c1" style={styles.statText}>
              {chain.participants} people
            </Text>
          </Layout>
          <Layout style={styles.statItem}>
            <Text category="c1" style={styles.statText}>
              {chain.photos}/{chain.participants} photos
            </Text>
          </Layout>
          {showPosition && (
            <Layout style={styles.statItem}>
              <Text category="c1" style={styles.statText}>
                Position #{chain.yourPosition}
              </Text>
            </Layout>
          )}
        </Layout>
        
        <Layout style={styles.chainFooter}>
          <Text category="c1" appearance="hint">
            {formatTimeAgo(chain.completedAt)}
          </Text>
          <Eye size={14} color="#CCC" />
        </Layout>
      </Layout>
    </Card>
  );

  const StatsView = () => (
    <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
      <Layout style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Layout style={styles.statCardContent}>
            <Trophy size={24} color="#FFD93D" />
            <Text category="h6" style={styles.statNumber}>
              {userStats.totalChainsCompleted}
            </Text>
            <Text category="c1" appearance="hint">
              Chains Completed
            </Text>
          </Layout>
        </Card>
        
        <Card style={styles.statCard}>
          <Layout style={styles.statCardContent}>
            <TrendingUp size={24} color="#4ECDC4" />
            <Text category="h6" style={styles.statNumber}>
              {userStats.currentStreak}
            </Text>
            <Text category="c1" appearance="hint">
              Current Streak
            </Text>
          </Layout>
        </Card>
        
        <Card style={styles.statCard}>
          <Layout style={styles.statCardContent}>
            <Clock size={24} color="#FF8B94" />
            <Text category="h6" style={styles.statNumber}>
              {userStats.averageResponseTime}m
            </Text>
            <Text category="c1" appearance="hint">
              Avg Response
            </Text>
          </Layout>
        </Card>
        
        <Card style={styles.statCard}>
          <Layout style={styles.statCardContent}>
            <Users size={24} color="#A8E6CF" />
            <Text category="h6" style={styles.statNumber}>
              {userStats.completionRate}%
            </Text>
            <Text category="c1" appearance="hint">
              Completion Rate
            </Text>
          </Layout>
        </Card>
      </Layout>
      
      <Layout style={styles.detailedStats}>
        <Card style={styles.detailCard}>
          <Text category="h6" style={styles.detailTitle}>Activity Summary</Text>
          <Layout style={styles.detailRow}>
            <Text category="s1">Chains Created</Text>
            <Text category="s1" style={styles.detailValue}>{userStats.totalChainsCreated}</Text>
          </Layout>
          <Layout style={styles.detailRow}>
            <Text category="s1">Photos Contributed</Text>
            <Text category="s1" style={styles.detailValue}>{userStats.totalPhotosContributed}</Text>
          </Layout>
          <Layout style={styles.detailRow}>
            <Text category="s1">Favorite Category</Text>
            <Text category="s1" style={styles.detailValue}>{userStats.favoriteCategory}</Text>
          </Layout>
        </Card>
      </Layout>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        {/* Header */}
        <Layout style={styles.header}>
          <Text category="h4" style={styles.title}>Chain History</Text>
          <Text category="s1" appearance="hint" style={styles.subtitle}>
            Your Flare Chain journey
          </Text>
        </Layout>

        {/* Tabs */}
        <TabView
          selectedIndex={selectedIndex}
          onSelect={index => setSelectedIndex(index)}
          style={styles.tabView}
        >
          <Tab title="Participated">
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              <Layout style={styles.section}>
                <Text category="h6" style={styles.sectionTitle}>
                  Chains You've Joined ({completedChains.length})
                </Text>
                {completedChains.map((chain) => (
                  <ChainCard key={chain.id} chain={chain} showPosition={true} />
                ))}
              </Layout>
            </ScrollView>
          </Tab>
          
          <Tab title="Created">
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              <Layout style={styles.section}>
                <Text category="h6" style={styles.sectionTitle}>
                  Chains You've Started ({createdChains.length})
                </Text>
                {createdChains.map((chain) => (
                  <ChainCard key={chain.id} chain={chain} />
                ))}
              </Layout>
            </ScrollView>
          </Tab>
          
          <Tab title="Stats">
            <StatsView />
          </Tab>
        </TabView>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  tabView: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  chainCard: {
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  chainContent: {
    padding: 8,
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chainInfo: {
    flex: 1,
    marginRight: 12,
  },
  chainTitle: {
    marginBottom: 4,
  },
  chainDescription: {
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  chainStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
  },
  chainFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    width: '48%',
    marginVertical: 8,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    marginVertical: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailedStats: {
    marginTop: 16,
  },
  detailCard: {
    padding: 16,
  },
  detailTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#FF4D4D',
  },
});