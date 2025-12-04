/* core.js — FINAL V13 (unified) */
(function(){
  // STORAGE KEYS
  const KEY_TYPES = "item-types";
  const KEY_STOCK = "stock-data";
  const KEY_SALES = "sales-data";
  const KEY_WANTING = "wanting-data";
  const KEY_EXPENSES = "expenses-data";
  const KEY_SERVICES = "service-data";
  const KEY_COLLECTIONS = "ks-collections";
  const KEY_LIMIT = "default-limit";
  const KEY_USER_EMAIL = "ks-user-email";

  const CLOUD_COLLECTIONS = {
    [KEY_TYPES]: "types",
    [KEY_STOCK]: "stock",
    [KEY_SALES]: "sales",
    [KEY_WANTING]: "wanting",
    [KEY_EXPENSES]: "expenses",
    [KEY_SERVICES]: "services",
    [KEY_COLLECTIONS]: "collections"
  };

  function safeParse(raw){ try{ return JSON.parse(raw); }catch{ return []; } }
  function toArray(v){ return Array.isArray(v) ? v : []; }

  // uid
  function uid(prefix="id"){ return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }
  window.uid = uid;

  // esc
  function esc(s){ return String(s || ""); }
  window.esc = esc;

  // dates
  function todayDate(){
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().split("T")[0];
  }
  window.todayDate = todayDate;

  function toInternalIfNeeded(d){
    if(!d) return "";
    if(typeof d !== "string") return d;
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if(/^\d{2}-\d{2}-\d{4}$/.test(d)){ const [dd,mm,yy]=d.split("-"); return `${yy}-${mm}-${dd}`; }
    return d;
  }
  window.toInternalIfNeeded = toInternalIfNeeded;

  function toDisplay(d){
    if(!d||typeof d!=="string") return "";
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)){ const [y,m,dd]=d.split("-"); return `${dd}-${m}-${y}`; }
    return d;
  }
  window.toDisplay = toDisplay;

  // load localsafely
  window.types = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  window.services = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

  function ensureArrays(){
    if(!Array.isArray(window.types)) window.types=[];
    if(!Array.isArray(window.stock)) window.stock=[];
    if(!Array.isArray(window.sales)) window.sales=[];
    if(!Array.isArray(window.wanting)) window.wanting=[];
    if(!Array.isArray(window.expenses)) window.expenses=[];
    if(!Array.isArray(window.services)) window.services=[];
    if(!Array.isArray(window.collections)) window.collections=[];
  }
  ensureArrays();

  function normalizeAllDates(){
    try{
      window.stock = (window.stock||[]).map(p=>{
        const c = {...p}; c.date = toInternalIfNeeded(c.date);
        if(Array.isArray(c.history)) c.history = c.history.map(h=>({...h, date: toInternalIfNeeded(h.date)}));
        return c;
      });
      window.sales = (window.sales||[]).map(s=>({...s, date: toInternalIfNeeded(s.date)}));
      window.wanting = (window.wanting||[]).map(w=>({...w, date: toInternalIfNeeded(w.date)}));
      window.expenses = (window.expenses||[]).map(e=>({...e, date: toInternalIfNeeded(e.date)}));
      window.services = (window.services||[]).map(j=>({...j, date_in: toInternalIfNeeded(j.date_in), date_out: toInternalIfNeeded(j.date_out)}));
      window.collections = (window.collections||[]).map(c=>({...c, date: toInternalIfNeeded(c.date)}));
    }catch(e){ console.warn("normalizeAllDates failed", e); }
  }
  normalizeAllDates();

  function _localSave(k, arr){ try{ localStorage.setItem(k, JSON.stringify(arr||[])); }catch(e){ console.warn(e); } }
  function saveTypes(){ _localSave(KEY_TYPES, window.types); }
  function saveStock(){ _localSave(KEY_STOCK, window.stock); }
  function saveSales(){ _localSave(KEY_SALES, window.sales); }
  function saveWanting(){ _localSave(KEY_WANTING, window.wanting); }
  function saveExpenses(){ _localSave(KEY_EXPENSES, window.expenses); }
  function saveServices(){ _localSave(KEY_SERVICES, window.services); }
  function saveCollections(){ _localSave(KEY_COLLECTIONS, window.collections); }

  window.saveTypes = saveTypes; window.saveStock = saveStock; window.saveSales = saveSales;
  window.saveWanting = saveWanting; window.saveExpenses = saveExpenses; window.saveServices = saveServices; window.saveCollections = saveCollections;

  // cloud helpers: rely on window.cloudSave / window.cloudLoad provided by firebase.js
  async function cloudSync(key, arr){
    try{ _localSave(key, arr); }catch(e){}
    try{
      const col = CLOUD_COLLECTIONS[key];
      if(col && typeof window.cloudSave === "function"){
        await window.cloudSave(col, arr);
      }
    }catch(e){ console.warn("cloudSync failed", e); }
  }
  window.cloudSync = cloudSync;

  // storage event multi-tab
  window.addEventListener("storage", ()=>{
    try{
      window.types = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
      window.stock = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
      window.sales = toArray(safeParse(localStorage.getItem(KEY_SALES)));
      window.wanting = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
      window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
      window.services = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
      window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));
      ensureArrays();
      normalizeAllDates();
      try{ renderTypes?.(); }catch{}
      try{ renderStock?.(); }catch{}
      try{ renderSales?.(); }catch{}
      try{ renderWanting?.(); }catch{}
      try{ renderExpenses?.(); }catch{}
      try{ renderServiceTables?.(); }catch{}
      try{ renderAnalytics?.(); }catch{}
      try{ renderCollection?.(); }catch{}
      try{ updateSummaryCards?.(); }catch{}
      try{ updateTabSummaryBar?.(); }catch{}
      try{ updateUniversalBar?.(); }catch{}
      try{ updateEmailTag?.(); }catch{}
    }catch(e){ console.warn("storage handler failed", e); }
  });

  /* Business logic (types / stock / wanting / expenses etc) */
  window.addType = function(name){
    name = (name||"").trim();
    if(!name) return;
    if((window.types||[]).some(t=>String(t.name||"").toLowerCase()===name.toLowerCase())) return;
    const item = { id: uid("type"), name };
    window.types.push(item);
    saveTypes();
    cloudSync(KEY_TYPES, window.types);
    try{ renderTypes?.(); }catch{};
  };

  window.findProduct = function(type,name){
    return (window.stock||[]).find(p => p.type===type && String(p.name||"").toLowerCase()===String(name||"").toLowerCase());
  };

  window.getProductCost = function(type,name){
    const p = window.findProduct(type,name);
    if(!p) return 0;
    if(p.cost) return Number(p.cost);
    if(Array.isArray(p.history) && p.history.length){
      let t=0,q=0;
      p.history.forEach(h=>{ t+=Number(h.cost||0)*Number(h.qty||0); q+=Number(h.qty||0);});
      return q? t/q : 0;
    }
    return 0;
  };

  window.addStockEntry = function({date,type,name,qty,cost}){
    date = toInternalIfNeeded(date);
    qty = Number(qty); cost = Number(cost);
    if(!type||!name||qty<=0||cost<=0) return;
    let p = window.findProduct(type,name);
    if(!p){
      p = { id: uid("stk"), date, type, name, qty, sold:0, cost, limit: Number(localStorage.getItem(KEY_LIMIT)||0), history:[{date,qty,cost}] };
      window.stock.push(p);
    } else {
      p.qty = Number(p.qty||0) + qty;
      p.cost = cost;
      p.history = p.history||[];
      p.history.push({date,qty,cost});
    }
    saveStock();
    cloudSync(KEY_STOCK, window.stock);
    try{ renderStock?.(); }catch{}
  };

  window.setGlobalLimit = function(v){ localStorage.setItem(KEY_LIMIT, v); };
  window.getGlobalLimit = function(){ return Number(localStorage.getItem(KEY_LIMIT) || 0); };

  window.autoAddWanting = function(type,name,note="Low Stock"){
    if(!type||!name) return;
    if((window.wanting||[]).some(w=>w.type===type && w.name===name)) return;
    const row = { id: uid("want"), date: todayDate(), type, name, note };
    window.wanting.push(row);
    saveWanting();
    cloudSync(KEY_WANTING, window.wanting);
    try{ renderWanting?.(); }catch{}
  };

  window.addExpense = function({date,category,amount,note}){
    const row = { id: uid("exp"), date: toInternalIfNeeded(date||todayDate()), category, amount: Number(amount||0), note: note||"" };
    window.expenses.push(row);
    saveExpenses();
    cloudSync(KEY_EXPENSES, window.expenses);
    try{ renderExpenses?.(); }catch{}
  };

  window.getTotalNetProfit = function(){
    let salesProfit=0, serviceProfit=0, exp=0;
    (window.sales||[]).forEach(s=>{ if(String(s.status||"").toLowerCase()!=="credit") salesProfit += Number(s.profit||0); });
    (window.services||[]).forEach(j=>{ serviceProfit += Number(j.profit||0); });
    (window.expenses||[]).forEach(e => { exp += Number(e.amount||0); });
    return salesProfit + serviceProfit - exp;
  };

  window.updateTabSummaryBar = function(){
    const el = document.getElementById("tabSummaryBar"); if(!el) return;
    const net = window.getTotalNetProfit();
    if(net>=0){ el.style.background="#004d00"; el.style.color="#fff"; el.textContent = `Profit: +₹${net}`; }
    else { el.style.background="#4d0000"; el.style.color="#fff"; el.textContent = `Loss: -₹${Math.abs(net)}`; }
  };

  // Collections helpers — minimal, will integrate with cloud via cloudSync
  function ensureCollections(){ if(!Array.isArray(window.collections)) window.collections = []; }
  ensureCollections();

  function _collectionKey(e){ return `${e.date||""}|${e.source||""}|${e.details||""}|${Number(e.amount||0)}`; }

  window.addCollectionEntry = function(entry){
    ensureCollections();
    entry = entry||{};
    const e = { id: entry.id || uid("col"), date: toInternalIfNeeded(entry.date||todayDate()), source: entry.source||"Unknown", details: entry.details||"", amount: Number(entry.amount||0) };
    const k = _collectionKey(e);
    window._collectionKeys = window._collectionKeys || [];
    if(window._collectionKeys.includes(k)) return false;
    window._collectionKeys.unshift(k);
    window.collections.unshift(e);
    saveCollections();
    cloudSync(KEY_COLLECTIONS, window.collections);
    try{ renderCollection?.(); }catch{}
    try{ updateSummaryCards?.(); }catch{}
    try{ updateUniversalBar?.(); }catch{}
    return true;
  };

  // markSaleCollected & markServiceCollected minimal versions (idempotent)
  window.markSaleCollected = function(saleOrId, options={}){
    if(!saleOrId) return false;
    let sale = (typeof saleOrId === "string") ? (window.sales||[]).find(s=>s.id===saleOrId) : saleOrId;
    if(!sale) return false;
    const idx = (window.sales||[]).findIndex(s=>s.id===sale.id);
    if(idx === -1) window.sales.unshift(sale);
    else sale = window.sales[idx];
    if(String(sale.creditStatus||"").toLowerCase()==="collected" || sale._collectedMarked) return false;
    const collectedAmount = Number(options.collectedAmount || sale.collectedAmount || sale.collected || sale.total || (Number(sale.qty||0)*Number(sale.price||0)) || 0);
    const collectedOn = options.collectedOn || todayDate();
    sale.creditStatus = "collected"; sale.wasCredit = true; sale.collectedAmount = collectedAmount; sale.creditCollectedOn = collectedOn; sale._collectedMarked = true;
    saveSales(); cloudSync(KEY_SALES, window.sales);
    window.addCollectionEntry({ date: collectedOn, source: "Sales (Credit Collected)", details: `${sale.customer||"-"} / ${sale.product||"-"}`, amount: collectedAmount });
    return true;
  };

  window.markServiceCollected = function(jobOrId, options={}){
    if(!jobOrId) return false;
    let job = (typeof jobOrId === "string") ? (window.services||[]).find(s=>s.id===jobOrId) : jobOrId;
    if(!job) return false;
    const idx = (window.services||[]).findIndex(s=>s.id===job.id);
    if(idx === -1) window.services.unshift(job);
    else job = window.services[idx];
    if(String(job.creditStatus||"").toLowerCase()==="collected" || job._collectedMarked) return false;
    const collectedAmount = Number(options.collectedAmount || job.creditCollectedAmount || job.collected || 0);
    const collectedOn = options.collectedOn || todayDate();
    job.creditStatus = "collected"; job.creditCollectedAmount = collectedAmount; job.creditCollectedOn = collectedOn; job._collectedMarked = true;
    saveServices(); cloudSync(KEY_SERVICES, window.services);
    window.addCollectionEntry({ date: collectedOn, source: "Service (Credit Collected)", details: `${job.customer||"-"} / ${job.item||"-"}`, amount: collectedAmount});
    return true;
  };

  // expose minimal public API if needed (already set on window)
  window.cloudSync = cloudSync;
})();
