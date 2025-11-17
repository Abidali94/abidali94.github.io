/* ==========================================================
   🛒 wanting.js — Wanting (Re-order) List Manager (v2)
   Works with: core.js (autoAddWanting, addStockEntry), stock.js
   ========================================================== */

/* window.wanting loaded from core.js */

function renderWanting() {
  const tbody = document.querySelector('#wantingTable tbody');
  if (!tbody) return;

  if (!window.wanting || !window.wanting.length) {
    tbody.innerHTML = `<tr><td colspan="5">No items in Wanting list</td></tr>`;
    return;
  }

  tbody.innerHTML = window.wanting
    .map((w, i) => `
      <tr data-i="${i}">
        <td>${esc(w.date)}</td>
        <td>${esc(w.type || '')}</td>
        <td style="text-align:left">${esc(w.name)}</td>
        <td>${esc(w.note || '')}</td>
        <td>
          <button class="want-to-stock small-btn" data-i="${i}">➕ Add to Stock</button>
          <button class="want-edit small-btn" data-i="${i}">✏️ Edit</button>
          <button class="want-remove small-btn" data-i="${i}">🗑️ Remove</button>
        </td>
      </tr>`).join('');
}

/* ---------------------------------------------------------
   MANUAL ADD WANTING ITEM
--------------------------------------------------------- */
function addWanting() {
  const type = (qs('#wantType')?.value || '').trim();
  const name = (qs('#wantName')?.value || '').trim();
  const note = (qs('#wantNote')?.value || '').trim();

  if (!name) return alert('Please enter product name');

  const it = { id: uid('want'), date: todayDate(), type, name, note };
  window.wanting = window.wanting || [];
  window.wanting.push(it);
  saveWanting();
  renderWanting();

  if (qs('#wantName')) qs('#wantName').value = '';
  if (qs('#wantNote')) qs('#wantNote').value = '';
  updateTypeDropdowns?.();
}

/* ---------------------------------------------------------
   ADD WANT ITEM BACK TO STOCK (prompt qty + cost)
   If product exists -> increase qty, else add new entry
--------------------------------------------------------- */
function addWantingToStock(index) {
  index = Number(index);
  const w = window.wanting[index];
  if (!w) return alert('Item not found');

  const qty = Number(prompt(`Enter quantity to add to stock for "${w.name}":`, '1') || 0);
  if (!qty || qty <= 0) return alert('Invalid quantity');

  const cost = Number(prompt('Enter cost per unit (₹):', '0') || 0);
  const date = todayDate();
  const type = w.type || '';

  // use core helper to add stock entry
  addStockEntry({ date, type, name: w.name, qty, cost });

  // remove from wanting
  window.wanting.splice(index, 1);
  saveWanting();
  saveStock?.();

  renderWanting();
  renderStock?.();
  updateTypeDropdowns?.();
}

/* ---------------------------------------------------------
   EDIT / REMOVE / CLEAR WANTING
--------------------------------------------------------- */
function editWant(index) {
  index = Number(index);
  const cur = window.wanting[index];
  if (!cur) return;

  const newName = prompt('Product Name:', cur.name);
  if (!newName) return;

  const newType = prompt('Type:', cur.type || '') || '';
  const newNote = prompt('Note:', cur.note || '') || '';

  window.wanting[index] = { ...cur, date: todayDate(), name: newName.trim(), type: newType.trim(), note: newNote.trim() };
  saveWanting();
  renderWanting();
}

function removeWant(index) {
  index = Number(index);
  if (!window.wanting[index]) return;
  if (!confirm('Remove this item from Wanting?')) return;
  window.wanting.splice(index, 1);
  saveWanting();
  renderWanting();
}

function clearWanting() {
  if (!confirm('Clear entire Wanting list?')) return;
  window.wanting = [];
  saveWanting();
  renderWanting();
}

/* ---------------------------------------------------------
   PRINT WANTING
--------------------------------------------------------- */
function printWanting() {
  const rows = qs('#wantingTable tbody').innerHTML;
  const html = `
  <html><head><title>Wanting List</title>
    <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}</style>
  </head><body>
    <h3>Wanting List — ${todayDate()}</h3>
    <table><thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Note</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

/* ---------------------------------------------------------
   EVENTS
--------------------------------------------------------- */
document.addEventListener('click', e => {
  const t = e.target;

  if (t.id === 'addWantBtn') return addWanting();
  if (t.id === 'clearWantBtn') return clearWanting();
  if (t.id === 'printWantBtn') return printWanting();

  if (t.classList.contains('want-remove')) return removeWant(t.dataset.i);
  if (t.classList.contains('want-edit')) return editWant(t.dataset.i);
  if (t.classList.contains('want-to-stock')) return addWantingToStock(t.dataset.i);
});

/* ---------------------------------------------------------
   INITIAL LOAD
--------------------------------------------------------- */
window.addEventListener('load', () => {
  updateTypeDropdowns?.();
  renderWanting();
});

/* EXPORTS */
window.renderWanting = renderWanting;
window.addWanting = addWanting;
window.addWantingToStock = addWantingToStock;
