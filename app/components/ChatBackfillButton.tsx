import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { flareChainService } from '../services/flareChainService';

interface ChatBackfillButtonProps {
  onBackfillComplete?: (success: boolean) => void;
}

export const ChatBackfillButton: React.FC<ChatBackfillButtonProps> = ({ onBackfillComplete }) => {
  const [isRunning, setIsRunning] = useState(false);

  const runBackfill = async () => {
    if (isRunning) return;

    setIsRunning(true);
    
    try {
      console.log('🔧 Starting chat room backfill operation...');
      
      Alert.alert(
        'Chat Backfill',
        'This will create missing chat rooms for existing chains. This may take a few moments.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsRunning(false) },
          {
            text: 'Run Backfill',
            onPress: async () => {
              try {
                await flareChainService.backfillMissingChatRooms();
                
                Alert.alert(
                  'Success!',
                  'Chat rooms have been created for all existing chains. You can now access chat functionality.',
                  [{ text: 'OK' }]
                );
                
                onBackfillComplete?.(true);
              } catch (error) {
                console.error('❌ Backfill failed:', error);
                
                Alert.alert(
                  'Error',
                  `Failed to create chat rooms: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  [{ text: 'OK' }]
                );
                
                onBackfillComplete?.(false);
              } finally {
                setIsRunning(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error starting backfill:', error);
      setIsRunning(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, isRunning && styles.buttonDisabled]} 
      onPress={runBackfill}
      disabled={isRunning}
    >
      <Text style={styles.buttonText}>
        {isRunning ? '🔧 Running Backfill...' : '🔧 Fix Chat Rooms'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});