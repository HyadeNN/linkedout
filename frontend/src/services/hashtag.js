import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

// Get all hashtags
export const getHashtags = async () => {
  const hashtagsRef = collection(db, 'hashtags');
  const snapshot = await getDocs(hashtagsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get hashtags followed by current user
export const getFollowedHashtags = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userHashtagsRef = collection(db, 'userHashtags');
  const q = query(userHashtagsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Follow a hashtag
export const followHashtag = async (hashtagId) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userHashtagsRef = collection(db, 'userHashtags');
  await addDoc(userHashtagsRef, { userId, hashtagId });
};

// Unfollow a hashtag
export const unfollowHashtag = async (userHashtagId) => {
  const userHashtagRef = doc(db, 'userHashtags', userHashtagId);
  await deleteDoc(userHashtagRef);
};

// Create a new hashtag
export const createHashtag = async (hashtagData) => {
  const hashtagsRef = collection(db, 'hashtags');
  const docRef = await addDoc(hashtagsRef, hashtagData);
  return { id: docRef.id, ...hashtagData };
}; 