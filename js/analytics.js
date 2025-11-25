<section id="analytics" class="section">
  <h3>📈 Smart Dashboard (Clean)</h3>
  ...
  <canvas id="cleanPie" height="150"></canvas>
</section>
```4  

So:

- “Overview లో pie chart” అనేది పాత design లో ఉన్నది కావచ్చు  
- కొత్త design లో **pie → Smart Dashboard tab** లో ఉంటుంది

ఇప్పుడే fix చేసే main పని: **`analytics.js` correct కోడ్ పెట్టాలి**.

---

## Step 2: కొత్త `analytics.js` కోడ్ (Overview + Pie కోసం)

ఈ క్రింది file ని **ఖచ్చితంగా** `/js/analytics.js` గా save చేసి upload చెయ్యి  
(పాత తప్పు file మీదే overwrite అవ్వాలి):

```js
// /js/analytics.js
// Smart Dashboard + Overview summary helper (v10 fixed)

// చిన్న helper – already HTML లో qs ఉంది, దాన్నే use అవుతాం
const qsA = window.qs || (s => document.querySelector(s));

(function () {

  let cleanPieChart = null;

  // ---- 1) TODAY SUMMARY (Overview cards కోసం) ----
  window.getAnalyticsData = function () {
    const today =
      (typeof window.todayDate === "function"
        ? window.todayDate()
        : new Date().toISOString().slice(0, 10)); // yyyy-mm-dd

    const sales    = window.sales    || [];
    const expenses = window.expenses || [];
    const services = window.services || [];

    let todaySales    = 0;
    let creditSales   = 0;
    let todayExpenses = 0;
    let grossProfit   = 0;

    // SALES – today (Paid vs Credit)
    sales.forEach(s => {
      if (s.date !== today) return;

      const total =
        Number(s.total || s.amount ||
          ((Number(s.qty || 0)) * Number(s.price || 0)));

      const status = String(s.status || "").toLowerCase();

      if (status === "credit") {
        creditSales += total;
      } else {
        todaySales  += total;
        grossProfit += Number(s.profit || 0);
      }
    });

    // SERVICE – today completed jobs profit
    services.forEach(j => {
      if (!j.date_out || j.date_out !== today) return;
      grossProfit += Number(j.profit || 0);
    });

    // EXPENSES – today
    expenses.forEach(e => {
      if (e.date === today) {
        todayExpenses += Number(e.amount || 0);
      }
    });

    const netProfit = grossProfit - todayExpenses;

    function round(n) {
      return Math.round(Number(n || 0));
    }

    return {
      todaySales:    round(todaySales),
      creditSales:   round(creditSales),
      todayExpenses: round(todayExpenses),
      grossProfit:   round(grossProfit),
      netProfit:     round(netProfit)
    };
  };

  // ---- 2) SMART DASHBOARD (Total cards + cleanPie) ----
  window.renderAnalytics = function () {
    const sales     = window.sales     || [];
    const expenses  = window.expenses  || [];
    const services  = window.services  || [];

    // TOTAL PROFIT = SalesProfit (Paid only) + ServiceProfit (Completed)
    let salesProfit = 0;
    let svcProfit   = 0;

    if (typeof window.getSalesProfitCollected === "function") {
      salesProfit = Number(window.getSalesProfitCollected() || 0);
    } else {
      sales.forEach(s => {
        if (String(s.status || "").toLowerCase() !== "credit") {
          salesProfit += Number(s.profit || 0);
        }
      });
    }

    if (typeof window.getServiceProfitCollected === "function") {
      svcProfit = Number(window.getServiceProfitCollected() || 0);
    } else {
      services
        .filter(s => s.status === "Completed")
        .forEach(s => { svcProfit += Number(s.profit || 0); });
    }

    const totalProfit = salesProfit + svcProfit;

    // TOTAL EXPENSES
    let totalExpenses = 0;
    expenses.forEach(e => {
      totalExpenses += Number(e.amount || 0);
    });

    // TOTAL CREDIT SALES
    let creditTotal = 0;
    sales.forEach(s => {
      if (String(s.status || "").toLowerCase() === "credit") {
        const t =
          Number(s.total || s.amount ||
            ((Number(s.qty || 0)) * Number(s.price || 0)));
        creditTotal += t;
      }
    });

    // TOTAL INVESTMENT (stock + sales + service)
    let totalInvestment = 0;
    if (typeof window.getStockInvestmentCollected === "function") {
      totalInvestment += Number(window.getStockInvestmentCollected() || 0);
    }
    if (typeof window.getSalesInvestmentCollected === "function") {
      totalInvestment += Number(window.getSalesInvestmentCollected() || 0);
    }
    if (typeof window.getServiceInvestmentCollected === "function") {
      totalInvestment += Number(window.getServiceInvestmentCollected() || 0);
    }

    // ---- Update Smart Dashboard cards ----
    if (qsA("#dashProfit"))
      qsA("#dashProfit").textContent = "₹" + Math.round(totalProfit);

    if (qsA("#dashExpenses"))
      qsA("#dashExpenses").textContent = "₹" + Math.round(totalExpenses);

    if (qsA("#dashCredit"))
      qsA("#dashCredit").textContent = "₹" + Math.round(creditTotal);

    if (qsA("#dashInv"))
      qsA("#dashInv").textContent = "₹" + Math.round(totalInvestment);

    // ---- Pie chart (cleanPie) ----
    const ctx = document.getElementById("cleanPie");
    if (!ctx || typeof Chart === "undefined") return;

    if (cleanPieChart) {
      cleanPieChart.destroy();
    }

    cleanPieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Profit", "Expenses", "Credit", "Investment"],
        datasets: [{
          data: [
            totalProfit,
            totalExpenses,
            creditTotal,
            totalInvestment
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  };

  // optional: auto render when file first loads (data ఉంటే వెంటనే)
  window.addEventListener("load", () => {
    try { window.renderAnalytics?.(); } catch (e) { console.warn(e); }
    try { window.updateSummaryCards?.(); } catch (e) { console.warn(e); }
  });

})();
