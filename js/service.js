/* ===========================================================
   services.js — FINAL v8.0
   ✔ Auto profit & investment update
   ✔ Completed status → auto sync
   ✔ dd-mm-yyyy support
   ✔ Full integration with Overview + Smart Dashboard + Profit Tab
=========================================================== */

/* -------------------------
   ADD SERVICE ENTRY
-------------------------- */
function addService() {
  let date_in  = qs("#svcIn")?.value || todayDate();
  let date_out = qs("#svcOut")?.value || "";
  const name   = qs("#svcName")?.value.trim();
  const invest = Number(qs("#svcInvest")?.value || 0);
  const profit = Number(qs("#svcProfit")?.value || 0);
  const status = qs("#svcStatus")?.value || "Pending";

  if (!name) return alert("Enter service name!");

  // date convert (dd-mm-yyyy → yyyy-mm-dd)
  if (date_in.includes("-") && date_in.split("-")[0].length === 2)
    date_in = toInternal(date_in);

  if (date_out && date_out.includes("-") && date_out.split("-")[0].length === 2)
    date_out = toInternal(date_out);

  window.services = window.services || [];

  const entry = {
    id: uid("svc"),
    date_in,
    date_out: date_out || "",
    name,
    invest,
    profit,
    status
  };

  window.services.push(entry);
  saveServices();

  // Auto profit & investment sync
  if (status === "Completed") {
    window.addServiceInvestment?.(invest);
    window.addServiceProfit?.(profit);
  }

  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();

  qs("#svcName").value = "";
  qs("#svcInvest").value = "";
  qs("#svcProfit").value = "";
  qs("#svcStatus").value = "Pending";
  qs("#svcOut").value = "";
}

/* -------------------------
   RENDER TABLE
-------------------------- */
function renderServiceTables() {
  const tbody = qs("#servicesTable tbody");
  if (!tbody) return;

  const fstat = qs("#svcFilterStatus")?.value || "all";
  const fdate = qs("#svcFilterDate")?.value || "";

  let list = window.services || [];

  if (fstat !== "all") list = list.filter(s => s.status === fstat);
  if (fdate) list = list.filter(s => s.date_in === fdate);

  let investTotal = 0;
  let profitTotal = 0;

  tbody.innerHTML = list
    .map(s => {
      if (s.status === "Completed") {
        investTotal += Number(s.invest || 0);
        profitTotal += Number(s.profit || 0);
      }

      return `
      <tr>
        <td>${toDisplay(s.date_in)}</td>
        <td>${s.date_out ? toDisplay(s.date_out) : "-"}</td>
        <td>${s.name}</td>
        <td>₹${s.invest}</td>
        <td>₹${s.profit}</td>
        <td>${s.status}</td>
        <td>
          <button class="svc-complete" data-id="${s.id}">✔ Complete</button>
          <button class="svc-delete" data-id="${s.id}">🗑 Delete</button>
        </td>
      </tr>
      `;
    })
    .join("");

  qs("#svcInvTotal").textContent = investTotal;
  qs("#svcProfitTotal").textContent = profitTotal;
}

/* -------------------------
   BUTTON EVENTS
-------------------------- */
document.addEventListener("click", e => {

  /* Mark as Completed */
  if (e.target.classList.contains("svc-complete")) {
    const id = e.target.dataset.id;
    let s = (window.services || []).find(x => x.id === id);
    if (!s) return;

    if (s.status === "Completed")
      return alert("Already completed!");

    s.status = "Completed";
    s.date_out = todayDate();

    // Sync investment + profit
    window.addServiceInvestment?.(s.invest);
    window.addServiceProfit?.(s.profit);

    saveServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  /* Delete Service */
  if (e.target.classList.contains("svc-delete")) {
    const id = e.target.dataset.id;
    if (!confirm("Delete this service?")) return;

    window.services = (window.services || []).filter(s => s.id !== id);
    saveServices();

    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }
});

/* -------------------------
   FILTER EVENTS
-------------------------- */
qs("#svcFilterStatus")?.addEventListener("change", renderServiceTables);
qs("#svcFilterDate")?.addEventListener("change", renderServiceTables);

/* -------------------------
   INIT
-------------------------- */
window.addEventListener("load", () => {
  renderServiceTables();
});

window.renderServiceTables = renderServiceTables;
