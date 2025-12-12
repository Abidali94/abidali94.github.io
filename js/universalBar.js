/* ===========================================================
   universal-bar.js — FULL ONLINE VERSION (v15 FINAL)
   ⭐ All offsets saved in Firestore (multi-device sync)
   ⭐ LocalStorage = cache only (no logic depends on it)
   ⭐ Net / Sale / Service / Stock / Service-Inv all synced
=========================================================== */

(function () {

  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  /* -----------------------------------------------------------
     CLOUD OFFSET LOAD & SAVE
  ----------------------------------------------------------- */
  const OFFSET_KEY = "offsets";  // Firestore collection name

  async function loadOffsets() {
    if (typeof cloudLoad !== "function") return {};

    try {
      const data = await cloudLoad(OFFSET_KEY);
      return typeof data === "object" && data !== null ? data : {};
    } catch {
      return {};
    }
  }

  async function saveOffsets(obj) {
    if (typeof cloudSaveDebounced !== "function") return;
    cloudSaveDebounced(OFFSET_KEY, obj);
  }

  // global store
  window.__offsets = {
    net: 0,
    sale: 0,
    service: 0,
    stock: 0,
    servInv: 0
  };

  async function initOffsets() {
    const loaded = await loadOffsets();
    window.__offsets = {
      net:     num(loaded.net),
      sale:    num(loaded.sale),
      service: num(loaded.service),
      stock:   num(loaded.stock),
      servInv: num(loaded.servInv)
    };
    updateUniversalBar();
  }

  /* -----------------------------------------------------------
     CENTRAL METRIC CALCULATOR
  ----------------------------------------------------------- */
  function computeMetrics() {

    const sales    = Array.isArray(window.sales)    ? window.sales    : [];
    const services = Array.isArray(window.services) ? window.services : [];
    const expenses = Array.isArray(window.expenses) ? window.expenses : [];
    const stock    = Array.isArray(window.stock)    ? window.stock    : [];

    let saleProfit      = 0;
    let serviceProfit   = 0;
    let pendingCredit   = 0;
    let totalExpenses   = 0;
    let stockInvestSold = 0;
    let servInv         = 0;

    /* ---------- SALES ---------- */
    sales.forEach(s => {
      const st = (s.status || "").toLowerCase();
      const total = num(s.total);

      if (st === "credit") {
        pendingCredit += total;
      } else {
        saleProfit += num(s.profit);
      }
    });

    /* ---------- SERVICES ---------- */
    services.forEach(j => {
      const st = (j.status || "").toLowerCase();
      if (st === "completed") {
        serviceProfit += num(j.profit);
        servInv += num(j.invest);
      }
    });

    /* ---------- EXPENSES ---------- */
    expenses.forEach(e => totalExpenses += num(e.amount));

    /* ---------- STOCK INVEST (sold) ---------- */
    stock.forEach(p => {
      const sold = num(p.sold);
      const c    = num(p.cost);
      if (sold > 0) stockInvestSold += sold * c;
    });

    /* ---------- APPLY CLOUD OFFSETS ---------- */
    const offs = window.__offsets;

    return {
      saleProfitCollected:     Math.max(0, saleProfit    - offs.sale),
      serviceProfitCollected:  Math.max(0, serviceProfit - offs.service),
      pendingCreditTotal:      pendingCredit,
      totalExpenses,

      stockInvestSold:         Math.max(0, stockInvestSold - offs.stock),
      serviceInvestCompleted:  Math.max(0, servInv        - offs.servInv),

      netProfit: Math.max(
        0,
        (saleProfit + serviceProfit - totalExpenses) - offs.net
      )
    };
  }

  /* -----------------------------------------------------------
     UPDATE UI
  ----------------------------------------------------------- */
  function updateUniversalBar() {
    const m = computeMetrics();

    const el = {
      net:      document.getElementById("unNetProfit"),
      sale:     document.getElementById("unSaleProfit"),
      serv:     document.getElementById("unServiceProfit"),
      exp:      document.getElementById("unExpenses"),
      stock:    document.getElementById("unStockInv"),
      servInv:  document.getElementById("unServiceInv"),
      credit:   document.getElementById("unCreditSales")
    };

    if (el.net)     el.net.textContent     = money(m.netProfit);
    if (el.sale)    el.sale.textContent    = money(m.saleProfitCollected);
    if (el.serv)    el.serv.textContent    = money(m.serviceProfitCollected);
    if (el.exp)     el.exp.textContent     = money(m.totalExpenses);
    if (el.stock)   el.stock.textContent   = money(m.stockInvestSold);
    if (el.servInv) el.servInv.textContent = money(m.serviceInvestCompleted);
    if (el.credit)  el.credit.textContent  = money(m.pendingCreditTotal);

    window.__unMetrics = m;
  }

  window.updateUniversalBar = updateUniversalBar;

  /* -----------------------------------------------------------
     COLLECT HANDLER (WITH CLOUD OFFSETS)
  ----------------------------------------------------------- */
  async function collect(kind) {
    const m = window.__unMetrics || {};
    const offs = window.__offsets;

    const map = {
      net:    ["Net Profit",                    m.netProfit,              "net"],
      stock:  ["Stock Investment (Sold Items)", m.stockInvestSold,        "stock"],
      service:["Service Investment",            m.serviceInvestCompleted, "servInv"]
    };

    if (!map[kind]) return;

    const [label, available, key] = map[kind];

    if (num(available) <= 0)
      return alert("Nothing to collect.");

    const amount = num(prompt(`${label}\nAvailable: ₹${available}\nEnter amount:`));
    if (amount <= 0) return alert("Invalid amount");

    const note = prompt("Optional note:", "") || "";

    // Add collection record
    window.addCollectionEntry(label, note, amount);

    // Update offset
    offs[key] = num(offs[key] || 0) + amount;

    // Special: Net → Sale & Service base reset
    if (kind === "net") {
      offs.sale =
        num(window.sales?.reduce((a,s)=>a+num(s.profit||0),0) || 0);
      offs.service =
        num(window.services?.reduce((a,j)=>a+num(j.profit||0),0) || 0);
    }

    await saveOffsets(offs);
    updateUniversalBar();
    window.renderCollection?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();

    alert("Collected successfully!");
  }

  window.handleCollect = collect;

  /* -----------------------------------------------------------
     AUTO BUTTON HANDLER
  ----------------------------------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    collect(btn.dataset.collect);
  });

  /* -----------------------------------------------------------
     INIT (LOAD CLOUD OFFSETS)
  ----------------------------------------------------------- */
  window.addEventListener("load", () => {
    setTimeout(initOffsets, 300);
  });

})();
