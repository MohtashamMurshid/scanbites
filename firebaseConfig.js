// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCu8QUzsCZZlset96JHj8aBrnpqGmJHjlM",
  authDomain: "scanbite-4930a.firebaseapp.com",
  projectId: "scanbite-4930a",
  storageBucket: "scanbite-4930a.firebasestorage.app",
  messagingSenderId: "813659889736",
  appId: "1:813659889736:web:6875e7178d192a741b387d",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
