import React, { createContext, useContext, useEffect, useState } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

// AWS Cognito Configuration
const USER_POOL_ID = 'ap-south-1_tl6kq6jwz';
const CLIENT_ID = '1o45st8m3c9ltofq5f2m3mma82';

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  signIn: (email: string, password: string) => Promise<{ isSignedIn: boolean; nextStep?: any }>;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  setupTOTP: () => Promise<string>;
  verifyTOTP: (code: string) => Promise<void>;
  setupSMS: (phoneNumber: string) => Promise<void>;
  verifySMS: (code: string) => Promise<void>;
  setTempPassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string>('');

  useEffect(() => {
    // Check if user is already signed in
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err: any, session: any) => {
        if (err) {
          console.log('Session error:', err);
          setIsAuthenticated(false);
          setUser(null);
        } else if (session.isValid()) {
          setIsAuthenticated(true);
          setUser(currentUser);
        }
      });
    }
  }, []);

  const signIn = (email: string, password: string): Promise<{ isSignedIn: boolean; nextStep?: any }> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          console.log('Sign in successful');
          setIsAuthenticated(true);
          setUser(cognitoUser);
          resolve({ isSignedIn: true });
        },
        onFailure: (err) => {
          console.error('Sign in failed:', err);
          reject(err);
        },
        mfaRequired: (challengeName, challengeParameters) => {
          console.log('MFA required:', challengeName);
          resolve({ 
            isSignedIn: false, 
            nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' } 
          });
        },
        mfaSetup: (challengeName, challengeParameters) => {
          console.log('MFA setup required');
          resolve({ 
            isSignedIn: false, 
            nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' } 
          });
        },
      });
    });
  };

  const signUp = (email: string, password: string, fullName: string, phoneNumber: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
        new CognitoUserAttribute({
          Name: 'name',
          Value: fullName,
        }),
        new CognitoUserAttribute({
          Name: 'phone_number',
          Value: phoneNumber,
        }),
      ];

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          console.error('Sign up error:', err);
          reject(err);
        } else {
          console.log('Sign up successful');
          resolve();
        }
      });
    });
  };

  const confirmSignUp = (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Confirm sign up error:', err);
          reject(err);
        } else {
          console.log('Confirmation successful');
          resolve();
        }
      });
    });
  };

  const signOut = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  const setupTOTP = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        reject(new Error('No authenticated user'));
        return;
      }
      (currentUser as any).associateSoftwareToken({
        onSuccess: (secretCode: string) => {
          console.log('TOTP setup successful');
          resolve(secretCode || '');
        },
        onFailure: (err: any) => {
          console.error('TOTP setup failed:', err);
          reject(err);
        },
      });
    });
  };

  const verifyTOTP = (code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        reject(new Error('No authenticated user'));
        return;
      }

      currentUser.verifySoftwareToken(code, 'TOTP', {
        onSuccess: (result) => {
          console.log('TOTP verification successful');
          resolve();
        },
        onFailure: (err) => {
          console.error('TOTP verification failed:', err);
          reject(err);
        },
      });
    });
  };

  const setupSMS = (phoneNumber: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        reject(new Error('No authenticated user'));
        return;
      }
      currentUser.getAttributeVerificationCode('phone_number', {
        onSuccess: function() {
          console.log('SMS setup successful');
          resolve();
        },
        onFailure: function(err: any) {
          console.error('SMS setup failed:', err);
          reject(err);
        },
        inputVerificationCode: undefined,
      });
    });
  };

  const verifySMS = (code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        reject(new Error('No authenticated user'));
        return;
      }

      currentUser.verifySoftwareToken(code, 'SMS', {
        onSuccess: (result) => {
          console.log('SMS verification successful');
          resolve();
        },
        onFailure: (err) => {
          console.error('SMS verification failed:', err);
          reject(err);
        },
      });
    });
  };

  const value = {
    isAuthenticated,
    user,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    setupTOTP,
    verifyTOTP,
    setupSMS,
    verifySMS,
    setTempPassword: (password: string) => setTempPassword(password),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 