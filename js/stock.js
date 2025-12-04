/* stock.js — FINAL V14 (fixed) */
(function(){
  const qsLocal = s => document.querySelector(s);
  window.stock = Array.isArray(window.stock)?window.stock:[];

  function saveStockLocal(){
    try{ localStorage.setItem("stock-data", JSON.stringify(window.stock)); }catch{}
    if(typeof window.cloudSaveDebounced==="function") window.cloudSaveDebounced("stock", window.stock);
    else if(typeof window.cloudSync==="function") window.cloudSync("stock-data", window.stock);
  }
  window.saveStock = saveStockLocal;

  window.addStockItem = function(){
    const date = qsLocal("#pdate")?.value || window.todayDate?.();
    const type = qsLocal("#ptype")?.value?.trim();
    const name = qsLocal("#pname")?.value?.trim();
    const qty = Number(qsLocal("#pqty")?.value || 0);
    const cost = Number(qsLocal("#pcost")?.value || 0);
    if(!date||!type||!name||qty<=0||cost<=0){ alert("Invalid stock entry!"); return; }
    const item = { id: window.uid?window.uid("stk"):"stk_"+Math.random().toString(36).slice(2,9), date, type, name, qty, remain:qty, sold:0, cost, limit: Number(qsLocal("#globalLimit")?.value || window.getGlobalLimit?.() || 0) };
    window.stock.unshift(item);
    saveStockLocal();
    try{ renderStock?.(); }catch{}
    try{ window.updateUniversalBar?.(); }catch{}
  };

  window.deleteStock = function(id){ window.stock = (window.stock||[]).filter(s=>s.id!==id); saveStockLocal(); try{ renderStock?.(); }catch{} try{ window.updateUniversalBar?.(); }catch{} };
  window.clearStock = function(){ if(!confirm("Clear all stock entries?")) return; window.stock=[]; saveStockLocal(); try{ renderStock?.(); }catch{} try{ window.updateUniversalBar?.(); }catch{} };

  function filterStockList(){
    const type = qsLocal("#filterType")?.value || "all";
    const search = (qsLocal("#productSearch")?.value || "").toLowerCase();
    return (window.stock||[]).filter(s => {
      const matchType = (type==="all" || s.type===type);
      const matchSearch = String(s.name||"").toLowerCase().includes(search) || String(s.type||"").toLowerCase().includes(search);
      return matchType && matchSearch;
    });
  }

  window.renderStock = function(){
    const tbody = qsLocal("#stockTable tbody");
    if(!tbody) return;
    const list = filterStockList();
    if(!list.length){ tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No stock added</td></tr>`; renderStockInvestment(); return; }
    tbody.innerHTML = list.map(item => {
      const alert = (Number(item.remain||0) <= Number(item.limit||0)) ? "⚠️" : "";
      return `<tr>
        <td>${window.toDisplay?window.toDisplay(item.date):item.date}</td>
        <td>${esc(item.type)}</td>
        <td>${esc(item.name)}</td>
        <td>${Number(item.qty||0)}</td>
        <td>${Number(item.sold||0)}</td>
        <td>${Number(item.remain||0)}</td>
        <td>${alert}</td>
        <td>${Number(item.limit||0)}</td>
        <td><button class="btn-link" onclick="deleteStock('${item.id}')">Delete</button></td>
      </tr>`;
    }).join("");
    renderStockInvestment();
  };

  function renderStockInvestment(){
    const box = qsLocal("#stockInvValue");
    if(!box) return;
    const total = (window.stock||[]).reduce((s,it)=> s + (Number(it.cost||0) * Number(it.qty||0)), 0);
    box.textContent = "₹" + total;
    const invEl = qsLocal("#unStockInv");
    if(invEl) invEl.textContent = "₹" + total;
  }

  window.reduceStockAfterSale = function(product, qty){
    qty = Number(qty||0);
    if(!product||qty<=0) return;
    for(const s of window.stock){
      if(s.name === product && Number(s.remain||0) > 0){
        const take = Math.min(qty, Number(s.remain||0));
        s.remain = Number(s.remain||0) - take;
        s.sold = Number(s.sold||0) + take;
        qty -= take;
        if(qty<=0) break;
      }
    }
    saveStockLocal();
    try{ renderStock?.(); }catch{}
    try{ window.updateUniversalBar?.(); }catch{}
  };

  window.addEventListener("load", ()=>{ try{ renderStock?.(); renderStockInvestment(); }catch{} });
})();
