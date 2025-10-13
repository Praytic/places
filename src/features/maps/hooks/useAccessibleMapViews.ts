import { useState, useEffect } from 'react';
import {MapView} from '../../../shared/types';
import {getAccessibleMapViews} from "../../../services/MapViewService";
import { useAuthContext } from '../../../providers';

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
    const fetchViews = async () => {
      if (authLoading) return;
      if (!user?.email) {
        setViews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const mapViews = await getAccessibleMapViews(user.email)
        setViews(mapViews);
      } catch (err) {
        console.error('Error fetching map views:', err);
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [user?.email, authLoading]);

  return { accessibleViews: views, loading, error };
};
