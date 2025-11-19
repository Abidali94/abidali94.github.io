/* =======================================================
   🛠 service.js — Service / Repair Manager (v7.0 FINAL)
   ✔ Completed flow:
       • asks investment
       • shows advance (if any)
       • asks customer FULL PAYMENT (total bill including advance)
       • auto-calculates Remaining = FullPayment - Advance and shows confirmation
       • saves: invest, paid (fullPayment), remaining, profit
   ✔ Pending shows Advance only when > 0
   ✔ History shows: Invest | Advance | FullPayment | Remaining | Profit (or Advance Returned for failures)
   ✔ Failed/Returned asks advance returned
   ✔ Pie chart: Pending | Completed | Failed/Returned
   ✔ Clear All supported
   ======================================================= */

(function () {
  const KEY = "service-data-v7";

  const toDisplay = window.toDisplay || (d => d || "");
  const toInternal = window.toInternal || (d => d || "");
  const today = window.todayDate || (() => new Date().toISOString().split("T")[0]);
  const uid = window.uid || (p => p + "_" + Math.random().toString(36).slice(2, 9));
  const esc = window.esc || (t => String(t || ""));

  let svcPieChart = null;

  // load / initialize
  window.services = JSON.parse(localStorage.getItem(KEY) || "[]");

  function save() {
    localStorage.setItem(KEY, JSON.stringify(window.services));
    // notify other modules
    window.dispatchEvent(new Event("storage"));
  }

  function nextJobId() {
    if (!window.services.length) return "01";
    const max = Math.max(...window.services.map(s => Number(s.jobNum || 0)));
    return String(max + 1).padStart(2, "0");
  }

  /* -----------------------------
       ADD NEW JOB
     ----------------------------- */
  function addJob() {
    const dateRaw = qs("#svcReceivedDate")?.value || today();
    const date = (dateRaw && dateRaw.includes("-") && dateRaw.split("-")[0].length === 2) ? toInternal(dateRaw) : dateRaw;
    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone = (qs("#svcPhone")?.value || "").trim();
    const itemType = (qs("#svcItemType")?.value || "Other");
    const model = (qs("#svcModel")?.value || "").trim();
    const problem = (qs("#svcProblem")?.value || "").trim();
    const advance = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !model || !problem) {
      return alert("Please fill required fields (Customer, Phone number, Model, Problem).");
    }

    const jobNum = Number(nextJobId());
    const jobId = String(jobNum).padStart(2, "0");

    const job = {
      id: uid("svc"),
      jobNum,
      jobId,
      date_in: toInternal(date),
      date_out: "",
      customer,
      phone,
      itemType,
      model,
      problem,
      advance: Number(advance || 0),    // advance taken at reception
      invest: 0,                        // investment spent during repair
      paid: 0,                          // FULL payment (advance + remaining) when completed
      remaining: 0,                     // remaining collected at completion (computed)
      profit: 0,
      returnedAdvance: 0,               // amount returned to customer in failed/returned flow
      status: "Pending"                 // Pending | Completed | Failed/Returned
    };

    window.services.push(job);
    save();
    renderTables();
    clearForm();

    // update other modules
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function clearForm() {
    if (qs("#svcReceivedDate")) qs("#svcReceivedDate").value = "";
    if (qs("#svcCustomer")) qs("#svcCustomer").value = "";
    if (qs("#svcPhone")) qs("#svcPhone").value = "";
    if (qs("#svcModel")) qs("#svcModel").value = "";
    if (qs("#svcProblem")) qs("#svcProblem").value = "";
    if (qs("#svcAdvance")) qs("#svcAdvance").value = "";
  }

  /* -----------------------------
       RENDER TABLES
     ----------------------------- */
  function renderTables() {
    const tb = qs("#svcTable tbody");
    const hist = qs("#svcHistoryTable tbody");
    if (!tb || !hist) return;

    const pending = window.services.filter(s => s.status === "Pending");
    const completedOrFailed = window.services.filter(s => s.status !== "Pending");

    // Pending: show Advance only when > 0
    tb.innerHTML = pending.map(s => `
      <tr>
        <td>${esc(s.jobId)}</td>
        <td>${toDisplay(s.date_in)}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(s.phone)}</td>
        <td>${esc(s.itemType)}</td>
        <td>${esc(s.model)}</td>
        <td>${esc(s.problem)}</td>
        <td>${s.advance > 0 ? `Advance: ₹${Number(s.advance)}` : ''}</td>
        <td>
          <button class="svc-view small-btn" data-id="${s.id}">Open</button>
          <button class="svc-del small-btn" data-id="${s.id}" style="background:#d32f2f">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9">No pending jobs</td></tr>`;

    // History: show Invest | Advance | FullPayment | Remaining | Profit
    hist.innerHTML = completedOrFailed.map(s => {
      if (s.status === "Failed/Returned") {
        return `
          <tr>
            <td>${esc(s.jobId)}</td>
            <td>${toDisplay(s.date_in)}</td>
            <td>${toDisplay(s.date_out)}</td>
            <td>${esc(s.customer)}</td>
            <td>${esc(s.model)}</td>
            <td>₹${Number(s.invest || 0)}</td>
            <td>₹${Number(s.paid || 0)}</td>
            <td>₹${Number(s.profit || 0)}</td>
            <td>${s.status} (Advance Returned: ₹${Number(s.returnedAdvance || 0)})</td>
          </tr>
        `;
      } else {
        // Completed
        return `
          <tr>
            <td>${esc(s.jobId)}</td>
            <td>${toDisplay(s.date_in)}</td>
            <td>${toDisplay(s.date_out)}</td>
            <td>${esc(s.customer)}</td>
            <td>${esc(s.model)}</td>
            <td>₹${Number(s.invest || 0)}</td>
            <td>₹${Number(s.paid || 0)}</td>
            <td>₹${Number(s.remaining || 0)}</td>
            <td>Profit: ₹${Number(s.profit || 0)} | Advance: ₹${Number(s.advance || 0)}</td>
          </tr>
        `;
      }
    }).join("") || `<tr><td colspan="9">No history</td></tr>`;

    // small cards
    if (qs("#svcPendingCount")) qs("#svcPendingCount").textContent = pending.length;
    if (qs("#svcCompletedCount")) qs("#svcCompletedCount").textContent = window.services.filter(s => s.status === "Completed").length;
    if (qs("#svcTotalProfit")) qs("#svcTotalProfit").textContent = "₹" + window.services.reduce((sum, j) => sum + Number(j.profit || 0), 0);

    renderPie();
  }

  /* -----------------------------
       PIE CHART
     ----------------------------- */
  function renderPie() {
    const c = qs("#svcPie");
    if (!c) return;

    const P = window.services.filter(s => s.status === "Pending").length;
    const C = window.services.filter(s => s.status === "Completed").length;
    const F = window.services.filter(s => s.status === "Failed/Returned").length;

    if (svcPieChart) try { svcPieChart.destroy(); } catch (e) { /* ignore */ }

    svcPieChart = new Chart(c, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{
          data: [P, C, F],
          backgroundColor: ["#ffb74d", "#4caf50", "#e57373"]
        }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }

  /* -----------------------------
       OPEN / ACTION MENU
     ----------------------------- */
  function openJob(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return alert("Job not found.");

    const msg = `Job ${s.jobId}
Customer: ${s.customer}
Phone Number: ${s.phone}
Item: ${s.itemType} - ${s.model}
Problem: ${s.problem}
Advance Paid: ₹${Number(s.advance || 0)}
Received: ${toDisplay(s.date_in)}

Choose action:
1 - Mark Completed
2 - Mark Failed/Returned`;

    const choice = prompt(msg, "1");
    if (!choice) return;

    if (choice === "1") return markCompleted(id);
    if (choice === "2") return markFailed(id);
  }

  /* -----------------------------
       MARK COMPLETED
       Flow:
         1) show advance (if any)
         2) ask investment
         3) ask FULL PAYMENT (total bill including advance)
         4) compute remaining = fullPayment - advance
         5) show confirmation summary and save
     ----------------------------- */
  function markCompleted(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return alert("Job not found.");

    const adv = Number(s.advance || 0);

    // Inform about advance (so user doesn't forget)
    if (adv > 0) {
      alert(`Advance already taken: ₹${adv}`);
    }

    // Investment (cost) input
    let investRaw = prompt("Enter investment (cost) ₹:", s.invest || 0);
    if (investRaw === null) return; // cancelled
    const invest = Number(investRaw || 0);

    // Full payment (total bill including advance)
    let fullRaw = prompt(`Enter CUSTOMER FULL PAYMENT (total bill INCLUDING advance) ₹:`, s.paid || adv || 0);
    if (fullRaw === null) return;
    const fullPayment = Number(fullRaw || 0);

    // Sanity: fullPayment should be >= advance ideally. If user enters less, we still compute remaining (may be negative).
    const remaining = Number(fullPayment - adv);

    // Confirmation summary
    const summary = `Confirm and SAVE:
Investment (cost): ₹${invest}
Advance already taken: ₹${adv}
Customer FULL PAYMENT (total): ₹${fullPayment}
Remaining collected now (full - advance): ₹${remaining}
Profit = FullPayment - Investment = ₹${fullPayment - invest}

Press OK to save, Cancel to abort.`;
    const ok = confirm(summary);
    if (!ok) return;

    // Save
    s.invest = invest;
    s.paid = fullPayment;     // store full payment amount
    s.remaining = remaining;  // convenience field (how much was additional collected beyond advance)
    s.profit = Math.round((fullPayment || 0) - (invest || 0));
    s.status = "Completed";
    s.date_out = today();
    s.returnedAdvance = 0;

    save();
    renderTables();

    updateSummaryCards?.();
    renderAnalytics?.();
  }

  /* -----------------------------
       MARK FAILED / RETURNED
       Ask how much advance returned; store returnedAdvance
     ----------------------------- */
  function markFailed(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return alert("Job not found.");

    const adv = Number(s.advance || 0);
    // Ask how much advance returned (default = adv)
    let retRaw = prompt("Advance returned to customer ₹ (enter 0 if none):", adv || 0);
    if (retRaw === null) return;
    const returned = Number(retRaw || 0);

    s.returnedAdvance = returned;
    // For failed jobs we zero-out invest/paid/profit/remaining
    s.invest = 0;
    s.paid = 0;
    s.remaining = 0;
    s.profit = 0;
    s.status = "Failed/Returned";
    s.date_out = today();

    save();
    renderTables();

    updateSummaryCards?.();
    renderAnalytics?.();
  }

  /* -----------------------------
       DELETE / CLEAR
     ----------------------------- */
  function deleteJob(id) {
    if (!confirm("Delete this job? This will remove it permanently.")) return;
    window.services = window.services.filter(s => s.id !== id);
    save();
    renderTables();
  }

  window.clearAllServices = function () {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    save();
    renderTables();
  };

  /* -----------------------------
       SEARCH helper (exposed)
     ----------------------------- */
  function searchService(q) {
    if (!q) return [];
    q = String(q).trim();
    return window.services.filter(s =>
      s.jobId === q ||
      s.customer.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q)
    );
  }

  /* -----------------------------
       EVENTS
     ----------------------------- */
  document.addEventListener("click", e => {
    if (!e.target) return;

    if (e.target.id === "addServiceBtn") addJob();
    if (e.target.classList.contains("svc-view")) openJob(e.target.dataset.id);
    if (e.target.classList.contains("svc-del")) deleteJob(e.target.dataset.id);
    if (e.target.id === "clearServiceBtn") clearAllServices();
  });

  window.addEventListener("load", renderTables);

  /* -----------------------------
       Expose API
     ----------------------------- */
  window.getServiceAnalytics = function () {
    const list = window.services || [];
    const totalProfit = list.reduce((s, j) => s + Number(j.profit || 0), 0);
    const pending = list.filter(x => x.status === "Pending").length;
    const completed = list.filter(x => x.status === "Completed").length;
    const failed = list.filter(x => x.status === "Failed/Returned").length;
    return { totalProfit, pending, completed, failed, list };
  };

  window.saveServices = save;
  window.renderServiceTables = renderTables;
  window.searchService = searchService;

})();
