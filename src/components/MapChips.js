import React, { useState, useRef } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageMapDialog from './ManageMapDialog';

const MapChips = ({ userMaps = [], selectedMapIds = new Set(), onMapToggle, userEmail, onMapCreated, sx = {} }) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingMap, setEditingMap] = useState(null);
    const longPressTimerRef = useRef(null);

    const handleLongPressStart = (mapId) => {
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

    const handleContextMenu = (event, mapId) => {
        event.preventDefault();
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
                        label={map.name}
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
                    userEmail={userEmail}
                    onMapCreated={onMapCreated}
                    onClose={() => setShowCreateDialog(false)}
                />
            )}

            {editingMap && (
                <ManageMapDialog
                    userEmail={userEmail}
                    onMapCreated={onMapCreated}
                    onClose={() => setEditingMap(null)}
                    existingMap={editingMap}
                />
            )}
        </>
    );
};

export default MapChips;
