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

// Get user profile by id
export const getUserProfile = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) throw new Error('User profile not found');
  return { id: userDoc.id, ...userDoc.data() };
};

// Update user profile
export const updateProfile = async (profileData) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, profileData);
  
  return { id: user.uid, ...profileData };
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const storageRef = ref(storage, `profile_images/${user.uid}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    'profile.profile_image': downloadURL
  });

  return downloadURL;
};

// Upload cover image
export const uploadCoverImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const storageRef = ref(storage, `cover_images/${user.uid}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    'profile.cover_image': downloadURL
  });

  return downloadURL;
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
  getUserProfile,
  updateUserRole
};