// core.js — Theme, Tabs, Lazy Loader, Safe Init, Summary Updater + Cloud Sync
(function () {
  console.log("%c⚙️ KharchaSaathi Core Loaded", "color:#ff7a00;font-weight:bold;");

  /* -----------------------------
     🌗 THEME INITIALIZATION
  ----------------------------- */
  const body = document.body;
  const themeBtn = document.getElementById("themeBtn");

  // Load saved theme
  if (localStorage.getItem("ks-theme") === "dark") body.classList.add("dark");

  // Toggle theme
  themeBtn &&
    themeBtn.addEventListener("click", () => {
      body.classList.toggle("dark");
      localStorage.setItem(
        "ks-theme",
        body.classList.contains("dark") ? "dark" : "light"
      );
    });

  /* -----------------------------
     💬 HELP MODAL HANDLER
  ----------------------------- */
  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const closeHelp = document.getElementById("closeHelp");

  if (helpBtn && helpModal) {
    helpBtn.addEventListener("click", () => {
      helpModal.style.display = "flex";
      helpModal.setAttribute("aria-hidden", "false");
    });
  }
  closeHelp &&
    closeHelp.addEventListener("click", () => {
      helpModal.style.display = "none";
      helpModal.setAttribute("aria-hidden", "true");
    });

  /* -----------------------------
     🧭 TAB SYSTEM
  ----------------------------- */
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const sections = Array.from(document.querySelectorAll(".section"));

  function setActiveTab(tabEl) {
    const id = tabEl.dataset.tab;
    tabs.forEach((t) => t.classList.remove("active"));
    sections.forEach((s) => {
      s.classList.remove("active");
      s.setAttribute("aria-hidden", "true");
    });

    tabEl.classList.add("active");
    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
      target.setAttribute("aria-hidden", "false");
    }

    lazyLoadModule(id);
    if (typeof perTabUpdate === "function") perTabUpdate(id);
  }

  tabs.forEach((t) => t.addEventListener("click", () => setActiveTab(t)));

  /* -----------------------------
     ⚡ LAZY MODULE LOADER
  ----------------------------- */
  const loadedModules = {};
  const moduleMap = {
    types: "js/types.js",
    stock: "js/stock.js",
    sales: "js/sales.js",
    wanting: "js/wanting.js",
    analytics: "js/analytics.js",
  };

  function lazyLoadModule(id) {
    if (loadedModules[id]) return;
    const src = moduleMap[id];
    if (!src) return;

    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = () => {
      loadedModules[id] = true;
      console.log(`📦 Module loaded: ${id}`);
      if (typeof moduleInit === "function") moduleInit(id);
    };
    s.onerror = (e) => console.warn("⚠️ Module load failed:", src, e);
    document.body.appendChild(s);
  }

  /* -----------------------------
     📊 SUMMARY UPDATE (SAFE)
  ----------------------------- */
  window.updateSummaryCards = function () {
    try {
      const sales = JSON.parse(localStorage.getItem("sales-data") || "[]");
      const stock = JSON.parse(localStorage.getItem("stock-data") || "[]");
      const today = new Date().toISOString().split("T")[0];

      let todaySales = 0,
        todayCredit = 0,
        todayProfit = 0;
      (sales || []).forEach((s) => {
        if (s.date === today) {
          if (s.status === "Paid") todaySales += Number(s.amount || 0);
          if (s.status === "Credit") todayCredit += Number(s.amount || 0);
          todayProfit += Number(s.profit || 0);
        }
      });

      const totalQty = (stock || []).reduce((a, b) => a + Number(b.qty || 0), 0);
      const soldQty = (stock || []).reduce((a, b) => a + Number(b.sold || 0), 0);
      const remainPct = totalQty
        ? Math.round(((totalQty - soldQty) / totalQty) * 100)
        : 0;

      const el = (id) => document.getElementById(id);
      el("todaySales").textContent =
        "₹" + (Math.round(todaySales * 100) / 100).toFixed(2);
      el("todayCredit").textContent =
        "₹" + (Math.round(todayCredit * 100) / 100).toFixed(2);
      el("todayProfit").textContent =
        "₹" + (Math.round(todayProfit * 100) / 100).toFixed(2);
      el("stockRemain").textContent = remainPct + "%";
    } catch (e) {
      console.warn("⚠️ updateSummaryCards failed:", e);
    }
  };

  /* -----------------------------
     💾 AUTO-SAVE ON CLOSE (Local)
  ----------------------------- */
  window.addEventListener("beforeunload", () => {
    try {
      if (typeof window.saveAll === "function") window.saveAll();
      if (typeof window.saveSales === "function") window.saveSales();
    } catch (e) {
      console.warn("⚠️ Auto-save skipped:", e);
    }
  });

  /* -----------------------------
     ☁️ CLOUD AUTO SYNC (Firebase)
  ----------------------------- */
  window.addEventListener("beforeunload", async () => {
    try {
      if (typeof cloudSave === "function" && typeof localStorage !== "undefined") {
        await cloudSave("sales", JSON.parse(localStorage.getItem("sales-data") || "[]"));
        await cloudSave("stock", JSON.parse(localStorage.getItem("stock-data") || "[]"));
        await cloudSave("types", JSON.parse(localStorage.getItem("types-data") || "[]"));
      }
    } catch (e) {
      console.warn("☁️ Cloud sync skipped:", e);
    }
  });

  /* -----------------------------
     🔁 PER-TAB UPDATES
  ----------------------------- */
  window.perTabUpdate = function (id) {
    if (id === "dashboard") updateSummaryCards();
    if (id === "analytics" && typeof window.renderAnalytics === "function")
      window.renderAnalytics();
    if (id === "stock" && typeof window.renderStock === "function")
      window.renderStock();
    if (id === "types" && typeof window.renderTypes === "function")
      window.renderTypes();
    if (id === "sales" && typeof window.renderSales === "function")
      window.renderSales();
  };

  /* -----------------------------
     🚀 INITIAL LOAD
  ----------------------------- */
  window.addEventListener("load", () => {
    updateSummaryCards();
    console.log("%c✅ Dashboard initialized", "color:#4caf50;font-weight:bold;");
  });

  // Expose loader for debugging
  window.lazyLoadModule = lazyLoadModule;
})();
