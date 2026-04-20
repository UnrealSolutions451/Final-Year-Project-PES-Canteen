// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP24BOJ0mYg7eyy87SyjA_rv-GX391XG0",
  authDomain: "pescanteen-7beb3.firebaseapp.com",
  projectId: "pescanteen-7beb3",
  storageBucket: "pescanteen-7beb3.firebasestorage.app",
  messagingSenderId: "493780029488",
  appId: "1:493780029488:web:6da48dbfaf8e37cf721df5"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth
const auth = getAuth(app);

// Auto sign in anonymously
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Signed in anonymously with UID:", user.uid);
  } else {
    signInAnonymously(auth)
      .then(() => console.log("🔑 Signed in anonymously"))
      .catch(err => console.error("Auth error:", err));
  }
});

export { auth };
