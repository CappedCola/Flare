import firestore from '@react-native-firebase/firestore';
import { ChatMessage, ChatRoom, ChainPrompt } from '../types';

export class ChatService {
  // Create a new chat room for a chain with optional prompt context
  async createChatRoom(chainId: string, participantIds: string[], prompt?: ChainPrompt): Promise<string> {
    try {
      console.log(`🔧 Creating chat room for chain ${chainId} with participants:`, participantIds);
      
      const chatRoom: Omit<ChatRoom, 'id'> = {
        chainId,
        participantIds,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastMessage: null,
        messageCount: 0,
      };

      const docRef = await firestore().collection('chatRooms').add({
        ...chatRoom,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessageAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Chat room created successfully with ID: ${docRef.id}`);
      
      // Send welcome message with prompt context if available
      if (prompt) {
        await this.sendPromptWelcomeMessage(docRef.id, prompt);
      }
      
      return docRef.id;
    } catch (error: any) {
      console.error('❌ Error creating chat room:', error);
      
      // Enhanced error diagnostics for permission issues
      if (error.code === 'firestore/permission-denied') {
        console.error('🚨 PERMISSION DENIED ERROR during chat room creation:');
        console.error('- Check if security rules are deployed correctly');
        console.error('- Verify user is authenticated');
        console.error('- Ensure participantIds array contains current user');
        console.error('- chainId:', chainId);
        console.error('- participantIds:', participantIds);
      }
      
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

      await firestore().collection('chatMessages').add({
        ...message,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update chat room's last message info
      await firestore().collection('chatRooms').doc(chatRoomId).update({
        lastMessage: text,
        lastMessageAt: firestore.FieldValue.serverTimestamp(),
        messageCount: firestore.FieldValue.increment(1),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send a welcome message with prompt context
  async sendPromptWelcomeMessage(chatRoomId: string, prompt: ChainPrompt): Promise<void> {
    try {
      const promptEmoji = prompt.emoji || '✨';
      const welcomeText = `${promptEmoji} Welcome to your chain chat!\n\nPrompt: "${prompt.title}"\n${prompt.description}\n\nShare your thoughts, ideas, and behind-the-scenes moments as you respond to this prompt!`;
      
      await this.sendMessage(
        chatRoomId,
        'system',
        'Flare',
        welcomeText,
        'system'
      );
      
      console.log('📝 Sent prompt welcome message for:', prompt.title);
    } catch (error) {
      console.error('Error sending prompt welcome message:', error);
      // Don't throw error as this is a nice-to-have feature
    }
  }

  // Send chain milestone messages
  async sendChainMilestoneMessage(
    chatRoomId: string, 
    milestoneType: 'turn_start' | 'turn_complete' | 'chain_complete',
    participantUsername?: string,
    promptTitle?: string
  ): Promise<void> {
    try {
      let messageText = '';
      
      switch (milestoneType) {
        case 'turn_start':
          messageText = `🎯 It's ${participantUsername}'s turn to respond to the prompt!`;
          break;
        case 'turn_complete':
          messageText = `📸 ${participantUsername} has shared their response!`;
          break;
        case 'chain_complete':
          messageText = `🎉 Chain completed! Everyone has responded to "${promptTitle}". Great work team!`;
          break;
      }
      
      if (messageText) {
        await this.sendMessage(
          chatRoomId,
          'system',
          'Flare',
          messageText,
          'system'
        );
      }
    } catch (error) {
      console.error('Error sending chain milestone message:', error);
    }
  }

  // Subscribe to messages in a chat room
  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    return firestore()
      .collection('chatMessages')
      .where('chatRoomId', '==', chatRoomId)
      .orderBy('createdAt', 'asc')
      .onSnapshot(
        (snapshot) => {
          const messages: ChatMessage[] = [];
          
          // Add null safety check for Hermes/React Native compatibility
          if (snapshot && snapshot.docs) {
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
          }

          callback(messages);
        },
        (error: any) => {
          console.error('❌ Error in messages subscription:', error);
          
          // Enhanced error diagnostics for permission issues
          if (error.code === 'firestore/permission-denied') {
            console.error('🚨 PERMISSION DENIED ERROR during message subscription:');
            console.error('- Check if user is participant in the chat room');
            console.error('- Verify chatRoomId exists and has correct participantIds');
            console.error('- chatRoomId:', chatRoomId);
          }
          
          callback([]); // Return empty array on error
        }
      );
  }

  // Get chat room for a specific chain with fallback creation for legacy chains
  async getChatRoomByChainId(chainId: string): Promise<ChatRoom | null> {
    try {
      return new Promise((resolve) => {
        const unsubscribe = firestore()
          .collection('chatRooms')
          .where('chainId', '==', chainId)
          .onSnapshot(
            async (snapshot) => {
              // Add null safety check for Hermes/React Native compatibility
              if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
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
                // No chat room found - this might be a legacy chain
                console.log(`🔍 No chat room found for chain ${chainId}, checking if this is a legacy chain...`);
                
                try {
                  // Try to create chat room for legacy chain
                  const legacyChatRoom = await this.createChatRoomForLegacyChain(chainId);
                  if (legacyChatRoom) {
                    console.log(`✅ Created chat room for legacy chain ${chainId}`);
                    resolve(legacyChatRoom);
                  } else {
                    resolve(null);
                  }
                } catch (legacyError) {
                  console.error(`❌ Failed to create chat room for legacy chain ${chainId}:`, legacyError);
                  resolve(null);
                }
              }
              unsubscribe();
            },
            (error) => {
              console.error('Error in chat room subscription:', error);
              resolve(null);
              unsubscribe();
            }
          );
      });
    } catch (error) {
      console.error('Error getting chat room:', error);
      // Enhanced error handling for the "Cannot read property 'empty' of null" issue
      if (error instanceof TypeError && error.message.includes("Cannot read property 'empty' of null")) {
        console.error('❌ HERMES ERROR DETECTED: Firebase snapshot is null');
        console.error('This is the exact error causing chat access failure after chain creation');
        console.error('The null safety fixes should prevent this issue');
      }
      return null;
    }
  }

  // Create chat room for legacy chain that doesn't have one
  private async createChatRoomForLegacyChain(chainId: string): Promise<ChatRoom | null> {
    try {
      console.log(`🔧 Attempting to create chat room for legacy chain ${chainId}...`);
      
      // First, get the chain data to extract participantIds
      const chainDoc = await firestore().collection('flareChains').doc(chainId).get();
      
      if (!chainDoc.exists()) {
        console.error(`❌ Chain ${chainId} not found in database`);
        return null;
      }
      
      const chainData = chainDoc.data();
      if (!chainData?.participantIds || !Array.isArray(chainData.participantIds)) {
        console.error(`❌ Chain ${chainId} missing valid participantIds`);
        return null;
      }
      
      // Create the chat room
      const chatRoomId = await this.createChatRoom(chainId, chainData.participantIds);
      
      // Update the chain document with the groupChatId
      await firestore().collection('flareChains').doc(chainId).update({
        groupChatId: chatRoomId
      });
      
      // Send system message explaining this is a legacy chain
      await this.sendSystemMessage(chatRoomId, 
        `Chat room created for chain! Welcome ${chainData.creatorUsername || 'everyone'}! 💬`
      );
      
      // Return the newly created chat room
      const chatRoomDoc = await firestore().collection('chatRooms').doc(chatRoomId).get();
      if (chatRoomDoc.exists()) {
        const data = chatRoomDoc.data()!;
        return {
          id: chatRoomDoc.id,
          chainId: data.chainId,
          participantIds: data.participantIds,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          lastMessage: data.lastMessage,
          messageCount: data.messageCount || 0,
        };
      }
      
      return null;
      
    } catch (error: any) {
      console.error(`❌ Failed to create chat room for legacy chain ${chainId}:`, error);
      
      // Enhanced error diagnostics for permission issues
      if (error.code === 'firestore/permission-denied') {
        console.error('🚨 PERMISSION DENIED ERROR during legacy chat room creation:');
        console.error('- Check if security rules allow chat room creation');
        console.error('- Verify user is authenticated and is participant in chain');
        console.error('- chainId:', chainId);
      }
      
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
      return new Promise((resolve) => {
        const unsubscribe = firestore()
          .collection('chatMessages')
          .where('chatRoomId', '==', chatRoomId)
          .where('readBy', 'not-in', [userId])
          .onSnapshot(
            (snapshot) => {
              // Add null safety check for Hermes/React Native compatibility
              resolve(snapshot ? snapshot.size : 0);
              unsubscribe();
            },
            (error) => {
              console.error('Error getting unread count:', error);
              resolve(0);
              unsubscribe();
            }
          );
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