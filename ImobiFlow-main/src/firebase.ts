// src/firebase.ts
// Conexão do app com o seu projeto Firebase.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCoJcc8X-AbYtcK85feQTJH-EgrqToYlw4",
  authDomain: "imobiflow-3784f.firebaseapp.com",
  projectId: "imobiflow-3784f",
  storageBucket: "imobiflow-3784f.firebasestorage.app",
  messagingSenderId: "608826465719",
  appId: "1:608826465719:web:8bf241c13f94613db05c32",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
