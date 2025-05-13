import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Get current user profile
export const getCurrentUserProfile = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) throw new Error('User profile not found');
  return { id: userDoc.id, ...userDoc.data() };
};

// Update profile
export const updateProfile = async (profileData) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const currentUserData = (await getDoc(userRef)).data();

  const updateData = {
    ...currentUserData,
    name: profileData.name || currentUserData?.name,
    headline: profileData.headline || currentUserData?.headline,
    location: profileData.location || currentUserData?.location,
    bio: profileData.bio || currentUserData?.bio,
    activity: profileData.activity || currentUserData?.activity || [],
    education: profileData.education || currentUserData?.education || [],
    experience: profileData.experience || currentUserData?.experience || [],
    interest: profileData.interest || currentUserData?.interest || [],
    skill: profileData.skill || currentUserData?.skill || [],
    profile: {
      ...(currentUserData?.profile || {}),
      about: profileData.profile?.about || currentUserData?.profile?.about || '',
      profile_image: profileData.profile?.profile_image || currentUserData?.profile?.profile_image || '',
      cover_image: profileData.profile?.cover_image || currentUserData?.profile?.cover_image || ''
    }
  };

  await updateDoc(userRef, updateData);
  return updateData;
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  // Delete old profile image if exists
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const oldImageUrl = userDoc.data()?.profile?.profile_image;
    if (oldImageUrl) {
      const oldImageRef = ref(storage, oldImageUrl);
      await deleteObject(oldImageRef);
    }
  } catch (error) {
    console.log('No old profile image to delete');
  }

  // Upload new image
  const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Update profile with new image URL
  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  await updateDoc(userRef, {
    profile: {
      ...userData.profile,
      profile_image: url
    }
  });

  return url;
};

// Upload cover image
export const uploadCoverImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  // Delete old cover image if exists
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const oldImageUrl = userDoc.data()?.profile?.cover_image;
    if (oldImageUrl) {
      const oldImageRef = ref(storage, oldImageUrl);
      await deleteObject(oldImageRef);
    }
  } catch (error) {
    console.log('No old cover image to delete');
  }

  // Upload new image
  const storageRef = ref(storage, `users/${user.uid}/cover.jpg`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Update profile with new cover image URL
  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  await updateDoc(userRef, {
    profile: {
      ...userData.profile,
      cover_image: url
    }
  });

  return url;
};

// Add activity
export const addActivity = async (activity) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  const activities = userData.activity || [];

  const newActivity = {
    ...activity,
    id: Date.now().toString()
  };

  await updateDoc(userRef, {
    activity: [...activities, newActivity]
  });

  return newActivity;
};

// Add education
export const addEducation = async (education) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  const educations = userData.education || [];

  const newEducation = {
    ...education,
    id: Date.now().toString()
  };

  await updateDoc(userRef, {
    education: [...educations, newEducation]
  });

  return newEducation;
};

// Add experience
export const addExperience = async (experience) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  const experiences = userData.experience || [];

  const newExperience = {
    ...experience,
    id: Date.now().toString()
  };

  await updateDoc(userRef, {
    experience: [...experiences, newExperience]
  });

  return newExperience;
};

// Add interest
export const addInterest = async (interest) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  const interests = userData.interest || [];

  const newInterest = {
    ...interest,
    id: Date.now().toString()
  };

  await updateDoc(userRef, {
    interest: [...interests, newInterest]
  });

  return newInterest;
};

// Add skill
export const addSkill = async (skill) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  const userData = (await getDoc(userRef)).data();
  const skills = userData.skill || [];

  const newSkill = {
    ...skill,
    id: Date.now().toString()
  };

  await updateDoc(userRef, {
    skill: [...skills, newSkill]
  });

  return newSkill;
};

// Get user profile by ID
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Profile not found');
  return userSnap.data();
};

export const profileService = {
  getCurrentUserProfile,
  updateProfile,
  uploadProfileImage,
  uploadCoverImage,
  addActivity,
  addEducation,
  addExperience,
  addInterest,
  addSkill,
  getUserProfile
};