// logout.js
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    // Save current page (full URL including query params)
    const currentPage = encodeURIComponent(window.location.href);

    await signOut(auth);

    // Redirect to login with ?redirect=
    window.location.href = `login.html?redirect=${currentPage}`;
  } catch (err) {
    console.error("Logout error:", err);
    alert("Error logging out. Please try again.");
  }
});
