import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState(''); // can be email or phone
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [cognitoUser, setCognitoUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already signed in and session is valid
    const checkSession = async () => {
      try {
        const userPool = require('amazon-cognito-identity-js').CognitoUserPool;
        const poolData = {
          UserPoolId: 'ap-south-1_tl6kq6jwz',
          ClientId: '1o45st8m3c9ltofq5f2m3mma82',
        };
        const pool = new userPool(poolData);
        const currentUser = pool.getCurrentUser();
        if (currentUser) {
          currentUser.getSession((err: any, session: any) => {
            if (!err && session && session.isValid()) {
              router.replace('/welcome');
            }
          });
        }
      } catch (e) {
        // Ignore errors
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email/phone and password');
      return;
    }
    setIsLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn(username, password);
      if (isSignedIn) {
        router.replace('/welcome');
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' || nextStep?.signInStep === 'SOFTWARE_TOKEN_MFA') {
        setShowMfa(true);
      } else if (nextStep?.signInStep === 'SMS_MFA') {
        Alert.alert('Error', 'Only TOTP (Authenticator App) verification is supported.');
      } else {
        Alert.alert('Error', 'Unable to complete sign in');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async () => {
    if (!mfaCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code sent to your email.');
      return;
    }
    setIsLoading(true);
    try {
      cognitoUser.sendMFACode(mfaCode, {
        onSuccess: () => {
          router.replace('/welcome');
        },
        onFailure: (err: any) => {
          Alert.alert('Error', err.message || 'Invalid code');
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.form}>
        {!showMfa ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email or Phone"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Signing in...' : 'Login'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/signup')} disabled={isLoading}>
              <Text style={[styles.link, isLoading && styles.linkDisabled]}>
                Don&apos;t have an account? Sign up
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Verification code (sent to your email)"
              placeholderTextColor="#94a3b8"
              value={mfaCode}
              onChangeText={setMfaCode}
              keyboardType="number-pad"
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleMfaSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#0891b2',
    textAlign: 'center',
    marginTop: 10,
  },
  linkDisabled: {
    color: '#94a3b8',
  },
}); 