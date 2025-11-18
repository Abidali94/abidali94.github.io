/* =======================================================
   🛠 service.js — Service / Repair Manager (v1.0)
   - Stores jobs in localStorage under "service-data"
   - Integrates with analytics & overview via window events
   - Uses core helpers: todayDate(), uid(), esc(), toDisplay()/toInternal() if present
   ======================================================= */

(function(){
  const KEY_SERVICES = "service-data";

  // helpers from core (fallbacks)
  const toDisplay = window.toDisplay || (d => d || "");
  const toInternal = window.toInternal || (d => d || "");
  const today = window.todayDate || (() => new Date().toISOString().split("T")[0]);
  const uid = window.uid || (p => p + "_" + Math.random().toString(36).slice(2,9));
  const esc = window.esc || (t => String(t||""));

  // Chart instance
  let svcPieChart = null;

  // in-memory
  window.services = Array.isArray(window.services) ? window.services : (JSON.parse(localStorage.getItem(KEY_SERVICES) || "[]"));

  function saveServices() {
    localStorage.setItem(KEY_SERVICES, JSON.stringify(window.services || []));
    window.dispatchEvent(new Event("storage"));
  }

  // Simple auto job id: 01, 02, 03 ...
  function generateJobId() {
    const all = window.services || [];
    if (!all.length) return "01";
    const max = all.reduce((m, s) => {
      const n = Number(s.jobNum || 0);
      return n > m ? n : m;
    }, 0);
    const next = max + 1;
    return String(next).padStart(2, "0");
  }

  // Add new job
  function addServiceJob() {
    const dateEl = qs("#svcReceivedDate");
    const nameEl = qs("#svcCustomer");
    const phoneEl = qs("#svcPhone");
    const typeEl = qs("#svcItemType");
    const modelEl = qs("#svcModel");
    const problemEl = qs("#svcProblem");
    const advEl = qs("#svcAdvance");

    if (!nameEl || !phoneEl || !typeEl || !modelEl || !problemEl) {
      return alert("Missing service form elements.");
    }

    let date = (dateEl?.value) || today();
    if (date.includes("-") && date.split("-")[0].length === 2) date = toInternal(date);

    const customer = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const itemType = typeEl.value;
    const model = modelEl.value.trim();
    const problem = problemEl.value.trim();
    const advance = Number(advEl?.value || 0);

    if (!customer || !phone || !model || !problem) return alert("Please fill required fields.");

    const jobNum = Number(generateJobId());
    const jobId = String(jobNum).padStart(2,"0");

    const job = {
      id: uid("svc"),
      jobNum,
      jobId, // human-friendly
      date_in: date,      // internal yyyy-mm-dd
      date_out: "",       // when completed
      customer,
      phone,
      itemType,
      model,
      problem,
      advance: Number(advance || 0),
      invest: 0,
      paid: 0,
      profit: 0,
      status: "Pending", // Pending, Completed, Failed, Returned
      notes: ""
    };

    window.services.push(job);
    saveServices();
    renderServiceTables();
    clearServiceForm();

    // update other modules
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function clearServiceForm() {
    qs("#svcReceivedDate").value = "";
    qs("#svcCustomer").value = "";
    qs("#svcPhone").value = "";
    qs("#svcModel").value = "";
    qs("#svcProblem").value = "";
    qs("#svcAdvance").value = "";
  }

  // Render pending and history tables
  function renderServiceTables() {
    const tbody = qs("#svcTable tbody");
    const hist = qs("#svcHistoryTable tbody");
    if (!tbody || !hist) return;

    const pending = (window.services || []).filter(s => s.status === "Pending");
    const completed = (window.services || []).filter(s => s.status !== "Pending");

    // Pending table
    tbody.innerHTML = pending.map(s => `
      <tr>
        <td>${esc(s.jobId)}</td>
        <td>${toDisplay(s.date_in)}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(s.phone)}</td>
        <td>${esc(s.itemType)}</td>
        <td>${esc(s.model)}</td>
        <td>${esc(s.problem)}</td>
        <td>${esc(s.status)}</td>
        <td>
          <button class="svc-view-btn small-btn" data-id="${s.id}">View</button>
          <button class="svc-cancel-btn small-btn" data-id="${s.id}" style="background:#d32f2f">Cancel</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9">No pending jobs</td></tr>`;

    // History table
    hist.innerHTML = completed.map(s => `
      <tr>
        <td>${esc(s.jobId)}</td>
        <td>${toDisplay(s.date_in)}</td>
        <td>${s.date_out ? toDisplay(s.date_out) : ""}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(s.model)}</td>
        <td>₹${Number(s.invest||0)}</td>
        <td>₹${Number(s.paid||0)}</td>
        <td>₹${Number(s.profit||0)}</td>
        <td>${esc(s.status)}</td>
      </tr>
    `).join("") || `<tr><td colspan="9">No history</td></tr>`;

    // Update small summary cards
    qs("#svcPendingCount") && (qs("#svcPendingCount").textContent = pending.length);
    qs("#svcCompletedCount") && (qs("#svcCompletedCount").textContent = completed.length);
    const totalProfit = (window.services || []).reduce((sum, s) => sum + Number(s.profit || 0), 0);
    qs("#svcTotalProfit") && (qs("#svcTotalProfit").textContent = "₹" + totalProfit);

    renderServicePie();
  }

  // render pie chart for statuses
  function renderServicePie() {
    const canvas = qs("#svcPie");
    if (!canvas) return;

    const list = window.services || [];
    const pending = list.filter(s => s.status === "Pending").length;
    const completed = list.filter(s => s.status === "Completed").length;
    const failed = list.filter(s => s.status === "Failed").length;
    const returned = list.filter(s => s.status === "Returned").length;

    if (svcPieChart) try { svcPieChart.destroy(); } catch(e){}

    svcPieChart = new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Pending","Completed","Failed","Returned"],
        datasets: [{
          data: [pending, completed, failed, returned],
          backgroundColor: ["#ffb74d","#4caf50","#e57373","#90a4ae"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // View / Complete job: show prompt modal-like flow (simple)
  function viewServiceJob(id) {
    const s = (window.services || []).find(x => x.id === id);
    if (!s) return alert("Job not found.");

    // show summary + choose action
    let msg = `Job ${s.jobId}\nCustomer: ${s.customer}\nPhone: ${s.phone}\nItem: ${s.itemType} ${s.model}\nProblem: ${s.problem}\nReceived: ${toDisplay(s.date_in)}\nStatus: ${s.status}\n\nChoose action:\n1 - Mark Completed\n2 - Mark Failed/Returned\n3 - Edit Invest/Paid\n4 - Close\n\n(Enter number)`;

    const choice = prompt(msg, "4");
    if (!choice) return;

    if (choice === "1") {
      markServiceCompletedInteractive(id);
    } else if (choice === "2") {
      markServiceFailed(id);
    } else if (choice === "3") {
      editServiceFinancials(id);
    }
  }

  // mark completed: collect invest and paid → compute profit
  function markServiceCompletedInteractive(id) {
    const s = (window.services || []).find(x => x.id === id);
    if (!s) return alert("Not found");

    const dateOut = today();
    const invest = Number(prompt("Enter investment (cost) ₹:", s.invest || 0) || 0);
    const paid = Number(prompt("Enter amount received from customer ₹:", s.paid || 0) || 0);

    s.invest = Number(invest || 0);
    s.paid = Number(paid || 0);
    s.profit = Math.round(Number(s.paid || 0) - Number(s.invest || 0));
    s.status = "Completed";
    s.date_out = dateOut;

    saveServices();
    renderServiceTables();

    // update summary & analytics
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function editServiceFinancials(id) {
    const s = (window.services || []).find(x => x.id === id);
    if (!s) return alert("Not found");

    const invest = Number(prompt("Edit investment (cost) ₹:", s.invest || 0) || 0);
    const paid = Number(prompt("Edit amount received ₹:", s.paid || 0) || 0);

    s.invest = Number(invest || 0);
    s.paid = Number(paid || 0);
    s.profit = Math.round(Number(s.paid || 0) - Number(s.invest || 0));

    saveServices();
    renderServiceTables();
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function markServiceFailed(id) {
    const s = (window.services || []).find(x => x.id === id);
    if (!s) return;
    const dateOut = today();
    s.invest = Number(prompt("Investment spent (if any) ₹:", s.invest || 0) || 0);
    s.paid = Number(prompt("Amount refunded/collected (if any) ₹:", s.paid || 0) || 0);
    s.profit = Math.round(Number(s.paid || 0) - Number(s.invest || 0));
    s.status = "Failed";
    s.date_out = dateOut;

    saveServices();
    renderServiceTables();
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function cancelServiceJob(id) {
    if (!confirm("Cancel this job? This will remove it.")) return;
    window.services = (window.services || []).filter(s => s.id !== id);
    saveServices();
    renderServiceTables();
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  // Search by jobId or phone
  function searchService(q) {
    if (!q) return null;
    return (window.services || []).filter(s => s.jobId === q || s.customer.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q));
  }

  // Event handlers
  document.addEventListener("click", e => {
    if (e.target && e.target.id === "addServiceBtn") return addServiceJob();

    if (e.target && e.target.classList.contains("svc-view-btn")) {
      const id = e.target.dataset.id; return viewServiceJob(id);
    }

    if (e.target && e.target.classList.contains("svc-cancel-btn")) {
      const id = e.target.dataset.id; return cancelServiceJob(id);
    }
  });

  // initial render
  window.addEventListener("load", () => {
    renderServiceTables();
  });

  // Expose API for other modules (analytics / summary cards)
  window.getServiceAnalytics = function() {
    const list = window.services || [];
    const totalProfit = list.reduce((s, j) => s + Number(j.profit || 0), 0);
    const pending = list.filter(x => x.status === "Pending").length;
    const completed = list.filter(x => x.status === "Completed").length;
    return { totalProfit, pending, completed, list };
  };

  window.saveServices = saveServices;
  window.renderServiceTables = renderServiceTables;
  window.searchService = searchService;

})();
