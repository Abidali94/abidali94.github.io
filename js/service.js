/* ===========================================================
   service.js — FINAL 2025 STABLE VERSION
   ✔ Tab open → data loads immediately
   ✔ Filters never reset automatically
   ✔ Date filter = Calendar + All Dates option
   ✔ Pie charts always load
=========================================================== */

(function () {

  const qs  = sel => document.querySelector(sel);
  const esc = v => (v == null ? "" : String(v));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  let pieStatus = null;
  let pieMoney  = null;

  /* ---------------------------------------------
        STORAGE HELPERS
  --------------------------------------------- */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function save() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch {}
  }

  /* ---------------------------------------------
        POPULATE FILTERS — ONLY ONCE!
  --------------------------------------------- */
  function populateFiltersOnce() {
    /* TYPE filter */
    const typeEl = qs("#svcFilterType");
    if (typeEl) {
      // Keep default options from HTML — no overwrite needed
      // but update based on dynamic types if present:
      if (Array.isArray(window.types)) {
        typeEl.innerHTML =
          `<option value="all">All</option>` +
          window.types.map(t =>
            `<option value="${esc(t.name)}">${esc(t.name)}</option>`
          ).join("");
      }
    }

    /* DATE filter build */
    buildDateFilter();
  }

  function buildDateFilter() {
    const dateEl = qs("#svcFilterDate");
    if (!dateEl) return;

    const set = new Set();
    ensureServices().forEach(j => {
      if (j.date_in)  set.add(j.date_in);
      if (j.date_out) set.add(j.date_out);
    });

    const list = [...set].filter(Boolean).sort((a,b)=>b.localeCompare(a));
    dateEl.innerHTML =
      `<option value="">All Dates</option>` +
      list.map(d => `<option value="${d}">${toDisplay(d)}</option>`).join("");
  }

  /* ---------------------------------------------
        GET FILTERED LIST
  --------------------------------------------- */
  function getFiltered() {
    const list = ensureServices();

    const typeVal   = qs("#svcFilterType")?.value || "all";
    const statusVal = (qs("#svcFilterStatus")?.value || "all").toLowerCase();
    const dateVal   = qs("#svcFilterDate")?.value || "";

    let out = [...list];

    /* TYPE filter */
    if (typeVal !== "all") {
      out = out.filter(j => j.item === typeVal);
    }

    /* STATUS filter */
    if (statusVal !== "all") {
      out = out.filter(j => {
        const s = (j.status || "").toLowerCase();
        if (statusVal === "pending") return s === "pending";
        if (statusVal === "completed") return s === "completed" && !j.fromCredit;
        if (statusVal === "credit") return s === "credit";
        if (statusVal === "credit-paid") return s === "completed" && !!j.fromCredit;
        if (statusVal === "failed") return s.includes("failed");
        return true;
      });
    }

    /* DATE filter */
    if (dateVal) {
      out = out.filter(j =>
        j.date_in === dateVal || j.date_out === dateVal
      );
    }

    return out;
  }

  /* ---------------------------------------------
        REFRESH UI
  --------------------------------------------- */
  function refresh() {
    renderCounts();
    renderTables();

    setTimeout(() => {
      drawPieStatus();
      drawPieMoney();
    }, 50);

    try { window.updateUniversalBar?.(); } catch {}
  }

  /* ---------------------------------------------
        COUNTS & TOTAL PROFIT
  --------------------------------------------- */
  function renderCounts() {
    const list = ensureServices();
    const pending = list.filter(j => j.status === "Pending").length;
    const completed = list.filter(j => j.status === "Completed").length;
    const profitSum = list
      .filter(j => j.status === "Completed")
      .reduce((a, b) => a + Number(b.profit || 0), 0);

    qs("#svcPendingCount").textContent = pending;
    qs("#svcCompletedCount").textContent = completed;
    qs("#svcTotalProfit").textContent = "₹" + profitSum;
  }

  /* ---------------------------------------------
        ADD JOB
  --------------------------------------------- */
  function nextId() {
    const nums = ensureServices().map(j => Number(j.jobNum) || 0);
    const m = nums.length ? Math.max(...nums) : 0;
    return {
      jobNum: m + 1,
      jobId:  String(m + 1).padStart(2,"0")
    };
  }

  function addJob() {
    const rcv = toInternal(qs("#svcReceivedDate")?.value || today());
    const customer = esc(qs("#svcCustomer")?.value || "").trim();
    const phone    = esc(qs("#svcPhone")?.value || "").trim();
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = esc(qs("#svcModel")?.value || "");
    const problem  = esc(qs("#svcProblem")?.value || "");
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone, Problem");
      return;
    }

    const idInfo = nextId();
    const job = {
      id: "svc_" + Math.random().toString(36).slice(2),
      jobNum: idInfo.jobNum,
      jobId:  idInfo.jobId,
      date_in: rcv,
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
      status: "Pending",
      fromCredit: false
    };

    ensureServices().push(job);
    save();
    buildDateFilter();
    refresh();
  }

  /* ---------------------------------------------
        COMPLETE JOB
  --------------------------------------------- */
  function completeJob(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Bill ₹:", job.paid || 0) || 0);
    if (!full) return alert("Invalid Total Bill");

    const adv = Number(job.advance || 0);
    const profit = full - invest;

    job.invest = invest;
    job.profit = profit;
    job.date_out = today();

    if (mode === "paid") {
      job.paid = full;
      job.remaining = 0;
      job.status = "Completed";
      job.fromCredit = false;
    } else {
      const due = full - adv;
      job.paid = adv;
      job.remaining = due;
      job.status = "Credit";
      job.fromCredit = false;
    }

    save();
    buildDateFilter();
    refresh();
  }

  /* ---------------------------------------------
        COLLECT CREDIT
  --------------------------------------------- */
  window.collectServiceCredit = function(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job || job.status !== "Credit") return;

    const due = Number(job.remaining || 0);
    if (!confirm(`Collect ₹${due}?`)) return;

    job.paid += due;
    job.remaining = 0;
    job.status = "Completed";
    job.fromCredit = true;

    save();
    refresh();
  };

  /* ---------------------------------------------
        FAIL JOB
  --------------------------------------------- */
  function failJob(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const ret = Number(prompt("Advance Returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = ret;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed";
    job.date_out = today();

    save();
    refresh();
  }

  /* ---------------------------------------------
        RENDER TABLES
  --------------------------------------------- */
  function renderTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");

    if (!pendBody || !histBody) return;

    const f = getFiltered();
    const pending = f.filter(j => j.status === "Pending");
    const history = f.filter(j => j.status !== "Pending");

    pendBody.innerHTML =
      pending.length
        ? pending.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.phone)}</td>
          <td>${esc(j.item)}</td>
          <td>${esc(j.model)}</td>
          <td>${esc(j.problem)}</td>
          <td>Pending</td>
          <td>
            <button class="small-btn svc-view" data-id="${j.id}">View / Update</button>
          </td>
        </tr>`
        ).join("")
        : `<tr><td colspan="9">No pending jobs</td></tr>`;

    histBody.innerHTML =
      history.length
        ? history.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>
            ${j.status === "Credit"
              ? `Credit <button class="small-btn" onclick="collectServiceCredit('${j.id}')">Collect</button>`
              : j.status}
          </td>
        </tr>`
        ).join("")
        : `<tr><td colspan="9">No history</td></tr>`;
  }

  /* ---------------------------------------------
        PIE CHARTS
  --------------------------------------------- */
  function drawPieStatus() {
    const el = qs("#svcPieStatus");
    if (!el || typeof Chart === "undefined") return;

    const f = getFiltered();
    const P = f.filter(j => j.status === "Pending").length;
    const C = f.filter(j => j.status === "Completed" && !j.fromCredit).length;
    const F = f.filter(j => j.status === "Failed").length;

    if (pieStatus) pieStatus.destroy();

    const data = [P, C, F];
    const ds = data.some(x => x > 0) ? data : [1,0,0];

    pieStatus = new Chart(el, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed"],
        datasets: [{ data: ds }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function drawPieMoney() {
    const el = qs("#svcPieMoney");
    if (!el || typeof Chart === "undefined") return;

    const f = getFiltered();
    const cash   = f.filter(j => j.status === "Completed" && !j.fromCredit).length;
    const credit = f.filter(j => j.status === "Credit").length;
    const paid   = f.filter(j => j.status === "Completed" && j.fromCredit).length;

    if (pieMoney) pieMoney.destroy();

    const data = [cash, credit, paid];
    const ds = data.some(x => x > 0) ? data : [1,0,0];

    pieMoney = new Chart(el, {
      type: "pie",
      data: {
        labels: ["Cash service", "Credit pending", "Credit paid"],
        datasets: [{ data: ds }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  /* ---------------------------------------------
        EVENTS
  --------------------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".svc-view");
    if (!btn) return;

    const id = btn.dataset.id;
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const select = prompt(
      `Job ${j.jobId}\n1: Completed (Paid)\n2: Completed (Credit)\n3: Failed`
    );

    if (select === "1") return completeJob(id, "paid");
    if (select === "2") return completeJob(id, "credit");
    if (select === "3") return failJob(id);
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL jobs?")) return;
    window.services = [];
    save();
    buildDateFilter();
    refresh();
  });

  qs("#svcFilterStatus")?.addEventListener("change", refresh);
  qs("#svcFilterType")?.addEventListener("change", refresh);
  qs("#svcFilterDate")?.addEventListener("change", refresh);

  /* ---------------------------------------------
        PAGE LOAD
  --------------------------------------------- */
  window.addEventListener("load", () => {
    populateFiltersOnce();
    refresh();
  });

})();
