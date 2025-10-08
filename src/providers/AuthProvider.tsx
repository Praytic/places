import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth as useAuthHook } from '../features/auth/hooks';

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

  const value: AuthContextValue = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};