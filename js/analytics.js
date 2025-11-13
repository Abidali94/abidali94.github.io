/* ==========================================================
   📊 analytics.js — Smart Dashboard Charts
   Works with: sales.js, core.js, stock.js
   Uses: Chart.js
   ========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   GET AGGREGATED SALES DATA
---------------------------------------------------------- */
function getSalesData() {
  const sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  const todayStr = todayDate();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let todaySales = 0,
    weekSales = 0,
    monthSales = 0,
    paidSales = 0,
    creditSales = 0,
    totalProfit = 0;

  sales.forEach(s => {
    const d = new Date(s.date);
    const amount = s.amount || 0;
    const profit = s.profit || 0;

    if (s.date === todayStr) todaySales += amount;
    if (d >= startOfWeek) weekSales += amount;
    if (d >= startOfMonth) monthSales += amount;

    if (s.status === "Credit") creditSales += amount;
    else paidSales += amount;

    totalProfit += profit;
  });

  return {
    todaySales,
    weekSales,
    monthSales,
    paidSales,
    creditSales,
    totalProfit,
  };
}

/* ----------------------------------------------------------
   RENDER FULL ANALYTICS DASHBOARD
---------------------------------------------------------- */
function renderAnalytics() {
  const data = getSalesData();

  const barCanvas = document.getElementById("salesBar");
  const pieCanvas = document.getElementById("salesPie");

  if (!barCanvas || !pieCanvas) return;

  /* Destroy old charts (avoid duplicate rendering errors) */
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
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: "Sales Summary" },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
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
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Total Profit: ₹${data.totalProfit.toFixed(2)}`,
        },
      },
    },
  });
}

/* ----------------------------------------------------------
   AUTO REFRESH ANALYTICS
---------------------------------------------------------- */
window.addEventListener("load", () => {
  renderAnalytics();
});

window.addEventListener("storage", () => {
  renderAnalytics();
});

/* Auto update every 60 seconds */
setInterval(() => {
  renderAnalytics();
}, 60000);

/* Expose for debugging */
window.renderAnalytics = renderAnalytics;
