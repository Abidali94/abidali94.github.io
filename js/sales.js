/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (FINAL v9.0)
   • Added: Stock Investment Collector
   • Added: Profit Collector
   • 100% Safe with your existing core.js/cloud sync
========================================================== */

/* ----- helpers / compatibility ----- */
const _SALES_KEY = "sales-data";

/* Persist sales */
function persistSales() {
  try {
    if (typeof window.saveSales === "function" && window.saveSales !== persistSales) {
      return window.saveSales();
    }
  } catch (e) {}

  try {
    localStorage.setItem(_SALES_KEY, JSON.stringify(window.sales || []));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Fallback saveSales failed:", e);
  }
}

/* ----- TYPE FILTER ----- */
function refreshSaleTypeSelector() {
  const tdd = qs("#saleType");
  if (!tdd) return;

  tdd.innerHTML =
    `<option value="all">All Types</option>` +
    (window.types || [])
      .map(t => `<option value="${esc(t.name || t)}">${esc(t.name || t)}</option>`)
      .join("");
}

/* ----- LIVE FILTER ----- */
function attachImmediateSalesFilters() {
  qs("#saleType")?.addEventListener("change", renderSales);
  qs("#saleDate")?.addEventListener("change", renderSales);
}

/* ----------------------------------------------------------
   CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = (window.sales || []).find(x => x.id === id);
  if (!s) return;

  if (String(s.status || "").toLowerCase() === "paid") {
    alert("Already Paid");
    return;
  }

  if (!confirm("Mark this CREDIT sale as PAID?")) return;

  s.status = "Paid";

  persistSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   CLEAR ALL SALES
---------------------------------------------------------- */
qs("#clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL sales permanently?")) return;

  window.sales = [];
  persistSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   🟢 NEW — STOCK INVESTMENT COLLECTOR (Sale-based)
   (Only sold qty × cost — NOT stock addition cost)
---------------------------------------------------------- */
window.getCollectedStockInvestment = function () {
  let inv = 0;
  (window.sales || []).forEach(s => {
    if (String(s.status).toLowerCase() !== "credit") {
      inv += Number(s.cost || 0) * Number(s.qty || 0);
    }
  });
  return inv;
};

/* ----------------------------------------------------------
   🟢 NEW — SALES PROFIT COLLECTOR (Paid only)
---------------------------------------------------------- */
window.getCollectedSalesProfit = function () {
  let p = 0;
  (window.sales || []).forEach(s => {
    if (String(s.status).toLowerCase() !== "credit") {
      p += Number(s.profit || 0);
    }
  });
  return p;
};

/* ----------------------------------------------------------
   RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales() {
  const tbody = qs("#salesTable tbody");
  const totalEl = qs("#salesTotal");
  const profitEl = qs("#profitTotal");

  if (!tbody) return;

  const typeFilter = qs("#saleType")?.value || "all";
  const dateFilter = qs("#saleDate")?.value || "";

  let total = 0;
  let profit = 0;
  let rows = "";

  (window.sales || [])
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s => !dateFilter || s.date === dateFilter)
    .forEach(s => {

      const dispDate = toDisplay(s.date);

      total += Number(s.amount || 0);

      // Credit does NOT count for profit
      if (String(s.status || "").toLowerCase() !== "credit") {
        profit += Number(s.profit || 0);
      }

      const statusBtn =
        String(s.status || "").toLowerCase() === "credit"
          ? `<button class="small-btn"
               style="background:#ff9800;color:#fff"
               onclick="markSalePaid('${s.id}')">CREDIT</button>`
          : `💰 Paid`;

      rows += `
        <tr>
          <td>${dispDate}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${esc(s.qty)}</td>
          <td>${esc(s.price)}</td>
          <td>${esc(s.amount)}</td>
          <td>${esc(s.profit)}</td>
          <td>${statusBtn}</td>
        </tr>
      `;
    });

  if (!rows)
    rows = `<tr><td colspan="8">No sales found</td></tr>`;

  tbody.innerHTML = rows;
  totalEl.textContent = total;
  profitEl.textContent = profit;
}

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleTypeSelector();
  attachImmediateSalesFilters();
  renderSales();
});

/* expose */
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
window.renderSales = renderSales;
window.markSalePaid = markSalePaid;
window.persistSales = persistSales;
