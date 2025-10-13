import { useState, useEffect } from 'react';
import { UserMap } from '../../../shared/types';
import { getUserMaps } from '../../../services/MapsService';
import { useAuthContext } from '../../../providers';

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
    const fetchMaps = async () => {
      if (authLoading) return;
      if (!user?.email) {
        setMaps([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ownedMaps = await getUserMaps(user.email)
        setMaps(ownedMaps);
      } catch (err) {
        console.error('Error fetching maps:', err);
        setError('Failed to fetch maps');
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  }, [user?.email, authLoading]);

  return { maps, loading, error };
};
