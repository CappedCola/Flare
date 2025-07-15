import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Layout, Text, Card, useTheme, Spinner, Button } from '@ui-kitten/components';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  MessageCircle,
  Award,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import analyticsService, { 
  ChainAnalytics, 
  PerformanceMetrics, 
  ChainInsight, 
  UserInsight 
} from '../services/analyticsService';

const { width: screenWidth } = Dimensions.get('window');
const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(255, 77, 77, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
};

interface AnalyticsDashboardProps {
  chainId?: string;
  userId?: string;
  type: 'chain' | 'user' | 'global';
}

interface MetricCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: any;
  color: string;
  theme: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendValue, 
  icon: Icon, 
  color, 
  theme 
}) => (
  <Card style={[styles.metricCard, { backgroundColor: theme['background-basic-color-1'] }]}>
    <View style={styles.metricHeader}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text category="h4" style={[styles.metricValue, { color: theme['text-basic-color'] }]}>
          {value}
        </Text>
        <Text category="c1" style={[styles.metricTitle, { color: theme['text-hint-color'] }]}>
          {title}
        </Text>
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            {trend === 'up' ? (
              <TrendingUp size={16} color="#4ECDC4" />
            ) : trend === 'down' ? (
              <TrendingDown size={16} color="#FF6B6B" />
            ) : (
              <Activity size={16} color="#95A5A6" />
            )}
            <Text 
              category="c2" 
              style={[
                styles.trendText, 
                { color: trend === 'up' ? '#4ECDC4' : trend === 'down' ? '#FF6B6B' : '#95A5A6' }
              ]}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </View>
  </Card>
);

