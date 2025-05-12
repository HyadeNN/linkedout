import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

// Get all teammates (accepted)
export const getTeammates = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const teammatesRef = collection(db, 'teammates');
  const q = query(teammatesRef, where('userIds', 'array-contains', userId), where('status', '==', 'accepted'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get pending invites
export const getTeammateInvites = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const teammatesRef = collection(db, 'teammates');
  const q = query(teammatesRef, where('userIds', 'array-contains', userId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Send teammate invite
export const sendTeammateInvite = async (targetUserId) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const teammatesRef = collection(db, 'teammates');
  await addDoc(teammatesRef, { userIds: [userId, targetUserId], status: 'pending', inviter: userId });
};

// Accept teammate invite
export const acceptTeammateInvite = async (inviteId) => {
  const inviteRef = doc(db, 'teammates', inviteId);
  await updateDoc(inviteRef, { status: 'accepted' });
};

// Reject teammate invite
export const rejectTeammateInvite = async (inviteId) => {
  const inviteRef = doc(db, 'teammates', inviteId);
  await updateDoc(inviteRef, { status: 'rejected' });
};

// Remove teammate
export const removeTeammate = async (teammateId) => {
  const teammateRef = doc(db, 'teammates', teammateId);
  await deleteDoc(teammateRef);
}; 