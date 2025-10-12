import React from 'react';
import { Box, Chip, IconButton, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MapView, SelectableAccessMap, UserMap} from "../shared/types";

interface MapChipsProps {
  selectableMaps: SelectableAccessMap[];
  onMapEdit?: (map: UserMap) => void;
  onViewEdit?: (map: MapView) => void;
  onMapCreate?: () => void;
  sx?: SxProps<Theme>;
}

const MapChips: React.FC<MapChipsProps> = ({
  selectableMaps = [],
  onMapEdit,
  onViewEdit,
  onMapCreate,
  sx = {}
}) => {
  const handleClick = (mapOrView: Pick<(UserMap | MapView), 'id'>) => {
    const clickedMap = selectableMaps.find(prop => prop.id === mapOrView.id);
    if (clickedMap) {
      clickedMap.selected = !clickedMap.selected;
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
          <Chip
            key={map.id}
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
