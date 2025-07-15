import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  DocumentData,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatMessage, ChatRoom } from '../types';

export class ChatService {
  // Create a new chat room for a chain
  async createChatRoom(chainId: string, participantIds: string[]): Promise<string> {
    try {
      const chatRoom: Omit<ChatRoom, 'id'> = {
        chainId,
        participantIds,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastMessage: null,
        messageCount: 0,
      };

      const docRef = await addDoc(collection(db, 'chatRooms'), {
        ...chatRoom,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Send a message to a chat room
  async sendMessage(
    chatRoomId: string,
    senderId: string,
    senderUsername: string,
    text: string,
    type: 'text' | 'system' = 'text'
  ): Promise<void> {
    try {
      const message: Omit<ChatMessage, 'id'> = {
        chatRoomId,
        senderId,
        senderUsername,
        text,
        type,
        createdAt: new Date(),
        readBy: [senderId], // Sender has read their own message
      };

      await addDoc(collection(db, 'chatMessages'), {
        ...message,
        createdAt: serverTimestamp(),
      });

      // Update chat room's last message info
      // TODO: Update chatRoom document with last message details
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Subscribe to messages in a chat room
  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const messages: ChatMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          chatRoomId: data.chatRoomId,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          text: data.text,
          type: data.type || 'text',
          createdAt: data.createdAt?.toDate() || new Date(),
          readBy: data.readBy || [],
        });
      });

      callback(messages);
    });
  }

  // Get chat room for a specific chain
  async getChatRoomByChainId(chainId: string): Promise<ChatRoom | null> {
    try {
      const q = query(
        collection(db, 'chatRooms'),
        where('chainId', '==', chainId)
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            
            const chatRoom: ChatRoom = {
              id: doc.id,
              chainId: data.chainId,
              participantIds: data.participantIds,
              createdAt: data.createdAt?.toDate() || new Date(),
              lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
              lastMessage: data.lastMessage,
              messageCount: data.messageCount || 0,
            };
            
            resolve(chatRoom);
          } else {
            resolve(null);
          }
          unsubscribe();
        });
      });
    } catch (error) {
      console.error('Error getting chat room:', error);
      return null;
    }
  }

  // Send system message (e.g., "John added a photo to the chain")
  async sendSystemMessage(
    chatRoomId: string,
    text: string
  ): Promise<void> {
    await this.sendMessage(chatRoomId, 'system', 'System', text, 'system');
  }

  // Mark messages as read by user
  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    try {
      // TODO: Implement batch update to mark messages as read
      console.log(`Marking messages as read for user ${userId} in room ${chatRoomId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get unread message count for user
  async getUnreadMessageCount(chatRoomId: string, userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'chatMessages'),
        where('chatRoomId', '==', chatRoomId),
        where('readBy', 'not-in', [userId])
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          resolve(snapshot.size);
          unsubscribe();
        });
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send chain update notifications to chat
  async sendChainUpdateMessage(
    chainId: string,
    username: string,
    action: 'joined' | 'responded' | 'skipped' | 'expired'
  ): Promise<void> {
    try {
      const chatRoom = await this.getChatRoomByChainId(chainId);
      if (!chatRoom) return;

      let message = '';
      switch (action) {
        case 'joined':
          message = `${username} joined the chain! 🎉`;
          break;
        case 'responded':
          message = `${username} added a photo to the chain! 📸`;
          break;
        case 'skipped':
          message = `${username} skipped their turn`;
          break;
        case 'expired':
          message = `Time expired for ${username}'s turn ⏰`;
          break;
      }

      await this.sendSystemMessage(chatRoom.id, message);
    } catch (error) {
      console.error('Error sending chain update message:', error);
    }
  }

  // Delete a chat room and all its messages
  async deleteChatRoom(chatRoomId: string): Promise<void> {
    try {
      // TODO: Implement batch deletion of chat room and messages
      console.log(`Deleting chat room ${chatRoomId}`);
    } catch (error) {
      console.error('Error deleting chat room:', error);
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();