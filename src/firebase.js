import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOhhCSWVK9oJlPMmBobF0Ec2vkilmin6A",
  authDomain: "crypto-casino-cdbc8.firebaseapp.com",
  projectId: "crypto-casino-cdbc8",
  storageBucket: "crypto-casino-cdbc8.firebasestorage.app",
  messagingSenderId: "323823498658",
  appId: "1:323823498658:web:9e0428399540083bfa6efb",
  measurementId: "G-LQY59RXTKQ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
