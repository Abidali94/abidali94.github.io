/* ==========================================================
   🛒 wanting.js — Wanting (Re-order) List Manager (v2.0)
   Works with: core.js, stock.js, sales.js
   Storage Key: wanting-data
   ========================================================== */

const WANT_KEY = "wanting-data";
window.wanting = JSON.parse(localStorage.getItem(WANT_KEY) || "[]");

/* ----------------------------------------------------------
   SAVE WANTING
---------------------------------------------------------- */
function saveWanting() {
  localStorage.setItem(WANT_KEY, JSON.stringify(window.wanting));
  window.dispatchEvent(new Event("storage"));
  cloudSaveDebounced("wanting", window.wanting);
}

/* ----------------------------------------------------------
   RENDER WANTING LIST
---------------------------------------------------------- */
function renderWanting() {
  const tbody = document.querySelector("#wantingTable tbody");
  if (!tbody) return;

  if (!window.wanting.length) {
    tbody.innerHTML = `<tr><td colspan="5">No items in Wanting list</td></tr>`;
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
          <button class="small-btn" data-edit="${i}">✏️</button>
          <button class="small-btn" data-del="${i}">🗑️</button>
        </td>
      </tr>
    `)
    .join("");
}

/* ----------------------------------------------------------
   MANUAL ADD WANTING
---------------------------------------------------------- */
function addWanting() {
  const type = document.getElementById("wantType")?.value.trim() || "";
  const name = document.getElementById("wantName")?.value.trim();
  const note = document.getElementById("wantNote")?.value.trim() || "";

  if (!name) return alert("Please enter product name");

  const entry = {
    id: uid("want"),
    date: todayDate(),
    type,
    name,
    note
  };

  window.wanting.push(entry);
  saveWanting();
  renderWanting();

  document.getElementById("wantName").value = "";
  document.getElementById("wantNote").value = "";
}

/* ----------------------------------------------------------
   AUTO ADD WANTING (Stock → Finished)
---------------------------------------------------------- */
function autoAddToWanting(obj) {
  if (!obj || !obj.name) return;

  // avoid duplicates
  const exists = window.wanting.find(
    w =>
      w.name.toLowerCase() === obj.name.toLowerCase() &&
      w.type === obj.type
  );

  if (exists) return;

  window.wanting.push({
    id: uid("want"),
    date: todayDate(),
    type: obj.type,
    name: obj.name,
    note: obj.note || "Auto Added (Out of Stock)"
  });

  saveWanting();
  renderWanting();
}

/* ----------------------------------------------------------
   EDIT WANTING
---------------------------------------------------------- */
function editWant(index) {
  index = Number(index);
  const item = window.wanting[index];
  if (!item) return;

  const nName = prompt("Product Name:", item.name);
  if (!nName) return;

  const nType = prompt("Type:", item.type);
  const nNote = prompt("Note:", item.note);

  window.wanting[index] = {
    id: item.id,
    date: todayDate(),
    type: nType || "",
    name: nName,
    note: nNote || ""
  };

  saveWanting();
  renderWanting();
}

/* ----------------------------------------------------------
   REMOVE WANTING
---------------------------------------------------------- */
function removeWant(index) {
  if (!confirm("Remove this item?")) return;

  window.wanting.splice(index, 1);
  saveWanting();
  renderWanting();
}

/* ----------------------------------------------------------
   CLEAR ALL
---------------------------------------------------------- */
function clearWanting() {
  if (!confirm("Clear entire wanting list?")) return;

  window.wanting = [];
  saveWanting();
  renderWanting();
}

/* ----------------------------------------------------------
   PRINT WANTING LIST
---------------------------------------------------------- */
function printWanting() {
  const rows = document.querySelector("#wantingTable tbody").innerHTML;

  const html = `
  <html>
    <head>
      <title>Wanting List</title>
      <style>
        table { width:100%; border-collapse:collapse; }
        th,td { border:1px solid #ccc; padding:6px; }
      </style>
    </head>
    <body>
      <h3>Wanting List — ${todayDate()}</h3>
      <table>
        <thead>
          <tr><th>Date</th><th>Type</th><th>Product</th><th>Note</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>
  `;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
}

/* ----------------------------------------------------------
   EVENTS
---------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addWantBtn") addWanting();
  if (e.target.id === "clearWantBtn") clearWanting();
  if (e.target.id === "printWantBtn") printWanting();

  if (e.target.dataset.del) removeWant(e.target.dataset.del);
  if (e.target.dataset.edit) editWant(e.target.dataset.edit);
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  renderWanting();
  updateTypeDropdowns?.();
});

/* ----------------------------------------------------------
   EXPORT
---------------------------------------------------------- */
window.autoAddToWanting = autoAddToWanting;
window.renderWanting = renderWanting;
