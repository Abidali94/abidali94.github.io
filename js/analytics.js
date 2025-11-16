/* ==========================================================
   📊 analytics.js — Smart Dashboard (v2.0)
   Works with: sales.js, stock.js, core.js
   Uses: Chart.js
   ========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   FORMAT DATE TO YYYY-MM-DD
---------------------------------------------------------- */
function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

/* ----------------------------------------------------------
   GET RANGE DATES
---------------------------------------------------------- */
function getStartOfWeek() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diff = today.getDate() - day;
  return formatDate(new Date(today.setDate(diff)));
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/* ----------------------------------------------------------
   COLLECT SALES DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      paidSales = 0,
      creditSales = 0,
      totalProfit = 0;

  sales.forEach(s => {
    const d = s.date;

    if (!d) return;

    if (d === today) todaySales += s.amount || 0;
    if (d >= weekStart) weekSales += s.amount || 0;
    if (d >= monthStart) monthSales += s.amount || 0;

    if (s.status === "Credit") creditSales += s.amount || 0;
    else paidSales += s.amount || 0;

    totalProfit += s.profit || 0;
  });

  return {
    todaySales,
    weekSales,
    monthSales,
    paidSales,
    creditSales,
    totalProfit
  };
}

/* ----------------------------------------------------------
   RENDER ANALYTICS CHARTS
---------------------------------------------------------- */
function renderAnalytics() {
  const data = getAnalyticsData();

  const barCanvas = document.getElementById("salesBar");
  const pieCanvas = document.getElementById("salesPie");

  if (!barCanvas || !pieCanvas) return;

  // Destroy old charts to prevent "canvas already in use"
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ========== BAR CHART ========== */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [
        {
          label: "Sales (₹)",
          data: [data.todaySales, data.weekSales, data.monthSales],
          backgroundColor: ["#ffa726", "#fb8c00", "#ef6c00"],
          borderRadius: 8,
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: "Sales Summary" },
        legend: { display: false }
      }
    }
  });

  /* ========== PIE CHART ========== */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales"],
      datasets: [
        {
          data: [data.paidSales, data.creditSales],
          backgroundColor: ["#43a047", "#42a5f5"],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Total Profit: ₹${data.totalProfit}`
        }
      }
    }
  });

  // Also update summary cards if that module exists
  if (typeof updateSummaryCards === "function") {
    updateSummaryCards();
  }
}

/* ----------------------------------------------------------
   AUTO UPDATE EVERY 60s
---------------------------------------------------------- */
setInterval(() => {
  try {
    renderAnalytics();
  } catch (err) {}
}, 60000);

/* ----------------------------------------------------------
   LISTEN FOR LOCALSTORAGE CHANGES
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try {
    renderAnalytics();
  } catch (e) {}
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try {
    renderAnalytics();
  } catch (e) {}
});

/* Export */
window.renderAnalytics = renderAnalytics;
window.ensureChartsLoadedAndRender = renderAnalytics;
