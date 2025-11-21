/* ===========================================================
   📦 profits.js — Profit Tab Logic (v1.0)
   Works with core.js ProfitBox module
=========================================================== */

console.log("profits.js loaded");

// Shortcuts
const qs = s => document.querySelector(s);

/* ----------------------------------------------------------
   RENDER PROFIT BOX UI
---------------------------------------------------------- */
window.renderProfitBox = function () {
  if (!window.getProfitBox) return;

  const box = window.getProfitBox();

  qs("#pb_stockInv").textContent  = "₹" + box.stockInv;
  qs("#pb_salesProf").textContent = "₹" + box.salesProf;
  qs("#pb_svcInv").textContent    = "₹" + box.svcInv;
  qs("#pb_svcProf").textContent   = "₹" + box.svcProf;

  renderProfitPie();
};

/* ----------------------------------------------------------
   PIE CHART (Investment / Profit / Credit / Expenses)
---------------------------------------------------------- */
let profitPie = null;

function renderProfitPie() {
  const ctx = qs("#profitPie");
  if (!ctx) return;

  const box = window.getProfitBox();
  const data = window.getAnalyticsData?.() || {};

  const totalInvestment =
    Number(box.stockInv) + Number(box.svcInv);

  const totalProfit =
    Number(box.salesProf) + Number(box.svcProf);

  const expenses = Number(data.totalExpenses || 0);
  const credit   = Number(data.creditSales || 0);

  if (profitPie) profitPie.destroy();

  profitPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [
        "Investment",
        "Profit",
        "Expenses",
        "Credit Sales"
      ],
      datasets: [{
        data: [
          totalInvestment,
          totalProfit,
          expenses,
          credit
        ],
        backgroundColor: [
          "#ffeb3b", // yellow
          "#4caf50", // green
          "#e53935", // red
          "#2196f3"  // blue
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: "Business Financial Status"
        }
      }
    }
  });
}

/* ----------------------------------------------------------
   COLLECT BUTTON LOGIC
---------------------------------------------------------- */

qs("#pb_collectStockInv")?.addEventListener("click", () => {
  const amt = window.collectStockInv?.() || 0;
  alert(`Stock Investment Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSalesProf")?.addEventListener("click", () => {
  const amt = window.collectSalesProfit?.() || 0;
  alert(`Sales Profit Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSvcInv")?.addEventListener("click", () => {
  const amt = window.collectServiceInv?.() || 0;
  alert(`Service Investment Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSvcProf")?.addEventListener("click", () => {
  const amt = window.collectServiceProfit?.() || 0;
  alert(`Service Profit Collected: ₹${amt}`);
  renderProfitBox();
});

/* ----------------------------------------------------------
   AUTO RENDER
---------------------------------------------------------- */
window.addEventListener("load", () => {
  setTimeout(renderProfitBox, 200);
});
