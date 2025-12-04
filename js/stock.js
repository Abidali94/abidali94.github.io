/* ============================================================
   STOCK.JS — FINAL V14 (Stable, Optimized, Zero-Conflict)
   ------------------------------------------------------------
   ✓ Clean rendering
   ✓ Real-time update
   ✓ Investment before sale correct
   ✓ Smooth sync with sales.js + universalBar.js
   ✓ No duplicates / no performance leaks
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (x === undefined || x === null) ? "" : String(x);
  const num = x => Number(x || 0);

  window.stock = Array.isArray(window.stock) ? window.stock : [];

  /* ============================================================
     SAVE STOCK (Local + Cloud)
  ============================================================ */
  function saveStock() {
    try {
      localStorage.setItem("ks-stock", JSON.stringify(window.stock));
    } catch {}
    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("stock", window.stock);
    }
  }
  window.saveStock = saveStock;

  /* ============================================================
     ADD NEW STOCK ITEM
  ============================================================ */
  window.addStockItem = function () {
    const date = qs("#pdate").value;
    const type = qs("#ptype").value.trim();
    const name = qs("#pname").value.trim();
    const qty  = num(qs("#pqty").value);
    const cost = num(qs("#pcost").value);

    if (!date || !type || !name || qty <= 0 || cost <= 0) {
      alert("Invalid stock entry!");
      return;
    }

    const item = {
      id: uid("stk"),
      date,
      type,
      name,
      qty,
      remain: qty,
      sold: 0,
      cost,
      limit: num(qs("#globalLimit").value || 2)
    };

    window.stock.unshift(item);
    saveStock();
    renderStock();
    window.updateUniversalBar?.();
  };

  /* ============================================================
     DELETE ONE STOCK ITEM
  ============================================================ */
  window.deleteStock = function (id) {
    window.stock = window.stock.filter(s => s.id !== id);
    saveStock();
    renderStock();
    window.updateUniversalBar?.();
  };

  /* ============================================================
     CLEAR ALL STOCK
  ============================================================ */
  window.clearStock = function () {
    if (!confirm("Clear all stock entries?")) return;
    window.stock = [];
    saveStock();
    renderStock();
    window.updateUniversalBar?.();
  };

  /* ============================================================
     FILTER + SEARCH
  ============================================================ */
  function filterStockList() {
    const type = qs("#filterType").value;
    const search = (qs("#productSearch").value || "").toLowerCase();

    return window.stock.filter(s => {
      const matchType = (type === "all" || s.type === type);
      const matchSearch =
        s.name.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search);

      return matchType && matchSearch;
    });
  }

  /* ============================================================
     RENDER STOCK TABLE
  ============================================================ */
  window.renderStock = function () {
    const tbody = qs("#stockTable tbody");
    if (!tbody) return;

    const list = filterStockList();
    if (!list.length) {
      tbody.innerHTML =
        `<tr><td colspan="9" style="text-align:center;opacity:.6;">No stock added</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const alert = item.remain <= item.limit ? "⚠️" : "";
      return `
        <tr>
          <td>${esc(item.date)}</td>
          <td>${esc(item.type)}</td>
          <td>${esc(item.name)}</td>
          <td>${item.qty}</td>
          <td>${item.sold}</td>
          <td>${item.remain}</td>
          <td>${alert}</td>
          <td>${item.limit}</td>
          <td>
            <button class="btn-link" onclick="deleteStock('${item.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

    renderStockInvestment();
  };

  /* ============================================================
     CALCULATE STOCK INVESTMENT (BEFORE SALE)
  ============================================================ */
  function renderStockInvestment() {
    const box = qs("#stockInvValue");
    if (!box) return;

    const total = window.stock.reduce((sum, s) => sum + num(s.cost), 0);
    box.textContent = "₹" + total;
  }

  /* ============================================================
     UPDATE STOCK AFTER SALE
     (Used from sales.js)
  ============================================================ */
  window.reduceStockAfterSale = function (product, qty) {
    qty = num(qty);
    if (!product || qty <= 0) return;

    for (const s of window.stock) {
      if (s.name === product && s.remain > 0) {
        const take = Math.min(qty, s.remain);
        s.remain -= take;
        s.sold += take;
        qty -= take;
        if (qty <= 0) break;
      }
    }

    saveStock();
    renderStock();
    window.updateUniversalBar?.();
  };

  /* ============================================================
     INIT
  ============================================================ */
  window.addEventListener("load", () => {
    renderStock();
    renderStockInvestment();
  });

})();
