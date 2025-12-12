/* ==========================================================
   🔐 security.js — ONLINE MODE (Firebase Auth)
   FINAL VERSION v10
   ----------------------------------------------------------
   ✔ Uses Firebase login state instead of localStorage
   ✔ Email auto-refresh from Firebase user
   ✔ Admin Password safe (local-only security)
   ✔ Works with new login-utils.js (online)
========================================================== */

console.log("🔐 security.js loaded (ONLINE MODE)");

/* ==========================================================
   🔵 FIREBASE USER HELPERS
========================================================== */

function getUserEmail() {
  try {
    const user = window.auth?.currentUser;
    return user?.email || "";
  } catch {
    return "";
  }
}
window.getUserEmail = getUserEmail;

function isLoggedIn() {
  try {
    return !!window.auth?.currentUser;
  } catch {
    return false;
  }
}
window.isLoggedIn = isLoggedIn;


/* ==========================================================
   🔵 LOGIN + LOGOUT (ONLINE MODE)
   (Handled in login-utils.js)
========================================================== */

function loginUser(email) {
  console.warn("⚠ loginUser() is handled by Firebase. Use login-utils.js");
  return false;
}
window.loginUser = loginUser;

function logoutUser() {
  console.warn("⚠ logoutUser() is handled by Firebase. Use login-utils.js");
  return false;
}
window.logoutUser = logoutUser;


/* ==========================================================
   🔐 ADMIN PASSWORD (Local Secure Password)
========================================================== */

const ADMIN_KEY = "ks-admin-pw";

/* Ensure Default Password Exists */
function ensureAdminPassword() {
  let pw = localStorage.getItem(ADMIN_KEY);

  if (!pw) {
    localStorage.setItem(ADMIN_KEY, "admin123"); // default
  }
}
ensureAdminPassword();

/* Update admin password */
function updateAdminPassword() {
  const oldPw = localStorage.getItem(ADMIN_KEY);
  const oldInput = prompt("Enter current admin password:");

  if (!oldInput) return;
  if (oldInput !== oldPw) {
    alert("Incorrect password!");
    return;
  }

  const newPw = prompt("Enter new admin password (min 4 chars):");
  if (!newPw || newPw.length < 4) {
    alert("Password too short!");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Admin password updated!");
}
window.updateAdminPassword = updateAdminPassword;

/* Ask password for unlocking */
function askAdminPassword() {
  const pw = prompt("Enter admin password:");
  if (!pw) return false;

  return pw === localStorage.getItem(ADMIN_KEY);
}

/* Secure Toggle UI */
function secureToggle(elementId) {
  if (!askAdminPassword()) {
    alert("Wrong password!");
    return;
  }

  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "" : "none";
}
window.secureToggle = secureToggle;

/* Unlock Profit Column */
function unlockProfitWithPassword() {
  if (askAdminPassword()) {
    window.profitLocked = false;

    if (typeof applyProfitVisibility === "function") {
      applyProfitVisibility();
    }

    alert("Profit column unlocked.");
  } else {
    alert("Incorrect password.");
  }
}
window.unlockProfitWithPassword = unlockProfitWithPassword;

/* Reset admin password */
function resetAdminPassword() {
  const cur = localStorage.getItem(ADMIN_KEY);
  const old = prompt("Enter current password:");

  if (!old) return;
  if (old !== cur) {
    alert("Incorrect password!");
    return;
  }

  const newPw = prompt("Enter new password:");
  if (!newPw || newPw.length < 4) {
    alert("Invalid new password.");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Password successfully reset.");
}
window.resetAdminPassword = resetAdminPassword;


/* ==========================================================
   🔵 EMAIL TAG UPDATE (Firebase Sync)
========================================================== */

window.updateEmailTag = function () {
  const tag = document.getElementById("emailTag");
  if (!tag) return;

  try {
    const email = getUserEmail();

    if (email) {
      tag.textContent = email;
    } else {
      tag.textContent = "Not logged in";
    }

  } catch (err) {
    console.error("updateEmailTag error:", err);
    tag.textContent = "Offline";
  }
};

/* Auto-update on:
   - Page load
   - Firebase login change
   - Storage change (rare case)
*/
window.addEventListener("load", updateEmailTag);
window.addEventListener("storage", updateEmailTag);

/* Firebase Listener */
if (window.auth) {
  window.auth.onAuthStateChanged(() => {
    updateEmailTag();
  });
}
