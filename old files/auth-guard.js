// auth-guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP24BOJ0mYg7eyy87SyjA_rv-GX391XG0",
  authDomain: "pescanteen-7beb3.firebaseapp.com",
  projectId: "pescanteen-7beb3",
  storageBucket: "pescanteen-7beb3.firebasestorage.app",
  messagingSenderId: "493780029488",
  appId: "1:493780029488:web:6da48dbfaf8e37cf721df5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Store current page as redirect target
    const redirectUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `loginMain.html?redirect=${redirectUrl}`;
  }
});
