import { useState, useEffect } from 'react';
import {MapView} from '../../../shared/types';
import {getAccessibleMapViews} from "../../../services/MapViewService";

export const useAccessibleMapViews = (): {
  accessibleViews: MapView[];
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
        const mapViews = await getAccessibleMapViews()
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

  return { accessibleViews: views, loading, error };
};
