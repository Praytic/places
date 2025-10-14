import { useState, useEffect } from 'react';
import { UserMap, userMapConverter } from '../../../shared/types';
import { useAuthContext } from '../../../providers';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

export const useUserMaps = (): {
  maps: UserMap[];
  loading: boolean;
  error: string | null;
} => {
  const { user, loading: authLoading } = useAuthContext();
  const [maps, setMaps] = useState<UserMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setMaps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ownedMapsQuery = query(
      collection(db, 'maps'),
      where('owner', '==', user.email)
    ).withConverter(userMapConverter);

    const unsubscribe = onSnapshot(
      ownedMapsQuery,
      (snapshot) => {
        const ownedMaps = snapshot.docs.map(doc => doc.data());
        setMaps(ownedMaps);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching maps:', err);
        setError('Failed to fetch maps');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email, authLoading]);

  return { maps, loading, error };
};
