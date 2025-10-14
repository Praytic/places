import { useState, useEffect } from 'react';
import {MapView, mapViewConverter} from '../../../shared/types';
import { useAuthContext } from '../../../providers';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

export const useAccessibleMapViews = (): {
  accessibleViews: MapView[];
  loading: boolean;
  error: string | null;
} => {
  const { user, loading: authLoading } = useAuthContext();
  const [views, setViews] = useState<MapView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setViews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const accessibleViewsQuery = query(
      collection(db, 'mapViews'),
      where('collaborator', '==', user.email)
    ).withConverter(mapViewConverter);

    const unsubscribe = onSnapshot(
      accessibleViewsQuery,
      (snapshot) => {
        const accessibleViews = snapshot.docs.map(doc => doc.data());
        setViews(accessibleViews);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching map views:', err);
        setError('Failed to fetch map views');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email, authLoading]);

  return { accessibleViews: views, loading, error };
};
