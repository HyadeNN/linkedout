import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Get all connections
export const getConnections = async (page = 1, limit = 20) => {
  const { user } = useAuth();
  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('status', '==', 'accepted'),
    where('participants', 'array-contains', user.uid),
    orderBy('updatedAt', 'desc'),
    limit(limit)
  );

  const snapshot = await getDocs(q);
  const connections = [];
  
  for (const doc of snapshot.docs) {
    const connection = doc.data();
    const otherUserId = connection.participants.find(id => id !== user.uid);
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
    
    if (otherUserDoc.exists()) {
      connections.push({
        id: doc.id,
        ...connection,
        user: otherUserDoc.data()
      });
    }
  }

  return {
    items: connections,
    total: connections.length
  };
};

// Get connection requests
export const getConnectionRequests = async (page = 1, limit = 20) => {
  const { user } = useAuth();
  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('status', '==', 'pending'),
    where('receiverId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(limit)
  );

  const snapshot = await getDocs(q);
  const requests = [];
  
  for (const doc of snapshot.docs) {
    const request = doc.data();
    const senderDoc = await getDoc(doc(db, 'users', request.senderId));
    
    if (senderDoc.exists()) {
      requests.push({
        id: doc.id,
        ...request,
        sender: senderDoc.data()
      });
    }
  }

  return {
    items: requests,
    total: requests.length
  };
};

// Get connection suggestions
export const getConnectionSuggestions = async (page = 1, limit = 20) => {
  const { user } = useAuth();
  
  // Get user's connections
  const connectionsRef = collection(db, 'connections');
  const connectionsQuery = query(
    connectionsRef,
    where('participants', 'array-contains', user.uid)
  );
  const connectionsSnapshot = await getDocs(connectionsQuery);
  const connectedUserIds = connectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return data.participants.find(id => id !== user.uid);
  });

  // Get all users except connected ones and current user
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('uid', 'not-in', [...connectedUserIds, user.uid]),
    limit(limit)
  );

  const snapshot = await getDocs(q);
  const suggestions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    items: suggestions,
    total: suggestions.length
  };
};

// Create connection request
export const createConnectionRequest = async (receiverId) => {
  const { user } = useAuth();
  const connectionsRef = collection(db, 'connections');
  
  const connectionData = {
    senderId: user.uid,
    receiverId,
    participants: [user.uid, receiverId],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(connectionsRef, connectionData);
  return {
    id: docRef.id,
    ...connectionData
  };
};

// Update connection status
export const updateConnectionStatus = async (connectionId, status) => {
  const connectionRef = doc(db, 'connections', connectionId);
  await updateDoc(connectionRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// Delete connection
export const deleteConnection = async (connectionId) => {
  const connectionRef = doc(db, 'connections', connectionId);
  await deleteDoc(connectionRef);
};

// Get mutual connections
export const getMutualConnections = async (userId, page = 1, limit = 20) => {
  const { user } = useAuth();
  
  // Get user's connections
  const userConnectionsRef = collection(db, 'connections');
  const userConnectionsQuery = query(
    userConnectionsRef,
    where('participants', 'array-contains', user.uid),
    where('status', '==', 'accepted')
  );
  const userConnectionsSnapshot = await getDocs(userConnectionsQuery);
  const userConnectedIds = userConnectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return data.participants.find(id => id !== user.uid);
  });

  // Get target user's connections
  const targetConnectionsRef = collection(db, 'connections');
  const targetConnectionsQuery = query(
    targetConnectionsRef,
    where('participants', 'array-contains', userId),
    where('status', '==', 'accepted')
  );
  const targetConnectionsSnapshot = await getDocs(targetConnectionsQuery);
  const targetConnectedIds = targetConnectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return data.participants.find(id => id !== userId);
  });

  // Find mutual connections
  const mutualIds = userConnectedIds.filter(id => targetConnectedIds.includes(id));

  // Get mutual users' data
  const mutualUsers = [];
  for (const id of mutualIds) {
    const userDoc = await getDoc(doc(db, 'users', id));
    if (userDoc.exists()) {
      mutualUsers.push({
        id: userDoc.id,
        ...userDoc.data()
      });
    }
  }

  return {
    items: mutualUsers,
    total: mutualUsers.length
  };
};

// Get sent connection requests
export const getSentConnectionRequests = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/sent-requests', {
    params: { page, limit },
  });
  return response.data;
};

// Check connection status with another user
export const checkConnectionStatus = async (userId) => {
  const response = await api.get(`/connections/status/${userId}`);
  return response.data;
};

// Follow a user
export const followUser = async (userId) => {
  const response = await api.post('/connections/follow', { followed_id: userId });
  return response.data;
};

// Unfollow a user
export const unfollowUser = async (userId) => {
  const response = await api.delete(`/connections/follow/${userId}`);
  return response.data;
};

// Get followers
export const getFollowers = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/followers', {
    params: { page, limit },
  });
  return response.data;
};

// Get following
export const getFollowing = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/following', {
    params: { page, limit },
  });
  return response.data;
};

// Check if following a user
export const isFollowingUser = async (userId) => {
  const response = await api.get(`/connections/is-following/${userId}`);
  return response.data;
};