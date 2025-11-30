/* ===========================================================
   firebase.js — FINAL V10
   ✔ Full Auth + Firestore + Cloud Sync
   ✔ Matching login-utils.js requirements
   ✔ Includes fsLogin / fsCheckAuth / fsLogout
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
   INITIALIZE FIREBASE
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

/* -----------------------------------------------------------
   REQUIRED AUTH FUNCTIONS (FOR login-utils.js)
----------------------------------------------------------- */

// LOGIN (used by login.html)
window.fsLogin = async function (email, password) {
  if (!auth) throw "Auth not ready";
  return auth.signInWithEmailAndPassword(email, password);
};

// SIGNUP (used by signup.html)
window.fsSignUp = async function (email, password) {
  if (!auth) throw "Auth not ready";

  const cred = await auth.createUserWithEmailAndPassword(email, password);

  try {
    await cred.user.sendEmailVerification();
  } catch (_) {}

  return cred;
};

// LOGOUT
window.fsLogout = async function () {
  if (!auth) return;
  await auth.signOut();
  localStorage.removeItem("ks-user-email");
  window.dispatchEvent(new Event("storage"));
};

// PASSWORD RESET
window.fsSendPasswordReset = async function (email) {
  if (!auth) throw "Auth not ready";
  return auth.sendPasswordResetEmail(email);
};

// CHECK AUTH STATE (used by login-utils.js)
window.fsCheckAuth = function () {
  return new Promise(resolve => {
    if (!auth) return resolve(null);

    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    });
  });
};

/* -----------------------------------------------------------
   ON AUTH STATE CHANGE
----------------------------------------------------------- */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");

      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

      // Pull Firestore → Local
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) {}
      }

      window.dispatchEvent(new Event("storage"));
    } else {
      localStorage.removeItem("ks-user-email");
      console.log("%c🔓 Logged out", "color:#999");
      window.dispatchEvent(new Event("storage"));
    }
  });
}

/* -----------------------------------------------------------
   FIRESTORE HELPERS
----------------------------------------------------------- */
function getCloudUser() {
  if (auth?.currentUser?.email) return auth.currentUser.email;
  return localStorage.getItem("ks-user-email") || "guest";
}

/* SAVE */
window.cloudSave = async function (collection, data) {
  if (!db) return;

  const user = getCloudUser();

  try {
    await db.collection(collection)
            .doc(user)
            .set({ items: data }, { merge: true });

    console.log(`☁️ Saved: ${collection} → ${user}`);
  } catch (e) {
    console.error("❌ Save error:", e);
  }
};

/* LOAD */
window.cloudLoad = async function (collection) {
  if (!db) return null;

  const user = getCloudUser();

  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) return null;

    const data = snap.data();
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error("❌ Load error:", e);
    return null;
  }
};

/* -----------------------------------------------------------
   DEBOUNCED CLOUD SAVE
----------------------------------------------------------- */
let _t = {};
window.cloudSaveDebounced = function (collection, data) {
  if (_t[collection]) clearTimeout(_t[collection]);

  _t[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 500);
};

/* -----------------------------------------------------------
   READY
----------------------------------------------------------- */
console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
