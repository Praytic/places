import React from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import ShareIcon from '@mui/icons-material/Share';
import { PlaceGroup, Set<PlaceGroup> } from '../shared/types/domain';

interface ControlPanelProps {
  onAddPlace: () => void;
  onToggleFilter: (group: PlaceGroup) => void;
  activeFilters: Set<PlaceGroup>;
  onManageMaps: (event: React.MouseEvent) => void;
  onShareMap: () => void;
  isAddPlaceDisabled?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddPlace,
  onToggleFilter,
  activeFilters,
  onManageMaps,
  onShareMap,
  isAddPlaceDisabled = false,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          borderRadius: 4,
          p: { xs: 0.5, sm: 1 },
          m: { xs: 1, sm: 1.5 },
          gap: 0,
          pointerEvents: 'auto',
        }}
      >
        <IconButton
          onClick={() => {
            onAddPlace();
          }}
          disabled={isAddPlaceDisabled}
          title="Add Place"
          sx={{
            minWidth: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '&.Mui-disabled': {
              color: 'action.disabled',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: { xs: '8px', sm: '12px' },
              bottom: { xs: '8px', sm: '12px' },
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>

        <IconButton
          onClick={() => onToggleFilter('favorite')}
          title="Toggle Favorites"
          sx={{
            minWidth: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            color: activeFilters.has('favorite') ? 'error.main' : 'text.disabled',
            '&:hover': {
              bgcolor: 'action.hover',
              color: activeFilters.has('favorite') ? 'error.main' : 'text.secondary',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: { xs: '8px', sm: '12px' },
              bottom: { xs: '8px', sm: '12px' },
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          {activeFilters.has('favorite') ? (
            <FavoriteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          )}
        </IconButton>

        <IconButton
          onClick={() => onToggleFilter('want to go')}
          title="Toggle Want to Go"
          sx={{
            minWidth: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            color: activeFilters.has('want to go') ? 'primary.main' : 'text.disabled',
            '&:hover': {
              bgcolor: 'action.hover',
              color: activeFilters.has('want to go') ? 'primary.main' : 'text.secondary',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: { xs: '8px', sm: '12px' },
              bottom: { xs: '8px', sm: '12px' },
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          {activeFilters.has('want to go') ? (
            <RemoveRedEyeIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          ) : (
            <RemoveRedEyeOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          )}
        </IconButton>

        <IconButton
          onClick={(e) => onManageMaps(e)}
          title="Manage Maps"
          sx={{
            minWidth: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: { xs: '8px', sm: '12px' },
              bottom: { xs: '8px', sm: '12px' },
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          <LayersIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>

        <IconButton
          onClick={onShareMap}
          title="Share Map"
          sx={{
            minWidth: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
          }}
        >
          <ShareIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ControlPanel;
