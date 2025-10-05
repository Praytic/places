import React, { useState } from 'react';
import { Box, Paper, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LayersIcon from '@mui/icons-material/Layers';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ROLES } from '../services/MapsService';

const ControlPanel = ({
  selectedPlace,
  onAddPlace,
  onRemovePlace,
  onChangeGroup,
  onToggleLayer,
  availableLayers,
  hiddenLayers,
  groups,
  userRole
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const layerToggleOpen = Boolean(anchorEl);

  const handleLayerToggle = (layer) => {
    onToggleLayer(layer);
  };

  const isReadOnly = userRole === ROLES.VIEWER;

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
          p: 1,
          m: 1.5,
          gap: 0,
          pointerEvents: 'auto',
        }}
      >
        <IconButton
          onClick={() => {
            onAddPlace();
            setAnchorEl(null);
          }}
          disabled={isReadOnly}
          title={isReadOnly ? "" : "Add Place"}
          sx={{
            minWidth: 48,
            height: 48,
            color: isReadOnly ? 'text.disabled' : 'text.secondary',
            '&:hover': !isReadOnly && {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
            '&:active': !isReadOnly && {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '12px',
              bottom: '12px',
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={() => {
            onRemovePlace();
            setAnchorEl(null);
          }}
          disabled={!selectedPlace || isReadOnly}
          title={!selectedPlace || isReadOnly ? "" : "Remove Place"}
          sx={{
            minWidth: 48,
            height: 48,
            color: !selectedPlace || isReadOnly ? 'text.disabled' : 'text.secondary',
            '&:hover': selectedPlace && !isReadOnly && {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
            '&:active': selectedPlace && !isReadOnly && {
              transform: 'scale(0.95)',
            },
            borderRadius: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '12px',
              bottom: '12px',
              width: '1px',
              bgcolor: 'action.disabled',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          title="Toggle Layers"
          sx={{
            minWidth: 48,
            height: 48,
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
          <LayersIcon fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={layerToggleOpen}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              mb: 1,
              minWidth: 200,
            },
          }}
        >
          <MenuItem disabled sx={{ justifyContent: 'center', fontWeight: 600 }}>
            Toggle Layers
          </MenuItem>
          <Divider />
          {availableLayers.map(layer => (
            <MenuItem
              key={layer}
              onClick={() => handleLayerToggle(layer)}
              sx={{ opacity: hiddenLayers.has(layer) ? 0.5 : 1 }}
            >
              <ListItemIcon>
                {hiddenLayers.has(layer) ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>{layer}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </Box>
  );
};

export default ControlPanel;
