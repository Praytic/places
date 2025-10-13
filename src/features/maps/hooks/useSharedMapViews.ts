import { useState, useEffect } from 'react';
import {MapView, UserMap} from '../../../shared/types';
import {getSharedMapViews} from "../../../services/MapViewService";

type CollaboratorEntry = Required<Pick<MapView, 'collaborator' | 'role'>>;

export const useSharedMapViews = (userMap?: UserMap): {
  collaborators: CollaboratorEntry[];
  setCollaborators: React.Dispatch<React.SetStateAction<CollaboratorEntry[]>>;
  loading: boolean;
  error: string | null;
} => {
  const [sharedViews, setSharedViews] = useState<CollaboratorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      if (!userMap) {
        return;
      }

      setLoading(true);
      try {
        const viewsPerUserMap = await getSharedMapViews([userMap]);
        const mapViews = viewsPerUserMap.get(userMap) ?? [];
        const validCollaborators: CollaboratorEntry[] = mapViews
          .filter((view): view is MapView & { collaborator: string; role: string } =>
            !!view.collaborator && !!view.role
          )
          .map(view => ({ collaborator: view.collaborator, role: view.role }));
        setSharedViews(validCollaborators);
      } catch (err) {
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  });

  return { collaborators: sharedViews, setCollaborators: setSharedViews, loading, error };
};
