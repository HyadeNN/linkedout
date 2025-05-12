import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const createProject = async (userId, { title, description, imageFile }) => {
  let imageUrl = '';
  if (imageFile) {
    const imageRef = ref(storage, `projects/${userId}/${uuidv4()}-${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }
  const docRef = await addDoc(collection(db, 'projects'), {
    userId,
    title,
    description,
    imageUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getProjects = async (userId) => {
  const q = query(collection(db, 'projects'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateProject = async (projectId, { title, description, imageFile }) => {
  let updateData = { title, description, updatedAt: serverTimestamp() };
  if (imageFile) {
    // Assume userId is not changing, so we don't need it here
    const imageRef = ref(storage, `projects/${projectId}/${uuidv4()}-${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    updateData.imageUrl = await getDownloadURL(imageRef);
  }
  await updateDoc(doc(db, 'projects', projectId), updateData);
};

export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
}; 