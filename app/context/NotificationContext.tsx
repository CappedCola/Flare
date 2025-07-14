import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PersonalPost } from '../types';
import { subscribeToPersonalPosts } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  currentNotification: PersonalPost | null;
  showNotification: (post: PersonalPost) => void;
  hideNotification: () => void;
  markAsViewed: (postId: string) => void;
  markAsDismissed: (postId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const [currentNotification, setCurrentNotification] = useState<PersonalPost | null>(null);
  const [processedPostIds, setProcessedPostIds] = useState<Set<string>>(new Set());
  
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
  
  const value: NotificationContextType = {
    currentNotification,
    showNotification,
    hideNotification,
    markAsViewed,
    markAsDismissed,
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