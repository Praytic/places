import React from 'react';
import { Box, Chip, IconButton, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import { MapView, SelectableAccessMap, UserMap} from "../shared/types";

interface MapChipsProps {
  selectableMaps: SelectableAccessMap[];
  selectedMapIds?: Set<string>;
  onMapToggle?: (mapId: string) => void;
  onMapEdit?: (map: UserMap) => void;
  onViewEdit?: (map: MapView) => void;
  onMapCreate?: () => void;
  userEmail?: string;
  sx?: SxProps<Theme>;
}

const MapChips: React.FC<MapChipsProps> = ({
  selectableMaps = [],
  onMapToggle,
  onMapEdit,
  onViewEdit,
  onMapCreate,
  sx = {}
}) => {
  const handleClick = (mapOrView: SelectableAccessMap) => {
    if (onMapToggle) {
      const mapId = 'mapId' in mapOrView ? mapOrView.mapId : mapOrView.id;
      onMapToggle(mapId);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, mapOrView: Pick<(UserMap | MapView), 'id'>) => {
    event.preventDefault();
    const map = selectableMaps.find(m => m.id === mapOrView.id);
    if (map instanceof UserMap && onMapEdit) {
      onMapEdit(map)
    } else if (map instanceof MapView && onViewEdit) {
      onViewEdit(map)
    } else {
      return
    }
  };

  if (selectableMaps.length === 0) {
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
        {selectableMaps.map((map) => (
          <Box key={map.id} sx={{ position: 'relative', display: 'inline-block' }}>
            <Chip
              label={map.name}
              size="medium"
              onClick={() => handleClick(map)}
              onContextMenu={(e) => handleContextMenu(e, map)}
              sx={{
                cursor: 'pointer',
                backgroundColor: map.selected ? 'primary.main' : 'white',
                color: map.selected ? 'white' : 'text.primary',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  backgroundColor: map.selected ? 'primary.dark' : 'rgba(220, 220, 220, 1)',
                },
              }}
            />
            {'mapId' in map && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <ShareIcon sx={{ fontSize: 12, color: 'primary.main' }} />
              </Box>
            )}
          </Box>
        ))}
        {onMapCreate && (
          <IconButton
            size="small"
            onClick={() => onMapCreate && onMapCreate()}
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
    </>
  );
};

export default MapChips;
