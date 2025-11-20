/* ===========================================================
   firebase.js — FINAL CLOUD SYNC (ARRAY SAFE VERSION)
   ✔ Works with Firebase v9 compat
   ✔ Email Login + Cloud Sync
   ✔ Arrays auto-wrapped (No Firestore errors)
   ✔ Debounced Cloud Save
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

// --------------------------------------------------
// Firebase Config
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

// --------------------------------------------------
// Initialize Firebase (Compat Mode)
// --------------------------------------------------
let db = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");
} 
catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}



// --------------------------------------------------
// Helper: Cloud User Email (Used as Document ID)
// --------------------------------------------------
function getCloudUser() {
  const email = localStorage.getItem("ks-user-email");
  return email ? email : "guest-user";   // fallback
}



// --------------------------------------------------
// CLOUD SAVE (Array → Object Wrapper)
// --------------------------------------------------
window.cloudSave = async function (collectionName, data) {
  if (!db) return console.error("❌ Firestore unavailable");

  try {
    const userId = getCloudUser();

    // Firestore cannot store arrays directly at root
    // So we wrap inside { items: [...] }
    const payload =
      Array.isArray(data)
        ? { items: data, updatedAt: Date.now() }
        : data;

    await db.collection(collectionName)
            .doc(userId)
            .set(payload, { merge: true });

    console.log(`☁️ Cloud Save OK → [${collectionName}] for ${userId}`);
  } 
  catch (e) {
    console.error("❌ Cloud Save Error:", e);
  }
};



// --------------------------------------------------
// CLOUD LOAD (Return Clean Array)
// --------------------------------------------------
window.cloudLoad = async function (collectionName) {
  if (!db) return console.error("❌ Firestore unavailable");

  try {
    const userId = getCloudUser();

    const snap = await db.collection(collectionName)
                         .doc(userId)
                         .get();

    if (!snap.exists) {
      console.warn(`⚠️ No cloud data found for "${collectionName}"`);
      return null;
    }

    console.log(`☁️ Cloud Load OK → [${collectionName}] for ${userId}`);

    const data = snap.data();

    // If wrapped → return array inside items
    if (Array.isArray(data.items)) return data.items;

    // Otherwise return object
    return data;
  } 
  catch (e) {
    console.error("❌ Cloud Load Error:", e);
    return null;
  }
};



// --------------------------------------------------
// DEBOUNCED CLOUD SAVE (prevents multiple writes)
// --------------------------------------------------
let _cloudSaveTimer = null;

window.cloudSaveDebounced = function (collection, data) {
  clearTimeout(_cloudSaveTimer);

  _cloudSaveTimer = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 500); 
};



// --------------------------------------------------
// READY
// --------------------------------------------------
console.log("%c⚙️ firebase.js ready (Cloud Sync Active)", 
            "color:#03a9f4;font-weight:bold;");
