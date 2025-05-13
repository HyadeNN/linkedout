import { db, auth } from '../firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    arrayUnion, 
    arrayRemove, 
    query, 
    where,
    serverTimestamp,
    limit,
    orderBy
} from 'firebase/firestore';

// Pages collection reference
const pagesRef = collection(db, 'pages');

// Create a new page
export const createPage = async (pageData) => {
    try {
        const { name, description, category, coverImage } = pageData;
        const currentUser = auth.currentUser;

        const pageDoc = await addDoc(pagesRef, {
            name,
            description,
            category,
            coverImage,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            admins: [{
                uid: currentUser.uid,
                role: 'owner',
                joinedAt: serverTimestamp()
            }],
            followers: [],
            followerCount: 0,
            posts: [],
            about: '',
            website: '',
            location: '',
            contact: '',
            updatedAt: serverTimestamp()
        });

        // Add page to user's pages
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            pages: arrayUnion({
                id: pageDoc.id,
                role: 'owner'
            })
        });

        return pageDoc.id;
    } catch (error) {
        console.error('Error creating page:', error);
        throw error;
    }
};

// Get user's pages (pages they manage)
export const getUserPages = async () => {
    try {
        const currentUser = auth.currentUser;
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return [];

        const userPages = userDoc.data().pages || [];
        const pages = [];

        for (const page of userPages) {
            const pageDoc = await getDoc(doc(db, 'pages', page.id));
            if (pageDoc.exists()) {
                pages.push({
                    id: pageDoc.id,
                    ...pageDoc.data(),
                    userRole: page.role
                });
            }
        }

        return pages;
    } catch (error) {
        console.error('Error getting user pages:', error);
        throw error;
    }
};

// Get pages followed by user
export const getFollowedPages = async () => {
    try {
        const currentUser = auth.currentUser;
        const q = query(
            pagesRef,
            where('followers', 'array-contains', currentUser.uid)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting followed pages:', error);
        throw error;
    }
};

// Get suggested pages
export const getSuggestedPages = async (limitCount = 10) => {
    try {
        const currentUser = auth.currentUser;
        
        // Get pages user already follows
        const followedPages = await getFollowedPages();
        const followedIds = followedPages.map(page => page.id);

        // Query pages with most followers that user doesn't follow
        const q = query(
            pagesRef,
            orderBy('followerCount', 'desc'),
            limit(limitCount + followedIds.length) // Get extra in case some are already followed
        );

        const snapshot = await getDocs(q);
        const pages = [];

        for (const doc of snapshot.docs) {
            if (!followedIds.includes(doc.id)) {
                pages.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
            if (pages.length >= limitCount) break;
        }

        return pages;
    } catch (error) {
        console.error('Error getting suggested pages:', error);
        throw error;
    }
};

// Follow page
export const followPage = async (pageId) => {
    try {
        const currentUser = auth.currentUser;
        const pageRef = doc(db, 'pages', pageId);
        const pageDoc = await getDoc(pageRef);

        if (!pageDoc.exists()) throw new Error('Page not found');

        // Add user to page followers
        await updateDoc(pageRef, {
            followers: arrayUnion(currentUser.uid),
            followerCount: pageDoc.data().followerCount + 1
        });

        // Add page to user's followed pages
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            followedPages: arrayUnion(pageId)
        });
    } catch (error) {
        console.error('Error following page:', error);
        throw error;
    }
};

// Unfollow page
export const unfollowPage = async (pageId) => {
    try {
        const currentUser = auth.currentUser;
        const pageRef = doc(db, 'pages', pageId);
        const pageDoc = await getDoc(pageRef);

        if (!pageDoc.exists()) throw new Error('Page not found');

        // Remove user from page followers
        await updateDoc(pageRef, {
            followers: arrayRemove(currentUser.uid),
            followerCount: pageDoc.data().followerCount - 1
        });

        // Remove page from user's followed pages
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            followedPages: arrayRemove(pageId)
        });
    } catch (error) {
        console.error('Error unfollowing page:', error);
        throw error;
    }
};

// Update page
export const updatePage = async (pageId, updateData) => {
    try {
        const pageRef = doc(db, 'pages', pageId);
        await updateDoc(pageRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating page:', error);
        throw error;
    }
};

// Add page post
export const addPagePost = async (pageId, postData) => {
    try {
        const currentUser = auth.currentUser;
        const { content, media } = postData;

        // Verify user is admin of the page
        const pageRef = doc(db, 'pages', pageId);
        const pageDoc = await getDoc(pageRef);
        
        if (!pageDoc.exists()) throw new Error('Page not found');
        
        const isAdmin = pageDoc.data().admins.some(admin => admin.uid === currentUser.uid);
        if (!isAdmin) throw new Error('Not authorized to post');

        const postDoc = await addDoc(collection(db, 'posts'), {
            content,
            media,
            authorId: currentUser.uid,
            pageId,
            createdAt: serverTimestamp(),
            likes: [],
            comments: []
        });

        // Add post reference to page
        await updateDoc(pageRef, {
            posts: arrayUnion(postDoc.id)
        });

        return postDoc.id;
    } catch (error) {
        console.error('Error adding page post:', error);
        throw error;
    }
}; 