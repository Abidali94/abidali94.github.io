// firebase.js - Cloud Sync Layer (NON-MODULE VERSION)

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase connected (compat) ✔️");

// Cloud Save
window.cloudSave = async function (collectionName, data) {
  try {
    const userId = localStorage.getItem("userId") || "owner";
    await db.collection(collectionName).doc(userId).set(data, { merge: true });
    console.log("Saved to cloud →", collectionName);
  } catch (e) {
    console.error("CloudSave ERROR:", e);
  }
};

// Cloud Load
window.cloudLoad = async function (collectionName) {
  try {
    const userId = localStorage.getItem("userId") || "owner";
    const snap = await db.collection(collectionName).doc(userId).get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    console.error("CloudLoad ERROR:", e);
    return null;
  }
};
