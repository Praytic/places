import { useState, useEffect } from 'react';
import { UserMap } from '../../../shared/types';
import { getUserMaps } from '../../../services/MapsService';

export const useUserMaps = (): {
  maps: UserMap[];
  loading: boolean;
  error: string | null;
} => {
  const [maps, setMaps] = useState<UserMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaps = async () => {
      setLoading(true);
      try {
        const ownedMaps = await getUserMaps()
        setMaps(ownedMaps);
      } catch (err) {
        console.error('Error fetching maps:', err);
        setError('Failed to fetch maps');
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  });

  return { maps, loading, error };
};
