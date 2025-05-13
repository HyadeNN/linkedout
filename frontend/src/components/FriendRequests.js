import React, { useState, useEffect } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Box, 
    Grid,
    Avatar
} from '@mui/material';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';

const defaultProfileImage = '/default-avatar.jpg';

const FriendRequests = ({ requests }) => {
    const [requestsWithProfiles, setRequestsWithProfiles] = useState([]);

    useEffect(() => {
        const fetchRequestProfiles = async () => {
            const profilePromises = requests.map(async (request) => {
                const userDoc = await getDoc(doc(db, 'users', request.uid));
                const userData = userDoc.exists() ? userDoc.data() : null;
                return {
                    ...request,
                    profile_image: userData?.profile?.profile_image || defaultProfileImage,
                    name: userData?.name || request.name,
                    headline: userData?.headline || request.headline
                };
            });

            const profiles = await Promise.all(profilePromises);
            setRequestsWithProfiles(profiles);
        };

        if (requests && requests.length > 0) {
            fetchRequestProfiles();
        }
    }, [requests]);

    const handleRequest = async (requestUid, action) => {
        try {
            const currentUserRef = doc(db, 'users', auth.currentUser.uid);
            const requestUserRef = doc(db, 'users', requestUid);

            // Get the request to remove
            const currentUserDoc = await getDoc(currentUserRef);
            const friendRequests = currentUserDoc.data()?.friendRequests || [];
            const requestToRemove = friendRequests.find(req => req.uid === requestUid);

            if (requestToRemove) {
                // Remove the request
                await updateDoc(currentUserRef, {
                    friendRequests: arrayRemove(requestToRemove)
                });

                if (action === 'accept') {
                    // Add to both users' connections
                    await updateDoc(currentUserRef, {
                        connections: arrayUnion(requestUid)
                    });
                    await updateDoc(requestUserRef, {
                        connections: arrayUnion(auth.currentUser.uid)
                    });
                }

                // Update local state
                setRequestsWithProfiles(prev => 
                    prev.filter(req => req.uid !== requestUid)
                );
            }
        } catch (error) {
            console.error('Error handling friend request:', error);
            alert('Failed to process the request');
        }
    };

    return (
        <Grid container spacing={2}>
            {requestsWithProfiles.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request.uid}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Avatar 
                                    src={request.profile_image}
                                    sx={{ width: 50, height: 50, mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="h6">
                                        {request.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {request.headline}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box display="flex" gap={1}>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    fullWidth
                                    onClick={() => handleRequest(request.uid, 'accept')}
                                >
                                    Accept
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="error"
                                    fullWidth
                                    onClick={() => handleRequest(request.uid, 'decline')}
                                >
                                    Decline
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
            {requestsWithProfiles.length === 0 && (
                <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                        No pending friend requests
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
};

export default FriendRequests; 