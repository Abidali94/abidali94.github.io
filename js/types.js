/* ======================================================
   🗂 types.js — Product Type Manager (FINAL ONLINE v11)
   • Pure Option-B Architecture (Cloud Master + Local Cache)
   • Cloud always overwrites local → same data on all devices
   • race-condition fixes added
====================================================== */

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // Prevent duplicate
  if ((window.types || []).some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return alert("Type already exists!");
  }

  // Add new type
  window.types.push({
    id: uid("type"),
    name
  });

  // Save → local cache + cloud push
  window.saveTypes?.();

  // UI refresh immediately
  renderTypes();
  updateTypeDropdowns();

  // 🔥 Ensure UI sync after cloudPull (race-condition fix)
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 180);

  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete ALL types?")) return;

  window.types = [];
  window.saveTypes?.();

  renderTypes();
  updateTypeDropdowns();

  // Extra cloud-sync UI correction
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 200);
}

/* ------------------------------------------------------
   📋 RENDER TYPES
------------------------------------------------------ */
function renderTypes() {
  const list = document.getElementById("typeList");
  if (!list) return;

  const types = window.types || [];

  if (!types.length) {
    list.innerHTML = "<li>No types added.</li>";
    return;
  }

  list.innerHTML = types
    .map(t => `<li>${esc(t.name)}</li>`)
    .join("");
}

/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS
------------------------------------------------------ */
function updateTypeDropdowns() {
  const types = window.types || [];

  const addStockType = document.getElementById("ptype");
  const filterStock  = document.getElementById("filterType");
  const saleType     = document.getElementById("saleType");
  const wantType     = document.getElementById("wantType");

  const options = types
    .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
    .join("");

  if (addStockType)
    addStockType.innerHTML =
      `<option value="">Select</option>` + options;

  if (filterStock)
    filterStock.innerHTML =
      `<option value="all">All Types</option>` + options;

  if (saleType)
    saleType.innerHTML =
      `<option value="all">All Types</option>` + options;

  if (wantType)
    wantType.innerHTML =
      `<option value="">Select Type</option>` + options;
}

/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target.id === "addTypeBtn") addType();
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT (After cloudPull)
------------------------------------------------------ */
window.addEventListener("load", () => {
  renderTypes();
  updateTypeDropdowns();

  // 🔥 Guaranteed sync after online cloud load
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 250);
});
