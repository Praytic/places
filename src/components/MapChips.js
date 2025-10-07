import React from 'react';
import { Box, Chip } from '@mui/material';

const MapChips = ({ userMaps = [], selectedMapIds = new Set(), onMapToggle, sx = {} }) => {
    if (userMaps.length === 0) {
        return null;
    }

    return (
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
        </Box>
    );
};

export default MapChips;
