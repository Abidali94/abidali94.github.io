/* ==========================================================
   stock.js — Clean Full Version (v3.0)
   • Supports:
       - Add stock
       - Render stock table
       - Sell / Credit sale
       - Update sold qty
       - Filter + search
       - Auto add Wanting when finished
       - Correct universalBar updates
========================================================== */

/* -----------------------------
   Helpers
----------------------------- */
function $(s) { return document.querySelector(s); }
function $all(s) { return Array.from(document.querySelectorAll(s)); }

function num(v) { 
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

function todayDate() {
  return new Date().toISOString().slice(0,10);
}

function getCurrentTime12hr() {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).substr(2,9);
}


/* ==========================================================
   LOAD / SAVE STOCK
========================================================== */
window.stock = JSON.parse(localStorage.getItem("stock") || "[]");

window.saveStock = function () {
  localStorage.setItem("stock", JSON.stringify(window.stock));
};


/* ==========================================================
   ADD STOCK
========================================================== */
$("#addStockBtn")?.addEventListener("click", () => {
  const date = $("#pdate").value || todayDate();
  const type = $("#ptype").value.trim();
  const name = $("#pname").value.trim();
  const qty  = num($("#pqty").value);
  const cost = num($("#pcost").value);

  if (!type || !name || qty <= 0 || cost <= 0) {
    alert("Enter valid product details."); return;
  }

  window.stock.push({
    id: uid("stk"),
    date,
    type,
    name,
    qty,
    sold: 0,
    cost,
    limit: num($("#globalLimit").value || 2)
  });

  window.saveStock();
  renderStock();
  window.updateUniversalBar?.();
});


/* ==========================================================
   CLEAR ALL STOCK
========================================================== */
$("#clearStockBtn")?.addEventListener("click", () => {
  if (confirm("Delete ALL stock?")) {
    window.stock = [];
    window.saveStock();
    renderStock();
    window.updateUniversalBar?.();
  }
});


/* ==========================================================
   SET GLOBAL LIMIT
========================================================== */
$("#setLimitBtn")?.addEventListener("click", () => {
  const limit = num($("#globalLimit").value || 2);
  window.stock.forEach(p => p.limit = limit);
  window.saveStock();
  renderStock();
});


/* ==========================================================
   STOCK QUICK SALE / CREDIT SALE
========================================================== */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = num(p.qty) - num(p.sold);
  if (remain <= 0) { alert("No stock left."); return; }

  const qty = num(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = num(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  // For credit sale
  let customer = "";
  let phone = "";

  if (mode === "Credit") {
    customer = prompt("Customer Name:") || "";
    phone = prompt("Phone Number:") || "";
  }

  const cost = num(p.cost);
  const total = qty * price;
  const profit = total - qty * cost;

  p.sold += qty;

  // Add sale entry
  window.sales = window.sales || [];
  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    time: getCurrentTime12hr(),
    type: p.type,
    product: p.name,
    qty,
    price,
    total,
    profit,
    cost,
    status: mode,
    customer,
    phone
  });

  window.saveSales && window.saveSales();
  window.saveStock();

  // Auto Wanting
  if (p.sold >= p.qty && window.autoAddWanting) {
    window.autoAddWanting(p.type, p.name, "Finished");
  }

  renderStock();
  window.renderSales?.();
  window.updateUniversalBar?.();
}


/* ==========================================================
   RENDER STOCK TABLE
========================================================== */
function renderStock() {
  const tbody = $("#stockTable tbody");
  if (!tbody) return;

  const filterType = $("#filterType")?.value || "all";
  const searchTxt = ($("#productSearch")?.value || "").toLowerCase();

  let data = window.stock;

  if (filterType !== "all") {
    data = data.filter(p => p.type === filterType);
  }

  if (searchTxt) {
    data = data.filter(p => 
      p.name.toLowerCase().includes(searchTxt) || 
      p.type.toLowerCase().includes(searchTxt)
    );
  }

  tbody.innerHTML = data.map((p, i) => {
    const remain = num(p.qty) - num(p.sold);
    const alert = remain <= p.limit ? "⚠️" : "";
    
    return `
      <tr>
        <td>${p.date}</td>
        <td>${p.type}</td>
        <td>${p.name}</td>
        <td>${p.qty}</td>
        <td>${p.sold}</td>
        <td>${remain}</td>
        <td>${alert}</td>
        <td>${p.limit}</td>

        <td>
          <button class="small-btn" onclick="stockQuickSale(${i}, 'Cash')">Cash</button>
          <button class="small-btn" onclick="stockQuickSale(${i}, 'Credit')"
            style="background:#facc15;color:#000;">Credit</button>
        </td>
      </tr>
    `;
  }).join("");

  updateStockInvestment();
}


/* ==========================================================
   STOCK INVESTMENT BOX (Before Sale)
========================================================== */
function updateStockInvestment() {
  const total = window.stock.reduce((sum, p) => {
    const remain = num(p.qty) - num(p.sold);
    return sum + remain * num(p.cost);
  }, 0);

  $("#stockInvValue").textContent = "₹" + total;
}


/* ==========================================================
   EVENTS
========================================================== */

$("#productSearch")?.addEventListener("input", renderStock);
$("#filterType")?.addEventListener("change", renderStock);


/* ==========================================================
   INIT
========================================================== */
window.addEventListener("load", () => {
  renderStock();
  updateStockInvestment();
  window.updateUniversalBar?.();
});
