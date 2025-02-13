// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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
const db = getFirestore(app); // Initialize Firestore

const googleSignInButton = document.getElementById("loginButton");

// googleSignInButton.addEventListener("click", async () => {
//   window.location.href = "./home/index.html";
// });

googleSignInButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User does not exist, add to Firestore
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        singlePlayerHistory: [],
        multiPlayerHistory: [],
      });
    }

    alert(`Hello ${user.displayName}!`);

    // Save user data in local storage
    localStorage.setItem("user", JSON.stringify(user));

    // Redirect to home page
    window.location.href = "./home/home.html";
  } catch (error) {
    console.error(error);
    alert("Error during sign-in!");
  }
});
