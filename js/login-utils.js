/* ==========================================================
   login-utils.js — FINAL v10 (Ultra-Stable)
   ----------------------------------------------------------
   ✔ Uses firebase.js wrappers (fsLogin, fsSignUp, fsLogout)
   ✔ Requires firebase.js to define fsSendPasswordReset()  <-- IMPORTANT
========================================================== */

window.getFirebaseUser = function () {
  try { return firebase.auth().currentUser || null; }
  catch { return null; }
};

window.loginUser = async function (email, password) {
  try {
    if (!email || !password) throw new Error("Enter email & password");
    await window.fsLogin(email, password);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

window.signupUser = async function (email, password) {
  try {
    if (!email || !password) throw new Error("Enter email & password");
    await window.fsSignUp(email, password);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

window.resetPassword = async function (email) {
  try {
    if (!email) throw new Error("Email required");
    await window.fsSendPasswordReset(email); // MUST exist in firebase.js
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

window.logoutUser = async function () {
  try {
    await window.fsLogout();
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

window.isLoggedIn = function () {
  try { return !!firebase.auth().currentUser; }
  catch { return false; }
};

firebase.auth().onAuthStateChanged(user => {
  try { updateEmailTag?.(); } catch {}
});
