import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@ui-kitten/components';
import {
  ArrowLeft,
  Send,
  Users,
  Edit3,
  Smile,
  Type,
  Crop,
  Sun,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import { createPostWithRecipients } from '../services/firebaseService';

interface PhotoSendScreenProps {
  navigation: any;
  route: {
    params: {
      photoUri: string;
      photoOrientation?: 'portrait' | 'landscape';
    };
  };
}

interface User {
  id: string;
  username: string;
  avatar?: string;
}

// Mock users data - will be replaced with real data later
const mockUsers: User[] = [
  { id: '1', username: 'john_doe', avatar: 'https://via.placeholder.com/40' },
  { id: '2', username: 'jane_smith', avatar: 'https://via.placeholder.com/40' },
  { id: '3', username: 'mike_wilson', avatar: 'https://via.placeholder.com/40' },
  { id: '4', username: 'sarah_jones', avatar: 'https://via.placeholder.com/40' },
];

export const PhotoSendScreen = ({ navigation, route }: PhotoSendScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { hideNavigation, showNavigation } = useNavigationContext();
  const { photoUri, photoOrientation = 'portrait' } = route.params;
  
  const [caption, setCaption] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Hide navigation when this screen is active
  React.useEffect(() => {
    hideNavigation();
    
    return () => {
      // Show navigation when leaving this screen
      showNavigation();
    };
  }, [hideNavigation, showNavigation]);
  
  const handleBack = () => {
    // Show navigation before going back
    showNavigation();
    navigation.goBack();
  };
  
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Select Recipients', 'Please select at least one person to send to.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please try again.');
      return;
    }
    
    setIsSending(true);
    try {
      // Create both global post and personal posts for selected recipients
      await createPostWithRecipients(
        photoUri,
        caption,
        user.id,
        selectedUsers
      );
      
      Alert.alert(
        'Photo Sent!', 
        `Photo posted to global feed and sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            showNavigation();
            navigation.navigate('Main', { screen: 'Feed' });
          }
        }]
      );
    } catch (error: any) {
      console.error('Error sending photo:', error);
      Alert.alert('Error', error.message || 'Failed to send photo. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  const UserSelector = () => (
    <View style={styles.userSelector}>
      <Text style={[styles.sectionTitle, { color: theme['text-primary-color'] }]}>
        Send to
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userList}>
        {mockUsers.map(mockUser => (
          <TouchableOpacity
            key={mockUser.id}
            style={[
              styles.userItem,
              selectedUsers.includes(mockUser.id) && styles.userItemSelected
            ]}
            onPress={() => handleUserSelect(mockUser.id)}
          >
            <View style={[
              styles.userAvatar,
              selectedUsers.includes(mockUser.id) && styles.userAvatarSelected
            ]}>
              <Text style={styles.userAvatarText}>
                {mockUser.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[
              styles.userName,
              { color: theme['text-primary-color'] },
              selectedUsers.includes(mockUser.id) && styles.userNameSelected
            ]}>
              {mockUser.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  const EditingTools = () => (
    <View style={styles.editingTools}>
      <Text style={[styles.sectionTitle, { color: theme['text-primary-color'] }]}>
        Edit Photo
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolsList}>
        <TouchableOpacity style={styles.toolButton}>
          <Crop size={20} color={theme['text-primary-color']} />
          <Text style={[styles.toolLabel, { color: theme['text-primary-color'] }]}>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Sun size={20} color={theme['text-primary-color']} />
          <Text style={[styles.toolLabel, { color: theme['text-primary-color'] }]}>Brightness</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Edit3 size={20} color={theme['text-primary-color']} />
          <Text style={[styles.toolLabel, { color: theme['text-primary-color'] }]}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Type size={20} color={theme['text-primary-color']} />
          <Text style={[styles.toolLabel, { color: theme['text-primary-color'] }]}>Text</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme['border-basic-color-2'] }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme['text-primary-color']} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme['text-primary-color'] }]}>
          Send Photo
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Preview */}
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: `file://${photoUri}` }} 
            style={[
              styles.photo,
              photoOrientation === 'landscape' && styles.photoLandscape
            ]}
            resizeMode="cover"
          />
        </View>
        
        {/* Caption Input */}
        <View style={[styles.captionContainer, { backgroundColor: theme['background-basic-color-2'] }]}>
          <TextInput
            style={[styles.captionInput, { color: theme['text-primary-color'] }]}
            placeholder="Add a caption..."
            placeholderTextColor={theme['text-hint-color']}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />
          <Text style={[styles.characterCount, { color: theme['text-hint-color'] }]}>
            {caption.length}/200
          </Text>
        </View>
        
        {/* User Selector */}
        <UserSelector />
        
        {/* Editing Tools */}
        <EditingTools />
      </ScrollView>
      
      {/* Send Button */}
      <View style={[styles.sendContainer, { borderTopColor: theme['border-basic-color-2'] }]}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: selectedUsers.length > 0 ? '#FF4D4D' : theme['color-basic-300'] }
          ]}
          onPress={handleSend}
          disabled={selectedUsers.length === 0 || isSending}
        >
          {isSending ? (
            <Text style={styles.sendButtonText}>Sending...</Text>
          ) : (
            <>
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>
                Send {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  photo: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 1.33,
    borderRadius: 12,
  },
  photoLandscape: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.75,
  },
  captionContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  userSelector: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  userList: {
    flexDirection: 'row',
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
  },
  userItemSelected: {
    transform: [{ scale: 0.95 }],
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  userAvatarSelected: {
    backgroundColor: '#FF4D4D',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userName: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 60,
    textAlign: 'center',
  },
  userNameSelected: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  editingTools: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  toolsList: {
    flexDirection: 'row',
  },
  toolButton: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  sendContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});