/* =======================================================
   🛒 wanting.js — Wanting / Reorder List (Final v2.1)
   Works with: core.js, stock.js
   ======================================================= */

/* window.wanting already exists from core.js */

/* -------------------------------------------------------
   🔁 RENDER WANTING LIST
------------------------------------------------------- */
function renderWanting() {
  const tbody = document.querySelector("#wantingTable tbody");
  const typeDrop = document.querySelector("#wantType");

  if (!tbody || !typeDrop) return;

  /* ---- Fill Type Dropdown ---- */
  typeDrop.innerHTML = window.types
    .map(t => `<option value="${t.name}">${t.name}</option>`)
    .join("");

  /* ---- Render Table ---- */
  let html = "";
  window.wanting.forEach((w, i) => {
    html += `
    <tr>
      <td>${w.date}</td>
      <td>${esc(w.type)}</td>
      <td>${esc(w.name)}</td>
      <td>${esc(w.note || "")}</td>
      <td>
        <button class="want-add-btn" data-i="${i}" title="Add to Stock">➕ Add</button>
        <button class="want-del-btn" data-i="${i}" title="Delete">🗑️ Delete</button>
      </td>
    </tr>`;
  });

  if (!html)
    html = `<tr><td colspan="5">No items in Wanting</td></tr>`;

  tbody.innerHTML = html;
}

/* -------------------------------------------------------
   ➕ ADD NEW WANTING ITEM
------------------------------------------------------- */
function addWantingItem() {
  const type = document.querySelector("#wantType")?.value;
  const name = document.querySelector("#wantName")?.value.trim();
  const note = document.querySelector("#wantNote")?.value.trim();

  if (!type || !name) return alert("Please enter type & product.");

  window.wanting.push({
    id: uid("want"),
    date: todayDate(),
    type,
    name,
    note
  });

  saveWanting();
  renderWanting();

  document.querySelector("#wantName").value = "";
  document.querySelector("#wantNote").value = "";
}

/* -------------------------------------------------------
   🔥 ADD “WANTED ITEM” TO STOCK
------------------------------------------------------- */
function wantingToStock(i) {
  const w = window.wanting[i];
  if (!w) return;

  const qty = Number(prompt(`Enter quantity for "${w.name}"`));
  if (!qty || qty <= 0) return alert("Invalid quantity.");

  const cost = Number(prompt("Enter Purchase Cost ₹ for each item:"));
  if (!cost || cost <= 0) return alert("Invalid cost.");

  // Add to stock
  addStockEntry({
    date: todayDate(),
    type: w.type,
    name: w.name,
    qty,
    cost
  });

  // Remove from wanting list
  window.wanting.splice(i, 1);
  saveWanting();

  renderWanting();
  renderStock?.();
}

/* -------------------------------------------------------
   ❌ DELETE FROM WANTING
------------------------------------------------------- */
function deleteWantingItem(i) {
  if (confirm("Remove this item?")) {
    window.wanting.splice(i, 1);
    saveWanting();
    renderWanting();
  }
}

/* -------------------------------------------------------
   🖱 EVENT HANDLER
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addWantBtn")
    return addWantingItem();

  if (e.target.id === "clearWantBtn") {
    if (confirm("Clear ALL wanting items?")) {
      window.wanting = [];
      saveWanting();
      renderWanting();
    }
    return;
  }

  if (e.target.classList.contains("want-add-btn"))
    return wantingToStock(e.target.dataset.i);

  if (e.target.classList.contains("want-del-btn"))
    return deleteWantingItem(e.target.dataset.i);
});

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderWanting();
});
