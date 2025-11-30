/* ===========================================================
   firebase.js — FINAL V11 (ONLINE ONLY + INSTANT CLOUD SYNC)
   ✔ FASTEST Auth + Firestore
   ✔ Instant Cloud Pull After Any Save
   ✔ No Offline Mode Confusion
   ✔ 1-second UI Sync (NO refresh needed)
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   FIREBASE CONFIG
----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.firebasestorage.app",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a99d933849f4c9482",
  measurementId: "G-7E1V1NLYTR"
};

/* -----------------------------------------------------------
   INITIALIZE
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

/* ===========================================================
   AUTH FUNCTIONS (Used by login-utils.js)
=========================================================== */

window.fsLogin = async function (email, password) {
  return auth.signInWithEmailAndPassword(email, password);
};

window.fsSignUp = async function (email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try { await cred.user.sendEmailVerification(); } catch (_) {}
  return cred;
};

window.fsLogout = async function () {
  await auth.signOut();
  localStorage.removeItem("ks-user-email");
  window.dispatchEvent(new Event("storage"));
};

window.fsSendPasswordReset = async function (email) {
  return auth.sendPasswordResetEmail(email);
};

window.fsCheckAuth = function () {
  return new Promise(resolve => {
    const off = auth.onAuthStateChanged(u => {
      off();
      resolve(u);
    });
  });
};

/* -----------------------------------------------------------
   AUTH LISTENER — ALWAYS ONLINE MODE
----------------------------------------------------------- */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");
      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

      // Always pull fresh live cloud data instantly
      if (typeof cloudPullAllIfAvailable === "function") {
        await cloudPullAllIfAvailable();
      }

      window.dispatchEvent(new Event("storage"));
    } else {
      localStorage.removeItem("ks-user-email");
      console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");
      window.dispatchEvent(new Event("storage"));
    }
  });
}

/* ===========================================================
   FIRESTORE HELPERS — INSTANT CLOUD MODE
=========================================================== */

function getCloudUser() {
  if (auth?.currentUser?.email) return auth.currentUser.email;
  return localStorage.getItem("ks-user-email") || "guest";
}

/* ----------- CLOUD SAVE (Instant + Push UI) ----------- */
window.cloudSave = async function (collection, data) {
  if (!db) return;

  const user = getCloudUser();
  try {
    await db.collection(collection)
            .doc(user)
            .set({ items: data }, { merge: true });

    console.log(`☁️ Saved: ${collection} → ${user}`);

    // ⭐ Instant cloud → UI sync
    setTimeout(() => {
      if (typeof window.cloudPullAllIfAvailable === "function") {
        window.cloudPullAllIfAvailable();
      }
    }, 200);

  } catch (e) {
    console.error("❌ Cloud Save error:", e);
  }
};

/* ----------- CLOUD LOAD ----------- */
window.cloudLoad = async function (collection) {
  if (!db) return null;

  const user = getCloudUser();

  try {
    const snap = await db.collection(collection).document(user).get();

    if (!snap.exists) return [];

    const data = snap.data();
    return Array.isArray(data.items) ? data.items : [];

  } catch (e) {
    console.error("❌ Cloud Load error:", e);
    return [];
  }
};

/* ===========================================================
   DEBOUNCED SAVE (smooth UI)
=========================================================== */
let _delay = {};
window.cloudSaveDebounced = function (collection, data) {
  if (_delay[collection]) clearTimeout(_delay[collection]);

  _delay[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 300); // very fast
};

/* -----------------------------------------------------------
   READY
----------------------------------------------------------- */
console.log("%c⚙️ firebase.js READY ✔ (ONLINE MODE)", "color:#03a9f4;font-weight:bold;");
