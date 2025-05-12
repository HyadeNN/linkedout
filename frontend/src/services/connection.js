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
import { auth } from '../firebase';

// Get all connections
export const getConnections = async (page = 1, limit = 20) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('status', '==', 'accepted'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(limit)
  );

  const snapshot = await getDocs(q);
  const connections = [];
  
  for (const doc of snapshot.docs) {
    const connection = doc.data();
    const otherUserId = connection.participants.find(id => id !== userId);
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
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('status', '==', 'pending'),
    where('receiverId', '==', userId),
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
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  // Get user's connections
  const connectionsRef = collection(db, 'connections');
  const connectionsQuery = query(
    connectionsRef,
    where('participants', 'array-contains', userId)
  );
  const connectionsSnapshot = await getDocs(connectionsQuery);
  const connectedUserIds = connectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return data.participants.find(id => id !== userId);
  });

  // Get all users except connected ones and current user
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('uid', 'not-in', [...connectedUserIds, userId]),
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
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const connectionsRef = collection(db, 'connections');
  
  const connectionData = {
    senderId: userId,
    receiverId,
    participants: [userId, receiverId],
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
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error('User not authenticated');
  
  // Get user's connections
  const userConnectionsRef = collection(db, 'connections');
  const userConnectionsQuery = query(
    userConnectionsRef,
    where('participants', 'array-contains', currentUserId),
    where('status', '==', 'accepted')
  );
  const userConnectionsSnapshot = await getDocs(userConnectionsQuery);
  const userConnectedIds = userConnectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return data.participants.find(id => id !== currentUserId);
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

// Check connection status with another user
export const checkConnectionStatus = async (userId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error('User not authenticated');

  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('participants', 'array-contains', currentUserId)
  );
  const snapshot = await getDocs(q);
  
  for (const doc of snapshot.docs) {
    const connection = doc.data();
    if (connection.participants.includes(userId)) {
      return {
        status: connection.status,
        connection_id: doc.id,
        is_sender: connection.senderId === currentUserId
      };
    }
  }
  
  return { status: 'none' };
};

// Follow a user
export const followUser = async (userId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error('User not authenticated');

  const followsRef = collection(db, 'follows');
  const followData = {
    followerId: currentUserId,
    followingId: userId,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(followsRef, followData);
  return {
    id: docRef.id,
    ...followData
  };
};

// Unfollow a user
export const unfollowUser = async (userId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error('User not authenticated');

  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followerId', '==', currentUserId),
    where('followingId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
};

// Get followers
export const getFollowers = async (page = 1, limit = 20) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followingId', '==', userId),
    limit(limit)
  );
  const snapshot = await getDocs(q);
  
  const followers = [];
  for (const doc of snapshot.docs) {
    const follow = doc.data();
    const followerDoc = await getDoc(doc(db, 'users', follow.followerId));
    if (followerDoc.exists()) {
      followers.push({
        id: followerDoc.id,
        ...followerDoc.data()
      });
    }
  }

  return {
    items: followers,
    total: followers.length
  };
};

// Get following
export const getFollowing = async (page = 1, limit = 20) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followerId', '==', userId),
    limit(limit)
  );
  const snapshot = await getDocs(q);
  
  const following = [];
  for (const doc of snapshot.docs) {
    const follow = doc.data();
    const followingDoc = await getDoc(doc(db, 'users', follow.followingId));
    if (followingDoc.exists()) {
      following.push({
        id: followingDoc.id,
        ...followingDoc.data()
      });
    }
  }

  return {
    items: following,
    total: following.length
  };
};

// Check if following a user
export const isFollowingUser = async (userId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error('User not authenticated');

  const followsRef = collection(db, 'follows');
  const q = query(
    followsRef,
    where('followerId', '==', currentUserId),
    where('followingId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  return {
    is_following: !snapshot.empty
  };
};