import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import Avatar from '@mui/material/Avatar';

const defaultProfileImage = '/default-avatar.jpg';
const defaultCoverImage = '/default-cover.jpg';

const UserCard = ({ 
    user, 
    onSendRequest, 
    onCancelRequest, 
    onRemoveConnection,
    isRequestSent,
    isConnection 
}) => {
    const { name, headline, profile, location } = user;
    const profile_image = profile?.profile_image || defaultProfileImage;
    const cover_image = profile?.cover_image || defaultCoverImage;

    const renderActionButton = () => {
        if (isConnection) {
            return (
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<PersonRemoveIcon />}
                    onClick={onRemoveConnection}
                    fullWidth
                >
                    Remove Connection
                </Button>
            );
        }

        if (isRequestSent) {
            return (
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={onCancelRequest}
                    fullWidth
                >
                    Cancel Request
                </Button>
            );
        }

        return (
            <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={onSendRequest}
                fullWidth
            >
                Connect
            </Button>
        );
    };

    return (
        <Card sx={{ 
            maxWidth: 345,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
                boxShadow: 6
            }
        }}>
            <Box sx={{ position: 'relative', height: 200 }}>
                <CardMedia
                    component="img"
                    height="120"
                    image={cover_image}
                    alt="cover"
                    sx={{
                        objectFit: 'cover',
                        backgroundColor: 'grey.200'
                    }}
                />
                <Avatar
                    src={profile_image}
                    alt={name}
                    sx={{
                        width: 90,
                        height: 90,
                        border: '4px solid white',
                        position: 'absolute',
                        bottom: -30,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'grey.200'
                    }}
                />
            </Box>
            <CardContent sx={{ flexGrow: 1, mt: 4 }}>
                <Typography gutterBottom variant="h6" component="div" align="center" noWrap>
                    {name}
                </Typography>
                {headline && (
                    <Typography variant="body2" color="text.secondary" gutterBottom align="center" noWrap>
                        {headline}
                    </Typography>
                )}
                {location && (
                    <Typography variant="body2" color="text.secondary" align="center" noWrap>
                        📍 {location}
                    </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                    {renderActionButton()}
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserCard; 