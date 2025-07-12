import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useTheme, 
  Input, 
  Button, 
  Card, 
  Layout,
  Spinner
} from '@ui-kitten/components';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Upload,
  X
} from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/firebaseService';

interface PostUploadScreenProps {
  navigation: any;
  route: {
    params: {
      photoUri: string;
      photoOrientation?: 'portrait' | 'landscape';
    };
  };
}

export const PostUploadScreen = ({ navigation, route }: PostUploadScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { photoUri, photoOrientation = 'portrait' } = route.params;
  
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const confettiRef = useRef<any>(null);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');

  // Get current time formatted
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleUpload = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload photos');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Create post with photo and optional description
      await createPost(photoUri, description.trim(), user.id);
      
      // Show success state
      setShowSuccess(true);
      
      // Trigger confetti animation
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      
      // Animate success message in
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Wait a bit then navigate back to feed
      setTimeout(() => {
        navigation.navigate('Main', { screen: 'Feed' });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading post:', error);
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (showSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: screenWidth / 2, y: 0 }}
          explosionSpeed={350}
          fallSpeed={2500}
          fadeOut={true}
          colors={[
            theme['color-primary-500'] || '#FF4D4D',
            theme['color-warning-300'] || '#FFD700',
            theme['color-success-500'] || '#43A047',
            theme['color-info-500'] || '#00ACC1',
            '#FF69B4',
            '#00CED1'
          ]}
        />
        <Animated.View 
          style={[
            styles.successContainer,
            { opacity: successOpacity }
          ]}
        >
          <Text style={[styles.congratsTitle, { color: theme['color-primary-500'] }]}>
            🎉 Congratulations! 🎉
          </Text>
          <Text style={[styles.congratsSubtitle, { color: theme['text-primary-color'] }]}>
            Your photo has been uploaded successfully!
          </Text>
          <Text style={[styles.congratsText, { color: theme['text-secondary-color'] }]}>
            Your streak continues! Keep sharing those daily moments.
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme['border-basic-color-2'] }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme['text-primary-color'] || '#2C2C2C'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme['text-primary-color'] }]}>
          Share Your Moment
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Preview */}
        <Card style={[styles.photoCard, { backgroundColor: theme['background-basic-color-3'] }]}>
          <Image 
            source={{ uri: photoUri }} 
            style={[
              styles.photoPreview,
              photoOrientation === 'landscape' && styles.photoPreviewLandscape
            ]}
            resizeMode="cover"
          />
        </Card>

        {/* Form Fields */}
        <Layout style={[styles.formContainer, { backgroundColor: theme['background-basic-color-3'] }]}>
          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme['text-primary-color'] }]}>
              Description
            </Text>
            <Input
              placeholder="What's happening in this moment?"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              textStyle={styles.descriptionInput}
              style={styles.inputField}
              maxLength={200}
            />
            <Text style={[styles.characterCount, { color: theme['text-hint-color'] }]}>
              {description.length}/200
            </Text>
          </View>

          {/* Location Input */}
          <View style={styles.inputGroup}>
            <View style={styles.fieldHeader}>
              <MapPin size={18} color={theme['color-primary-500'] || '#FF4D4D'} />
              <Text style={[styles.fieldLabel, { color: theme['text-primary-color'] }]}>
                Location
              </Text>
            </View>
            <Input
              placeholder="Where was this taken?"
              value={location}
              onChangeText={setLocation}
              style={styles.inputField}
              maxLength={50}
            />
          </View>

          {/* Time Display */}
          <View style={styles.inputGroup}>
            <View style={styles.fieldHeader}>
              <Clock size={18} color={theme['color-primary-500'] || '#FF4D4D'} />
              <Text style={[styles.fieldLabel, { color: theme['text-primary-color'] }]}>
                Time
              </Text>
            </View>
            <View style={[styles.timeDisplay, { backgroundColor: theme['background-basic-color-2'] }]}>
              <Text style={[styles.timeText, { color: theme['text-secondary-color'] }]}>
                {currentTime}
              </Text>
            </View>
          </View>
        </Layout>

        {/* Error Message */}
        {uploadError && (
          <View style={[styles.errorContainer, { backgroundColor: theme['color-danger-100'] }]}>
            <Text style={[styles.errorText, { color: theme['color-danger-500'] }]}>
              {uploadError}
            </Text>
            <TouchableOpacity onPress={() => setUploadError(null)}>
              <X size={16} color={theme['color-danger-500'] || '#B71C1C'} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      <View style={[styles.uploadButtonContainer, { borderTopColor: theme['border-basic-color-2'] }]}>
        <Button
          style={[styles.uploadButton, { backgroundColor: theme['color-primary-500'] }]}
          onPress={handleUpload}
          disabled={isUploading}
          accessoryLeft={isUploading ? 
            () => <Spinner size='small' status='control' /> : 
            () => <Upload size={20} color="#FFFFFF" />
          }
        >
          {() => (
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
};

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
    fontFamily: 'Inter_600SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  photoCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoPreviewLandscape: {
    height: 150,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  inputField: {
    borderRadius: 12,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  timeDisplay: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  uploadButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  uploadButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_700Bold',
  },
  congratsSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  congratsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
});