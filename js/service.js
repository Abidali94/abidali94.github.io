/* ===========================================================
   🛠 service.js — Service / Repair Manager (v13 UI UPGRADED)
   • Colorful tables (mobile + desktop)
   • data-label support for mobile responsive tables
   • Status badges with your global CSS
   • Fully compatible with your dashboard & analytics
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const esc = x => (x === undefined || x === null) ? "" : String(x);

  const toDisplay  = window.toDisplay;
  const toInternal = window.toInternal;
  const todayDate  = window.todayDate;

  let svcPie = null;

  /* -----------------------------
      STORAGE HELPERS
  ------------------------------ */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); return; } catch (e) {}
    }
    try { localStorage.setItem("services", JSON.stringify(window.services)); } catch {}
  }

  /* -----------------------------
      JOB ID GENERATOR
  ------------------------------ */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    const n = max + 1;
    return {
      jobNum: n,
      jobId: String(n).padStart(2, "0")
    };
  }

  /* -----------------------------
      ADD SERVICE JOB
  ------------------------------ */
  function addServiceJob() {

    let received = qs("#svcReceivedDate")?.value || todayDate();
    if (received.split("-")[0].length === 2)
      received = toInternal(received);

    const customer = esc(qs("#svcCustomer")?.value.trim());
    const phone    = esc(qs("#svcPhone")?.value.trim());
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = esc(qs("#svcModel")?.value.trim());
    const problem  = esc(qs("#svcProblem")?.value.trim());
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem)
      return alert("Please fill Customer, Phone, Problem.");

    const ids = nextJobId();

    const job = {
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      jobNum: ids.jobNum,
      jobId: ids.jobId,
      date_in: received,
      date_out: "",
      customer,
      phone,
      item,
      model,
      problem,
      advance,
      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,
      returnedAdvance: 0,
      status: "Pending"
    };

    ensureServices().push(job);
    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
  }

  /* -----------------------------
      COMPLETE JOB
  ------------------------------ */
  function markCompleted(id) {
    const list = ensureServices();
    const job = list.find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Amount Collected ₹:", job.paid || 0) || 0);

    const remaining = full - job.advance;
    const profit    = full - invest;

    if (!confirm(
      `Save this job?\n\nInvest: ₹${invest}\nAdvance: ₹${job.advance}\nFull: ₹${full}\nRemaining: ₹${remaining}\nProfit: ₹${profit}`
    )) return;

    job.invest = invest;
    job.paid = full;
    job.remaining = remaining;
    job.profit = profit;
    job.status = "Completed";
    job.date_out = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
  }

  /* -----------------------------
      FAIL RETURNED
  ------------------------------ */
  function markFailed(id) {
    const list = ensureServices();
    const job = list.find(j => j.id === id);
    if (!job) return;

    const returned = Number(prompt("Advance returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = returned;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
  }

  /* -----------------------------
      DELETE JOB
  ------------------------------ */
  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;
    window.services = ensureServices().filter(j => j.id !== id);
    persistServices();
    renderServiceTables();
  }

  /* -----------------------------
      QUICK MENU FOR A JOB
  ------------------------------ */
  function openJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const msg =
      `Job ${j.jobId}\n` +
      `Customer: ${j.customer}\nPhone: ${j.phone}\n` +
      `Item: ${j.item} - ${j.model}\nProblem: ${j.problem}\nAdvance: ₹${j.advance}\n\n` +
      `1 - Completed\n2 - Failed/Returned`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id);
    if (ch === "2") return markFailed(id);
  }

  /* ==========================================================
       🚀 RENDER PENDING + HISTORY TABLES (NEW UI)
  ========================================================== */
  function renderServiceTables() {

    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const pending   = list.filter(j => j.status === "Pending");
    const completed = list.filter(j => j.status === "Completed");
    const failed    = list.filter(j => j.status === "Failed/Returned");

    /* ------------------------
        BADGE MAKER
    ------------------------ */
    const badge = s => {
      if (s === "Pending")
        return `<span class='status-credit'>Pending</span>`;
      if (s === "Completed")
        return `<span class='status-paid'>Completed</span>`;
      return `<span class='status-credit' style='background:#e53935'>Failed</span>`;
    };

    /* ------------------------
        PENDING TABLE (UI)
    ------------------------ */
    pendBody.innerHTML =
      pending.map(j => `
        <tr>
          <td data-label="Job ID">${j.jobId}</td>
          <td data-label="Received">${toDisplay(j.date_in)}</td>
          <td data-label="Customer">${esc(j.customer)}</td>
          <td data-label="Phone">${esc(j.phone)}</td>
          <td data-label="Item">${esc(j.item)}</td>
          <td data-label="Model">${esc(j.model)}</td>
          <td data-label="Problem">${esc(j.problem)}</td>
          <td data-label="Status">${badge(j.status)}</td>
          <td data-label="Action">
            <button class="small-btn svc-view" data-id="${j.id}">Open</button>
            <button class="small-btn svc-del" data-id="${j.id}" style="background:#b71c1c">🗑</button>
          </td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9">No pending jobs</td></tr>`;

    /* ------------------------
        HISTORY TABLE (UI)
    ------------------------ */
    histBody.innerHTML =
      [...completed, ...failed].map(j => `
        <tr>
          <td data-label="Job ID">${j.jobId}</td>
          <td data-label="Received">${toDisplay(j.date_in)}</td>
          <td data-label="Completed">${toDisplay(j.date_out)}</td>
          <td data-label="Customer">${esc(j.customer)}</td>
          <td data-label="Item">${esc(j.item)}</td>
          <td data-label="Invest">₹${j.invest}</td>
          <td data-label="Paid">₹${j.paid}</td>
          <td data-label="Profit">₹${j.profit}</td>
          <td data-label="Status">${badge(j.status)}</td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9">No history</td></tr>`;

    /* ------------------------
        SUMMARY CARDS
    ------------------------ */
    qs("#svcPendingCount").textContent   = pending.length;
    qs("#svcCompletedCount").textContent = completed.length;

    const totalProfit = list.reduce((s, j) => s + Number(j.profit || 0), 0);
    qs("#svcTotalProfit").textContent = "₹" + totalProfit;

    renderServicePie();
  }

  /* ==========================================================
      PIE CHART
  ========================================================== */
  function renderServicePie() {
    const ctx = qs("#svcPie");
    if (!ctx) return;

    const list = ensureServices();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (svcPie) svcPie.destroy();

    svcPie = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{
          data: [P, C, F],
          backgroundColor: ["#FFEB3B", "#4CAF50", "#E53935"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  /* ----------------------------- */
  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);
  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    persistServices();
    renderServiceTables();
  });

  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view")) openJob(e.target.dataset.id);
    if (e.target.classList.contains("svc-del"))  deleteServiceJob(e.target.dataset.id);
  });

  window.addEventListener("load", renderServiceTables);

  window.renderServiceTables = renderServiceTables;

})();
