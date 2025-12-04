/* ============================================================
   STOCK.JS — FINAL V15 (core.js V13 Compatible, Zero-Conflict)
   ------------------------------------------------------------
   ✓ Uses KEY_STOCK = "stock-data"
   ✓ Full compatibility with sales.js + wanting.js
   ✓ FIFO stock reduction
   ✓ Correct investment calculation
   ✓ Cloud sync (cloudSync)
=========================================================== */

(function () {

  const qs  = s => document.querySelector(s);
  const esc = v => (v === undefined || v === null) ? "" : String(v);
  const num = v => Number(v || 0);

  /* ============================================================
     SAVE (Local + Cloud)
  ============================================================ */
  function saveStock() {
    try {
      localStorage.setItem("stock-data", JSON.stringify(window.stock));
    } catch {}

    // cloud sync (core.js)
    cloudSync("stock-data", window.stock);
  }
  window.saveStock = saveStock;

  /* ============================================================
     ADD STOCK ITEM (with history batch)
  ============================================================ */
  window.addStockEntry = function ({ date, type, name, qty, cost }) {

    date = toInternalIfNeeded(date);
    qty  = num(qty);
    cost = num(cost);

    if (!date || !type || !name || qty <= 0 || cost <= 0) {
      alert("Invalid entry!");
      return;
    }

    // check if product exists
    let p = window.stock.find(
      s => s.type === type && s.name.toLowerCase() === name.toLowerCase()
    );

    if (!p) {
      p = {
        id: uid("stk"),
        date,
        type,
        name,
        qty,
        remain: qty,
        sold: 0,
        cost,
        limit: getGlobalLimit(),
        history: [{ date, qty, cost }]
      };
      window.stock.unshift(p);
    } else {
      p.qty += qty;
      p.remain += qty;
      p.cost = cost;
      p.history = p.history || [];
      p.history.unshift({ date, qty, cost });
    }

    saveStock();
    renderStock();
    updateUniversalBar?.();
  };

  /* ============================================================
     DELETE STOCK ENTRY
  ============================================================ */
  window.deleteStock = function (id) {
    window.stock = window.stock.filter(s => s.id !== id);
    saveStock();
    renderStock();
    updateUniversalBar?.();
  };

  /* ============================================================
     CLEAR ALL STOCK
  ============================================================ */
  window.clearStock = function () {
    if (!confirm("Clear all stock items?")) return;
    window.stock = [];
    saveStock();
    renderStock();
    updateUniversalBar?.();
  };

  /* ============================================================
     FILTER LIST
  ============================================================ */
  function getFilteredStock() {
    const type   = qs("#filterType")?.value || "all";
    const search = (qs("#productSearch")?.value || "").toLowerCase();

    return window.stock.filter(s => {
      const okType   = type === "all" || s.type === type;
      const okSearch =
        s.name.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search);
      return okType && okSearch;
    });
  }

  /* ============================================================
     RENDER STOCK TABLE
  ============================================================ */
  window.renderStock = function () {
    const tbody = qs("#stockTable tbody");
    if (!tbody) return;

    const list = getFilteredStock();

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.55;">No stock</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(s => {
      const alert = s.remain <= s.limit ? "⚠️" : "";
      return `
        <tr>
          <td>${toDisplay(s.date)}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.name)}</td>
          <td>${s.qty}</td>
          <td>${s.sold}</td>
          <td>${s.remain}</td>
          <td>${alert}</td>
          <td>${s.limit}</td>
          <td><button class="small-btn" onclick="deleteStock('${s.id}')">🗑 Delete</button></td>
        </tr>
      `;
    }).join("");

    renderStockInvestment();
  };

  /* ============================================================
     STOCK INVESTMENT (before sale)
     correct formula = Σ(history.qty * history.cost)
  ============================================================ */
  function renderStockInvestment() {
    const box = qs("#stockInvValue");
    if (!box) return;

    let total = 0;

    window.stock.forEach(s => {
      (s.history || []).forEach(h => {
        total += num(h.qty) * num(h.cost);
      });
    });

    box.textContent = "₹" + total;
  }

  /* ============================================================
     FIFO REDUCTION AFTER SALE (sales.js uses this)
  ============================================================ */
  window.reduceStockAfterSale = function (product, qty) {

    qty = num(qty);
    if (!product || qty <= 0) return;

    for (const p of window.stock) {

      if (p.name.toLowerCase() !== product.toLowerCase()) continue;
      if (p.remain <= 0) continue;

      const use = Math.min(p.remain, qty);

      p.remain -= use;
      p.sold   += use;

      qty -= use;

      if (qty <= 0) break;
    }

    saveStock();
    renderStock();
    updateUniversalBar?.();
  };

  /* ============================================================
     INIT
  ============================================================ */
  window.addEventListener("load", () => {
    renderStock();
    renderStockInvestment();
  });

})();
