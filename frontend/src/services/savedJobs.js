import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  serverTimestamp
} from 'firebase/firestore';

// İş ilanı kaydetme
export const saveJob = async (userId, jobId) => {
  try {
    // Daha önce kaydedilmiş mi kontrol et
    const savedJobsRef = collection(db, 'savedJobs');
    const q = query(
      savedJobsRef,
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Zaten kaydedilmiş
      return { id: querySnapshot.docs[0].id, saved: true };
    }
    
    // Yeni kayıt oluştur
    const savedJobData = {
      userId,
      jobId,
      savedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'savedJobs'), savedJobData);
    return { id: docRef.id, saved: true };
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
};

// Kaydedilen iş ilanını silme
export const removeSavedJob = async (userId, jobId) => {
  try {
    // Kaydedilmiş iş ilanını bul
    const savedJobsRef = collection(db, 'savedJobs');
    const q = query(
      savedJobsRef,
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Kaydedilmiş iş bulunamadı
      return { saved: false };
    }
    
    // Kaydedilmiş işi sil
    await deleteDoc(doc(db, 'savedJobs', querySnapshot.docs[0].id));
    return { saved: false };
  } catch (error) {
    console.error('Error removing saved job:', error);
    throw error;
  }
};

// İş ilanının kaydedilmiş olup olmadığını kontrol et
export const isJobSaved = async (userId, jobId) => {
  try {
    const savedJobsRef = collection(db, 'savedJobs');
    const q = query(
      savedJobsRef,
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    return false;
  }
};

// Kullanıcının kaydettiği tüm işleri getir
export const getSavedJobs = async (userId) => {
  try {
    const savedJobsRef = collection(db, 'savedJobs');
    const q = query(
      savedJobsRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      jobId: doc.data().jobId,
      savedAt: doc.data().savedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting saved jobs:', error);
    return [];
  }
};

export default {
  saveJob,
  removeSavedJob,
  isJobSaved,
  getSavedJobs
}; 