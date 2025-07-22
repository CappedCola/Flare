import React, { useState, useRef, useEffect } from 'react';
import { Layout, Text, Card, Button, Input, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Send, MessageCircle, Users, ArrowLeft } from 'lucide-react-native';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, FlareChain } from '../../types';
import { flareChainService } from '../../services/flareChainService';

export const FlareChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  
  const [messageInput, setMessageInput] = useState('');
  const [chain, setChain] = useState<FlareChain | null>(null);
  const [loadingChain, setLoadingChain] = useState(true);
  
  // Get chainId from navigation params
  const chainId = (route.params as any)?.chainId || 'demo-chain';
  const currentUserId = user?.id || 'current-user-id';
  const currentUsername = user?.username || 'Current User';

  const {
    messages,
    loading,
    error,
    chatRoom,
    sendMessage,
    sendingMessage,
    unreadCount,
    markAsRead,
  } = useChat(chainId, currentUserId, currentUsername);

  // Load chain data to get prompt information
  useEffect(() => {
    const loadChain = async () => {
      try {
        setLoadingChain(true);
        const chainData = await flareChainService.getChainById(chainId);
        setChain(chainData);
      } catch (error) {
        console.error('Error loading chain:', error);
      } finally {
        setLoadingChain(false);
      }
    };

    if (chainId && chainId !== 'demo-chain') {
      loadChain();
    } else {
      setLoadingChain(false);
    }
  }, [chainId]);

  useEffect(() => {
    // Mark messages as read when screen is opened
    if (chatRoom && unreadCount > 0) {
      markAsRead();
    }
  }, [chatRoom, unreadCount]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    const message = messageInput.trim();
    setMessageInput('');

    try {
      await sendMessage(message);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessageInput(message); // Restore message if sending failed
    }
  };

  const formatMessageTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === currentUserId;
    const isSystemMessage = message.type === 'system';
    
    if (isSystemMessage) {
      return (
        <Layout key={message.id} style={styles.systemMessageContainer}>
          <Text category='c2' appearance='hint' style={styles.systemMessage}>
            {message.text}
          </Text>
        </Layout>
      );
    }

    return (
      <Layout key={message.id} style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <Card style={[
          styles.messageCard,
          isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard
        ]}>
          <Layout style={styles.messageContent}>
            {!isOwnMessage && (
              <Text category='c2' style={styles.senderName}>
                {message.senderUsername}
              </Text>
            )}
            <Text category='s1' style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {message.text}
            </Text>
            <Text category='c2' appearance='hint' style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(message.createdAt)}
            </Text>
          </Layout>
        </Card>
      </Layout>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Loading chat...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.errorContainer}>
          <MessageCircle size={48} color="#95A5A6" />
          <Text category="h6" style={styles.errorText}>
            Chat Unavailable
          </Text>
          <Text category="s1" appearance="hint" style={styles.errorSubtext}>
            {error}
          </Text>
          <Button appearance="ghost" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  if (!chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.errorContainer}>
          <MessageCircle size={48} color="#95A5A6" />
          <Text category="h6" style={styles.errorText}>
            No Chat Available
          </Text>
          <Text category="s1" appearance="hint" style={styles.errorSubtext}>
            Chat will be available once the chain starts.
          </Text>
          <Button appearance="ghost" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Layout style={styles.header}>
          <Button
            appearance="ghost"
            size="small"
            onPress={() => navigation.goBack()}
            accessoryLeft={(props) => <ArrowLeft {...props} size={20} />}
          />
          <Layout style={styles.headerContent}>
            {chain?.prompt ? (
              <Layout style={styles.promptHeaderInfo}>
                {chain.prompt.emoji && (
                  <Text style={styles.headerEmoji}>{chain.prompt.emoji}</Text>
                )}
                <Layout style={styles.headerTextContainer}>
                  <Text category="h6" style={styles.headerTitle} numberOfLines={1}>
                    {chain.prompt.title}
                  </Text>
                  <Text category="c2" appearance="hint" style={styles.headerSubtitle} numberOfLines={1}>
                    Chain Chat
                  </Text>
                </Layout>
              </Layout>
            ) : (
              <Layout style={styles.defaultHeaderInfo}>
                <Users size={20} color="#FF4D4D" />
                <Text category="h6" style={styles.headerTitle}>
                  Chain Chat
                </Text>
              </Layout>
            )}
          </Layout>
          <Layout style={styles.headerSpacer} />
        </Layout>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Layout style={styles.emptyContainer}>
              {chain?.prompt ? (
                <Layout style={styles.promptWelcome}>
                  {chain.prompt.emoji && (
                    <Text style={styles.welcomeEmoji}>{chain.prompt.emoji}</Text>
                  )}
                  <Text category="h6" style={styles.welcomeTitle}>
                    {chain.prompt.title}
                  </Text>
                  <Text category="s1" appearance="hint" style={styles.welcomeDescription}>
                    "{chain.prompt.description}"
                  </Text>
                  <Text category="c1" appearance="hint" style={styles.welcomeSubtext}>
                    Share your thoughts about this prompt with your chain!
                  </Text>
                </Layout>
              ) : (
                <Layout style={styles.defaultEmpty}>
                  <MessageCircle size={48} color="#E8E8E8" />
                  <Text category="h6" appearance="hint" style={styles.emptyTitle}>
                    Start the conversation!
                  </Text>
                  <Text category="s1" appearance="hint" style={styles.emptySubtext}>
                    Send the first message to get the chat going.
                  </Text>
                </Layout>
              )}
            </Layout>
          ) : (
            <Layout style={styles.messagesList}>
              {messages.map((message, index) => renderMessage(message, index))}
            </Layout>
          )}
        </ScrollView>

        {/* Input */}
        <Layout style={styles.inputContainer}>
          <Input
            style={styles.messageInput}
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            textStyle={styles.inputTextStyle}
          />
          <Button
            style={styles.sendButton}
            size="small"
            status="primary"
            disabled={!messageInput.trim() || sendingMessage}
            onPress={handleSendMessage}
            accessoryLeft={sendingMessage ? 
              (props) => <Spinner {...props} size="small" /> : 
              (props) => <Send {...props} size={16} />
            }
          >
            {sendingMessage ? '' : 'Send'}
          </Button>
        </Layout>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginVertical: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  defaultHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTextContainer: {
    alignItems: 'center',
    maxWidth: 200,
  },
  headerTitle: {
    marginLeft: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Balance the back button
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  promptWelcome: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  defaultEmpty: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#2C2C2C',
    fontWeight: '600',
  },
  welcomeDescription: {
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  welcomeSubtext: {
    textAlign: 'center',
    fontSize: 13,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageCard: {
    maxWidth: '80%',
    minWidth: '20%',
  },
  ownMessageCard: {
    backgroundColor: '#FF6B47',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 16,
  },
  otherMessageCard: {
    backgroundColor: '#FF9068',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 16,
  },
  messageContent: {
    padding: 12,
  },
  senderName: {
    marginBottom: 4,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messageText: {
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  messageInput: {
    flex: 1,
    marginRight: 12,
  },
  inputTextStyle: {
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
  },
});