/* ===========================================================
   🛠 service.js — Service / Repair Manager (v12 FINAL)
   • Job IDs: 01, 02, 03...
   • Status: Pending / Completed / Failed/Returned
   • Pie chart: Pending (yellow) / Completed (green) / Failed (red)
   • Compatible with core.js + analytics.js + profit tab
=========================================================== */

(function () {

  const qs   = window.qs  || (s => document.querySelector(s));
  const toDisplay  = window.toDisplay  || (d => d || "");
  const toInternal = window.toInternal || (d => d || "");
  const todayDate  = window.todayDate  || ( ) => new Date().toISOString().slice(0, 10);
  const uid        = window.uid        || (p => (p || "svc") + "_" + Math.random().toString(36).slice(2, 9));
  const esc        = window.esc        || (x => (x ?? "").toString());

  let svcPie = null;

  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    const list = ensureServices();
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); return; } catch (e) { console.warn("saveServices error", e); }
    }
    // local fallback (optional)
    try {
      localStorage.setItem("services", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("services local save failed", e);
    }
  }

  // convert dd-mm-yyyy -> yyyy-mm-dd if needed
  function normalizeDateInput(d) {
    if (!d) return "";
    const parts = d.split("-");
    if (parts[0].length === 2) {
      return toInternal(d);
    }
    return d;
  }

  /* ---------- JOB ID AUTO NUMBER ---------- */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    const n = max + 1;
    return {
      jobNum: n,
      jobId : String(n).padStart(2, "0")
    };
  }

  /* =====================================================
       ADD JOB
     ===================================================== */
  function addServiceJob() {

    let receivedRaw = qs("#svcReceivedDate")?.value || todayDate();
    const date_in = normalizeDateInput(receivedRaw);

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone    = (qs("#svcPhone")?.value || "").trim();
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = (qs("#svcModel")?.value || "").trim();
    const problem  = (qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone and Problem fields.");
      return;
    }

    const ids = nextJobId();

    const job = {
      id: uid("svc"),
      jobNum: ids.jobNum,
      jobId : ids.jobId,
      date_in,
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

    const list = ensureServices();
    list.push(job);
    persistServices();
    clearForm();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  function clearForm() {
    ["svcReceivedDate","svcCustomer","svcPhone","svcModel","svcProblem","svcAdvance"]
      .forEach(id => { if (qs("#" + id)) qs("#" + id).value = ""; });
  }

  /* =====================================================
       COMPLETE JOB
     ===================================================== */
  function markCompleted(id) {
    const list = ensureServices();
    const job = list.find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    if (isNaN(invest)) return;

    const full = Number(prompt("Total Amount Collected (FULL) ₹:", job.paid || 0) || 0);
    if (isNaN(full)) return;

    const remaining = full - Number(job.advance || 0);
    const profit    = full - invest;

    if (!confirm(
`Save this job?

Invest:      ₹${invest}
Advance:     ₹${job.advance || 0}
Full Amount: ₹${full}
Remaining:   ₹${remaining}
Profit:      ₹${profit}`
    )) return;

    job.invest    = invest;
    job.paid      = full;
    job.remaining = remaining;
    job.profit    = profit;
    job.status    = "Completed";
    job.date_out  = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  /* =====================================================
       FAILED / RETURNED
     ===================================================== */
  function markFailed(id) {
    const list = ensureServices();
    const job = list.find(j => j.id === id);
    if (!job) return;

    const returned = Number(prompt(
      "Advance returned to customer ₹:",
      job.advance || job.returnedAdvance || 0
    ) || 0);
    if (isNaN(returned)) return;

    job.returnedAdvance = returned;
    job.invest    = 0;
    job.paid      = 0;
    job.remaining = 0;
    job.profit    = 0;
    job.status    = "Failed/Returned";
    job.date_out  = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  /* =====================================================
       DELETE / CLEAR
     ===================================================== */
  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;

    const list = ensureServices();
    window.services = list.filter(j => j.id !== id);
    persistServices();

    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  function clearAllServices() {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  /* =====================================================
       OPEN JOB (Popup: Completed / Failed)
     ===================================================== */
  function openJob(id) {
    const list = ensureServices();
    const j = list.find(x => x.id === id);
    if (!j) return;

    const msg =
`Job ${j.jobId || ""}
Customer: ${j.customer}
Phone:    ${j.phone}
Item:     ${j.item} - ${j.model}
Problem:  ${j.problem}
Advance:  ₹${j.advance || 0}

1 - Mark as Completed
2 - Mark as Failed / Returned`;

    const choice = prompt(msg, "1");
    if (choice === "1") return markCompleted(id);
    if (choice === "2") return markFailed(id);
  }

  /* =====================================================
       RENDER TABLES
     ===================================================== */
  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const pending   = list.filter(j => j.status === "Pending");
    const completed = list.filter(j => j.status === "Completed");
    const failed    = list.filter(j => j.status === "Failed/Returned");

    /* Pending / Active jobs */
    pendBody.innerHTML = pending.map(j => `
      <tr>
        <td>${esc(j.jobId || "")}</td>
        <td>${toDisplay(j.date_in)}</td>
        <td>${esc(j.customer)}</td>
        <td>${esc(j.phone)}</td>
        <td>${esc(j.item)}</td>
        <td>${esc(j.model)}</td>
        <td>${esc(j.problem)}</td>
        <td>${j.status || "Pending"}</td>
        <td>
          <button class="small-btn svc-view" data-id="${j.id}">Open</button>
          <button class="small-btn svc-del" data-id="${j.id}"
            style="background:#b71c1c;color:#fff">🗑</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9">No pending jobs</td></tr>`;

    /* Completed + Failed history */
    const historyRows = [...completed, ...failed];

    histBody.innerHTML = historyRows.map(j => {
      const isFailed = (j.status === "Failed/Returned");
      const statusText = isFailed
        ? `Failed/Returned${j.returnedAdvance ? " (Returned ₹" + j.returnedAdvance + ")" : ""}`
        : "Completed";

      return `
        <tr>
          <td>${esc(j.jobId || "")}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${toDisplay(j.date_out)}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${j.invest || 0}</td>
          <td>₹${j.paid || 0}</td>
          <td>₹${j.profit || 0}</td>
          <td>${statusText}</td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="9">No history</td></tr>`;

    /* Summary cards */
    qs("#svcPendingCount")   && (qs("#svcPendingCount").textContent   = pending.length);
    qs("#svcCompletedCount") && (qs("#svcCompletedCount").textContent = completed.length);

    const totalProfit = list.reduce((s, j) => s + Number(j.profit || 0), 0);
    qs("#svcTotalProfit") && (qs("#svcTotalProfit").textContent = "₹" + totalProfit);

    renderServicePie();
  }

  /* =====================================================
       PIE CHART — Pending / Completed / Failed
     ===================================================== */
  function renderServicePie() {
    const ctx = qs("#svcPie");
    if (!ctx || typeof Chart === "undefined") return;

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
          backgroundColor: ["#FFEB3B", "#4CAF50", "#E53935"] // yellow, green, red
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  /* =====================================================
       EVENTS
     ===================================================== */
  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);
  qs("#clearServiceBtn")?.addEventListener("click", clearAllServices);

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.classList.contains("svc-view")) {
      openJob(t.dataset.id);
    }
    if (t.classList.contains("svc-del")) {
      deleteServiceJob(t.dataset.id);
    }
  });

  window.addEventListener("load", renderServiceTables);

  // expose for other modules
  window.renderServiceTables = renderServiceTables;

})();
