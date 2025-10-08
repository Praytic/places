import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase';

/**
 * Custom hook for managing Firebase authentication state
 *
 * Subscribes to Firebase auth state changes and provides the current user
 * and loading status. Automatically unsubscribes on component unmount.
 *
 * @returns {Object} Authentication state
 * @returns {User | null} user - The current Firebase user or null if not authenticated
 * @returns {boolean} loading - True while initial auth state is being determined
 *
 * @example
 * ```tsx
 * const { user, loading } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */
export const useAuth = (): { user: User | null; loading: boolean } => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
