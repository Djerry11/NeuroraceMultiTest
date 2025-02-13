document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const profilePic = document.getElementById("img");

  if (user) {
    document.getElementById("userName").textContent = user.displayName;
    document.getElementById("userEmail").textContent = user.email;
    localStorage.setItem(
      "user",
      JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      })
    );

    // Set profile picture, defaulting to 'profile.jpg' if no photoURL
    const photoURL = user.photoURL ? user.photoURL : "profile.jpg";
    profilePic.innerHTML = `<img src="${photoURL}" alt="Profile Picture">`;
  } else {
    alert("No user data found. Redirecting to login.");
    window.location.href = "login.html";
  }
});

// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjbTn9DnRD-TE3K2vQX1oeOex_pnWeX38",
  authDomain: "neuroracemultitest-bc184.firebaseapp.com",
  projectId: "neuroracemultitest-bc184",
  storageBucket: "neuroracemultitest-bc184.firebasestorage.app",
  messagingSenderId: "972081204609",
  appId: "1:972081204609:web:50b715340d89e09c49ec80",
  measurementId: "G-57GBW4H6GN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("user");
      window.location.href = "../../index.html"; // Redirect to home
    })
    .catch((error) => {
      console.error("Error logging out:", error);
    });
});

document.getElementById("go-back").addEventListener("click", () => {
  window.history.back();
});
