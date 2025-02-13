import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  updateDoc,
  doc,
  arrayUnion,
  onSnapshot,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
export { arrayUnion, doc, getDoc, updateDoc, getFirestore, initializeApp };
// // Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyAjbTn9DnRD-TE3K2vQX1oeOex_pnWeX38",
  authDomain: "neuroracemultitest-bc184.firebaseapp.com",
  projectId: "neuroracemultitest-bc184",
  storageBucket: "neuroracemultitest-bc184.firebasestorage.app",
  messagingSenderId: "972081204609",
  appId: "1:972081204609:web:50b715340d89e09c49ec80",
  measurementId: "G-57GBW4H6GN",
};

// // 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function addRaceHistory(data) {
  //   //   console.log("addRaceHistory", data);
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const history = userSnap.data().singlePlayerHistory;
      history.push(data);
      await updateDoc(userRef, { singlePlayerHistory: history });
    }
  } catch (error) {
    console.log(error);
  }
}

// /*
//  * New Functions to Upload Race Data Separately
//  */

// // Function to upload a new single player race result
// Expected raceData: { time: number, collisions: number }
export async function uploadSinglePlayerRaceData(raceData) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    console.error("User not logged in.");
    return;
  }
  const userRef = doc(db, "users", user.uid);
  try {
    await updateDoc(userRef, {
      singlePlayerHistory: arrayUnion(raceData),
    });
    console.log("Single player race data uploaded successfully!");
  } catch (error) {
    console.error("Error uploading single player race data:", error);
  }
}

// // Function to upload a new multiplayer race result
// // Expected raceData: { opponent: string, time: number, result: string }
export async function uploadMultiplayerRaceData(raceData) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    console.error("User not logged in.");
    return;
  }
  const userRef = doc(db, "users", user.uid);
  try {
    await updateDoc(userRef, {
      multiPlayerHistory: arrayUnion(raceData),
    });
    console.log("Multiplayer race data uploaded successfully!");
  } catch (error) {
    console.error("Error uploading multiplayer race data:", error);
  }
}

/* --- End of New Upload Functions --- */
/*
Example usage:

// Upload a single player race result:
uploadSinglePlayerRace({ time: 85.23, collisions: 2 });

// Upload a multiplayer race result:
uploadMultiplayerRace({ opponent: "Alice", time: 92.45, result: "Win" });
*/
