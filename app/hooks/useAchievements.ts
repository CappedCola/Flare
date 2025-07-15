import { useState, useEffect, useCallback } from 'react';
import { Achievement } from '../types';
import { statisticsService, AchievementNotification } from '../services/statisticsService';

export interface UseAchievementsReturn {
  unreadNotifications: AchievementNotification[];
  loading: boolean;
  error: string | null;
  showCelebration: (achievement: Achievement) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markCelebrationShown: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useAchievements = (userId: string): UseAchievementsReturn => {
  const [unreadNotifications, setUnreadNotifications] = useState<AchievementNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load unread notifications
  const loadUnreadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const notifications = await statisticsService.getUnreadAchievementNotifications(userId);
      setUnreadNotifications(notifications);
    } catch (err: any) {
      console.error('Error loading achievement notifications:', err);
      // Handle permission errors gracefully
      if (err?.code === 'firestore/permission-denied') {
        setError('Achievement features require authentication');
        setUnreadNotifications([]);
      } else {
        setError('Failed to load achievement notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadUnreadNotifications();
    }
  }, [userId, loadUnreadNotifications]);

  // Show celebration modal
  const showCelebration = useCallback((achievement: Achievement) => {
    // This would trigger a celebration modal
    // For now, just log
    console.log('🎉 Achievement celebration:', achievement.title);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await statisticsService.markAchievementNotificationRead(notificationId);
      setUnreadNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark celebration as shown
  const markCelebrationShown = useCallback(async (notificationId: string) => {
    try {
      await statisticsService.markCelebrationShown(notificationId);
      setUnreadNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, celebrationShown: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking celebration as shown:', err);
      setError('Failed to mark celebration as shown');
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadUnreadNotifications();
  }, [loadUnreadNotifications]);

  return {
    unreadNotifications,
    loading,
    error,
    showCelebration,
    markAsRead,
    markCelebrationShown,
    refreshNotifications,
  };
};

export default useAchievements;