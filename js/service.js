/* ===========================================================
   service.js — FINAL PERFECT VERSION
   (Type filter fixed, Date filter fixed, Pie charts always load)
=========================================================== */
(function () {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s || ""));
  const esc = x => (x == null ? "" : String(x));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  let pieStatus = null;
  let pieMoney = null;

  /* ---------- STORAGE ---------- */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persist() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch (e) {
      console.warn("service persist failed", e);
    }
  }

  /* =====================================================
        FILTER OPTIONS (ONCE ON PAGE LOAD)
     - Type dropdown updated from global types if available
     - Date dropdown collects all date_in/date_out and shows "All Dates"
  ===================================================== */
  function populateFilters() {
    /* TYPE: prefer dynamic types list if present */
    const typeEl = qs("#svcFilterType");
    if (typeEl) {
      const types = Array.isArray(window.types) ? window.types.map(t => esc(t.name)) : [];
      const typeOptions = [`<option value="all">All</option>`]
        .concat(types.length ? types.map(t => `<option value="${t}">${t}</option>`)
                             : [`<option value="Mobile">Mobile</option>`,
                                `<option value="Laptop">Laptop</option>`,
                                `<option value="Other">Other</option>`]);
      typeEl.innerHTML = typeOptions.join("");
    }

    /* DATE: build unique sorted list of dates (newest first) */
    const dateEl = qs("#svcFilterDate");
    if (dateEl) {
      const set = new Set();
      ensureServices().forEach(j => {
        if (j.date_in) set.add(j.date_in);
        if (j.date_out) set.add(j.date_out);
      });

      const dates = Array.from(set).filter(Boolean).sort((a, b) => b.localeCompare(a));
      dateEl.innerHTML = `<option value="">All Dates</option>` + dates.map(d => `<option value="${d}">${toDisplay(d)}</option>`).join("");
    }
  }

  /* =====================================================
        FILTERED LIST
     - type matching uses item / item type exactly (case-sensitive as UI shows)
     - status supports several aliases and special "credit-paid"
     - date filter matches either date_in OR date_out
  ===================================================== */
  function getFiltered() {
    const list = ensureServices();

    const typeVal = qs("#svcFilterType")?.value || "all";
    const statusVal = (qs("#svcFilterStatus")?.value || "all").toLowerCase();
    const dateVal = qs("#svcFilterDate")?.value || "";

    let out = [...list];

    /* TYPE filter (correct matching) */
    if (typeVal !== "all" && typeVal !== "") {
      out = out.filter(j => {
        // Support both stored `item` or `itemType` or `type` keys
        const it = j.item || j.itemType || j.type || "";
        return String(it) === String(typeVal);
      });
    }

    /* STATUS filter */
    if (statusVal !== "all") {
      out = out.filter(j => {
        const s = String(j.status || "").toLowerCase();
        if (statusVal === "pending") return s === "pending";
        if (statusVal === "completed") return s === "completed";
        if (statusVal === "credit") return s === "credit";
        if (statusVal === "credit-paid") return (s === "completed" && !!j.fromCredit);
        if (statusVal === "failed") return s === "failed" || s === "failed/returned" || s === "returned";
        return false;
      });
    }

    /* DATE filter (matches either in/out) */
    if (dateVal) {
      out = out.filter(j => {
        return (j.date_in === dateVal) || (j.date_out === dateVal);
      });
    }

    return out;
  }

  /* =====================================================
        FULL REFRESH
  ===================================================== */
  function fullRefresh() {
    // refresh filters (in case data changed)
    populateFilters();

    renderTables();

    // defer charts slightly so DOM finishes updating (helps when charts' canvases are hidden initially)
    setTimeout(() => {
      renderPieStatus();
      renderPieMoney();
    }, 80);

    // ensure universal bar & analytics refresh if present
    try { window.updateUniversalBar?.(); } catch {}
    try { window.renderAnalytics?.(); } catch {}
  }

  /* =====================================================
        ADD NEW JOB
  ===================================================== */
  function nextId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    return {
      jobNum: max + 1,
      jobId: String(max + 1).padStart(2, "0")
    };
  }

  function addJob() {
    let received = qs("#svcReceivedDate")?.value || today();
    received = toInternal(received);

    const customer = esc(qs("#svcCustomer")?.value || "").trim();
    const phone = esc(qs("#svcPhone")?.value || "").trim();
    const item = qs("#svcItemType")?.value || "Other";
    const model = esc(qs("#svcModel")?.value || "");
    const problem = esc(qs("#svcProblem")?.value || "");
    const advance = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone, Problem");
      return;
    }

    const ids = nextId();
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
      status: "Pending",
      fromCredit: false
    };

    ensureServices().push(job);
    persist();
    fullRefresh();
  }

  /* =====================================================
        COMPLETE JOB
     - prompts are defensive (NaN -> 0)
     - sets invest, profit, dates consistently
  ===================================================== */
  function markCompleted(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const prevInvest = Number(job.invest || 0);
    const prevPaid = Number(job.paid || 0);

    const investInput = prompt("Parts / Repair Cost ₹:", prevInvest || 0);
    const invest = Number(investInput || 0);
    if (isNaN(invest) || invest < 0) return alert("Invalid invest amount");

    const fullInput = prompt("Total Bill ₹:", prevPaid || 0);
    const full = Number(fullInput || 0);
    if (isNaN(full) || full <= 0) return alert("Invalid total bill");

    const adv = Number(job.advance || 0);
    const profit = full - invest;

    job.invest = invest;
    job.profit = profit;
    job.date_out = today();
    job.fromCredit = false;

    if (mode === "paid") {
      const collect = full - adv;
      if (!confirm(`Collect ₹${collect}? Profit: ₹${profit}`)) return;

      job.paid = full;
      job.remaining = 0;
      job.status = "Completed";
    } else {
      const due = full - adv;
      if (!confirm(`Credit pending ₹${due}`)) return;

      job.paid = adv;
      job.remaining = due;
      job.status = "Credit";
    }

    persist();
    fullRefresh();
  }

  /* =====================================================
        COLLECT CREDIT
  ===================================================== */
  function collectServiceCredit(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job || job.status !== "Credit") return;

    const due = Number(job.remaining || 0);
    if (!confirm(`Collect ₹${due}?`)) return;

    job.paid = Number(job.paid || 0) + due;
    job.remaining = 0;
    job.status = "Completed";
    job.fromCredit = true;

    persist();
    fullRefresh();
  }
  window.collectServiceCredit = collectServiceCredit;

  /* =====================================================
        FAILED JOB
  ===================================================== */
  function markFailed(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const retInput = prompt("Advance Returned ₹:", job.advance || 0);
    const ret = Number(retInput || 0);
    if (isNaN(ret) || ret < 0) return alert("Invalid amount");

    job.returnedAdvance = ret;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = today();

    persist();
    fullRefresh();
  }

  /* =====================================================
        RENDER TABLES
  ===================================================== */
  function renderTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");

    if (!pendBody || !histBody) return;

    const filtered = getFiltered();
    const pending = filtered.filter(j => String(j.status || "").toLowerCase() === "pending");
    const history = filtered.filter(j => String(j.status || "").toLowerCase() !== "pending");

    pendBody.innerHTML =
      pending.length
        ? pending.map(j => `
        <tr>
          <td>${esc(j.jobId)}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.phone)}</td>
          <td>${esc(j.item)}</td>
          <td>${esc(j.model)}</td>
          <td>${esc(j.problem)}</td>
          <td>Pending</td>
          <td><button class="btn btn-xs svc-view" data-id="${j.id}">View / Update</button></td>
        </tr>`).join("")
        : `<tr><td colspan="9">No pending jobs</td></tr>`;

    histBody.innerHTML =
      history.length
        ? history.map(j => {
            let st = esc(j.status);
            if (String(j.status).toLowerCase() === "credit") {
              st = `Credit <button class="btn btn-xs" onclick="collectServiceCredit('${j.id}')">Collect</button>`;
            }
            return `
        <tr>
          <td>${esc(j.jobId)}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${Number(j.invest || 0)}</td>
          <td>₹${Number(j.paid || 0)}</td>
          <td>₹${Number(j.profit || 0)}</td>
          <td>${st}</td>
        </tr>`;
          }).join("")
        : `<tr><td colspan="9">No history</td></tr>`;
  }

  /* =====================================================
        PIE — STATUS
     - Defensive: ensure Chart exists & canvas has dimensions
     - If zero items, show minimal dataset to avoid Chart errors
  ===================================================== */
  function renderPieStatus() {
    const el = qs("#svcPieStatus");
    if (!el) return;

    // wait for Chart availability
    if (typeof Chart === "undefined") {
      // try again later without blocking
      setTimeout(renderPieStatus, 300);
      return;
    }

    const list = getFiltered();
    const P = list.filter(j => String(j.status || "").toLowerCase() === "pending").length;
    const C = list.filter(j => String(j.status || "").toLowerCase() === "completed").length;
    const F = list.filter(j => {
      const s = String(j.status || "").toLowerCase();
      return s === "failed" || s === "failed/returned" || s === "returned";
    }).length;

    try {
      if (pieStatus) pieStatus.destroy();
    } catch (e) { /* ignore */ }

    const data = [P, C, F];
    // ensure non-empty numeric dataset (Chart may error on all zeros in some builds)
    const nonZero = data.some(v => v > 0) ? data : [1, 0, 0];

    try {
      pieStatus = new Chart(el, {
        type: "pie",
        data: {
          labels: ["Pending", "Completed", "Failed/Returned"],
          datasets: [{ data: nonZero }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    } catch (err) {
      console.error("Pie status render failed", err);
    }
  }

  /* =====================================================
        PIE — MONEY
     - Defensive similar to above
  ===================================================== */
  function renderPieMoney() {
    const el = qs("#svcPieMoney");
    if (!el) return;

    if (typeof Chart === "undefined") {
      setTimeout(renderPieMoney, 300);
      return;
    }

    const list = getFiltered();
    const cash = list.filter(j => String(j.status || "").toLowerCase() === "completed" && !j.fromCredit).length;
    const creditPending = list.filter(j => String(j.status || "").toLowerCase() === "credit").length;
    const creditPaid = list.filter(j => String(j.status || "").toLowerCase() === "completed" && !!j.fromCredit).length;

    try {
      if (pieMoney) pieMoney.destroy();
    } catch (e) { /* ignore */ }

    const data = [cash, creditPending, creditPaid];
    const nonZero = data.some(v => v > 0) ? data : [1, 0, 0];

    try {
      pieMoney = new Chart(el, {
        type: "pie",
        data: {
          labels: ["Cash service", "Credit (pending)", "Credit paid"],
          datasets: [{ data: nonZero }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    } catch (err) {
      console.error("Pie money render failed", err);
    }
  }

  /* =====================================================
        EVENTS
  ===================================================== */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".svc-view");
    if (btn) {
      const id = btn.dataset.id;
      const j = ensureServices().find(x => x.id === id);
      if (!j) return;

      const msg =
        `Job ${j.jobId}\n` +
        `Customer: ${j.customer}\n` +
        `Phone: ${j.phone}\n` +
        `Item: ${j.item}\n\n` +
        `1 - Completed (Paid)\n` +
        `2 - Completed (Credit)\n` +
        `3 - Failed/Returned`;

      const ch = prompt(msg, "1");
      if (ch === "1") return markCompleted(id, "paid");
      if (ch === "2") return markCompleted(id, "credit");
      if (ch === "3") return markFailed(id);
      return;
    }
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL jobs?")) return;
    window.services = [];
    persist();
    fullRefresh();
  });

  qs("#svcFilterType")?.addEventListener("change", fullRefresh);
  qs("#svcFilterStatus")?.addEventListener("change", fullRefresh);
  qs("#svcFilterDate")?.addEventListener("change", fullRefresh);

  /* =====================================================
        PAGE LOAD
  ===================================================== */
  window.addEventListener("load", () => {
    // normalize service dates if helper available
    if (typeof window.toInternalIfNeeded === "function") {
      ensureServices().forEach(s => {
        if (s.date_in) s.date_in = toInternal(s.date_in);
        if (s.date_out) s.date_out = toInternal(s.date_out);
      });
    }

    populateFilters();
    fullRefresh();

    // ensure charts re-render when window resizes (fix for hidden canvases)
    window.addEventListener("resize", () => {
      try { if (pieStatus) pieStatus.resize(); } catch {}
      try { if (pieMoney) pieMoney.resize(); } catch {}
    });
  });

  // expose some helpers for debugging
  window._svc_fullRefresh = fullRefresh;
  window._svc_getFiltered = getFiltered;

})();
