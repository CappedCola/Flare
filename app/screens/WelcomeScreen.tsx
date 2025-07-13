import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@ui-kitten/components';
import { AppleIcon, MailIcon, UserIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';


export const WelcomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleEmailSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn' as never);
  };

  const handleAppleSignUp = () => {
    // TODO: Implement Apple Sign In
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google Sign In
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/app-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
            Welcome to Flare
          </Text>
          <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
            Share your daily moments and build streaks with friends
          </Text>
        </View>

        {/* Sign Up Options */}
        <View style={styles.signUpContainer}>
          <Text style={[styles.sectionTitle, { color: theme['text-basic-color'] }]}>
            Get Started
          </Text>

          {/* Apple Sign Up (Placeholder) */}
          <TouchableOpacity
            style={[styles.signUpButton, styles.appleButton]}
            onPress={handleAppleSignUp}
            activeOpacity={0.8}
          >
            <AppleIcon size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Google Sign Up (Placeholder) */}
          <TouchableOpacity
            style={[styles.signUpButton, styles.googleButton]}
            onPress={handleGoogleSignUp}
            activeOpacity={0.8}
          >
            <MailIcon size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Email Sign Up (Functional) */}
          <TouchableOpacity
            style={[styles.signUpButton, styles.emailButton, { backgroundColor: theme['color-primary-default'] }]}
            onPress={handleEmailSignUp}
            activeOpacity={0.8}
          >
            <UserIcon size={20} color="#FFFFFF" />
            <Text style={styles.emailButtonText}>Sign up with Email</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInPrompt, { color: theme['text-hint-color'] }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={[styles.signInLink, { color: theme['color-primary-default'] }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'Inter_400Regular',
  },
  signUpContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  emailButton: {
    // backgroundColor from theme['color-primary-default']
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPrompt: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
});