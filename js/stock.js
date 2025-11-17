/* =======================================================
   📦 stock.js — Product Stock Manager (v2)
   Works with: core.js, types.js, sales.js, wanting.js
   ======================================================= */

/* NOTE:
   Expects core.js to provide:
     - window.stock (array)
     - addStockEntry({date,type,name,qty,cost,limit})
     - updateStockQty(type,name,delta)
     - getGlobalLimit(), saveStock(), saveSales(), saveWanting()
     - findProduct(), getProductCost(), autoAddWanting()
     - qs(), esc(), todayDate(), uid()
*/

function addStock() {
  const date = qs('#pdate')?.value || todayDate();
  const type = (qs('#ptype')?.value || '').trim();
  const name = (qs('#pname')?.value || '').trim();
  const qty = Number(qs('#pqty')?.value || 0);
  const cost = Number(qs('#pcost')?.value || 0);
  const limit = Number(qs('#pLimit')?.value || getGlobalLimit() || 0);

  if (!type || !name || !qty || qty <= 0) {
    return alert('Please fill Type, Product name and Qty.');
  }

  // Use core helper to keep behaviour consistent
  addStockEntry({ date, type, name, qty, cost, limit });

  // clear form
  if (qs('#pname')) qs('#pname').value = '';
  if (qs('#pqty')) qs('#pqty').value = '';
  if (qs('#pcost')) qs('#pcost').value = '';

  // refresh UI
  updateTypeDropdowns?.();
  renderStock();
}

/* -------------------------------------------------------
   🔥 RENDER STOCK TABLE
------------------------------------------------------- */
function renderStock() {
  const filter = qs('#filterType')?.value || 'all';
  const tbody = document.querySelector('#stockTable tbody');
  if (!tbody) return;

  const limitGlobal = getGlobalLimit();

  const rows = window.stock
    .filter(item => filter === 'all' || String(item.type) === String(filter))
    .map((item, index) => {
      const sold = Number(item.sold || 0);
      const qty = Number(item.qty || 0);
      const remain = qty - sold;
      const limit = (typeof item.limit !== 'undefined') ? Number(item.limit) : Number(limitGlobal || 0);

      let status = 'OK', cls = 'ok';
      if (remain <= 0) { status = 'OUT'; cls = 'out'; }
      else if (limit && remain <= limit) { status = 'LOW'; cls = 'low'; }

      return `
      <tr data-i="${index}">
        <td>${esc(item.date)}</td>
        <td>${esc(item.type)}</td>
        <td style="text-align:left">${esc(item.name)}</td>
        <td>${qty}</td>
        <td>${sold}</td>
        <td>${remain}</td>
        <td class="${cls}">${status}</td>
        <td>${limit}</td>
        <td>
          <button class="history-btn small-btn" data-i="${index}">📜 History</button>
          <button class="sale-btn small-btn" data-i="${index}">💰 Sale</button>
          <button class="credit-btn small-btn" data-i="${index}">💳 Credit</button>
        </td>
      </tr>`;
    });

  tbody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="9">No Stock Found</td></tr>`;
}

/* -------------------------------------------------------
   📜 SHOW STOCK HISTORY
   accepts index (from renderStock)
------------------------------------------------------- */
function showHistory(i) {
  i = Number(i);
  const s = window.stock[i];
  if (!s) return alert('No such product');

  if (!s.history || !s.history.length) {
    return alert(`${s.name} — No history available.`);
  }

  let msg = `${s.name} — History:\n\n`;
  s.history.forEach(h => {
    msg += `${h.date} — Qty: ${h.qty} @ ₹${h.cost}\n`;
  });
  alert(msg);
}

/* -------------------------------------------------------
   💸 STOCK SALE / CREDIT (from stock table)
   mode: "Paid" or "Credit"
------------------------------------------------------- */
function stockSale(i, mode = 'Paid') {
  i = Number(i);
  const s = window.stock[i];
  if (!s) return alert('Product not found');

  const remain = Number(s.qty || 0) - Number(s.sold || 0);
  if (remain <= 0) return alert('No stock left!');

  const qty = parseInt(prompt(`Enter Qty (Available: ${remain})`) || '0');
  if (!qty || qty <= 0 || qty > remain) return alert('Invalid quantity');

  const price = parseFloat(prompt('Enter Sale Price ₹:') || '0');
  if (!price || price <= 0) return alert('Invalid price');

  const date = todayDate();
  const cost = getProductCost(s.type, s.name) || 0;
  const profit = Math.round((price - cost) * qty);

  // update sold qty
  s.sold = (Number(s.sold || 0) + Number(qty));

  // ask customer name when credit
  let customer = '';
  if (mode === 'Credit') {
    customer = prompt('Customer name for credit:') || 'Customer';
  }

  // create sale entry
  const sale = {
    id: uid('sale'),
    date,
    type: s.type,
    product: s.name,
    qty,
    price,
    amount: Math.round(price * qty),
    profit,
    status: mode,
    customer
  };

  window.sales = window.sales || [];
  window.sales.push(sale);

  // persist
  saveStock();
  saveSales?.();

  // auto-add wanting if finished
  if (Number(s.sold || 0) >= Number(s.qty || 0)) {
    autoAddWanting?.(s.type, s.name, 'Auto Added');
    alert(`${s.name} finished — auto-added to Wanting`);
  }

  // refresh UIs
  renderStock();
  typeof renderSales === 'function' && renderSales();
  updateTypeDropdowns?.();
}

/* -------------------------------------------------------
   EVENT HANDLING
------------------------------------------------------- */
document.addEventListener('click', e => {
  const t = e.target;

  if (t.id === 'addStockBtn') return addStock();
  if (t.id === 'clearStockBtn') {
    if (confirm('Clear all stock? This cannot be undone.')) {
      window.stock = [];
      saveStock();
      renderStock();
    }
    return;
  }

  if (t.classList.contains('history-btn')) return showHistory(t.dataset.i);
  if (t.classList.contains('sale-btn')) return stockSale(t.dataset.i, 'Paid');
  if (t.classList.contains('credit-btn')) return stockSale(t.dataset.i, 'Credit');
});

/* -------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------- */
window.addEventListener('load', () => {
  // ensure type dropdowns synced
  updateTypeDropdowns?.();
  renderStock();
});

/* EXPORT */
window.renderStock = renderStock;
window.addStock = addStock;
window.showHistory = showHistory;
window.stockSale = stockSale;
