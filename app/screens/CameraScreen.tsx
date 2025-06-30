import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Text, Button, Icon, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

const FlashIcon = (props: any) => <Icon {...props} name='flash-outline' />;
const FlipIcon = (props: any) => <Icon {...props} name='flip-2-outline' />;
const SettingsIcon = (props: any) => <Icon {...props} name='settings-outline' />;
const CloseIcon = (props: any) => <Icon {...props} name='close-outline' />;
const CameraIcon = (props: any) => <Icon {...props} name='camera-outline' />;

export const CameraScreen = () => {
  const theme = useTheme();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={styles.header}>
          <Button
            appearance='ghost'
            accessoryLeft={CloseIcon}
            size='small'
            style={styles.headerButton}
          />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            <View style={[
              styles.cameraPreview,
              { backgroundColor: theme['background-basic-color-2'] }
            ]}>
              <Text style={styles.cameraPlaceholder}>Camera View</Text>
              <Text style={styles.cameraSubtext}>Front & Back Camera</Text>
            </View>
            
            <View style={styles.toolRail}>
              <Button
                appearance='ghost'
                accessoryLeft={FlashIcon}
                style={[
                  styles.toolButton,
                  { 
                    borderColor: theme['color-basic-800'],
                    backgroundColor: 'transparent'
                  }
                ]}
              />
              <Button
                appearance='ghost'
                accessoryLeft={FlipIcon}
                style={[
                  styles.toolButton,
                  { 
                    borderColor: theme['color-basic-800'],
                    backgroundColor: 'transparent'
                  }
                ]}
              />
              <Button
                appearance='ghost'
                accessoryLeft={SettingsIcon}
                style={[
                  styles.toolButton,
                  { 
                    borderColor: theme['color-basic-800'],
                    backgroundColor: 'transparent'
                  }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.friendsText}>👥 My friends only    📍 W 47th St...</Text>
          
          <View style={styles.captureContainer}>
            <Button
              status='primary'
              accessoryLeft={CameraIcon}
              style={[
                styles.captureButton,
                { backgroundColor: theme['color-primary-500'] }
              ]}
              onPress={() => console.log('Capture pressed')}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cameraContainer: {
    flexDirection: 'row',
    height: 420,
    marginBottom: 32,
  },
  cameraPreview: {
    flex: 1,
    aspectRatio: 4/5,
    borderRadius: 12,
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
  toolRail: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: 80,
  },
  toolButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  friendsText: {
    color: '#CCCCCC',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
});