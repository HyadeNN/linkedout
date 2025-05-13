import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// Get current user profile
export const getCurrentUserProfile = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Profile not found');
  return userSnap.data();
};

// Create or update current user profile
export const updateProfile = async (profileData) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, profileData, { merge: true });
  return profileData;
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateProfileField('profile_image', url);
  return url;
};

// Upload cover image
export const uploadCoverImage = async (file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  const storageRef = ref(storage, `users/${user.uid}/cover.jpg`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateProfileField('cover_image', url);
  return url;
};

// Helper to update a single profile field
export const updateProfileField = async (field, value) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, { profile: { [field]: value } }, { merge: true });
};

// Get user profile by user ID
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Profile not found');
  return userSnap.data().profile || {};
};

// Experience CRUD
export const addExperience = async (exp) => {
  const profile = await getCurrentUserProfile();
  const experiences = profile.experiences || [];
  exp.id = uuidv4();
  await updateProfile({ ...profile, experiences: [...experiences, exp] });
};

export const updateExperience = async (expId, updatedExp) => {
  const profile = await getCurrentUserProfile();
  const experiences = (profile.experiences || []).map(exp =>
    exp.id === expId ? { ...exp, ...updatedExp } : exp
  );
  await updateProfile({ ...profile, experiences });
};

export const deleteExperience = async (expId) => {
  const profile = await getCurrentUserProfile();
  const experiences = (profile.experiences || []).filter(exp => exp.id !== expId);
  await updateProfile({ ...profile, experiences });
};

// Education CRUD
export const addEducation = async (edu) => {
  const profile = await getCurrentUserProfile();
  const educations = profile.educations || [];
  edu.id = uuidv4();
  await updateProfile({ ...profile, educations: [...educations, edu] });
};

export const updateEducation = async (eduId, updatedEdu) => {
  const profile = await getCurrentUserProfile();
  const educations = (profile.educations || []).map(edu =>
    edu.id === eduId ? { ...edu, ...updatedEdu } : edu
  );
  await updateProfile({ ...profile, educations });
};

export const deleteEducation = async (eduId) => {
  const profile = await getCurrentUserProfile();
  const educations = (profile.educations || []).filter(edu => edu.id !== eduId);
  await updateProfile({ ...profile, educations });
};

// Skills CRUD
export const addSkill = async (skill) => {
  const profile = await getCurrentUserProfile();
  const skills = profile.skills || [];
  skill.id = uuidv4();
  await updateProfile({ ...profile, skills: [...skills, skill] });
};

export const updateSkill = async (skillId, updatedSkill) => {
  const profile = await getCurrentUserProfile();
  const skills = (profile.skills || []).map(skill =>
    skill.id === skillId ? { ...skill, ...updatedSkill } : skill
  );
  await updateProfile({ ...profile, skills });
};

export const deleteSkill = async (skillId) => {
  const profile = await getCurrentUserProfile();
  const skills = (profile.skills || []).filter(skill => skill.id !== skillId);
  await updateProfile({ ...profile, skills });
};