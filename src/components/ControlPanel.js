import React from 'react';
import {Box, IconButton, Paper} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import {ROLES} from '../services/MapsService';

const ControlPanel = ({
                          onAddPlace,
                          onToggleFilter,
                          activeFilters,
                          userRole
                      }) => {
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
                    <AddIcon fontSize="small"/>
                </IconButton>

                <IconButton
                    onClick={() => onToggleFilter('favorite')}
                    title="Toggle Favorites"
                    sx={{
                        minWidth: 48,
                        height: 48,
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
                            top: '12px',
                            bottom: '12px',
                            width: '1px',
                            bgcolor: 'action.disabled',
                        },
                    }}
                >
                    {activeFilters.has('favorite') ? (
                        <FavoriteIcon fontSize="small"/>
                    ) : (
                        <FavoriteBorderIcon fontSize="small"/>
                    )}
                </IconButton>

                <IconButton
                    onClick={() => onToggleFilter('want to go')}
                    title="Toggle Want to Go"
                    sx={{
                        minWidth: 48,
                        height: 48,
                        color: activeFilters.has('want to go') ? 'primary.main' : 'text.disabled',
                        '&:hover': {
                            bgcolor: 'action.hover',
                            color: activeFilters.has('want to go') ? 'primary.main' : 'text.secondary',
                        },
                        '&:active': {
                            transform: 'scale(0.95)',
                        },
                        borderRadius: 0,
                    }}
                >
                    {activeFilters.has('want to go') ? (
                        <RemoveRedEyeIcon fontSize="small"/>
                    ) : (
                        <RemoveRedEyeOutlinedIcon fontSize="small"/>
                    )}
                </IconButton>
            </Paper>
        </Box>
    );
};

export default ControlPanel;
