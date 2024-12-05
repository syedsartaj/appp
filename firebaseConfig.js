// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCkhIvALBFua8jOQ0v5h1spIF3UCMPYPCc',
  authDomain: 'tablet-70927.firebaseapp.com',
  projectId: 'tablet-70927',
  storageBucket: 'tablet-70927.appspot.com',
  messagingSenderId: '1083416805795',
  appId: '1:1083416805795:android:8ba9f556d79e2ed67a5a16',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Realtime Database
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { db, rtdb };
