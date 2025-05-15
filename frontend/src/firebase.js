// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgpVm6VtXMjN_n1ZwuGJTL79w8AapKFmQ",
  authDomain: "linkedincopy-3423b.firebaseapp.com",
  projectId: "linkedincopy-3423b",
  storageBucket: "linkedincopy-3423b.appspot.com",
  messagingSenderId: "607139497223",
  appId: "1:607139497223:web:653cb9474dd9c68df3f1a2",
  measurementId: "G-1FZELZ39F4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, storage, googleProvider };