/* ===========================================================
   service.js — FINAL (consolidated)
   - Manage service jobs (add, complete, collect-credit)
   - Uses window.services array and optional hooks:
     window.saveServices, window.collectCreditService, window.updateSummaryCards,
     window.updateUniversalBar, window.renderCollection, window.renderAnalytics
=========================================================== */

(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (x === undefined || x === null) ? "" : String(x);

  // Ensure global array exists
  window.services = Array.isArray(window.services) ? window.services : [];

  // Helpers
  function uid(prefix = "svc"){
    if (typeof window.uid === "function") return window.uid(prefix);
    return (prefix + "_" + Date.now() + "_" + Math.floor(Math.random()*9999));
  }
  function nowDate(){ return (typeof todayDate === "function") ? todayDate() : (new Date()).toISOString().split("T")[0]; }
  function nowTime(){ return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }

  /* -------------------------
     Add new service job
     params: { date_in, customer, phone, item, model, problem, advance (number) }
  ------------------------- */
  function addServiceJob(obj){
    if (!obj) return;
    const job = {
      id: obj.id || uid("job"),
      date_in: obj.date_in || nowDate(),
      time_in: obj.time_in || nowTime(),
      customer: obj.customer || "",
      phone: obj.phone || "",
      item: obj.item || "Item",
      model: obj.model || "",
      problem: obj.problem || "",
      invest: Number(obj.invest || 0),      // money spent on this job so far
      paid: Number(obj.paid || 0),          // amount paid by customer
      remaining: Number(obj.remaining || 0),// remaining credit (if any)
      creditStatus: (obj.creditStatus || "").toLowerCase(), // "", "credit", "collected"
      status: (obj.status || "pending")     // pending, inprogress, completed
    };

    window.services.push(job);
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); } catch(e){ console.warn("saveServices failed", e); }
    }

    renderServiceTables();
    renderServiceHistory();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    return job;
  }
  window.addServiceJob = addServiceJob;

  /* -------------------------
     Mark job as completed (but may have pending remaining credit)
     params: id, finishInfo { date_out, paid, invest, remaining, creditStatus }
  ------------------------- */
  function completeServiceJob(id, finishInfo = {}){
    const j = (window.services || []).find(x => x.id === id);
    if (!j) { alert("Job not found"); return; }

    // Update fields
    j.date_out = finishInfo.date_out || nowDate();
    j.time_out = finishInfo.time_out || nowTime();
    j.invest = Number(finishInfo.invest ?? j.invest ?? 0);
    j.paid = Number(finishInfo.paid ?? j.paid ?? 0);
    j.remaining = Number(finishInfo.remaining ?? j.remaining ?? 0);
    j.creditStatus = (finishInfo.creditStatus || j.creditStatus || "").toLowerCase();
    j.status = "completed";

    // If fully paid, ensure remaining = 0 and creditStatus = collected/none
    if (!j.remaining || j.remaining <= 0){
      j.remaining = 0;
      if (j.creditStatus === "credit") j.creditStatus = "collected";
    }

    if (typeof window.saveServices === "function") {
      try { window.saveServices(); } catch(e){ console.warn("saveServices failed", e); }
    }

    renderServiceTables();
    renderServiceHistory();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
  }
  window.completeServiceJob = completeServiceJob;

  /* -------------------------
     Collect credit for a service job (mark collected)
     - This should NOT push to generic collectionHistory.
     - Instead call window.collectCreditService(job) so collection module manages credit-collected list.
  ------------------------- */
  function collectServiceCredit(id){
    const j = (window.services || []).find(x => x.id === id);
    if (!j) { alert("Job not found."); return; }

    // Only applicable when there is remaining credit or creditStatus is 'credit'
    const rem = Number(j.remaining || 0);
    const creditFlag = String(j.creditStatus || "").toLowerCase();

    if (rem <= 0 && creditFlag !== "credit") {
      alert("No pending credit on this job.");
      return;
    }

    // Confirm
    const msg = [
      `Collect payment for job: ${j.item} ${j.model}`.trim(),
      `Customer: ${j.customer || "-"}`,
      `Remaining: ₹${rem}`
    ];
    if (!confirm(msg.join("\n") + "\n\nMark as collected?")) return;

    // Mark collected
    j.paid = Number(j.paid || 0) + rem;
    j.remaining = 0;
    j.creditStatus = "collected";
    j.status = j.status === "pending" ? "completed" : j.status;

    // Persist
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); } catch(e){ console.warn("saveServices failed", e); }
    }

    // Inform collection module to record credit-collected (so it goes to Credit History with delete icon)
    try {
      if (typeof window.collectCreditService === "function") {
        // Provide necessary details (date, customer, phone, item, model, collected amount)
        window.collectCreditService({
          date_out: j.date_out || nowDate(),
          customer: j.customer || "",
          phone: j.phone || "",
          item: j.item || "",
          model: j.model || "",
          creditCollectedOn: nowDate(),
          creditCollectedAmount: rem
        });
      } else {
        // fallback: if app doesn't have collectCreditService, fallback to add to generic collection (less preferred)
        if (typeof window.addToCollectionHistory === "function"){
          window.addToCollectionHistory({
            date: nowDate(),
            source: "Service (Collected)",
            details: `${j.item} ${j.model} — ${j.customer || "-"}`,
            amount: rem
          });
        }
      }
    } catch (err) {
      console.warn("collectCreditService failed", err);
    }

    // update UI
    renderServiceTables();
    renderServiceHistory();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.renderCollection?.();
  }
  window.collectServiceCredit = collectServiceCredit;

  /* -------------------------
     Render pending / active jobs table (#svcTable)
  ------------------------- */
  function renderServiceTables(){
    const tbody = qs("#svcTable tbody");
    if (!tbody) return;

    const list = (window.services || []).filter(s => String(s.status || "").toLowerCase() !== "archived");
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No service jobs</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(j => {
      const remaining = Number(j.remaining || 0);
      const creditFlag = String(j.creditStatus || "").toLowerCase();
      let actionHTML = "";

      if (String(j.status || "").toLowerCase() === "completed") {
        actionHTML = `<button class="btn-link" onclick="viewServiceJob('${j.id}')">View</button>`;
        if (remaining > 0 || creditFlag === "credit") {
          actionHTML += ` <button class="small-btn" style="padding:4px 8px;font-size:12px;margin-left:6px;" onclick="collectServiceCredit('${j.id}')">Collect</button>`;
        }
      } else {
        actionHTML = `<button class="small-btn" onclick="startServiceJob('${j.id}')">Start</button>
                      <button class="small-btn" style="margin-left:6px;" onclick="completeServiceJob('${j.id}', { remaining: ${remaining}, paid: ${j.paid || 0}, invest: ${j.invest || 0}, creditStatus: '${j.creditStatus || ""}' })">Complete</button>`;
      }

      return `
        <tr>
          <td>${esc(j.id)}</td>
          <td>${esc(j.date_in || "")}${j.time_in ? `<br><small>${esc(j.time_in)}</small>` : ""}</td>
          <td>${esc(j.customer || "-")}</td>
          <td>${esc(j.phone || "")}</td>
          <td>${esc(j.item || "")}</td>
          <td>${esc(j.model || "")}</td>
          <td>${esc(j.problem || "")}</td>
          <td>
            ${j.status === "completed" ? `<span class="status-paid">Completed</span>` : `<span class="status-credit">${esc(j.status || "")}</span>`}
            ${remaining > 0 ? `<br><small style="color:#ea580c">Pending ₹${remaining}</small>` : ""}
          </td>
          <td>${actionHTML}</td>
        </tr>
      `;
    }).join("");
  }
  window.renderServiceTables = renderServiceTables;

  /* -------------------------
     Render completed/history table (#svcHistoryTable)
  ------------------------- */
  function renderServiceHistory(){
    const tbody = qs("#svcHistoryTable tbody");
    if (!tbody) return;

    const list = (window.services || []).filter(s => s.status === "completed");
    if (!list.length){
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No completed jobs</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(j => {
      return `
        <tr>
          <td>${esc(j.id)}</td>
          <td>${esc(j.date_in || "")}</td>
          <td>${esc(j.date_out || "")}</td>
          <td>${esc(j.customer || "-")}</td>
          <td>${esc(j.item || "")}</td>
          <td>₹${Number(j.invest || 0)}</td>
          <td>₹${Number(j.paid || 0)}</td>
          <td>₹${Number((j.paid || 0) - (j.invest || 0))}</td>
          <td>${esc(j.creditStatus || "")}</td>
        </tr>
      `;
    }).join("");
  }
  window.renderServiceHistory = renderServiceHistory;

  /* -------------------------
     Start job (set status inprogress)
  ------------------------- */
  function startServiceJob(id){
    const j = (window.services || []).find(x => x.id === id);
    if (!j) { alert("Job not found"); return; }
    j.status = "inprogress";
    if (typeof window.saveServices === "function") try{ window.saveServices(); }catch(e){}

    renderServiceTables();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
  }
  window.startServiceJob = startServiceJob;

  /* -------------------------
     Delete / Clear all jobs (danger)
  ------------------------- */
  document.getElementById("clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Clear ALL service jobs? This cannot be undone.")) return;
    window.services = [];
    if (typeof window.saveServices === "function") try{ window.saveServices(); }catch(e){}
    renderServiceTables();
    renderServiceHistory();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
  });

  /* -------------------------
     Utility: view job (simple alert / or open modal if exists)
  ------------------------- */
  window.viewServiceJob = function(id){
    const j = (window.services || []).find(x => x.id === id);
    if (!j) { alert("Job not found"); return; }
    let info = [
      `Job ID: ${j.id}`,
      `Received: ${j.date_in} ${j.time_in || ""}`,
      `Customer: ${j.customer || "-"}`,
      `Phone: ${j.phone || "-"}`,
      `Item: ${j.item} ${j.model || ""}`,
      `Problem: ${j.problem || ""}`,
      `Invest: ₹${j.invest || 0}`,
      `Paid: ₹${j.paid || 0}`,
      `Remaining: ₹${j.remaining || 0}`,
      `Status: ${j.status} ${j.creditStatus ? "(" + j.creditStatus + ")" : ""}`
    ];
    alert(info.join("\n"));
  };

  /* -------------------------
     Init render on DOM ready
  ------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try { renderServiceTables(); } catch(e){ console.warn(e); }
    try { renderServiceHistory(); } catch(e){ console.warn(e); }
  });

})();
