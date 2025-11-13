/* ==========================================================
   💰 sales.js — Sales + Profit Manager
   Works with: core.js, stock.js, types.js, analytics.js
   ========================================================== */

window.sales = JSON.parse(localStorage.getItem("sales-data") || "[]");
const SALES_KEY = "sales-data";

let profitLocked = false;

/* ----------------------------------------------------------
   🟠 SAVE SALES
---------------------------------------------------------- */
function saveSales() {
  localStorage.setItem(SALES_KEY, JSON.stringify(window.sales));
  window.dispatchEvent(new Event("storage"));
}

/* ----------------------------------------------------------
   🔽 UPDATE TYPE + PRODUCT DROPDOWNS (Stock → Sales Sync)
---------------------------------------------------------- */
function refreshSaleSelectors() {
  const typeDD = document.getElementById("saleType");
  const prodDD = document.getElementById("saleProduct");

  if (!typeDD || !prodDD) return;

  /* ---- TYPE DROPDOWN ---- */
  typeDD.innerHTML =
    `<option value="">All Types</option>` +
    window.types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");

  /* ---- PRODUCT DROPDOWN ---- */
  const products = window.stock
    .map(s => ({ type: s.type, name: s.name }))
    .filter((x, i, a) => a.findIndex(y => y.type === x.type && y.name === x.name) === i);

  prodDD.innerHTML =
    `<option value="">Select Product</option>` +
    products
      .map(p => `<option value="${p.type}|||${p.name}">${esc(p.type)} — ${esc(p.name)}</option>`)
      .join("");
}

/* ----------------------------------------------------------
   ➕ ADD SALE ENTRY
---------------------------------------------------------- */
function addSale() {
  const d = document.getElementById("saleDate")?.value || todayDate();
  const typeProd = document.getElementById("saleProduct")?.value;
  const qty = parseInt(document.getElementById("saleQty")?.value || 0);
  const price = parseFloat(document.getElementById("salePrice")?.value || 0);
  const status = document.getElementById("saleStatus")?.value || "Paid";
  const includeGST = document.getElementById("includeGst")?.checked;
  const gstPercent = parseFloat(document.getElementById("gstPercent")?.value || 0);

  if (!typeProd) return alert("Select product");
  if (!qty || qty <= 0) return alert("Invalid Qty");
  if (!price || price <= 0) return alert("Invalid Price");

  const [type, name] = typeProd.split("|||");

  /* ---- Check Remaining ---- */
  const p = findProduct(type, name);
  const remain = p ? (p.qty - (p.sold || 0)) : 0;

  if (qty > remain) {
    if (!confirm(`Only ${remain} available. Continue?`)) return;
  }

  /* ---- COST ---- */
  let cost = getProductCost(type, name);
  let netPrice = price;

  if (includeGST && gstPercent > 0) {
    netPrice = price / (1 + gstPercent / 100);
  }

  let profit = (netPrice - cost) * qty;

  /* ---- Update Stock Sold ---- */
  if (p) {
    p.sold = (p.sold || 0) + qty;
    saveStock();
  }

  /* ---- Add sale ---- */
  const entry = {
    date: d,
    type,
    product: name,
    qty,
    price,
    amount: price * qty,
    profit: Math.round(profit),
    status
  };

  window.sales.push(entry);
  saveSales();

  renderSales();
  renderStock();
  if (typeof updateSummaryCards === "function") updateSummaryCards();
  if (typeof renderAnalytics === "function") renderAnalytics();

  /* reset inputs */
  document.getElementById("saleQty").value = "";
  document.getElementById("salePrice").value = "";
}

/* ----------------------------------------------------------
   📋 RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales(filterDate = null) {
  const tbody = document.querySelector("#salesTable tbody");
  const totalEl = document.getElementById("salesTotal");
  const profitEl = document.getElementById("profitTotal");

  if (!tbody) return;

  let list = window.sales;

  if (filterDate) list = list.filter(s => s.date === filterDate);

  let total = 0, profit = 0;

  let html = list.map(s => {
    total += s.amount || 0;
    profit += s.profit || 0;

    return `
      <tr>
        <td>${s.date}</td>
        <td>${esc(s.type)}</td>
        <td>${esc(s.product)}</td>
        <td>${s.qty}</td>
        <td>${s.price}</td>
        <td>${s.amount}</td>
        <td class="profit-cell">${s.profit}</td>
        <td>${s.status}</td>
      </tr>`;
  }).join("");

  if (!html) html = `<tr><td colspan="8">No Sales Found</td></tr>`;

  tbody.innerHTML = html;
  totalEl.textContent = total;
  profitEl.textContent = profit;

  applyProfitVisibility();
}

/* ----------------------------------------------------------
   🔒 PROFIT COLUMN LOCK
---------------------------------------------------------- */
function applyProfitVisibility() {
  const profitCells = document.querySelectorAll(".profit-cell");
  const profitHead = document.querySelector("#salesTable thead th:nth-child(7)");

  if (profitLocked) {
    profitCells.forEach(c => (c.style.display = "none"));
    if (profitHead) profitHead.style.display = "none";
    document.getElementById("profitTotal").style.display = "none";
  } else {
    profitCells.forEach(c => (c.style.display = ""));
    if (profitHead) profitHead.style.display = "";
    document.getElementById("profitTotal").style.display = "";
  }
}

/* Toggle profit lock */
function toggleProfit() {
  if (!profitLocked) {
    profitLocked = true;
    applyProfitVisibility();
    return alert("Profit column hidden. To unlock, you must enter admin password.");
  }

  const pw = prompt("Enter admin password:");
  if (!pw) return;
  if (!validateAdminPassword(pw)) return alert("Wrong password!");

  profitLocked = false;
  applyProfitVisibility();
  alert("Profit column unlocked.");
}

/* ----------------------------------------------------------
   🖨 PRINT SALES TABLE
---------------------------------------------------------- */
function printSales() {
  const rows = document.querySelector("#salesTable tbody").innerHTML;
  const head = document.querySelector("#salesTable thead").innerHTML;
  const date = document.getElementById("saleDate")?.value || "All";

  const html = `
  <html>
    <head>
      <title>Sales Report</title>
      <style>
        table { width:100%; border-collapse:collapse; }
        th,td { border:1px solid #ccc; padding:6px; text-align:center; }
      </style>
    </head>
    <body>
      <h2>Sales — ${date}</h2>
      <table>
        <thead>${head}</thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

/* ----------------------------------------------------------
   🖱 EVENT LISTENERS
---------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addSaleBtn") addSale();
  if (e.target.id === "viewSalesBtn") {
    const d = document.getElementById("saleDate")?.value;
    renderSales(d);
  }
  if (e.target.id === "printSalesBtn") printSales();
  if (e.target.id === "toggleProfitBtn") toggleProfit();
});

/* ----------------------------------------------------------
   🚀 INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  if (document.getElementById("saleDate") && !document.getElementById("saleDate").value)
    document.getElementById("saleDate").value = todayDate();

  refreshSaleSelectors();
  renderSales();
});
