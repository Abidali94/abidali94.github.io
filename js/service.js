/* ===========================================================
   🛠 service.js — BUSINESS SAFE VERSION (v13)
   ⭐ Correct profit tracking
   ⭐ Safe history clear
   ⭐ Safe universal offset refresh
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);

  const escSafe       = window.esc || (x => x == null ? "" : String(x));
  const toDisplay     = window.toDisplay          || (d => d);
  const toInternalIf  = window.toInternalIfNeeded || (d => d);
  const todayDateFn   = window.todayDate          || (() => new Date().toISOString().slice(0, 10));

  let svcPieInstance = null;

  /* ===========================================================
     STORAGE HELPERS
  ============================================================ */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); return; } catch {}
    }
    localStorage.setItem("service-data", JSON.stringify(window.services || []));
  }

  /* ===========================================================
     SAFE REFRESH (Correct order always)
  ============================================================ */
  function fullRefresh() {
    try { renderServiceTables(); }         catch {}
    try { renderSvcPie(); }                catch {}
    try { window.renderAnalytics?.(); }    catch {}
    try { window.updateSummaryCards?.(); } catch {}
    try { window.renderCollection?.(); }   catch {}

    /* ⭐ Delay universal bar ensures TRUE profit after changes */
    setTimeout(() => {
      window.updateUniversalBar?.();
      window.updateTabSummaryBar?.();
    }, 50);
  }

  /* ===========================================================
     ADD NEW JOB
  ============================================================ */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max  = nums.length ? Math.max(...nums) : 0;
    const n = max + 1;
    return {
      jobNum: n,
      jobId: String(n).padStart(2, "0")
    };
  }

  function addServiceJob() {
    let received = qs("#svcReceivedDate")?.value || todayDateFn();
    received = toInternalIf(received);

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone    = (qs("#svcPhone")?.value || "").trim();
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = (qs("#svcModel")?.value || "").trim();
    const problem  = (qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone & Problem");
      return;
    }

    const ids = nextJobId();

    const job = {
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      jobNum: ids.jobNum,
      jobId:  ids.jobId,
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
    fullRefresh();

    /* ⭐ CLEAR FORM UI */
    qs("#svcCustomer").value = "";
    qs("#svcPhone").value = "";
    qs("#svcModel").value = "";
    qs("#svcProblem").value = "";
    qs("#svcAdvance").value = "";
  }

  /* ===========================================================
     COMPLETE JOB
  ============================================================ */
  function markCompleted(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Bill ₹:", job.paid || 0) || 0);

    if (!full || full <= 0) return alert("Invalid bill amount");

    const profit = full - invest;
    const adv    = Number(job.advance || 0);

    job.invest = invest;     // TRUE investment
    job.profit = profit;     // TRUE profit
    job.date_out = todayDateFn();

    if (mode === "paid") {
      const collect = full - adv;

      if (!confirm(`Collect Now: ₹${collect}\nProfit: ₹${profit}`)) return;

      job.paid      = full;
      job.remaining = 0;
      job.status    = "Completed";

      if (collect > 0)
        window.addCollectionEntry(
          "Service (Paid)",
          `Job ${job.jobId}`,
          collect
        );

    } else {
      const due = full - adv;
      if (!confirm(`Pending Credit: ₹${due}\nProfit added when paid`)) return;

      job.paid      = adv;
      job.remaining = due;
      job.status    = "Credit";
    }

    persistServices();
    fullRefresh();
  }

  /* ===========================================================
     FAILED JOB
  ============================================================ */
  function markFailed(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const ret = Number(prompt("Advance Returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = ret;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = todayDateFn();

    persistServices();
    fullRefresh();
  }

  /* ===========================================================
     OPEN JOB MENU
  ============================================================ */
  function openJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const msg =
      `Job ${j.jobId}\nCustomer: ${j.customer}\nPhone: ${j.phone}\nItem: ${j.item}\nModel: ${j.model}\nProblem: ${j.problem}\nAdvance: ₹${j.advance}\n\n` +
      `1 - Completed (Paid)\n` +
      `2 - Completed (Credit)\n` +
      `3 - Failed/Returned`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id, "paid");
    if (ch === "2") return markCompleted(id, "credit");
    if (ch === "3") return markFailed(id);
  }

  /* ===========================================================
     CLEAR ALL SERVICE JOBS ⭐ SAFE ⭐
  ============================================================ */
  window.clearAllServiceJobs = function () {
    if (!confirm("Clear ALL Service Job history?")) return;

    /* 1️⃣ Clear only history */
    window.services = [];
    persistServices();

    /* 2️⃣ Reset ONLY service investment offset — NOT net offset */
    window.collectedServiceTotal = 0;
    window.saveCollectedServiceTotal?.();

    /* 3️⃣ Refresh everything safely */
    fullRefresh();
  };

  /* ===========================================================
     TABLE + PIE CHART
  ============================================================ */
  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();
    const pending = list.filter(j => j.status === "Pending");

    pendBody.innerHTML =
      pending.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${escSafe(j.customer)}</td>
          <td>${escSafe(j.phone)}</td>
          <td>${escSafe(j.item)}</td>
          <td>${escSafe(j.model)}</td>
          <td>${escSafe(j.problem)}</td>
          <td>Pending</td>
          <td>
            <button class="small-btn svc-view" data-id="${j.id}">Open</button>
          </td>
        </tr>
      `).join("") || `<tr><td colspan="9" style="text-align:center;">No pending</td></tr>`;

    const history = list.filter(j => j.status !== "Pending");

    histBody.innerHTML =
      history.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${escSafe(j.customer)}</td>
          <td>${escSafe(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
        </tr>
      `).join("") || `<tr><td colspan="9" style="text-align:center;">No history</td></tr>`;

    renderSvcPie();
  }

  function renderSvcPie() {
    const canvas = qs("#svcPie");
    if (!canvas || typeof Chart === "undefined") return;

    const list = ensureServices();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (svcPieInstance) svcPieInstance.destroy();

    svcPieInstance = new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{
          data: [P, C, F],
          backgroundColor: ["#facc15", "#22c55e", "#ef4444"]
        }]
      }
    });
  }

  /* ===========================================================
     EVENT LISTENERS
  ============================================================ */
  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view"))
      openJob(e.target.dataset.id);
  });

  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);
  qs("#clearServiceBtn")?.addEventListener("click", clearAllServiceJobs);

  window.addEventListener("load", () => {
    renderServiceTables();
  });

  window.renderServiceTables = renderServiceTables;

})();
