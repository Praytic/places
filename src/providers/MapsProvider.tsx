import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useUserMaps, useVisibleMaps } from '../features/maps/hooks';
import { useAuthContext } from './AuthProvider';
import {UserMap} from "../shared/types";

/**
 * Context value provided by MapsProvider
 */
interface MapsContextValue {
  maps: UserMap[];
  loading: boolean;
  error: string | null;
  currentMapId: string | null;
  visibleMapIds: Set<string>;
  setCurrentMapId: (mapId: string | null) => void;
  toggleMapVisibility: (mapId: string) => void;
}

const MapsContext = createContext<MapsContextValue | undefined>(undefined);

/**
 * Hook to access maps context
 *
 * Must be used within a MapsProvider component tree.
 * Provides access to user's maps, current map selection, and visibility controls.
 *
 * @returns {MapsContextValue} Current maps state and controls
 * @throws {Error} If used outside of MapsProvider
 *
 * @example
 * ```tsx
 * function MapSelector() {
 *   const { maps, currentMapId, setCurrentMapId } = useMapsContext();
 *   return (
 *     <select value={currentMapId} onChange={e => setCurrentMapId(e.target.value)}>
 *       {maps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
 *     </select>
 *   );
 * }
 * ```
 */
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

/**
 * Maps Provider Component
 *
 * Wraps the application to provide map management state via React Context.
 * Manages user's maps collection, current map selection, and map visibility.
 * Requires AuthProvider as a parent in the component tree.
 * All child components can access maps state using the useMapsContext hook.
 *
 * @param {MapsProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <MapsProvider>
 *         <MyMapApp />
 *       </MapsProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const MapsProvider: React.FC<MapsProviderProps> = ({ children }) => {
  const { user } = useAuthContext();
  const userId = user?.email ?? null;

  const { maps, loading, error, currentMapId, setCurrentMapId } = useUserMaps(userId);

  const availableMapIds = useMemo(() => maps.map((m) => m.id), [maps]);

  const defaultMapIds = useMemo(
    () => (maps.length > 0 ? [maps[0]?.id ?? ''].filter(Boolean) : []),
    [maps]
  );

  const { visibleMapIds, toggleMapVisibility } = useVisibleMaps(
    userId,
    availableMapIds,
    defaultMapIds
  );

  const handleSetCurrentMapId = useCallback(
    (mapId: string | null) => {
      setCurrentMapId(mapId);
    },
    [setCurrentMapId]
  );

  const value: MapsContextValue = useMemo(
    () => ({
      maps,
      loading,
      error,
      currentMapId,
      visibleMapIds,
      setCurrentMapId: handleSetCurrentMapId,
      toggleMapVisibility,
    }),
    [maps, loading, error, currentMapId, visibleMapIds, handleSetCurrentMapId, toggleMapVisibility]
  );

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
};
