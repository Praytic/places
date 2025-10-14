import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { User, GoogleAuthProvider } from 'firebase/auth';
import { Box, Card, Typography, CircularProgress } from '@mui/material';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { useAuth as useAuthHook } from '../features/auth/hooks';
import { auth } from '../config/firebase';
import AccountMenu from '../components/AccountMenu';

/**
 * Context value provided by AuthProvider
 */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Hook to access authentication context
 *
 * Must be used within an AuthProvider component tree.
 * Provides access to the current user and auth loading state.
 *
 * @returns {AuthContextValue} Current authentication state
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuthContext();
 *   if (loading) return <Spinner />;
 *   return <div>Hello {user?.email}</div>;
 * }
 * ```
 */
export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const LoginScreen: React.FC = () => {
  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

    const uiConfig: firebaseui.auth.Config = {
      signInOptions: [GoogleAuthProvider.PROVIDER_ID],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: () => false,
      },
    };

    ui.start('#firebaseui-auth-container', uiConfig);

    return () => ui.reset();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        sx={{
          p: 5,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Places App
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue
        </Typography>
        <div id="firebaseui-auth-container"></div>
      </Card>
    </Box>
  );
};

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide Firebase authentication state via React Context.
 * Automatically subscribes to auth state changes and provides current user info.
 * All child components can access auth state using the useAuthContext hook.
 *
 * @param {AuthProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <MyApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, loading } = useAuthHook();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const value: AuthContextValue = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      <AccountMenu user={user} />
      {children}
    </AuthContext.Provider>
  );
};