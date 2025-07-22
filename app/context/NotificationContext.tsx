import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { PersonalPost, NotificationTypeEnum } from '../types';
import { subscribeToPersonalPosts } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import NotificationService from '../services/notificationService';
import NotificationPreferencesService from '../services/notificationPreferencesService';

interface NotificationContextType {
  currentNotification: PersonalPost | null;
  showNotification: (post: PersonalPost) => void;
  hideNotification: () => void;
  markAsViewed: (postId: string) => void;
  markAsDismissed: (postId: string) => void;
  // Push notification methods
  initializePushNotifications: () => Promise<void>;
  handleNotificationReceived: (notification: Notifications.Notification) => void;
  handleNotificationResponse: (response: Notifications.NotificationResponse) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const [currentNotification, setCurrentNotification] = useState<PersonalPost | null>(null);
  const [processedPostIds, setProcessedPostIds] = useState<Set<string>>(new Set());

  const notificationService = NotificationService.getInstance();
  const preferencesService = NotificationPreferencesService.getInstance();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Feature flag - disable personal posts subscription temporarily to avoid permission errors
    const enablePersonalPosts = false; // Set to true when personal posts feature is ready
    
    if (!enablePersonalPosts) {
      if (__DEV__) console.log('Personal posts subscription disabled');
      return;
    }
    
    // Subscribe to new personal posts for this user
    const unsubscribe = subscribeToPersonalPosts(
      user.id,
      (personalPosts) => {
        // Only show notification for new posts that haven't been processed
        const newPosts = personalPosts.filter(post => 
          post.status === 'sent' && !processedPostIds.has(post.id)
        );
        
        if (newPosts.length > 0) {
          // Show the most recent post
          const latestPost = newPosts[0];
          setCurrentNotification(latestPost);
          
          // Mark this post as processed
          setProcessedPostIds(prev => new Set([...prev, latestPost.id]));
        }
      },
      (error) => {
        // Only log non-permission errors to avoid spam in console
        if (error.message && !error.message.includes('permission')) {
          console.error('Error subscribing to personal posts:', error);
        }
      }
    );
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, processedPostIds]);
  
  const showNotification = (post: PersonalPost) => {
    setCurrentNotification(post);
  };
  
  const hideNotification = () => {
    setCurrentNotification(null);
  };
  
  const markAsViewed = (postId: string) => {
    if (currentNotification?.id === postId) {
      setCurrentNotification(null);
    }
  };
  
  const markAsDismissed = (postId: string) => {
    if (currentNotification?.id === postId) {
      setCurrentNotification(null);
    }
  };

  // Push notification initialization
  const initializePushNotifications = async () => {
    try {
      if (!user?.id) return;

      // Initialize the notification service
      await NotificationService.initialize();

      // Register for push notifications and get token
      const pushToken = await notificationService.registerForPushNotifications();
      
      if (pushToken) {
        // Update user's push token in preferences
        await preferencesService.updatePushToken(user.id, pushToken);
        console.log('Push notifications initialized successfully');
      }

      // Set up notification listeners
      const receivedListener = notificationService.addNotificationReceivedListener(handleNotificationReceived);
      const responseListener = notificationService.addNotificationResponseListener(handleNotificationResponse);

      // Cleanup function
      return () => {
        receivedListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  // Handle notification received while app is running
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    const data = notification.request.content.data;
    const notificationType = data?.type as NotificationTypeEnum;

    // Handle different notification types
    switch (notificationType) {
      case NotificationTypeEnum.CHAIN_INVITATION:
        // Could show in-app notification or update some state
        console.log('Chain invitation received:', data);
        break;
      case NotificationTypeEnum.CHAIN_TURN:
        console.log('Chain turn notification received:', data);
        break;
      case NotificationTypeEnum.CHAIN_COMPLETED:
        console.log('Chain completed notification received:', data);
        break;
      default:
        console.log('Unknown notification type received:', notificationType);
    }
  };

  // Handle notification response when user taps on notification
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    const notificationType = data?.type as NotificationTypeEnum;

    // Navigate based on notification type
    switch (notificationType) {
      case NotificationTypeEnum.CHAIN_INVITATION:
        if (data?.chainId) {
          // Navigate to chain view screen
          console.log('Navigate to chain:', data.chainId);
          // navigation.navigate('FlareChainView', { chainId: data.chainId });
        }
        break;
      case NotificationTypeEnum.CHAIN_TURN:
        if (data?.chainId) {
          // Navigate to chain response screen
          console.log('Navigate to chain response:', data.chainId);
          // navigation.navigate('FlareResponse', { chainId: data.chainId });
        }
        break;
      case NotificationTypeEnum.CHAIN_COMPLETED:
        if (data?.chainId) {
          // Navigate to completed chain view
          console.log('Navigate to completed chain:', data.chainId);
          // navigation.navigate('FlareChainView', { chainId: data.chainId });
        }
        break;
      default:
        console.log('Unknown notification response type:', notificationType);
    }
  };

  // Initialize push notifications when user is available
  useEffect(() => {
    if (user?.id) {
      initializePushNotifications();
    }
  }, [user?.id]);
  
  const value: NotificationContextType = {
    currentNotification,
    showNotification,
    hideNotification,
    markAsViewed,
    markAsDismissed,
    initializePushNotifications,
    handleNotificationReceived,
    handleNotificationResponse,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};