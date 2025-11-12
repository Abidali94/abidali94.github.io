// firebase.js — Cloud connect + Firestore integration for KharchaSaathi
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

/* --------------------------
   🔧 Firebase Configuration
--------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

/* --------------------------
   🚀 Initialize Firebase
--------------------------- */
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");

/* --------------------------
   🧪 Test Firestore Connection
--------------------------- */
window.testCloud = async function () {
  try {
    await setDoc(doc(db, "testCollection", "firstDoc"), {
      time: new Date().toISOString(),
      msg: "Cloud Connected from KharchaSaathi"
    });
    alert("✅ Test data saved to Firestore!");
    console.log("%c✅ Firestore write successful", "color:#4caf50;font-weight:bold;");
  } catch (e) {
    console.error("❌ Error writing test data:", e);
    alert("⚠️ Error writing test data — check console.");
  }
};

/* --------------------------
   🧠 Notes:
   - This file must be loaded in index.html as:
       <script type='module' src='js/firebase.js'></script>
   - Then open browser console and run:
       testCloud()
   - You’ll see alert + Firestore entry.
--------------------------- */
