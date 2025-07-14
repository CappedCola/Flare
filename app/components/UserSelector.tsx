import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useTheme } from '@ui-kitten/components';
import { Search, UserPlus, Check } from 'lucide-react-native';

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline?: boolean;
}

interface UserSelectorProps {
  users: User[];
  selectedUsers: string[];
  onUserSelect: (userId: string) => void;
  onUserDeselect: (userId: string) => void;
  maxSelections?: number;
  showSearch?: boolean;
  title?: string;
}

export const UserSelector = ({
  users,
  selectedUsers,
  onUserSelect,
  onUserDeselect,
  maxSelections,
  showSearch = true,
  title = "Send to",
}: UserSelectorProps) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onUserDeselect(userId);
    } else {
      if (maxSelections && selectedUsers.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onUserSelect(userId);
    }
  };

  const renderUserAvatar = (user: User) => {
    if (user.avatar) {
      return (
        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
      );
    }
    
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme['color-basic-400'] }]}>
        <Text style={styles.avatarText}>
          {user.username.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderSelectedUsers = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <View style={styles.selectedContainer}>
        <Text style={[styles.selectedTitle, { color: theme['text-primary-color'] }]}>
          Selected ({selectedUsers.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedUsers.map(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return null;

            return (
              <TouchableOpacity
                key={userId}
                style={styles.selectedUser}
                onPress={() => onUserDeselect(userId)}
              >
                <View style={styles.selectedUserAvatar}>
                  {renderUserAvatar(user)}
                  <View style={[styles.removeIndicator, { backgroundColor: theme['color-danger-500'] }]}>
                    <Text style={styles.removeText}>×</Text>
                  </View>
                </View>
                <Text style={[styles.selectedUserName, { color: theme['text-primary-color'] }]}>
                  {user.username}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme['text-primary-color'] }]}>
        {title}
      </Text>

      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: theme['background-basic-color-2'] }]}>
          <Search size={16} color={theme['text-hint-color']} />
          <TextInput
            style={[styles.searchInput, { color: theme['text-primary-color'] }]}
            placeholder="Search users..."
            placeholderTextColor={theme['text-hint-color']}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {renderSelectedUsers()}

      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        {filteredUsers.map(user => {
          const isSelected = selectedUsers.includes(user.id);
          const isDisabled = maxSelections && !isSelected && selectedUsers.length >= maxSelections;

          return (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userItem,
                { backgroundColor: theme['background-basic-color-2'] },
                isSelected && { backgroundColor: theme['color-primary-100'] },
                isDisabled && { opacity: 0.5 }
              ]}
              onPress={() => handleUserToggle(user.id)}
              disabled={isDisabled}
            >
              <View style={styles.userInfo}>
                <View style={styles.userAvatarContainer}>
                  {renderUserAvatar(user)}
                  {user.isOnline && (
                    <View style={[styles.onlineIndicator, { backgroundColor: theme['color-success-500'] }]} />
                  )}
                </View>
                
                <View style={styles.userTextInfo}>
                  <Text style={[styles.username, { color: theme['text-primary-color'] }]}>
                    {user.username}
                  </Text>
                  {user.displayName && (
                    <Text style={[styles.displayName, { color: theme['text-hint-color'] }]}>
                      {user.displayName}
                    </Text>
                  )}
                </View>
              </View>

              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: theme['color-primary-500'] }]}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <UserPlus size={32} color={theme['text-hint-color']} />
            <Text style={[styles.emptyText, { color: theme['text-hint-color'] }]}>
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  selectedContainer: {
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedUser: {
    alignItems: 'center',
    marginRight: 12,
  },
  selectedUserAvatar: {
    position: 'relative',
  },
  selectedUserName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    maxWidth: 60,
    textAlign: 'center',
  },
  removeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  displayName: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});