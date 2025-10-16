import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase config
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjR5TwLtj4t34quTRscFYAvmulgP39x8I",
  authDomain: "progres-e78f1.firebaseapp.com",
  projectId: "progres-e78f1",
  storageBucket: "progres-e78f1.firebasestorage.app",
  messagingSenderId: "713817509365",
  appId: "1:713817509365:web:3301e31c414c098031e4bc",
  measurementId: "G-E1LG9F1L7K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;