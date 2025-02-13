import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  uploadSinglePlayerRaceData,
  uploadMultiplayerRaceData,
} from "../../firebaseFunctions.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
// Firebase configuration
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
const db = getFirestore(app);

// DOM Elements
const userNameElement = document.getElementById("userName");
const userEmailElement = document.getElementById("userEmail");
const singlePlayerHistoryElement = document.getElementById(
  "singlePlayerHistory"
);
const multiPlayerHistoryElement = document.getElementById("multiPlayerHistory");
const profilePicElement = document.getElementById("img");

// Fetch and Display User Profile
async function fetchUserProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return console.log("User not logged in.");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    userNameElement.textContent = userData.name || "Unknown";
    userEmailElement.textContent = user.email || "No Email";
    profilePicElement.style.backgroundImage = `url(${
      userData.profilePic || "../../images/raceprofile.png"
    })`;

    displayRaceHistory(
      userData.singlePlayerHistory || [],
      singlePlayerHistoryElement
    );
    displayMultiRaceHistory(
      userData.multiPlayerHistory || [],
      multiPlayerHistoryElement
    );
  } else {
    console.log("No profile data found.");
  }
}

// Display Race History
function displayMultiRaceHistory(history, listElement) {
  listElement.innerHTML =
    history.length > 0
      ? history
          .sort((a, b) => a.time - b.time)
          .map(
            (entry) =>
              `<li class="race-history-item">
                <div class="history-info">
                  <span class="opponent">👤 ${entry.opponent}</span> 
                  <span class="result ${entry.result.toLowerCase()}">
                    ${entry.result.toLowerCase() === "win" ? "🏁" : "❌"} ${
                entry.result
              }
                  </span>
                </div>
                <div class="history-time">
                  <span>⏱ ${entry.time.toFixed(2)}s</span>
                </div>
              </li>`
          )
          .join("")
      : "<li class='no-history'>No race history available.</li>";
}

function displayRaceHistory(history, listElement) {
  listElement.innerHTML =
    history.length > 0
      ? history
          .sort((a, b) => a.time - b.time)
          .map(
            (entry) =>
              `<li class="race-history-item">
                <div class="history-info">
                  <span class="time">⏱ ${entry.time.toFixed(2)}s</span>
                </div>
                <div class="history-collisions">
                  <span>🚧 ${entry.collisions} collisions</span>
                </div>
              </li>`
          )
          .join("")
      : "<li class='no-history'>No race history available.</li>";
}

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  // await uploadMultiplayerRaceData({
  //   opponent: "Mike",
  //   time: 34,
  //   result: "Win",
  // });
  localStorage.removeItem("user");
  window.location.href = "../../index.html";
});

// Go Back
document
  .getElementById("go-back")
  .addEventListener("click", () => (window.location.href = "../home.html"));

fetchUserProfile();