interface InsightCardProps {
  insight: ChainInsight | UserInsight;
  theme: any;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, theme }) => (
  <Card style={[styles.insightCard, { backgroundColor: theme['background-basic-color-1'] }]}>
    <View style={styles.insightHeader}>
      <View style={[
        styles.insightIcon, 
        { backgroundColor: insight.priority === 'high' ? '#FF6B6B20' : insight.priority === 'medium' ? '#FFD93D20' : '#4ECDC420' }
      ]}>
        {insight.priority === 'high' ? (
          <AlertCircle size={20} color="#FF6B6B" />
        ) : (
          <CheckCircle size={20} color="#4ECDC4" />
        )}
      </View>
      <View style={styles.insightContent}>
        <Text category="s1" style={[styles.insightTitle, { color: theme['text-basic-color'] }]}>
          {insight.title}
        </Text>
        <Text category="p2" style={[styles.insightDescription, { color: theme['text-hint-color'] }]}>
          {insight.description}
        </Text>
        {'recommendation' in insight && insight.recommendation && (
          <Text category="c1" style={[styles.insightRecommendation, { color: theme['color-primary-500'] }]}>
            💡 {insight.recommendation}
          </Text>
        )}
        {'suggestion' in insight && insight.suggestion && (
          <Text category="c1" style={[styles.insightSuggestion, { color: theme['color-primary-500'] }]}>
            💡 {insight.suggestion}
          </Text>
        )}
      </View>
    </View>
  </Card>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  chainId, 
  userId, 
  type 
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [chainAnalytics, setChainAnalytics] = useState<ChainAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<(ChainInsight | UserInsight)[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [chainId, userId, type]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (type === 'chain' && chainId) {
        const analytics = await analyticsService.generateChainAnalytics(chainId);
        const chainInsights = await analyticsService.generateChainInsights(chainId);
        setChainAnalytics(analytics);
        setInsights(chainInsights);
      } else if (type === 'user' && userId) {
        const userInsights = await analyticsService.generateUserInsights(userId);
        setInsights(userInsights);
      } else if (type === 'global') {
        const performance = await analyticsService.generatePerformanceMetrics();
        setPerformanceMetrics(performance);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Layout style={[styles.container, styles.centered]}>
        <Spinner size="large" />
        <Text category="s1" style={[styles.loadingText, { color: theme['text-hint-color'] }]}>
          Loading analytics...
        </Text>
      </Layout>
    );
  }

  const renderChainAnalytics = () => {
    if (!chainAnalytics) return null;

    const completionData = {
      labels: ['Completed', 'Dropped'],
      datasets: [{
        data: [
          chainAnalytics.completionRate,
          100 - chainAnalytics.completionRate
        ]
      }]
    };

    const responseTimeData = {
      labels: ['Fast', 'Average', 'Slow'],
      datasets: [{
        data: [
          chainAnalytics.fastestResponse,
          chainAnalytics.averageResponseTime,
          chainAnalytics.slowestResponse
        ]
      }]
    };

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text category="h5" style={[styles.title, { color: theme['text-basic-color'] }]}>
            Chain Analytics
          </Text>
          <Button
            size="small"
            appearance="ghost"
            status="primary"
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Completion Rate"
            value={`${chainAnalytics.completionRate.toFixed(1)}%`}
            trend={chainAnalytics.completionRate > 70 ? 'up' : 'down'}
            trendValue={chainAnalytics.completionRate > 70 ? 'Good' : 'Low'}
            icon={Target}
            color="#4ECDC4"
            theme={theme}
          />
          <MetricCard
            title="Avg Response Time"
            value={`${chainAnalytics.averageResponseTime.toFixed(1)}m`}
            trend={chainAnalytics.averageResponseTime < 30 ? 'up' : 'down'}
            trendValue={chainAnalytics.averageResponseTime < 30 ? 'Fast' : 'Slow'}
            icon={Clock}
            color="#FFD93D"
            theme={theme}
          />
          <MetricCard
            title="Participants"
            value={chainAnalytics.participantCount.toString()}
            icon={Users}
            color="#FF6B6B"
            theme={theme}
          />
          <MetricCard
            title="Engagement"
            value={`${chainAnalytics.engagementScore.toFixed(0)}/100`}
            trend={chainAnalytics.engagementScore > 60 ? 'up' : 'down'}
            trendValue={chainAnalytics.engagementScore > 60 ? 'High' : 'Low'}
            icon={MessageCircle}
            color="#9B59B6"
            theme={theme}
          />
        </View>

        {/* Charts */}
        <View style={styles.chartSection}>
          <Text category="h6" style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
            Completion Rate Distribution
          </Text>
          <Card style={[styles.chartCard, { backgroundColor: theme['background-basic-color-1'] }]}>
            <PieChart
              data={completionData.datasets[0].data.map((value, index) => ({
                name: completionData.labels[index],
                population: value,
                color: index === 0 ? '#4ECDC4' : '#FF6B6B',
                legendFontColor: theme['text-hint-color'],
                legendFontSize: 12,
              }))}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card>
        </View>

        <View style={styles.chartSection}>
          <Text category="h6" style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
            Response Times
          </Text>
          <Card style={[styles.chartCard, { backgroundColor: theme['background-basic-color-1'] }]}>
            <BarChart
              data={responseTimeData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero={true}
              showBarTops={true}
              yAxisSuffix="m"
            />
          </Card>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text category="h6" style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
              Insights & Recommendations
            </Text>
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} theme={theme} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderGlobalAnalytics = () => {
    if (!performanceMetrics) return null;

    const userActivityData = {
      labels: ['Daily', 'Weekly', 'Monthly'],
      datasets: [{
        data: [
          performanceMetrics.dailyActiveUsers,
          performanceMetrics.weeklyActiveUsers,
          performanceMetrics.monthlyActiveUsers
        ]
      }]
    };

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text category="h5" style={[styles.title, { color: theme['text-basic-color'] }]}>
            Global Performance
          </Text>
          <Button
            size="small"
            appearance="ghost"
            status="primary"
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </View>

        {/* Global Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Chains"
            value={performanceMetrics.totalChains.toString()}
            icon={Award}
            color="#4ECDC4"
            theme={theme}
          />
          <MetricCard
            title="Active Users"
            value={performanceMetrics.totalActiveUsers.toString()}
            icon={Users}
            color="#FF6B6B"
            theme={theme}
          />
          <MetricCard
            title="Completion Rate"
            value={`${performanceMetrics.averageChainCompletionRate.toFixed(1)}%`}
            icon={Target}
            color="#FFD93D"
            theme={theme}
          />
          <MetricCard
            title="Avg Response"
            value={`${performanceMetrics.averageResponseTime.toFixed(1)}m`}
            icon={Clock}
            color="#9B59B6"
            theme={theme}
          />
        </View>

        {/* User Activity Chart */}
        <View style={styles.chartSection}>
          <Text category="h6" style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
            User Activity
          </Text>
          <Card style={[styles.chartCard, { backgroundColor: theme['background-basic-color-1'] }]}>
            <BarChart
              data={userActivityData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero={true}
              showBarTops={true}
            />
          </Card>
        </View>
      </ScrollView>
    );
  };

  const renderUserAnalytics = () => {
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text category="h5" style={[styles.title, { color: theme['text-basic-color'] }]}>
            Your Insights
          </Text>
          <Button
            size="small"
            appearance="ghost"
            status="primary"
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </View>

        {/* User Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text category="h6" style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
              Personal Insights
            </Text>
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} theme={theme} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Layout style={styles.container}>
      {type === 'chain' && renderChainAnalytics()}
      {type === 'global' && renderGlobalAnalytics()}
      {type === 'user' && renderUserAnalytics()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (screenWidth - 44) / 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  insightRecommendation: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  insightSuggestion: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});