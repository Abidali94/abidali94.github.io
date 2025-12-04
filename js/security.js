/* ==========================================================
   🔐 security.js — FINAL v12 (Firebase-Safe + Bug-Free)
   ----------------------------------------------------------
   ✔ No fake login system (uses Firebase only)
   ✔ Admin password system (local + secure usage)
   ✔ Profit Lock controls only
   ✔ Email Tag reads from Firebase user (correct source)
========================================================== */

/* ==========================================================
   🔵 EMAIL TAG (Correct Firebase Source)
========================================================== */
window.updateEmailTag = function () {
  const tag = document.getElementById("emailTag");
  if (!tag) return;

  try {
    const fbUser = firebase.auth().currentUser;
    const email = fbUser?.email || localStorage.getItem("ks-user-email");

    tag.textContent = email || "Offline Mode";

  } catch (err) {
    console.error("updateEmailTag error:", err);
    tag.textContent = "Offline";
  }
};

window.addEventListener("load", updateEmailTag);


/* ==========================================================
   🔐 ADMIN PASSWORD SYSTEM (Local secure area)
========================================================== */

const ADMIN_KEY = "ks-admin-pw";

/* Create default password if not existing */
(function ensureAdminPassword() {
  if (!localStorage.getItem(ADMIN_KEY)) {
    localStorage.setItem(ADMIN_KEY, "admin123");
  }
})();

/* Validate admin password */
function askAdminPassword() {
  const pw = prompt("Enter admin password:");
  if (!pw) return false;

  return pw === localStorage.getItem(ADMIN_KEY);
}

/* Change admin password */
window.updateAdminPassword = function () {
  const oldPw = localStorage.getItem(ADMIN_KEY);
  const oldInput = prompt("Enter current admin password:");

  if (!oldInput) return;
  if (oldInput !== oldPw) {
    return alert("Incorrect password!");
  }

  const newPw = prompt("Enter new password (min 4 chars):");
  if (!newPw || newPw.length < 4) {
    return alert("Password too short!");
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Admin password updated!");
};

/* Unlock profit column */
window.unlockProfitWithPassword = function () {
  if (askAdminPassword()) {
    window.profitLocked = false;

    if (typeof applyProfitVisibility === "function") {
      applyProfitVisibility();
    }

    alert("Profit unlocked!");
  } else {
    alert("Incorrect password!");
  }
};

/* Secure show/hide any element */
window.secureToggle = function (id) {
  if (!askAdminPassword()) {
    return alert("Wrong password!");
  }

  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "" : "none";
};

/* Reset admin password */
window.resetAdminPassword = function () {
  const current = localStorage.getItem(ADMIN_KEY);
  const old = prompt("Enter current password:");

  if (!old) return;
  if (old !== current) return alert("Incorrect password!");

  const newPw = prompt("Enter new password:");
  if (!newPw || newPw.length < 4) {
    return alert("Invalid password!");
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Password reset successful.");
};


console.log("🔐 security.js (v12) loaded — Firebase Safe");
