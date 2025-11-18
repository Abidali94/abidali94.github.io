/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v7.0)
   ✔ Full dd-mm-yyyy / yyyy-mm-dd internal support
   ✔ Includes Service/Repair Profits
   ✔ Works with stock, sales, expenses, service modules
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   DATE HELPERS
---------------------------------------------------------- */

function toNum(d) {
  return d ? Number(d.replace(/-/g, "")) : 0;
}

function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay(); 
  t.setDate(t.getDate() - day);
  return formatDate(t);
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS DATA
   (SALES + SERVICE PROFIT INCLUDED)
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const services = window.services || [];

  const today = todayDate(); 
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const todayN = toNum(today);
  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;
  let paidSales = 0;
  let creditSales = 0;
  let grossProfit = 0;
  let serviceProfitTotal = 0;

  /* ----- SALES DATA ----- */
  sales.forEach(s => {
    if (!s.date) return;

    const d = s.date;
    const dNum = toNum(d);
    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    if (s.status === "Credit") creditSales += amt;
    else paidSales += amt;

    grossProfit += prof;
  });

  /* ----- SERVICE PROFITS ----- */
  services.forEach(j => {
    serviceProfitTotal += Number(j.profit || 0);
  });

  grossProfit += serviceProfitTotal; // add repair profit

  const todayExpenses = getExpensesByDate(today);
  const netProfit = grossProfit - todayExpenses;

  return {
    todaySales,
    weekSales,
    monthSales,
    paidSales,
    creditSales,
    serviceProfitTotal,
    grossProfit,
    todayExpenses,
    netProfit
  };
}

/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");

  if (!barCanvas || !pieCanvas) return;

  const data = getAnalyticsData();

  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ------------------ BAR CHART ------------------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [{
        label: "Sales ₹",
        data: [data.todaySales, data.weekSales, data.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 8
      }]
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

  /* ------------------ PIE CHART ------------------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales", "Service Profit"],
      datasets: [{
        data: [
          data.paidSales,
          data.creditSales,
          data.serviceProfitTotal
        ],
        backgroundColor: ["#4caf50", "#2196f3", "#9c27b0"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Gross: ₹${data.grossProfit} | Net: ₹${data.netProfit}`
        }
      }
    }
  });

  updateSummaryCards?.();
}

/* ----------------------------------------------------------
   AUTO REFRESH
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 45000);

/* ----------------------------------------------------------
   STORAGE SYNC
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
