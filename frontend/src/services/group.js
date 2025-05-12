import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

// Get all groups
export const getGroups = async () => {
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get groups joined by current user
export const getUserGroups = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userGroupsRef = collection(db, 'userGroups');
  const q = query(userGroupsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Join a group
export const joinGroup = async (groupId) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userGroupsRef = collection(db, 'userGroups');
  await addDoc(userGroupsRef, { userId, groupId });
};

// Leave a group
export const leaveGroup = async (userGroupId) => {
  const userGroupRef = doc(db, 'userGroups', userGroupId);
  await deleteDoc(userGroupRef);
};

// Create a new group
export const createGroup = async (groupData) => {
  const groupsRef = collection(db, 'groups');
  const docRef = await addDoc(groupsRef, groupData);
  return { id: docRef.id, ...groupData };
}; 