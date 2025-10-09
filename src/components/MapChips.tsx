import React, { useState, useRef } from 'react';
import { Box, Chip, IconButton, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageMapDialog from './ManageMapDialog';
import { PlaceMapWithRole, Set<string> } from '../shared/types/domain';

interface MapChipsProps {
  userMaps?: PlaceMapWithRole[];
  selectedMapIds?: Set<string>;
  onMapToggle?: (mapId: string) => void;
  userEmail?: string;
  onMapCreated?: () => void;
  enableManagement?: boolean;
  sx?: SxProps<Theme>;
}

const MapChips: React.FC<MapChipsProps> = ({
  userMaps = [],
  selectedMapIds = new Set(),
  onMapToggle,
  userEmail,
  onMapCreated,
  enableManagement = true,
  sx = {}
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMap, setEditingMap] = useState<PlaceMapWithRole | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = (mapId: string) => {
    if (!enableManagement) return;
    longPressTimerRef.current = setTimeout(() => {
      const map = userMaps.find(m => m.id === mapId);
      if (map) {
        setEditingMap(map);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (event: React.MouseEvent, mapId: string) => {
    event.preventDefault();
    if (!enableManagement) return;
    const map = userMaps.find(m => m.id === mapId);
    if (map) {
      setEditingMap(map);
    }
  };

  if (userMaps.length === 0) {
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
        {userMaps.map((map) => (
          <Chip
            key={map.id}
            label={map.displayedName || map.name}
            size="medium"
            onClick={() => onMapToggle && onMapToggle(map.id)}
            onContextMenu={(e) => handleContextMenu(e, map.id)}
            onMouseDown={() => handleLongPressStart(map.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(map.id)}
            onTouchEnd={handleLongPressEnd}
            sx={{
              cursor: 'pointer',
              backgroundColor: selectedMapIds.has(map.id) ? 'primary.main' : 'white',
              color: selectedMapIds.has(map.id) ? 'white' : 'text.primary',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: selectedMapIds.has(map.id) ? 'primary.dark' : 'rgba(220, 220, 220, 1)',
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

      {editingMap && (
        <ManageMapDialog
          userEmail={userEmail!}
          onMapCreated={onMapCreated!}
          onClose={() => setEditingMap(null)}
          existingMap={editingMap}
        />
      )}
    </>
  );
};

export default MapChips;
