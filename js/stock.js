/* ==========================================================
   stock.js — ONLINE REALTIME VERSION (v7.0 CLOUD SAFE + FIXED HISTORY)
========================================================== */

const $  = s => document.querySelector(s);
const num = v => isNaN(Number(v)) ? 0 : Number(v);
const toDisp = d => (typeof window.toDisplay === "function" ? toDisplay(d) : d);

/* ==========================================================
   SAFE NORMALIZE HISTORY (AFTER CLOUD LOAD ONLY)
========================================================== */
function normalizeStockHistory() {

  // Ensure stock is ARRAY (important)
  window.stock = Array.isArray(window.stock)
    ? window.stock
    : toArray(safeParse(localStorage.getItem("stock-data")));

  (window.stock || []).forEach(p => {
    // If no history but qty/cost exists → repair
    if (!Array.isArray(p.history) || !p.history.length) {
      if (num(p.qty) > 0 && num(p.cost) > 0) {
        const dt = toInternalIfNeeded(p.date || todayDate());
        p.history = [{
          date: dt,
          qty : num(p.qty),
          cost: num(p.cost)
        }];
      }
    }
  });

  window.saveStock?.();
}

/* ==========================================================
   SAVE STOCK (LOCAL + CLOUD)
========================================================== */
window.saveStock = function () {
  try {
    localStorage.setItem("stock-data", JSON.stringify(window.stock));
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("stock", window.stock);
  }
};

/* ==========================================================
   ADD STOCK  (WITH HISTORY)
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

  // Find existing product
  const p = (window.stock || []).find(
    x => x.type === type && x.name.toLowerCase() === name.toLowerCase()
  );

  if (!p) {
    // NEW product
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
    // EXISTING product — update qty + cost and append history
    p.qty += qty;
    p.cost = cost;

    if (!Array.isArray(p.history)) p.history = [];
    p.history.push({ date, qty, cost });
  }

  window.saveStock();
  renderStock();
  window.updateUniversalBar?.();
});

/* ==========================================================
   SHOW PURCHASE HISTORY (POPUP)
========================================================== */
function showStockHistory(id) {
  const p = (window.stock || []).find(x => x.id === id);
  if (!p || !p.history || !p.history.length) {
    alert("No history available.");
    return;
  }

  let msg = `Purchase History — ${p.name}\n\n`;
  let totalCost = 0, totalQty = 0;

  p.history.forEach(h => {
    const q  = num(h.qty);
    const c  = num(h.cost);
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
   SET GLOBAL LIMIT
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
  if (remain <= 0) { alert("No stock left."); return; }

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
    time: (new Date()).toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"}),
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

          <button class="small-btn" onclick="stockQuickSale(${i}, 'Credit')"
            style="background:#facc15;color:black;">Credit</button>
        </td>
      </tr>
    `;
  }).join("");

  updateStockInvestment();
}

/* ==========================================================
   STOCK INVESTMENT (Before sale)
========================================================== */
function updateStockInvestment() {
  const total = (window.stock || []).reduce((sum, p) => {
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
   INIT (AFTER CLOUD SYNC)
========================================================== */
window.addEventListener("load", () => {
  setTimeout(() => {
    normalizeStockHistory();
    renderStock();
    updateStockInvestment();
    window.updateUniversalBar?.();
  }, 600); // ⭐ wait for cloudPullAllIfAvailable()
});
