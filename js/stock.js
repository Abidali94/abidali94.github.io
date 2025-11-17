/* =======================================================
   📦 stock.js — Product Stock Manager (Final v2.1)
   Works with: core.js, types.js, sales.js, wanting.js
   ======================================================= */

/* window.stock is already loaded from core.js */

/* -------------------------------------------------------
   ➕ ADD / UPDATE STOCK
------------------------------------------------------- */
function addStock() {
  const date = qs("#pdate")?.value;
  const type = qs("#ptype")?.value;
  const name = qs("#pname")?.value.trim();
  const qty  = Number(qs("#pqty")?.value || 0);
  const cost = Number(qs("#pcost")?.value || 0);

  if (!date || !type || !name || qty <= 0 || cost <= 0)
    return alert("Please fill all fields.");

  addStockEntry({ date, type, name, qty, cost });

  renderStock();
  updateTypeDropdowns?.();

  qs("#pname").value = "";
  qs("#pqty").value = "";
  qs("#pcost").value = "";
}

/* -------------------------------------------------------
   📊 RENDER STOCK TABLE
------------------------------------------------------- */
function renderStock() {
  const filter = qs("#filterType")?.value || "all";
  const tbody = qs("#stockTable tbody");

  if (!tbody) return;

  let html = "";

  window.stock
    .filter(item => filter === "all" || item.type === filter)
    .forEach((item, i) => {
      const sold   = Number(item.sold || 0);
      const remain = Number(item.qty) - sold;

      const limit = (typeof item.limit !== "undefined")
        ? Number(item.limit)
        : getGlobalLimit();

      let status = "OK", cls = "ok";

      if (remain <= 0) {
        status = "OUT";
        cls = "out";
      }
      else if (remain <= limit) {
        status = "LOW";
        cls = "low";
      }

      html += `
      <tr>
        <td>${item.date}</td>
        <td>${esc(item.type)}</td>
        <td>${esc(item.name)}</td>
        <td>${item.qty}</td>
        <td>${sold}</td>
        <td>${remain}</td>
        <td class="${cls}">${status}</td>
        <td>${limit}</td>
        <td>
          <button class="history-btn" data-i="${i}" title="View History">📜 History</button>
          <button class="sale-btn" data-i="${i}" title="Quick Sale">💰 Sale</button>
          <button class="credit-btn" data-i="${i}" title="Quick Credit">💳 Credit</button>
        </td>
      </tr>`;
    });

  if (!html)
    html = `<tr><td colspan="9">No Stock Found</td></tr>`;

  tbody.innerHTML = html;
}

/* -------------------------------------------------------
   📜 SHOW HISTORY
------------------------------------------------------- */
function showHistory(i) {
  const p = window.stock[i];
  if (!p || !p.history) return alert("No history found.");

  let msg = `History for ${p.name}:\n\n`;
  p.history.forEach(h => {
    msg += `${h.date} — Qty: ${h.qty} @ ₹${h.cost}\n`;
  });

  alert(msg);
}

/* -------------------------------------------------------
   💸 QUICK SALE / CREDIT
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = p.qty - (p.sold || 0);
  if (remain <= 0) return alert("No stock left!");

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  const date = todayDate();
  const cost = getProductCost(p.type, p.name);
  const profit = (price - cost) * qty;

  // update stock
  p.sold = (p.sold || 0) + qty;

  // save sale entry
  window.sales.push({
    id: uid("sale"),
    date,
    type: p.type,
    product: p.name,
    qty,
    price,
    amount: qty * price,
    profit: Math.round(profit),
    status: mode
  });

  saveStock();
  saveSales();

  if (p.sold >= p.qty)
    autoAddWanting(p.type, p.name, "Finished");

  renderStock();
  renderSales?.();
  updateSummaryCards?.();
}

/* -------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addStockBtn") return addStock();

  if (e.target.id === "clearStockBtn") {
    if (confirm("Clear ALL stock?")) {
      window.stock = [];
      saveStock();
      renderStock();
    }
    return;
  }

  if (e.target.classList.contains("history-btn"))
    return showHistory(e.target.dataset.i);

  if (e.target.classList.contains("sale-btn"))
    return stockQuickSale(e.target.dataset.i, "Paid");

  if (e.target.classList.contains("credit-btn"))
    return stockQuickSale(e.target.dataset.i, "Credit");
});

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  updateTypeDropdowns?.();
  renderStock();
});
