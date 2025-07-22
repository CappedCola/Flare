import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatRoom } from '../types';
import { chatService } from '../services/chatService';

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  chatRoom: ChatRoom | null;
  sendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
  unreadCount: number;
  markAsRead: () => Promise<void>;
}

export const useChat = (
  chainId: string,
  currentUserId: string,
  currentUsername: string
): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!chainId || !currentUserId) return;

    loadChatRoom();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chainId, currentUserId]);

  const loadChatRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required parameters
      if (!chainId) {
        setError('Chain ID is required');
        setLoading(false);
        return;
      }

      if (!currentUserId) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      console.log(`🔍 Loading chat room for chain ${chainId}...`);

      // Get or create chat room for this chain (with fallback creation for legacy chains)
      let room = await chatService.getChatRoomByChainId(chainId);
      
      if (!room) {
        console.log(`❌ No chat room found for chain ${chainId}`);
        setError('Chat room not available. This chain may not support chat yet.');
        setLoading(false);
        return;
      }

      console.log(`✅ Chat room loaded: ${room.id}`);
      setChatRoom(room);

      // Verify user is a participant in the chat room
      if (!room.participantIds.includes(currentUserId)) {
        console.error(`❌ User ${currentUserId} is not a participant in chat room ${room.id}`);
        setError('You do not have access to this chat room.');
        setLoading(false);
        return;
      }

      // Subscribe to messages with enhanced error handling
      const unsubscribe = chatService.subscribeToMessages(
        room.id, 
        (newMessages) => {
          console.log(`📨 Received ${newMessages.length} messages for chat room ${room.id}`);
          setMessages(newMessages);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;

      // Get unread count with error handling
      try {
        const count = await chatService.getUnreadMessageCount(room.id, currentUserId);
        setUnreadCount(count);
      } catch (unreadError) {
        console.warn('Failed to get unread count (non-critical):', unreadError);
        // Non-critical error, don't fail the entire chat loading
      }

    } catch (err: any) {
      console.error('Error loading chat room:', err);
      
      // Enhanced error messaging based on error type
      let errorMessage = 'Failed to load chat';
      
      if (err.code === 'firestore/permission-denied') {
        errorMessage = 'Permission denied. You may not have access to this chat.';
        console.error('🚨 PERMISSION DENIED in useChat hook:');
        console.error('- chainId:', chainId);
        console.error('- currentUserId:', currentUserId);
        console.error('- Error details:', err);
      } else if (err.message && err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!chatRoom || !text.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      await chatService.sendMessage(
        chatRoom.id,
        currentUserId,
        currentUsername,
        text.trim()
      );

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (): Promise<void> => {
    if (!chatRoom) return;

    try {
      await chatService.markMessagesAsRead(chatRoom.id, currentUserId);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  return {
    messages,
    loading,
    error,
    chatRoom,
    sendMessage,
    sendingMessage,
    unreadCount,
    markAsRead,
  };
};