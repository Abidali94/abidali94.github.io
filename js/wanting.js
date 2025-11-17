/* =======================================================
   🛒 wanting.js — Wanting / Reorder Manager (v3.0 PRO)
   Fully compatible with: core.js v3.2, stock.js v3.0
   ======================================================= */

/* -------------------------------------------------------
   🔁 RENDER WANTING TABLE
------------------------------------------------------- */
function renderWanting() {
  const tbody = qs("#wantingTable tbody");
  const typeDD = qs("#wantType");

  if (!tbody || !typeDD) return;

  /* --- Fill Types Dropdown --- */
  typeDD.innerHTML =
    `<option value="">Select Type</option>` +
    window.types.map(t => `<option value="${t.name}">${esc(t.name)}</option>`).join("");

  /* --- Table Render --- */
  if (window.wanting.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No items in Wanting</td></tr>`;
    return;
  }

  tbody.innerHTML = window.wanting
    .map((w, i) => `
      <tr>
        <td>${w.date}</td>
        <td>${esc(w.type)}</td>
        <td>${esc(w.name)}</td>
        <td>${esc(w.note || "")}</td>
        <td>
          <button class="want-add-btn small-btn" data-i="${i}">➕ Add to Stock</button>
          <button class="want-del-btn small-btn" data-i="${i}" style="background:#e53935">🗑 Delete</button>
        </td>
      </tr>
    `).join("");
}

/* -------------------------------------------------------
   ➕ MANUAL ADD WANTING ITEM
------------------------------------------------------- */
function addWantingItem() {
  const type = qs("#wantType")?.value;
  const name = qs("#wantName")?.value.trim();
  const note = qs("#wantNote")?.value.trim();

  if (!type || !name) return alert("Please enter Type and Product name");

  window.wanting.push({
    id: uid("want"),
    date: todayDate(),
    type,
    name,
    note
  });

  saveWanting();
  renderWanting();

  qs("#wantName").value = "";
  qs("#wantNote").value = "";
}

/* -------------------------------------------------------
   🚚 ADD WANTING ITEM → STOCK
------------------------------------------------------- */
function wantingToStock(i) {
  const w = window.wanting[i];
  if (!w) return;

  const qty = Number(prompt(`Enter Qty for "${w.name}"`));
  if (!qty || qty <= 0) return alert("Invalid Quantity");

  const cost = Number(prompt("Enter Cost ₹ per item:"));
  if (!cost || cost <= 0) return alert("Invalid Cost");

  /* --- Update Stock --- */
  addStockEntry({
    date: todayDate(),
    type: w.type,
    name: w.name,
    qty,
    cost
  });

  /* --- Remove from Wanting --- */
  window.wanting.splice(i, 1);
  saveWanting();

  renderWanting();
  renderStock?.();
  refreshSaleSelectors?.();    // IMPORTANT FIX
  updateSummaryCards?.();
}

/* -------------------------------------------------------
   ❌ DELETE ITEM
------------------------------------------------------- */
function deleteWantingItem(i) {
  if (!confirm("Remove this item?")) return;

  window.wanting.splice(i, 1);
  saveWanting();
  renderWanting();
}

/* -------------------------------------------------------
   🧹 CLEAR ALL WANTING
------------------------------------------------------- */
function clearAllWanting() {
  if (!confirm("Clear ALL wanting items?")) return;

  window.wanting = [];
  saveWanting();
  renderWanting();
}

/* -------------------------------------------------------
   🖱 EVENT HANDLER
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addWantBtn") return addWantingItem();

  if (e.target.id === "clearWantBtn") return clearAllWanting();

  if (e.target.classList.contains("want-add-btn"))
    return wantingToStock(Number(e.target.dataset.i));

  if (e.target.classList.contains("want-del-btn"))
    return deleteWantingItem(Number(e.target.dataset.i));
});

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderWanting();
});
