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

      // Get or create chat room for this chain
      let room = await chatService.getChatRoomByChainId(chainId);
      
      if (!room) {
        // Chat room doesn't exist yet, it will be created when the chain is created
        setLoading(false);
        return;
      }

      setChatRoom(room);

      // Subscribe to messages
      const unsubscribe = chatService.subscribeToMessages(room.id, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      // Get unread count
      const count = await chatService.getUnreadMessageCount(room.id, currentUserId);
      setUnreadCount(count);

    } catch (err) {
      console.error('Error loading chat room:', err);
      setError('Failed to load chat');
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