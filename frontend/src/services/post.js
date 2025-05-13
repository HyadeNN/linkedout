import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc, limit, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Create a post
export const createPost = async (userId, { content, image, hashtags = [] }) => {
  try {
    let imageUrl = '';
    if (image) {
      const imageRef = ref(storage, `posts/${userId}/${uuidv4()}-${image.name}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

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
    return {
      id: docRef.id,
      ...postData,
      user: {
        id: userId,
        name: userData?.name || '',
        headline: userData?.headline || '',
        location: userData?.location || '',
        bio: userData?.bio || '',
        profile: {
          about: userData?.profile?.about || '',
          profile_image: userData?.profile?.profile_image || '',
          cover_image: userData?.profile?.cover_image || ''
        },
        activity: userData?.activity || [],
        education: userData?.education || [],
        experience: userData?.experience || [],
        interest: userData?.interest || [],
        skill: userData?.skill || []
      }
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
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

// Get feed posts with user data
export const getFeedPosts = async () => {
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    // Get posts with user data
    const postsWithUserData = await Promise.all(
      snapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        const userData = userDoc.data();
        
        return {
          id: postDoc.id,
          ...postData,
          user: {
            id: postData.userId,
            name: userData?.name || '',
            headline: userData?.headline || '',
            location: userData?.location || '',
            bio: userData?.bio || '',
            profile: {
              about: userData?.profile?.about || '',
              profile_image: userData?.profile?.profile_image || '',
              cover_image: userData?.profile?.cover_image || ''
            },
            activity: userData?.activity || [],
            education: userData?.education || [],
            experience: userData?.experience || [],
            interest: userData?.interest || [],
            skill: userData?.skill || []
          },
          createdAt: postData.createdAt?.toDate()
        };
      })
    );

    return postsWithUserData;
  } catch (error) {
    console.error('Error getting feed posts:', error);
    throw error;
  }
};

// Get user posts with user data
export const getUserPosts = async (userId) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    // Get user data once since all posts are from same user
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      user: {
        id: userId,
        name: userData?.name || '',
        headline: userData?.headline || '',
        location: userData?.location || '',
        bio: userData?.bio || '',
        profile: {
          about: userData?.profile?.about || '',
          profile_image: userData?.profile?.profile_image || '',
          cover_image: userData?.profile?.cover_image || ''
        },
        activity: userData?.activity || [],
        education: userData?.education || [],
        experience: userData?.experience || [],
        interest: userData?.interest || [],
        skill: userData?.skill || []
      },
      createdAt: doc.data().createdAt?.toDate()
    }));

    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
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

// Get posts with filters and user data
export const getPosts = async (filters = {}) => {
  try {
    let postsQuery = collection(db, 'posts');
    
    if (filters.hashtag) {
      postsQuery = query(
        postsQuery,
        where('hashtags', 'array-contains', filters.hashtag),
        orderBy('createdAt', 'desc')
      );
    } else {
      postsQuery = query(postsQuery, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(postsQuery);
    
    // Get posts with user data
    const postsWithUserData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const postData = doc.data();
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        const userData = userDoc.data();
        
        return {
          id: doc.id,
          ...postData,
          user: {
            id: postData.userId,
            name: userData?.name || '',
            headline: userData?.headline || '',
            location: userData?.location || '',
            bio: userData?.bio || '',
            profile: {
              about: userData?.profile?.about || '',
              profile_image: userData?.profile?.profile_image || '',
              cover_image: userData?.profile?.cover_image || ''
            },
            activity: userData?.activity || [],
            education: userData?.education || [],
            experience: userData?.experience || [],
            interest: userData?.interest || [],
            skill: userData?.skill || []
          },
          createdAt: postData.createdAt?.toDate()
        };
      })
    );

    return postsWithUserData;
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

// Like a post
export const likePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'likes', `${postId}_${userId}`);
  
  await addDoc(collection(db, 'likes'), {
    postId,
    userId,
    createdAt: serverTimestamp()
  });
  
  await updateDoc(postRef, {
    likes_count: increment(1)
  });
};

// Unlike a post
export const unlikePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  const likesRef = collection(db, 'likes');
  const q = query(likesRef, 
    where('postId', '==', postId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await deleteDoc(doc(db, 'likes', snapshot.docs[0].id));
    await updateDoc(postRef, {
      likes_count: increment(-1)
    });
  }
};

// Check if a post is liked by the current user
export const isPostLiked = async (postId, userId) => {
  if (!userId) return false;
  
  const likesRef = collection(db, 'likes');
  const q = query(likesRef,
    where('postId', '==', postId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Get post likes count
export const getPostLikesCount = async (postId) => {
  const likesRef = collection(db, 'likes');
  const q = query(likesRef, where('postId', '==', postId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Get trending hashtags
export const getTrendingHashtags = async () => {
  const hashtagsRef = collection(db, 'hashtags');
  const q = query(hashtagsRef, orderBy('count', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().name);
};

// Follow a hashtag
export const followHashtag = async (userId, hashtag) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    followedHashtags: arrayUnion(hashtag)
  });
};

// Unfollow a hashtag
export const unfollowHashtag = async (userId, hashtag) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    followedHashtags: arrayRemove(hashtag)
  });
};

// Get followed hashtags for a user
export const getFollowedHashtags = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().followedHashtags || [] : [];
};