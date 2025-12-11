/* ==========================================================
   stock.js — ONLINE ONLY (Option-B Cloud Master) — FINAL v11
   • Cloud is primary source of truth
   • Local is only temporary UI cache
   • All writes → cloudSync
   • Auto-resync → cloudPullAllIfAvailable()
========================================================== */

const $  = s => document.querySelector(s);
const num = v => isNaN(Number(v)) ? 0 : Number(v);
const toDisp = d => (typeof window.toDisplay === "function" ? toDisplay(d) : d);

/* ==========================================================
   SAVE STOCK (Cloud Master)
========================================================== */
window.saveStock = function () {

  // 1️⃣ Local temporary cache (for instant UI only)
  try {
    localStorage.setItem("stock-data", JSON.stringify(window.stock));
  } catch {}

  // 2️⃣ Cloud Master Save
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("stock", window.stock);
  }

  // 3️⃣ Trigger global resync (other devices)
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => cloudPullAllIfAvailable(), 200);
  }
};

/* ==========================================================
   ADD STOCK (WITH HISTORY)
========================================================== */
$("#addStockBtn")?.addEventListener("click", () => {

  let date = $("#pdate").value || todayDate();
  date = toInternalIfNeeded(date);

  const type = $("#ptype").value.trim();
  const name = $("#pname").value.trim();
  const qty  = num($("#pqty").value);
  const cost = num($("#pcost").value);

  if (!type || !name || qty <= 0 || cost <= 0) {
    alert("Enter valid product details.");
    return;
  }

  const p = (window.stock || []).find(
    x => x.type === type && x.name.toLowerCase() === name.toLowerCase()
  );

  if (!p) {
    // New product
    window.stock.push({
      id: uid("stk"),
      type,
      name,
      date,
      qty,
      sold: 0,
      cost,
      limit: num($("#globalLimit").value || 2),
      history: [{ date, qty, cost }]
    });

  } else {
    // Update existing product
    p.qty += qty;
    p.cost = cost;

    if (!Array.isArray(p.history)) p.history = [];
    p.history.push({ date, qty, cost });
  }

  window.saveStock();

  renderStock();
  window.updateUniversalBar?.();

  // Clear input fields
  $("#pname").value = "";
  $("#pqty").value = "";
  $("#pcost").value = "";
});

/* ==========================================================
   SHOW PURCHASE HISTORY
========================================================== */
function showStockHistory(id) {
  const p = (window.stock || []).find(x => x.id === id);
  if (!p || !p.history?.length) {
    alert("No history available.");
    return;
  }

  let msg = `Purchase History — ${p.name}\n\n`;
  let totalCost = 0, totalQty = 0;

  p.history.forEach(h => {
    const q = num(h.qty), c = num(h.cost);
    const dt = h.date ? toDisp(h.date) : "-";

    totalCost += q * c;
    totalQty  += q;

    msg += `${dt} — ${q} qty × ₹${c} = ₹${q * c}\n`;
  });

  const avg = totalQty ? (totalCost / totalQty).toFixed(2) : 0;

  msg += `\nTotal Purchased Qty: ${totalQty}`;
  msg += `\nAverage Cost: ₹${avg}`;

  alert(msg);
}
window.showStockHistory = showStockHistory;

/* ==========================================================
   CLEAR ALL STOCK
========================================================== */
$("#clearStockBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL stock?")) return;

  window.stock = [];
  window.saveStock();

  renderStock();
  window.updateUniversalBar?.();
});

/* ==========================================================
   SET GLOBAL LIMIT FOR ALL ITEMS
========================================================== */
$("#setLimitBtn")?.addEventListener("click", () => {
  const limit = num($("#globalLimit").value || 2);
  window.stock.forEach(p => p.limit = limit);

  window.saveStock();
  renderStock();
});

/* ==========================================================
   STOCK QUICK SALE (Cash / Credit)
========================================================== */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = num(p.qty) - num(p.sold);
  if (remain <= 0) return alert("No stock left.");

  const qty = num(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = num(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  let customer = "", phone = "";
  if (mode === "Credit") {
    customer = prompt("Customer Name:") || "";
    phone    = prompt("Phone Number:") || "";
  }

  const cost   = num(p.cost);
  const total  = qty * price;
  const profit = total - qty * cost;

  p.sold += qty;
  window.saveStock();

  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
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

  window.saveSales?.();

  if (p.sold >= p.qty && window.autoAddWanting) {
    window.autoAddWanting(p.type, p.name, "Finished");
  }

  renderStock();
  window.renderSales?.();
  window.renderCollection?.();
  window.updateUniversalBar?.();
}
window.stockQuickSale = stockQuickSale;

/* ==========================================================
   RENDER STOCK TABLE
========================================================== */
function renderStock() {
  const tbody = $("#stockTable tbody");
  if (!tbody) return;

  const filterType = $("#filterType")?.value || "all";
  const searchTxt  = ($("#productSearch")?.value || "").toLowerCase();

  let data = window.stock || [];

  if (filterType !== "all") data = data.filter(p => p.type === filterType);
  if (searchTxt)
    data = data.filter(p =>
      p.name.toLowerCase().includes(searchTxt) ||
      p.type.toLowerCase().includes(searchTxt)
    );

  tbody.innerHTML = data.map((p, i) => {
    const remain = num(p.qty) - num(p.sold);
    const alert  = remain <= p.limit ? "⚠️" : "";

    return `
      <tr>
        <td>${toDisp(p.date)}</td>
        <td>${p.type}</td>
        <td>${p.name}</td>
        <td>${p.qty}</td>
        <td>${p.sold}</td>
        <td>${remain}</td>
        <td>${alert}</td>
        <td>${p.limit}</td>
        <td>
          <button class="small-btn"
                  style="background:#555;color:#fff;"
                  onclick="showStockHistory('${p.id}')">📜</button>
          <button class="small-btn" onclick="stockQuickSale(${i}, 'Paid')">Cash</button>
          <button class="small-btn"
                  onclick="stockQuickSale(${i}, 'Credit')"
                  style="background:#facc15;color:black;">Credit</button>
        </td>
      </tr>`;
  }).join("");

  updateStockInvestment();
}

/* ==========================================================
   STOCK INVESTMENT (Remaining stock value)
========================================================== */
function updateStockInvestment() {
  const total = (window.stock || []).reduce((sum, p) => {
    const remain = num(p.qty) - num(p.sold);
    return sum + remain * num(p.cost);
  }, 0);

  $("#stockInvValue").textContent = "₹" + total;
}

/* ==========================================================
   FILTER EVENTS
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

  // 🔥 Safe re-sync after cloud pull
  setTimeout(() => {
    renderStock();
    updateStockInvestment();
  }, 250);
});
