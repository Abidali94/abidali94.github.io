/* =======================================================
   📦 stock.js — Inventory Manager (FINAL v6.1)
   - FULL SUPPORT: dd-mm-yyyy UI, yyyy-mm-dd internal
   - FIXED: Sales entry now stores cost (REQ for investment)
======================================================= */

const toDisp = window.toDisplay;
const toInt  = window.toInternal;

/* -------------------------------------------------------
   ➕ ADD STOCK ENTRY
------------------------------------------------------- */
function addStock() {
  let date = qs("#pdate")?.value || todayDate();
  const type = qs("#ptype")?.value;
  const name = qs("#pname")?.value.trim();
  const qty  = Number(qs("#pqty")?.value || 0);
  const cost = Number(qs("#pcost")?.value || 0);

  if (!type || !name || qty <= 0 || cost <= 0)
    return alert("Please fill all fields.");

  // convert UI dd-mm-yyyy → internal yyyy-mm-dd
  if (date.includes("-") && date.split("-")[0].length === 2) {
    date = toInt(date);
  }

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
    .forEach((p, i) => {

      const sold   = Number(p.sold || 0);
      const remain = Number(p.qty) - sold;
      const limit = Number(p.limit ?? getGlobalLimit());

      let status = "OK", cls = "ok";
      if (remain <= 0) { status = "OUT"; cls = "out"; }
      else if (remain <= limit) { status = "LOW"; cls = "low"; }

      // fallback inline color
      let rowStyle = "";
      if (cls === "low") rowStyle = 'style="background:#fff8ec"';
      if (cls === "out") rowStyle = 'style="background:#ffecec;color:#a00;font-weight:600"';

      const dispDate = toDisp(p.date);

      html += `
      <tr class="${cls}" ${rowStyle}>
        <td>${dispDate}</td>
        <td>${esc(p.type)}</td>
        <td>${esc(p.name)}</td>
        <td>${p.qty}</td>
        <td>${sold}</td>
        <td>${remain}</td>
        <td class="status-cell">${status}</td>
        <td>${limit}</td>
        <td>
          <button class="history-btn" data-i="${i}">📜 History</button>
          <button class="sale-btn" data-i="${i}">💰 Sale</button>
          <button class="credit-btn" data-i="${i}">💳 Credit</button>
        </td>
      </tr>`;
    });

  if (!html) html = `<tr><td colspan="9">No Stock Found</td></tr>`;
  tbody.innerHTML = html;
}

/* -------------------------------------------------------
   📜 HISTORY VIEW
------------------------------------------------------- */
function showHistory(i) {
  const p = window.stock[i];
  if (!p?.history?.length)
    return alert("No history found.");

  let msg = `Purchase History of ${p.name}:\n\n`;

  p.history.forEach(h => {
    msg += `${toDisp(h.date)} — Qty ${h.qty} @ ₹${h.cost}\n`;
  });

  alert(msg);
}

/* -------------------------------------------------------
   💰 QUICK SALE / CREDIT
   FIXED → cost is now stored in sales entry ✔
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = Number(p.qty) - Number(p.sold || 0);
  if (remain <= 0) return alert("No stock left!");

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  let date = todayDate(); // yyyy-mm-dd
  const cost = getProductCost(p.type, p.name);
  const profit = (price - cost) * qty;

  p.sold = (p.sold || 0) + qty;

  // FINAL: Sales entry with cost FIXED ✔
  window.sales.push({
    id: uid("sale"),
    date,
    type: p.type,
    product: p.name,
    qty,
    price,
    amount: qty * price,
    profit: Math.round(profit),
    cost: cost,        // REQUIRED FOR INVESTMENT SYSTEM ✔
    status: mode
  });

  saveStock();
  saveSales();

  if (p.sold >= p.qty)
    autoAddWanting(p.type, p.name, "Finished");

  renderStock();
  renderSales?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* -------------------------------------------------------
   EVENT HANDLERS
------------------------------------------------------- */
document.addEventListener("click", e => {

  if (e.target.id === "addStockBtn")
    return addStock();

  if (e.target.id === "setLimitBtn") {
    const v = Number(qs("#globalLimit")?.value);
    if (v >= 0) {
      setGlobalLimit(v);
      alert("Global limit updated.");
      renderStock();
    }
    return;
  }

  if (e.target.id === "clearStockBtn") {
    if (confirm("Clear ALL stock?")) {
      window.stock = [];
      saveStock();
      renderStock();
    }
    return;
  }

  if (e.target.classList.contains("history-btn"))
    return showHistory(Number(e.target.dataset.i));

  if (e.target.classList.contains("sale-btn"))
    return stockQuickSale(Number(e.target.dataset.i), "Paid");

  if (e.target.classList.contains("credit-btn"))
    return stockQuickSale(Number(e.target.dataset.i), "Credit");
});

qs("#filterType")?.addEventListener("change", renderStock);

/* -------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  updateTypeDropdowns?.();
  renderStock();
});
