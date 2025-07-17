// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWnXTYSoiDAgWwRMDrNoiuPCVxP_LQ1Pg",
  authDomain: "citysense-a23ee.firebaseapp.com",
  projectId: "citysense-a23ee",
  storageBucket: "citysense-a23ee.firebasestorage.app",
  messagingSenderId: "221613263472",
  appId: "1:221613263472:web:c13370917e41a43c8d82b5",
  measurementId: "G-VMLBM8S9E3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase services

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;