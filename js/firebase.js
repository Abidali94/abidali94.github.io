/* ===========================================================
   firebase.js — FINAL V16 (COMPAT + LOGIN GUARD + SAFE LOAD)
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   PREVENT DOUBLE LOAD (SAFE VERSION)
----------------------------------------------------------- */
if (window.__firebase_loaded) {
  console.warn("⚠️ firebase.js loaded twice — skipping second load.");
  throw new Error("Duplicate firebase.js load stopped.");
}
window.__firebase_loaded = true;

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
   INITIALIZE (NO ERROR STOP)
----------------------------------------------------------- */
let auth = null;
let db = null;

try {
  firebase.initializeApp(firebaseConfig);

  auth = firebase.auth();
  db = firebase.firestore();

  console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

window.auth = auth;
window.db = db;

/* -----------------------------------------------------------
   PATH HELPERS
----------------------------------------------------------- */
function currentPath() {
  return location.pathname.replace(/\/+$/, "");
}

const PROTECTED = ["/tools/business-dashboard.html"];
const AUTH_PAGES = ["/login.html", "/signup.html", "/reset.html"];

/* -----------------------------------------------------------
   EMAIL HELPER
----------------------------------------------------------- */
function setLocalEmail(e) {
  try { localStorage.setItem("ks-user-email", e); } catch {}
}
function clearLocalEmail() {
  try { localStorage.removeItem("ks-user-email"); } catch {}
}

/* ===========================================================
   AUTH FUNCTIONS (EXPOSED)
=========================================================== */

window.fsLogin = async function (email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.signInWithEmailAndPassword(email, password);
  setLocalEmail(cred.user.email);
  return cred;
};

window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  setLocalEmail(cred.user.email);
  return cred;
};

window.fsSendPasswordReset = email => auth.sendPasswordResetEmail(email);

window.fsLogout = async function () {
  try { await auth.signOut(); } catch(e) {}
  clearLocalEmail();
  location.href = "/login.html";
};

/* -----------------------------------------------------------
   AUTH LISTENER (GUARD)
----------------------------------------------------------- */
auth.onAuthStateChanged(async user => {
  const path = currentPath();

  if (user) {
    setLocalEmail(user.email);

    console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

    if (typeof cloudPullAllIfAvailable === "function") {
      try { await cloudPullAllIfAvailable(); } catch{}
    }

    if (AUTH_PAGES.some(p => path.endsWith(p))) {
      location.replace("/tools/business-dashboard.html");
    }
  } else {
    clearLocalEmail();
    console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");

    if (PROTECTED.some(p => path.endsWith(p))) {
      location.replace("/login.html");
    }
  }
});

/* ===========================================================
   FIRESTORE HELPERS
=========================================================== */

function getCloudUser() {
  return auth.currentUser?.email || localStorage.getItem("ks-user-email");
}

window.cloudSave = async function (collection, data) {
  const user = getCloudUser();
  if (!user) return;

  try {
    await db.collection(collection).doc(user).set({ items: data }, { merge: true });
    console.log("☁️ Saved:", collection);
  } catch (e) {
    console.error("❌ Cloud Save error:", e);
  }
};

window.cloudLoad = async function (collection) {
  const user = getCloudUser();
  if (!user) return [];

  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) return [];
    return snap.data().items || [];
  } catch (e) {
    console.error("❌ Cloud Load error:", e);
    return [];
  }
};

console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
