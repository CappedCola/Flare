import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Layout, Text, useTheme, Card } from '@ui-kitten/components';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Flame, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onRegularPost: () => void;
  onFlareChain: () => void;
  photoUri?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  onRegularPost,
  onFlareChain,
  photoUri,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      
      {/* Dark overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        {/* Main content */}
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <BlurView
            intensity={20}
            tint="dark"
            style={styles.blurContainer}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Header */}
            <View style={styles.header}>
              <Text 
                category="h6" 
                style={[styles.title, { color: theme['text-basic-color'] }]}
              >
                What would you like to do?
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={theme['text-basic-color']} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              
              {/* Regular Post Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={onRegularPost}
                activeOpacity={0.8}
              >
                <Card style={[styles.optionCard, { backgroundColor: theme['background-basic-color-1'] }]}>
                  <View style={styles.optionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: theme['color-primary-100'] }]}>
                      <Camera size={32} color={theme['color-primary-500']} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text 
                        category="h6" 
                        style={[styles.optionTitle, { color: theme['text-basic-color'] }]}
                      >
                        Regular Post
                      </Text>
                      <Text 
                        category="s1" 
                        appearance="hint"
                        style={[styles.optionDescription, { color: theme['text-hint-color'] }]}
                      >
                        Share your photo with friends
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              {/* Flare Chain Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={onFlareChain}
                activeOpacity={0.8}
              >
                <Card style={[styles.optionCard, { backgroundColor: theme['background-basic-color-1'] }]}>
                  <View style={styles.optionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FFE5E5' }]}>
                      <Flame size={32} color={theme['color-primary-500']} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text 
                        category="h6" 
                        style={[styles.optionTitle, { color: theme['text-basic-color'] }]}
                      >
                        Start Flare Chain
                      </Text>
                      <Text 
                        category="s1" 
                        appearance="hint"
                        style={[styles.optionDescription, { color: theme['text-hint-color'] }]}
                      >
                        Create a photo chain with friends
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    width: screenWidth,
    maxHeight: screenHeight * 0.6,
  },
  blurContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    width: '100%',
  },
  optionCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});