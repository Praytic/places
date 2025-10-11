import React, {createContext, ReactNode, useContext, useMemo} from 'react';
import {useMapViews, useUserMaps, useVisibleMaps} from '../features/maps/hooks';
import {MapView, UserMap} from "../shared/types";

interface MapsContextValue {
  maps: UserMap[];
  views: MapView[];
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
    const {views, loading: viewsLoading, error: viewsError} = useMapViews();

    const loading = mapsLoading || viewsLoading;
    const error = mapsError || viewsError;

    const availableMapIds = useMemo(() => [...maps, ...views].map((m) => 'mapId' in m ? m.mapId : m.id), [maps, views]);

    const {visibleMapIds, toggleMapVisibility} = useVisibleMaps(availableMapIds);

    const value: MapsContextValue = useMemo(
      () => ({
        maps,
        views,
        loading,
        error,
        visibleMapIds,
        toggleMapVisibility,
      }),
      [maps, views, loading, error, visibleMapIds, toggleMapVisibility]
    );

    return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
  }
;
