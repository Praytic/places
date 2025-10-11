import { useState, useEffect } from 'react';
import {MapView} from '../../../shared/types';
import {getUserMapViews} from "../../../services/MapViewService";

export const useMapViews = (): {
  views: MapView[];
  loading: boolean;
  error: string | null;
} => {
  const [views, setViews] = useState<MapView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      try {
        const mapViews = await getUserMapViews()
        setViews(mapViews);
      } catch (err) {
        console.error('Error fetching map views:', err);
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  });

  return { views: views, loading, error };
};
