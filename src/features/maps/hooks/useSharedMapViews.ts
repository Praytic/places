import { useState, useEffect } from 'react';
import {MapView, UserMap} from '../../../shared/types';
import {getSharedMapViews} from "../../../services/MapViewService";

export const useSharedMapViews = (userMaps: UserMap[]): {
  sharedViews: Map<UserMap, MapView[]>;
  loading: boolean;
  error: string | null;
} => {
  const [sharedViews, setSharedViews] = useState<Map<UserMap, MapView[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      try {
        const mapViews = await getSharedMapViews(userMaps)
        setSharedViews(mapViews);
      } catch (err) {
        console.error('Error fetching map views:', err);
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  });

  return { sharedViews: sharedViews, loading, error };
};
