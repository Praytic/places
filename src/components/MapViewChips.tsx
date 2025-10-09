import React, { useState, useRef } from 'react';
import { Box, Chip, IconButton, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageMapDialog from './ManageMapDialog';
import { PlaceMapWithRole, Set<string> } from '../shared/types/domain';

interface MapViewChipsProps {
  userMapViews?: PlaceMapWithRole[];
  selectedMapIds?: Set<string>;
  onMapViewToggle?: (mapId: string) => void;
  userEmail?: string;
  onMapCreated?: () => void;
  enableManagement?: boolean;
  sx?: SxProps<Theme>;
}

const MapViewChips: React.FC<MapViewChipsProps> = ({
  userMapViews = [],
  selectedMapIds = new Set(),
  onMapViewToggle,
  userEmail,
  onMapCreated,
  enableManagement = true,
  sx = {}
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMapView, setEditingMapView] = useState<PlaceMapWithRole | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = (mapViewId: string) => {
    if (!enableManagement) return;
    longPressTimerRef.current = setTimeout(() => {
      const mapView = userMapViews.find(mv => mv.mapViewId === mapViewId);
      if (mapView) {
        setEditingMapView(mapView);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (event: React.MouseEvent, mapViewId: string) => {
    event.preventDefault();
    if (!enableManagement) return;
    const mapView = userMapViews.find(mv => mv.mapViewId === mapViewId);
    if (mapView) {
      setEditingMapView(mapView);
    }
  };

  if (userMapViews.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        ...sx
      }}>
        {userMapViews.map((mapView) => (
          <Chip
            key={mapView.mapViewId}
            label={mapView.displayedName}
            size="medium"
            onClick={() => onMapViewToggle && onMapViewToggle(mapView.id)}
            onContextMenu={(e) => handleContextMenu(e, mapView.mapViewId!)}
            onMouseDown={() => handleLongPressStart(mapView.mapViewId!)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(mapView.mapViewId!)}
            onTouchEnd={handleLongPressEnd}
            sx={{
              cursor: 'pointer',
              backgroundColor: selectedMapIds.has(mapView.id) ? 'primary.main' : 'white',
              color: selectedMapIds.has(mapView.id) ? 'white' : 'text.primary',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: selectedMapIds.has(mapView.id) ? 'primary.dark' : 'rgba(220, 220, 220, 1)',
              },
            }}
          />
        ))}
        {userEmail && onMapCreated && (
          <IconButton
            size="small"
            onClick={() => setShowCreateDialog(true)}
            sx={{
              backgroundColor: 'white',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(220, 220, 220, 1)',
              },
              width: 32,
              height: 32,
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {showCreateDialog && (
        <ManageMapDialog
          userEmail={userEmail!}
          onMapCreated={onMapCreated!}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {editingMapView && (
        <ManageMapDialog
          userEmail={userEmail!}
          onMapCreated={onMapCreated!}
          onClose={() => setEditingMapView(null)}
          existingMap={editingMapView}
        />
      )}
    </>
  );
};

export default MapViewChips;
