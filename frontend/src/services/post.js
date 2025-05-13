import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Create a post
export const createPost = async (userId, { content, image, hashtags = [] }) => {
  let imageUrl = '';
  if (image) {
    const imageRef = ref(storage, `posts/${userId}/${uuidv4()}-${image.name}`);
    await uploadBytes(imageRef, image);
    imageUrl = await getDownloadURL(imageRef);
  }

  const postData = {
    userId,
    content,
    imageUrl,
    hashtags,
    createdAt: serverTimestamp(),
    likes_count: 0,
    comments_count: 0
  };

  const docRef = await addDoc(collection(db, 'posts'), postData);
  return { id: docRef.id, ...postData };
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

// Search posts and hashtags
export const searchPosts = async (searchTerm) => {
  const searchTermLower = searchTerm.toLowerCase();
  const postsQuery = query(collection(db, 'posts'));
  const querySnapshot = await getDocs(postsQuery);
  
  const results = [];
  const hashtagSet = new Set();

  querySnapshot.docs.forEach(doc => {
    const post = { id: doc.id, ...doc.data() };
    
    // Search in post content
    if (post.content.toLowerCase().includes(searchTermLower)) {
      results.push({
        type: 'post',
        id: post.id,
        content: post.content,
        author: post.author,
        created_at: post.created_at
      });
    }

    // Collect unique hashtags
    if (post.hashtags) {
      post.hashtags.forEach(hashtag => {
        if (hashtag.toLowerCase().includes(searchTermLower)) {
          hashtagSet.add(hashtag);
        }
      });
    }
  });

  // Add hashtag results
  hashtagSet.forEach(hashtag => {
    results.push({
      type: 'hashtag',
      value: hashtag
    });
  });

  return results;
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

// Get posts with hashtag filtering
export const getPosts = async (filters = {}) => {
  let postsQuery = collection(db, 'posts');
  const constraints = [];

  if (filters.hashtag) {
    constraints.push(where('hashtags', 'array-contains', filters.hashtag));
  }

  if (filters.userId) {
    constraints.push(where('userId', '==', filters.userId));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(postsQuery, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Follow a hashtag
export const followHashtag = async (userId, hashtag) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    followed_hashtags: arrayUnion(hashtag)
  });
};

// Unfollow a hashtag
export const unfollowHashtag = async (userId, hashtag) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    followed_hashtags: arrayRemove(hashtag)
  });
};

// Get user's followed hashtags
export const getFollowedHashtags = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDocs(userRef);
  return userDoc.data()?.followed_hashtags || [];
};

// Get trending hashtags
export const getTrendingHashtags = async () => {
  const postsQuery = query(collection(db, 'posts'));
  const querySnapshot = await getDocs(postsQuery);
  
  const hashtagCounts = {};
  querySnapshot.docs.forEach(doc => {
    const hashtags = doc.data().hashtags || [];
    hashtags.forEach(hashtag => {
      hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
    });
  });

  return Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([hashtag]) => hashtag);
};