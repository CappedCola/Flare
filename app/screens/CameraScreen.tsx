import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Text, Button, Icon } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

const FlashIcon = (props: any) => <Icon {...props} name='flash-outline' />;
const FlipIcon = (props: any) => <Icon {...props} name='flip-2-outline' />;
const SettingsIcon = (props: any) => <Icon {...props} name='settings-outline' />;
const CloseIcon = (props: any) => <Icon {...props} name='close-outline' />;
const CameraIcon = (props: any) => <Icon {...props} name='camera-outline' />;

export const CameraScreen = () => {
  const [timeRemaining, setTimeRemaining] = useState('01:29');

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            appearance='ghost'
            accessoryLeft={CloseIcon}
            size='small'
            style={styles.headerButton}
          />
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Camera Area */}
        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            <View style={styles.cameraView}>
              <Text style={styles.cameraPlaceholder}>Camera View</Text>
              <Text style={styles.cameraSubtext}>Front & Back Camera</Text>
            </View>
            
            <View style={styles.sideControls}>
              <Button
                appearance='ghost'
                accessoryLeft={FlashIcon}
                size='small'
                style={styles.sideButton}
              />
              <Button
                appearance='ghost'
                accessoryLeft={FlipIcon}
                size='small'
                style={styles.sideButton}
              />
              <Button
                appearance='ghost'
                accessoryLeft={SettingsIcon}
                size='small'
                style={styles.sideButton}
              />
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomSection}>
          <View style={styles.captureContainer}>
            <Button
              status='primary'
              accessoryLeft={CameraIcon}
              style={styles.captureButton}
              onPress={() => console.log('Capture pressed')}
            />
          </View>

          <View style={styles.sendContainer}>
            <Text style={styles.friendsText}>👥 My friends only    📍 W 47th St...</Text>
            <Button
              status='primary'
              appearance='outline'
              style={styles.sendButton}
              onPress={() => console.log('Send pressed')}
            >
              SEND ▶
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerSpacer: {
    width: 44,
  },
  cameraSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cameraContainer: {
    flexDirection: 'row',
    height: 420,
    marginBottom: 32,
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraPlaceholder: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cameraSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: '#AAAAAA',
    letterSpacing: 0.3,
  },
  sideControls: {
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 72,
    paddingVertical: 24,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  sendContainer: {
    alignItems: 'center',
  },
  friendsText: {
    color: '#CCCCCC',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sendButton: {
    width: '80%',
    borderRadius: 28,
    paddingVertical: 16,
    shadowColor: '#5D5FEF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});