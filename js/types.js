/* ======================================================
   🗂 types.js — Product Type Manager (FINAL ONLINE v10.0)
   • Fully compatible with ONLINE core.js (cloudSync)
   • Instant UI update + guaranteed dropdown sync
   • Prevents duplicates (same as before)
   • Clean and safe for Firestore syncing
====================================================== */

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // Prevent duplicate type names
  if ((window.types || []).find(t => t.name.toLowerCase() === name.toLowerCase())) {
    return alert("Type already exists!");
  }

  // Add new type
  window.types.push({
    id: uid("type"),
    name
  });

  // Save → LOCAL + CLOUD (handled inside saveTypes)
  if (window.saveTypes) window.saveTypes();

  // UI refresh
  renderTypes();
  updateTypeDropdowns();

  // Extra guaranteed refresh (fixes race condition after cloud sync)
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 100);

  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete ALL types?")) return;

  // Reset array
  window.types = [];

  // Save to cloud + local
  if (window.saveTypes) window.saveTypes();

  // UI refresh
  renderTypes();
  updateTypeDropdowns();

  // Extra refresh
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 120);
}

/* ------------------------------------------------------
   📋 RENDER TYPE LIST
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
   🔽 UPDATE ALL TYPE DROPDOWNS
   (Stock / Sales / Wanting)
------------------------------------------------------ */
function updateTypeDropdowns() {

  const types = window.types || [];

  const addStockType = document.getElementById("ptype");
  const filterStock  = document.getElementById("filterType");
  const saleType     = document.getElementById("saleType");
  const wantType     = document.getElementById("wantType");

  /* Stock – add stock selector */
  if (addStockType) {
    addStockType.innerHTML =
      `<option value="">Select</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* Stock filter */
  if (filterStock) {
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* Sales filter */
  if (saleType) {
    saleType.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* Wanting selector */
  if (wantType) {
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }
}

/* ------------------------------------------------------
   🖱 EVENT LISTENERS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target.id === "addTypeBtn") addType();
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT
------------------------------------------------------ */
window.addEventListener("load", () => {
  renderTypes();
  updateTypeDropdowns();

  // Extra startup sync
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 150);
});
