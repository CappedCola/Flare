import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { PushNotificationData, NotificationTypeEnum, PushNotificationPermission } from '../types';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null;
      }

      // Check existing permissions
      const existingStatus = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only ask if permissions have not already been determined
      if (existingStatus.status !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = { ...finalStatus, status };
      }

      // Get push token if permissions granted
      if (finalStatus.status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        this.pushToken = token.data;
        console.log('Push token obtained:', token.data);
        return token.data;
      } else {
        console.warn('Push notification permissions not granted');
        return null;
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Get current push notification permissions
   */
  async getPermissions(): Promise<PushNotificationPermission> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      
      return {
        status: permissions.status,
        canAskAgain: permissions.canAskAgain,
        granted: permissions.status === 'granted'
      };
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false,
        granted: false
      };
    }
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<PushNotificationPermission> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      
      return {
        status,
        canAskAgain,
        granted: status === 'granted'
      };
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false,
        granted: false
      };
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Refresh the push token
   */
  async refreshPushToken(): Promise<string | null> {
    return this.registerForPushNotifications();
  }

  /**
   * Send a local notification (for testing or immediate feedback)
   */
  async sendLocalNotification(data: PushNotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Handle notification response when user taps on notification
   */
  addNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Handle notification received while app is running
   */
  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Create notification data for chain invitation
   */
  static createChainInvitationNotification(
    senderUsername: string,
    chainId: string,
    promptTitle: string
  ): PushNotificationData {
    return {
      title: 'New Chain Invitation!',
      body: `${senderUsername} invited you to join "${promptTitle}"`,
      data: {
        type: NotificationTypeEnum.CHAIN_INVITATION,
        chainId,
        senderUsername,
        promptTitle,
      }
    };
  }

  /**
   * Create notification data for chain turn
   */
  static createChainTurnNotification(
    chainId: string,
    promptTitle: string
  ): PushNotificationData {
    return {
      title: "It's Your Turn!",
      body: `Your turn in "${promptTitle}" - you have 60 minutes!`,
      data: {
        type: NotificationTypeEnum.CHAIN_TURN,
        chainId,
        promptTitle,
      }
    };
  }

  /**
   * Create notification data for completed chain
   */
  static createChainCompletedNotification(
    chainId: string,
    promptTitle: string,
    participantCount: number
  ): PushNotificationData {
    return {
      title: 'Chain Completed! 🎉',
      body: `"${promptTitle}" completed with ${participantCount} participants`,
      data: {
        type: NotificationTypeEnum.CHAIN_COMPLETED,
        chainId,
        promptTitle,
        participantCount,
      }
    };
  }

  /**
   * Platform-specific configuration for Android
   */
  static async configureAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4D4D', // Flare red color
      });

      // Create separate channel for chain notifications
      await Notifications.setNotificationChannelAsync('chains', {
        name: 'Flare Chains',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4D4D',
        sound: 'default',
      });
    }
  }

  /**
   * Initialize the notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Configure Android channels
      await NotificationService.configureAndroidChannel();
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }
}

export default NotificationService;