import React, {createContext, ReactNode, useContext, useMemo} from 'react';
import {useAccessibleMapViews, useUserMaps, useVisibleMaps} from '../features/maps/hooks';
import {MapView, UserMap} from "../shared/types";
import {useSharedMapViews} from "../features/maps/hooks/useSharedMapViews";

interface MapsContextValue {
  maps: UserMap[];
  accessibleViews: MapView[];
  sharedViews: Map<UserMap, MapView[]>;
  loading: boolean;
  error: string | null;
  visibleMapIds: Set<string>;
  toggleMapVisibility: (mapId: string) => void;
}

const MapsContext = createContext<MapsContextValue | undefined>(undefined);

export const useMapsContext = (): MapsContextValue => {
  const context = useContext(MapsContext);
  if (!context) {
    throw new Error('useMapsContext must be used within MapsProvider');
  }
  return context;
};

interface MapsProviderProps {
  children: ReactNode;
}

export const MapsProvider: React.FC<MapsProviderProps> = ({children}) => {
    const {maps, loading: mapsLoading, error: mapsError} = useUserMaps();
    const {accessibleViews, loading: accessibleViewsLoading, error: accessibleViewsError} = useAccessibleMapViews();
    const {collaborators, loading: sharedViewsLoading, error: sharedViewsError} = useSharedMapViews(maps);

    const loading = mapsLoading || accessibleViewsLoading || sharedViewsLoading;
    const error = mapsError || accessibleViewsError || sharedViewsError;

    const availableMapIds = useMemo(() => [...maps, ...accessibleViews].map((m) => 'mapId' in m ? m.mapId : m.id), [maps, accessibleViews]);

    const {visibleMapIds, toggleMapVisibility} = useVisibleMaps(availableMapIds);

    const value: MapsContextValue = useMemo(
      () => ({
        maps,
        accessibleViews,
        sharedViews: collaborators,
        loading,
        error,
        visibleMapIds,
        toggleMapVisibility,
      }),
      [maps, accessibleViews, collaborators, loading, error, visibleMapIds, toggleMapVisibility]
    );

    return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
  }
;
