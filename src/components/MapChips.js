import React, { useState } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateMapDialog from './CreateMapDialog';

const MapChips = ({ userMaps = [], selectedMapIds = new Set(), onMapToggle, userEmail, onMapCreated, sx = {} }) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);

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
                <CreateMapDialog
                    userEmail={userEmail}
                    onMapCreated={onMapCreated}
                    onClose={() => setShowCreateDialog(false)}
                />
            )}
        </>
    );
};

export default MapChips;
