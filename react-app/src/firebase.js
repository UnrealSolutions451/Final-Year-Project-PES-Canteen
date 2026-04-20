import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQFOv3uq9uviBQOjJAdgSni1uyikGPgbo",
  authDomain: "pes-canteen.firebaseapp.com",
  projectId: "pes-canteen",
  storageBucket: "pes-canteen.firebasestorage.app",
  messagingSenderId: "398702472399",
  appId: "1:398702472399:web:626587a3b358bd55075bba",
  measurementId: "G-LL28HG6PDB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Auto sign in anonymously for customers
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth)
      .then(() => console.log("Signed in anonymously"))
      .catch(err => console.error("Auth error:", err));
  }
});
