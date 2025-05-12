import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Create a post
export const createPost = async (userId, { content, image }) => {
  let imageUrl = '';
  if (image) {
    const imageRef = ref(storage, `posts/${userId}/${uuidv4()}-${image.name}`);
    await uploadBytes(imageRef, image);
    imageUrl = await getDownloadURL(imageRef);
  }
  const docRef = await addDoc(collection(db, 'posts'), {
    userId,
    content,
    imageUrl,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update a post
export const updatePost = async (postId, content) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Delete a post
export const deletePost = async (postId) => {
  await deleteDoc(doc(db, 'posts', postId));
};

// Get a post by ID
export const getPost = async (postId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Get feed posts
export const getFeedPosts = async () => {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get user posts
export const getUserPosts = async (userId) => {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Search posts
export const searchPosts = async (query, page = 1, limit = 20) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Create a comment
export const createComment = async (postId, userId, content) => {
  const docRef = await addDoc(collection(db, 'comments'), {
    postId,
    userId,
    content,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Update a comment
export const updateComment = async (commentId, content) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Delete a comment
export const deleteComment = async (commentId) => {
  await deleteDoc(doc(db, 'comments', commentId));
};

// Get post comments
export const getComments = async (postId) => {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Like a post
export const likePost = async (postId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Unlike a post
export const unlikePost = async (postId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Like a comment
export const likeComment = async (commentId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Unlike a comment
export const unlikeComment = async (commentId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Get post likes
export const getPostLikes = async (postId, page = 1, limit = 50) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Get comment likes
export const getCommentLikes = async (commentId, page = 1, limit = 50) => {
  // Implementation needed
  throw new Error('Method not implemented');
};

// Check if post is liked
export const isPostLiked = async (postId) => {
  // Implementation needed
  throw new Error('Method not implemented');
};