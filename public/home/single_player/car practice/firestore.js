import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
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

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addRaceHistory(data) {
  //   console.log("addRaceHistory", data);
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
