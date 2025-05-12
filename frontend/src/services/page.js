import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

// Get all pages
export const getPages = async () => {
  const pagesRef = collection(db, 'pages');
  const snapshot = await getDocs(pagesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get pages followed by current user
export const getFollowedPages = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userPagesRef = collection(db, 'userPages');
  const q = query(userPagesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Follow a page
export const followPage = async (pageId) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  const userPagesRef = collection(db, 'userPages');
  await addDoc(userPagesRef, { userId, pageId });
};

// Unfollow a page
export const unfollowPage = async (userPageId) => {
  const userPageRef = doc(db, 'userPages', userPageId);
  await deleteDoc(userPageRef);
};

// Create a new page
export const createPage = async (pageData) => {
  const pagesRef = collection(db, 'pages');
  const docRef = await addDoc(pagesRef, pageData);
  return { id: docRef.id, ...pageData };
}; 