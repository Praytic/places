import React, { useState, useRef } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageMapDialog from './ManageMapDialog';

const MapViewChips = ({ userMapViews = [], selectedMapIds = new Set(), onMapViewToggle, userEmail, onMapCreated, enableManagement = true, sx = {} }) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingMapView, setEditingMapView] = useState(null);
    const longPressTimerRef = useRef(null);

    const handleLongPressStart = (mapViewId) => {
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

    const handleContextMenu = (event, mapViewId) => {
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
                        onClick={() => onMapViewToggle && onMapViewToggle(mapView.mapId)}
                        onContextMenu={(e) => handleContextMenu(e, mapView.mapViewId)}
                        onMouseDown={() => handleLongPressStart(mapView.mapViewId)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(mapView.mapViewId)}
                        onTouchEnd={handleLongPressEnd}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: selectedMapIds.has(mapView.mapId) ? 'primary.main' : 'white',
                            color: selectedMapIds.has(mapView.mapId) ? 'white' : 'text.primary',
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                            '&:hover': {
                                backgroundColor: selectedMapIds.has(mapView.mapId) ? 'primary.dark' : 'rgba(220, 220, 220, 1)',
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
                    userEmail={userEmail}
                    onMapCreated={onMapCreated}
                    onClose={() => setShowCreateDialog(false)}
                />
            )}

            {editingMapView && (
                <ManageMapDialog
                    userEmail={userEmail}
                    onMapCreated={onMapCreated}
                    onClose={() => setEditingMapView(null)}
                    existingMap={editingMapView}
                />
            )}
        </>
    );
};

export default MapViewChips;