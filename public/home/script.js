// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDSseDbK6sujAU4qVeIQjly1Cp9QQnUNXA",
//   authDomain: "cargame-106cc.firebaseapp.com",
//   projectId: "cargame-106cc",
//   storageBucket: "cargame-106cc.firebasestorage.app",
//   messagingSenderId: "832855049902",
//   appId: "1:832855049902:web:5c761de666bc475cd20f3f",
// };
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
const auth = getAuth(app); // Initialize Firebase Auth

const logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("user");
      window.location.href = "../index.html"; // Redirect to login
    })
    .catch((error) => {
      console.error("Error logging out:", error);
    });
});
document.getElementById("how-to-play").addEventListener("click", () => {
  window.location.href = "./how_to_play/index.html"; // Redirect to login
});
document.getElementById("view-profile").addEventListener("click", () => {
  window.location.href = "./view_profile/index.html";
});
document.getElementById("single-player").addEventListener("click", () => {
  window.location.href = "./single_player/carPractice/single_race.html";
});
document.getElementById("multi-player").addEventListener("click", () => {
  window.location.href = "../multiplayer/lobby.html";
});
