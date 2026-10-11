/* app.js — all application code (extracted from the single-file version).
   Blocks run in the original order; later blocks wrap/override earlier ones.
   Block 1 is the core (top-level functions and state); the other blocks are patches, each isolated with try/catch. */

/* ===== Script block 1/26 ===== */
/* Chart.js is loaded from a CDN. If it cannot load (offline, VPN, blocked), the app must still start:
   this small stand-in stops the first chart from throwing and killing everything that runs after it. */
if(typeof Chart==='undefined'){
  window.Chart=function(ctx){
    var cv=ctx&&ctx.canvas;
    if(cv&&cv.parentNode&&!cv.parentNode.querySelector('.chart-offline')){
      var n=document.createElement('div');n.className='chart-offline';
      n.style.cssText='padding:24px 12px;text-align:center;color:var(--text-muted);font-size:12px;';
      n.textContent='نمودار نمایش داده نشد (کتابخانه Chart.js بارگذاری نشد؛ اتصال اینترنت را بررسی کنید)';
      cv.style.display='none';cv.parentNode.appendChild(n);
    }
    this.destroy=function(){var m=cv&&cv.parentNode&&cv.parentNode.querySelector('.chart-offline');if(m)m.remove();if(cv)cv.style.display='';};
    this.update=function(){};
  };
  Chart.register=function(){};Chart.defaults={font:{},plugins:{legend:{labels:{}}}};
}
/* =========================================================
   جلالی <-> میلادی (الگوریتم استاندارد تقویم جلالی)
   ========================================================= */
function jDiv(a,b){return ~~(a/b);}
function jMod(a,b){return a-~~(a/b)*b;}
const J_BREAKS=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
function jalCal(jy){
  const bl=J_BREAKS.length; let gy=jy+621, leapJ=-14, jp=J_BREAKS[0], jm,jump,n,i;
  for(i=1;i<bl;i++){jm=J_BREAKS[i]; jump=jm-jp; if(jy<jm) break; leapJ=leapJ+jDiv(jump,33)*8+jDiv(jMod(jump,33),4); jp=jm;}
  n=jy-jp;
  leapJ=leapJ+jDiv(n,33)*8+jDiv(jMod(n,33)+3,4);
  if(jMod(jump,33)===4 && jump-n===4) leapJ+=1;
  const leapG=jDiv(gy,4)-jDiv((jDiv(gy,100)+1)*3,4)-150;
  const march=20+leapJ-leapG;
  if(jump-n<6) n=n-jump+jDiv(jump,33)*33;
  let leap=jMod(jMod(n+1,33)-1,4);
  if(leap===-1) leap=4;
  return {leap:leap, gy:gy, march:march};
}
function g2d(gy,gm,gd){
  let d=jDiv((gy+jDiv(gm-8,6)+100100)*1461,4)+jDiv(153*jMod(gm+9,12)+2,5)+gd-34840408;
  d=d-jDiv(jDiv(gy+jDiv(gm-8,6)+100100,100)*3,4)+752;
  return d;
}
function d2g(jdn){
  let j=4*jdn+139361631;
  j=j+jDiv(jDiv(4*jdn+183187720,146097)*3,4)*4-3908;
  const i=jDiv(jMod(j,1461),4)*5+308;
  const gd=jDiv(jMod(i,153),5)+1;
  const gm=jMod(jDiv(i,153),12)+1;
  const gy=jDiv(j,1461)-100100+jDiv(8-gm,6);
  return [gy,gm,gd];
}
function j2d(jy,jm,jd){
  const r=jalCal(jy);
  return g2d(r.gy,3,r.march)+(jm-1)*31-jDiv(jm,7)*(jm-7)+jd-1;
}
function d2j(jdn){
  let gy=d2g(jdn)[0], jy=gy-621, jd,jm,k;
  const r=jalCal(jy);
  const jdn1f=g2d(gy,3,r.march);
  k=jdn-jdn1f;
  if(k>=0){
    if(k<=185){ jm=1+jDiv(k,31); jd=jMod(k,31)+1; return [jy,jm,jd]; }
    else k-=186;
  } else { jy-=1; k+=179; if(r.leap===1) k+=1; }
  jm=7+jDiv(k,30); jd=jMod(k,30)+1;
  return [jy,jm,jd];
}
function gregorianToJalali(gy,gm,gd){ return d2j(g2d(gy,gm,gd)); }
function jalaliToGregorian(jy,jm,jd){ return d2g(j2d(jy,jm,jd)); }
function todayJalali(){ const d=new Date(); const [jy,jm,jd]=gregorianToJalali(d.getFullYear(),d.getMonth()+1,d.getDate()); return {jy,jm,jd}; }
function jToJdn(j){ return j2d(j.jy,j.jm,j.jd); }
const J_MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
function jDaysInMonth(jy,jm){
  if(jm<=6) return 31;
  if(jm<=11) return 30;
  const r=jalCal(jy);
  return r.leap===0?30:29;
}

/* =========================================================
   ابزارهای کمکی
   ========================================================= */
const FA_DIGITS=['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
function fa(n){ return String(n).replace(/[0-9]/g, d=>FA_DIGITS[d]); }
function money(n){ n=Math.round(n||0); return fa(n.toLocaleString('en-US')); }
function jStr(j){ if(!j) return ''; return fa(j.jd)+' '+J_MONTHS[j.jm-1]+' '+fa(j.jy); }
function jStrShort(j){ if(!j) return ''; return fa(String(j.jy)+'/'+String(j.jm).padStart(2,'0')+'/'+String(j.jd).padStart(2,'0')); }
function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function range(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }
function showToast(msg){
  const r=document.getElementById('toastRoot');
  r.innerHTML='<div class="toast">'+esc(msg)+'</div>';
  setTimeout(()=>{ r.innerHTML=''; }, 2400);
}

/* =========================================================
   داده و ذخیره‌سازی
   ========================================================= */
const STORE_KEY='daftar_service_biz_v2';
let state=null;

function defaultExpenseCategories(){
  const rent={id:uid(), name:'اجاره', parentId:null};
  const salary={id:uid(), name:'حقوق و دستمزد', parentId:null};
  const purchase={id:uid(), name:'خرید', parentId:null};
  const purchaseEquip={id:uid(), name:'خرید تجهیزات', parentId:purchase.id};
  const purchaseSupplies={id:uid(), name:'خرید مواد مصرفی', parentId:purchase.id};
  const bills={id:uid(), name:'قبوض', parentId:null};
  const billsPower={id:uid(), name:'برق', parentId:bills.id};
  const billsWater={id:uid(), name:'آب', parentId:bills.id};
  const billsGas={id:uid(), name:'گاز', parentId:bills.id};
  const billsNet={id:uid(), name:'اینترنت و تلفن', parentId:bills.id};
  const marketing={id:uid(), name:'بازاریابی و تبلیغات', parentId:null};
  const transport={id:uid(), name:'حمل‌ونقل', parentId:null};
  const misc={id:uid(), name:'متفرقه', parentId:null};
  return [rent,salary,purchase,purchaseEquip,purchaseSupplies,bills,billsPower,billsWater,billsGas,billsNet,marketing,transport,misc];
}
function defaultServiceCategories(){ return [{id:uid(),name:'خدمات فنی'},{id:uid(),name:'خدمات مشاوره'},{id:uid(),name:'کالا و تجهیزات'}]; }
function defaultCustomerCategories(){ return [{id:uid(),name:'عمده‌فروش'},{id:uid(),name:'خرده‌فروش'},{id:uid(),name:'ویژه (VIP)'}]; }
function defaultBankAccounts(){ return [{id:uid(),name:'صندوق نقدی',type:'cash',initialBalance:0,note:''},{id:uid(),name:'حساب بانک ملت',type:'bank',initialBalance:0,note:''}]; }

function defaultState(){
  return {
    business:{ name:'دفتر خدمات فنی آریا', phone:'۰۲۱-۸۸۷۷۶۶۵۵', address:'تهران، خیابان ولیعصر، پلاک ۱۲', economicCode:'', taxRate:9, currency:'تومان', nextInvoiceNo:1001 },
    settings:{ invoicePrefix:'INV-', nextProformaNo:1001, proformaPrefix:'PF-', decimalPlaces:0, numberFormat:'fa', dateCalendar:'jalali', fiscalYearStartMonth:1, defaultTaxRate:9, defaultReceiveAccountId:null, defaultPayAccountId:null, invoiceFooter:'', invoiceHeader:'', paymentTerms:'', showLogo:true, showBankInfo:true, showTax:true, showDiscount:true, showSignature:true, paperSize:'A4', printMargin:'normal', autoBackup:false, backupReminderDays:7, lockEnabled:false, lockPin:'', autoLockMinutes:0, theme:'system', accent:'brass', language:'fa', compactTables:false, users:[]},
    customers:[], services:[], invoices:[], expenses:[], activityLog:[],
    expenseCategories:defaultExpenseCategories(), serviceCategories:defaultServiceCategories(), customerCategories:defaultCustomerCategories(),
    bankAccounts:defaultBankAccounts(), transactions:[], checks:[], receivablesPayables:[]
  };
}
function seedDemo(){
  const s=defaultState();
  const custCatWholesale=s.customerCategories.find(c=>c.name==='عمده‌فروش');
  const custCatRetail=s.customerCategories.find(c=>c.name==='خرده‌فروش');
  const c1={id:uid(), name:'شرکت راهکار پویا', phone:'۰۹۱۲۱۲۳۴۵۶۷', address:'تهران', economicCode:'', note:'', categoryId:custCatWholesale?custCatWholesale.id:null};
  const c2={id:uid(), name:'فروشگاه سبز', phone:'۰۹۱۹۸۸۷۷۶۶۵', address:'کرج', economicCode:'', note:'', categoryId:custCatRetail?custCatRetail.id:null};
  s.customers=[c1,c2];

  const svcCatTech=s.serviceCategories.find(c=>c.name==='خدمات فنی');
  const svcCatGoods=s.serviceCategories.find(c=>c.name==='کالا و تجهیزات');
  const sv1={id:uid(), name:'نصب و راه‌اندازی سیستم', unit:'مورد', price:1800000, note:'', categoryId:svcCatTech?svcCatTech.id:null, trackStock:false, stock:0};
  const sv2={id:uid(), name:'پشتیبانی ماهانه', unit:'ماه', price:1200000, note:'', categoryId:svcCatTech?svcCatTech.id:null, trackStock:false, stock:0};
  const sv3={id:uid(), name:'دستگاه کارت‌خوان POS', unit:'دستگاه', price:3500000, note:'', categoryId:svcCatGoods?svcCatGoods.id:null, trackStock:true, stock:5};
  s.services=[sv1,sv2,sv3];

  s.bankAccounts[0].initialBalance=2000000;

  const today=todayJalali();
  function mkInv(no, jy,jm,jd, custId, items, paidFraction){
    const subtotal=items.reduce((a,it)=>a+it.qty*it.price-it.discount,0);
    const tax=Math.round(subtotal*s.business.taxRate/100);
    const grand=subtotal+tax;
    const inv={id:uid(), number:no, customerId:custId, date:{jy,jm,jd}, items, includeTax:true, subtotal, tax, grandTotal:grand, voided:false, payments:[]};
    if(paidFraction>0){
      const amt=Math.round(grand*paidFraction);
      inv.payments.push({id:uid(), date:{jy,jm,jd:Math.min(jd+1,28)}, amount:amt, method:'نقد', accountId:s.bankAccounts[0].id, note:''});
    }
    return inv;
  }
  const inv1=mkInv(1001, today.jy, today.jm, Math.max(1,today.jd-20), c1.id, [{key:uid(),serviceId:sv1.id,name:sv1.name,qty:1,price:1800000,discount:0}], 1);
  const inv2=mkInv(1002, today.jy, today.jm, Math.max(1,today.jd-9), c2.id, [{key:uid(),serviceId:sv2.id,name:sv2.name,qty:2,price:1200000,discount:100000}], 0.4);
  s.invoices=[inv1, inv2];
  s.business.nextInvoiceNo=1003;

  inv1.payments.forEach(p=>{ s.transactions.push({id:uid(), accountId:p.accountId, date:p.date, type:'deposit', amount:p.amount, description:'دریافت وجه فاکتور #'+fa(inv1.number), relatedType:'invoice-payment', relatedId:p.id}); });
  inv2.payments.forEach(p=>{ s.transactions.push({id:uid(), accountId:p.accountId, date:p.date, type:'deposit', amount:p.amount, description:'دریافت وجه فاکتور #'+fa(inv2.number), relatedType:'invoice-payment', relatedId:p.id}); });

  const catRent=s.expenseCategories.find(c=>c.name==='اجاره');
  const catBillsPower=s.expenseCategories.find(c=>c.name==='برق');
  const exp1={id:uid(), date:{jy:today.jy,jm:today.jm,jd:Math.max(1,today.jd-15)}, categoryId:catRent?catRent.id:null, amount:4500000, description:'اجاره دفتر کار', accountId:s.bankAccounts[1].id};
  const exp2={id:uid(), date:{jy:today.jy,jm:today.jm,jd:Math.max(1,today.jd-4)}, categoryId:catBillsPower?catBillsPower.id:null, amount:620000, description:'قبض برق', accountId:null};
  s.expenses=[exp1, exp2];
  s.transactions.push({id:uid(), accountId:exp1.accountId, date:exp1.date, type:'withdraw', amount:exp1.amount, description:'هزینه: اجاره', relatedType:'expense', relatedId:exp1.id});

  s.checks=[{id:uid(), direction:'receivable', customerId:c2.id, partyName:c2.name, number:'558200', bankName:'بانک ملت', amount:800000, dueDate:{jy:today.jy,jm:today.jm,jd:Math.min(28,today.jd+12)}, note:'', status:'pending'}];

  s.activityLog=[
    {id:uid(), type:'system', message:'دفتر حساب راه‌اندازی شد', date:{jy:today.jy,jm:today.jm,jd:Math.max(1,today.jd-20)}, time:'09:00'},
    {id:uid(), type:'invoice', message:'فاکتور #۱۰۰۱ برای «شرکت راهکار پویا» صادر و تسویه شد', date:{jy:today.jy,jm:today.jm,jd:Math.max(1,today.jd-20)}, time:'09:15'},
    {id:uid(), type:'invoice', message:'فاکتور #۱۰۰۲ برای «فروشگاه سبز» صادر شد', date:{jy:today.jy,jm:today.jm,jd:Math.max(1,today.jd-9)}, time:'11:40'}
  ];
  return s;
}
function migrate(){
  let changed=false;
  if(!state.expenseCategories){ state.expenseCategories=defaultExpenseCategories(); changed=true; }
  if(!state.serviceCategories){ state.serviceCategories=defaultServiceCategories(); changed=true; }
  if(!state.customerCategories){ state.customerCategories=defaultCustomerCategories(); changed=true; }
  if(!state.bankAccounts){ state.bankAccounts=defaultBankAccounts(); changed=true; }
  if(!state.transactions){ state.transactions=[]; changed=true; }
  if(!state.checks){ state.checks=[]; changed=true; }
  if(!state.receivablesPayables){ state.receivablesPayables=[]; changed=true; }
  if(!state.settings){ state.settings=defaultState().settings; changed=true; }
  const ds=defaultState().settings;
  Object.keys(ds).forEach(k=>{ if(state.settings[k]===undefined){ state.settings[k]=ds[k]; changed=true; } });
  if(!Array.isArray(state.appUsers)){ state.appUsers=[{id:uid(),name:'مدیر سیستم',role:'admin',active:true}]; changed=true; }

  (state.receivablesPayables||[]).forEach(r=>{
    if(r.paid===undefined){ r.paid=0; changed=true; }
    if(!r.payments){ r.payments=[]; changed=true; }
    if(!r.status){ r.status='open'; changed=true; }
  });
  if(!state.activityLog){ state.activityLog=[]; changed=true; }
  (state.customers||[]).forEach(c=>{ if(c.categoryId===undefined){ c.categoryId=null; changed=true; } });
  (state.services||[]).forEach(sv=>{
    if(sv.categoryId===undefined){ sv.categoryId=null; changed=true; }
    if(sv.trackStock===undefined){ sv.trackStock=false; changed=true; }
    if(sv.stock===undefined){ sv.stock=0; changed=true; }
  });
  (state.expenses||[]).forEach(e=>{
    if(e.categoryId===undefined){
      let cat=state.expenseCategories.find(c=>c.name===e.category);
      if(!cat){ cat={id:uid(), name:e.category||'متفرقه', parentId:null}; state.expenseCategories.push(cat); }
      e.categoryId=cat.id; delete e.category; changed=true;
    }
    if(e.accountId===undefined){ e.accountId=null; changed=true; }
  });
  (state.invoices||[]).forEach(inv=>{
    if(inv.payments===undefined){
      inv.payments=[];
      inv.voided = inv.status==='void';
      if(inv.status==='paid'){
        inv.payments.push({id:uid(), date:inv.paidDate||inv.date, amount:inv.grandTotal, accountId:null, method:'نامشخص', note:'ثبت خودکار از نسخه قبلی'});
      }
      delete inv.status; delete inv.paidDate;
      changed=true;
    }
    if(inv.voided===undefined){ inv.voided=false; changed=true; }
  });
  if(changed) save();
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){ state=JSON.parse(raw); migrate(); return; }
  }catch(e){}
  state=seedDemo();
  save();
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
}
function logEvent(type, message){
  if(!state.activityLog) state.activityLog=[];
  const now=new Date();
  state.activityLog.unshift({ id:uid(), type:type, message:message, date:todayJalali(),
    time:String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0') });
  if(state.activityLog.length>500) state.activityLog.length=500;
}
function getCustomer(id){ return state.customers.find(c=>c.id===id); }
function getService(id){ return state.services.find(s=>s.id===id); }
function getInvoice(id){ return state.invoices.find(i=>i.id===id); }
function getCategoryName(kind,id){
  const list=kind==='expense'?state.expenseCategories:(kind==='service'?state.serviceCategories:state.customerCategories);
  const c=list.find(x=>x.id===id);
  if(!c) return '—';
  if(kind==='expense' && c.parentId){ const p=list.find(x=>x.id===c.parentId); return (p?p.name+' / ':'')+c.name; }
  return c.name;
}
function invoicePaidAmount(inv){ return (inv.payments||[]).reduce((a,p)=>a+p.amount,0); }
function invoiceRemaining(inv){ return Math.max(0, inv.grandTotal-invoicePaidAmount(inv)); }
function computeInvoiceStatus(inv){
  if(inv.voided) return 'void';
  const paid=invoicePaidAmount(inv);
  if(paid<=0) return 'pending';
  if(paid>=inv.grandTotal) return 'paid';
  return 'partial';
}
function applyStockDelta(items, sign){
  items.forEach(it=>{
    if(it.serviceId){
      const s=getService(it.serviceId);
      if(s && s.trackStock){ s.stock=(s.stock||0)+sign*(Number(it.qty)||0); }
    }
  });
}
function addTransaction(accountId, date, type, amount, description, relatedType, relatedId){
  const t={id:uid(), accountId, date, type, amount, description, relatedType:relatedType||null, relatedId:relatedId||null};
  state.transactions.push(t);
  return t;
}
function removeLinkedTransactions(relatedType, relatedId){
  state.transactions=state.transactions.filter(t=>!(t.relatedType===relatedType && t.relatedId===relatedId));
}
function accountBalance(accId){
  const acc=state.bankAccounts.find(a=>a.id===accId);
  if(!acc) return 0;
  /* Financial balance is Ledger-only. Opening balance is already posted by coreRebuildLedger. */
  try{
    if(typeof coreRebuildLedger==='function') coreRebuildLedger();
    const code=acc.type==='bank'?'102':'101';
    return (state.journalEntries||[]).reduce(function(total,e){
      if(e.status==='void'||e.status==='reversed') return total;
      return total+(e.lines||[]).filter(function(l){return l.accountCode===code&&l.cashAccountId===accId;})
        .reduce(function(a,l){return a+(+l.debit||0)-(+l.credit||0)},0);
    },0);
  }catch(err){
    /* Legacy fallback is intentionally zero-based: never add initialBalance a second time. */
    return (state.transactions||[]).filter(function(t){return t.accountId===accId;})
      .reduce(function(a,t){return a+(t.type==='deposit'?+t.amount||0:-(+t.amount||0));},0)+(acc.initialBalance||0);
  }
}
function allPayments(){
  return state.invoices.filter(inv=>!inv.voided).flatMap(inv=>(inv.payments||[]).map(p=>({...p, invoiceNumber:inv.number})));
}
function rpPaidAmount(r){ return Number(r.paid||0); }
function rpRemaining(r){ return Math.max(0, Number(r.amount||0)-rpPaidAmount(r)); }
function rpStatus(r){
  if(r.status==='void') return 'void';
  if(rpRemaining(r)<=0 && Number(r.amount||0)>0) return 'paid';
  if(rpPaidAmount(r)>0) return 'partial';
  return 'pending';
}
function rpStatusBadge(status){
  const map={
    paid:['paid','تسویه‌شده','check'],
    partial:['partial','پرداخت جزئی','wallet'],
    pending:['pending','باز / پرداخت‌نشده','clock'],
    void:['void','باطل‌شده','x']
  };
  const m=map[status]||map.pending;
  return '<span class="badge '+m[0]+'">'+icon(m[2])+m[1]+'</span>';
}

/* =========================================================
   مسیریابی
   ========================================================= */
let route={page:'dashboard', id:null};
function nav(page, id){ route={page, id: id||null}; closeModal(); renderPage(); window.scrollTo(0,0); }

/* =========================================================
   آیکن‌ها
   ========================================================= */
const ICONS={
  home:'<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-6h4v6"/>',
  invoice:'<path d="M7 3.5h10v17l-2.3-1.6L12.3 20l-2.4-1.1L7.6 20 7 18.9z"/><path d="M9.2 8h5.6M9.2 11h5.6M9.2 14h3.5"/>',
  users:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.8 13.4c2 .3 3.6 1.9 4 4.6"/>',
  services:'<rect x="4" y="8" width="16" height="11" rx="1.6"/><path d="M8.5 8V6.5A2.5 2.5 0 0 1 11 4h2a2.5 2.5 0 0 1 2.5 2.5V8"/><path d="M4 12.5h16"/>',
  wallet:'<rect x="3.5" y="6.5" width="17" height="12" rx="2"/><path d="M3.5 10.5h17"/><circle cx="16.5" cy="14.5" r="1.1"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M4 20h16"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M4 20l.9-3.6L16.5 5 19 7.5 7.4 19z"/><path d="M14.3 6.7 17.3 9.7"/>',
  trash:'<path d="M5 7h14"/><path d="M9 7V5.3A1.3 1.3 0 0 1 10.3 4h3.4A1.3 1.3 0 0 1 15 5.3V7"/><path d="M7 7l1 13h8l1-13"/>',
  print:'<path d="M6 9V4h12v5"/><rect x="4.5" y="9" width="15" height="7" rx="1.4"/><path d="M6 14h12v6H6z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-5-5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  download:'<path d="M12 4v11.5"/><path d="M7.5 11l4.5 4.5L16.5 11"/><path d="M5 19.5h14"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  stamp:'<path d="M9 3.5h6l1 5H8z"/><path d="M8.5 8.5h7l1.5 6h-10z"/><path d="M4 20.5h16"/><path d="M6.5 20.5 7.7 14.5h8.6l1.2 6"/>',
  history:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M4.5 6.5 3.8 3.2M4.5 6.5 7.8 5.8"/>',
  bank:'<path d="M3.5 9.5 12 4l8.5 5.5"/><path d="M4.5 9.5v9M8.5 9.5v9M15.5 9.5v9M19.5 9.5v9"/><path d="M3 20.5h18"/>',
  tag:'<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.4"/>'
};
function icon(name, cls){ return '<svg class="'+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>'; }

/* =========================================================
   پوسته
   ========================================================= */
function renderShell(){
  const items=[
    ['dashboard','home','داشبورد'],
    ['invoices','invoice','فاکتورها'],
    ['customers','users','مشتریان'],
    ['services','services','خدمات'],
    ['checks','stamp','چک‌ها'],
    ['receivables-payables','wallet','دریافتنی / پرداختنی'],
    ['accounts','bank','حساب‌ها و صندوق'],
    ['expenses','wallet','هزینه‌ها'],
    ['reports','chart','گزارش‌ها'],
    ['categories','tag','دسته‌بندی‌ها'],
    ['activity','history','تاریخچه تغییرات'],
    ['settings','gear','تنظیمات']
  ];
  let active=route.page;
  if(active==='invoice-form'||active==='invoice-view') active='invoices';
  if(active==='customer-ledger') active='customers';
  if(active==='account-ledger') active='accounts';
  if(active==='rp-form'||active==='rp-view') active='receivables-payables';
  document.getElementById('sidebar').innerHTML=
    '<div class="brand"><div class="mark">د</div><div><div class="word">دفتر</div><div class="sub">حسابداری کسب‌وکار خدماتی</div></div></div>'+
    '<nav class="mainnav">'+items.map(it=>
      '<a class="navlink'+(active===it[0]?' active':'')+'" onclick="nav(\''+it[0]+'\')">'+icon(it[1])+'<span>'+it[2]+'</span></a>'
    ).join('')+'</nav>'+
    '<div class="sidebar-foot">'+
      '<div class="biz-line">'+esc(state.business.name)+'</div>'+
      '<div class="theme-toggle" onclick="toggleTheme()">'+icon('sun')+'<span>حالت روشن/تیره</span></div>'+
    '</div>';

  const pageTitles={dashboard:'داشبورد', invoices:'فاکتورها', 'invoice-form':(route.id?'ویرایش فاکتور':'فاکتور جدید'), 'invoice-view':'مشاهده فاکتور',
    customers:'مشتریان', 'customer-ledger':'کارت حساب مشتری', services:'خدمات', checks:'چک‌ها',
    'receivables-payables':'حساب‌های دریافتنی و پرداختنی', 'rp-form':(route.id?'ویرایش حساب':'ثبت حساب'),
    'rp-view':'جزئیات حساب', accounts:'حساب‌ها و صندوق', 'account-ledger':'گردش حساب',
    expenses:'هزینه‌ها', reports:'گزارش‌ها', categories:'دسته‌بندی‌ها', activity:'تاریخچه تغییرات', settings:'تنظیمات'};
  const t=todayJalali();
  document.getElementById('topbar').innerHTML=
    '<h1>'+(pageTitles[route.page]||'')+'</h1>'+
    '<div class="today">امروز: '+jStr(t)+'</div>';
}
function toggleTheme(){
  const html=document.documentElement;
  const cur=html.getAttribute('data-theme');
  if(cur==='dark'){ html.setAttribute('data-theme','light'); }
  else if(cur==='light'){ html.removeAttribute('data-theme'); }
  else { html.setAttribute('data-theme','dark'); }
}

/* =========================================================
   داشبورد
   ========================================================= */
let chartInstances={};
function destroyChart(id){ if(chartInstances[id]){ chartInstances[id].destroy(); delete chartInstances[id]; } }
function lastNMonthsLabels(n){
  const t=todayJalali(); const arr=[];
  let y=t.jy, m=t.jm;
  for(let i=0;i<n;i++){ arr.unshift({jy:y,jm:m,label:J_MONTHS[m-1]+' '+fa(y)}); m--; if(m<1){m=12;y--;} }
  return arr;
}
function statCard(label, value, kind){
  return '<div class="stat-card'+(kind?' '+kind:'')+'"><div class="label">'+esc(label)+'</div><div class="value">'+money(value)+'<small>'+esc(state.business.currency)+'</small></div></div>';
}
function statCardCount(label, value){
  return '<div class="stat-card"><div class="label">'+esc(label)+'</div><div class="value">'+fa(value)+'</div></div>';
}
function statusBadge(status){
  const map={paid:['paid','پرداخت‌شده'], pending:['pending','در انتظار پرداخت'], partial:['partial','پرداخت جزئی'], void:['void','باطل‌شده']};
  const m=map[status]||map.pending;
  const iconName=status==='paid'?'check':(status==='void'?'x':(status==='partial'?'wallet':'clock'));
  return '<span class="badge '+m[0]+'">'+icon(iconName)+m[1]+'</span>';
}
function emptyState(iconName, title, sub, action, actionLabel){
  return '<div class="empty-state">'+icon(iconName)+'<div class="t">'+esc(title)+'</div><div>'+esc(sub)+'</div>'+
    (action?'<div style="margin-top:14px"><button class="btn btn-brand" onclick="'+action+'">'+icon('plus')+actionLabel+'</button></div>':'')+'</div>';
}
function dashboardModulesHTML(){
  const m=[
    ['invoices','invoice','فاکتور فروش','orange'],['purchase-invoices','invoice','فاکتور خرید','gold'],
    ['customers','users','اطلاعات اشخاص','green'],['suppliers','users','تأمین‌کنندگان','blue'],
    ['checks','stamp','چک‌ها','purple'],['receivables-payables','wallet','دریافت / پرداخت','cyan'],
    ['expenses','wallet','هزینه‌ها','red'],['services','services','خدمات و کالا','slate'],
    ['accounts','bank','بانک و صندوق','gold'],['stock','bank','انبار','green'],
    ['journals','invoice','اسناد حسابداری','purple'],['reports','chart','گزارش‌ها','blue'],
    ['financial-statements','chart','صورت‌های مالی','orange'],['trial-balance','chart','تراز آزمایشی','gold'],
    ['tax','chart','مالیات','red'],['settings','gear','تنظیمات','slate']
  ];
  return '<div class="module-section-label">دسترسی سریع به بخش‌ها</div><div class="module-grid">'+m.map(x=>
    '<button class="module-tile '+x[3]+'" onclick="nav(\''+x[0]+'\')">'+icon(x[1])+'<span>'+x[2]+'</span></button>'
  ).join('')+'</div>';
}
function dashboardCalendarHTML(t){
  const first=j2d(t.jy,t.jm,1);
  const g=d2g(first);
  const dow=(new Date(g[0],g[1]-1,g[2]).getDay()+1)%7; // شنبه=0
  const days=jDaysInMonth(t.jy,t.jm);
  const names=['ش','ی','د','س','چ','پ','ج'];
  let h='<div class="cal-head"><span>'+esc(J_MONTHS[t.jm-1])+'</span><span>'+fa(t.jy)+'</span></div><div class="cal-grid">';
  names.forEach(n=>h+='<div class="dow">'+n+'</div>');
  for(let i=0;i<dow;i++)h+='<div></div>';
  for(let d=1;d<=days;d++)h+='<div class="day '+(d===t.jd?'today':'')+'">'+fa(d)+'</div>';
  h+='</div><div class="quick-title">دسترسی سریع</div>';
  h+='<button class="btn btn-ghost quick-btn" onclick="openInvoiceForm()">'+icon('plus')+'فاکتور فروش</button>';
  h+='<button class="btn btn-ghost quick-btn" onclick="openExpenseForm()">'+icon('plus')+'ثبت هزینه</button>';
  h+='<button class="btn btn-ghost quick-btn" onclick="openCustomerForm()">'+icon('users')+'مشتری جدید</button>';
  return h;
}
function renderDashboard(){
  const t=todayJalali();
  const pays=allPayments();
  const rpPayments=(state.receivablesPayables||[]).flatMap(r=>(r.payments||[]).map(p=>({...p,direction:r.direction})));
  const thisMonthIncome=pays.filter(p=>p.date.jy===t.jy && p.date.jm===t.jm).reduce((a,p)=>a+p.amount,0)+
    rpPayments.filter(p=>p.direction==='receivable'&&p.date.jy===t.jy&&p.date.jm===t.jm).reduce((a,p)=>a+p.amount,0);
  const thisMonthExpense=state.expenses.filter(e=>e.date.jy===t.jy && e.date.jm===t.jm).reduce((a,e)=>a+e.amount,0)+
    rpPayments.filter(p=>p.direction==='payable'&&p.date.jy===t.jy&&p.date.jm===t.jm).reduce((a,p)=>a+p.amount,0);
  const net=thisMonthIncome-thisMonthExpense;
  const activeInvoices=state.invoices.filter(i=>!i.voided);
  const outstanding=activeInvoices.reduce((a,i)=>a+invoiceRemaining(i),0);
  const pendingCount=activeInvoices.filter(i=>invoiceRemaining(i)>0).length;
  const cashTotal=state.bankAccounts.reduce((a,acc)=>a+accountBalance(acc.id),0);
  const checksInFlight=state.checks.filter(c=>c.status==='pending').length;
  const rpReceivable=(state.receivablesPayables||[]).filter(r=>r.direction==='receivable'&&r.status!=='void').reduce((a,r)=>a+rpRemaining(r),0);
  const rpPayable=(state.receivablesPayables||[]).filter(r=>r.direction==='payable'&&r.status!=='void').reduce((a,r)=>a+rpRemaining(r),0);

  let html='<div class="dashboard-layout"><aside class="dashboard-side">'+dashboardCalendarHTML(t)+'</aside><section class="dashboard-main">'+dashboardModulesHTML()+'<div class="stat-grid">'+
    statCard('درآمد این ماه', thisMonthIncome, 'income')+
    statCard('هزینه این ماه', thisMonthExpense, 'expense')+
    statCard('سود خالص این ماه', net, net>=0?'income':'expense')+
    statCard('مطالبات فاکتورها ('+fa(pendingCount)+' فاکتور)', outstanding, '')+
    statCard('حساب‌های دریافتنی', rpReceivable, '')+
    statCard('حساب‌های پرداختنی', rpPayable, 'expense')+
    statCard('موجودی نقد و بانک', cashTotal, 'income')+
    statCardCount('چک‌های در جریان وصول', checksInFlight)+
  '</div>';

  html+='<div class="two-col">';
  html+='<div class="card"><div class="section-title">روند درآمد و هزینه (۶ ماه اخیر)</div><div class="chart-wrap"><canvas id="dashChart"></canvas></div></div>';

  html+='<div class="card"><div class="section-title">آخرین فاکتورها</div>';
  const recent=[...state.invoices].sort((a,b)=>jToJdn(b.date)-jToJdn(a.date)).slice(0,5);
  if(recent.length===0){
    html+=emptyState('invoice','هنوز فاکتوری ثبت نشده', 'اولین فاکتور خود را صادر کنید', "openInvoiceForm()", 'فاکتور جدید');
  } else {
    html+='<table><tbody>';
    recent.forEach(inv=>{
      const cust=getCustomer(inv.customerId);
      html+='<tr style="cursor:pointer" onclick="nav(\'invoice-view\',\''+inv.id+'\')">'+
        '<td>'+statusBadge(computeInvoiceStatus(inv))+'</td>'+
        '<td>'+esc(cust?cust.name:'—')+'<div class="muted" style="font-size:11.5px">فاکتور '+fa(inv.number)+' · '+jStrShort(inv.date)+'</div></td>'+
        '<td class="num">'+money(inv.grandTotal)+' <span class="muted" style="font-weight:400">'+esc(state.business.currency)+'</span></td>'+
      '</tr>';
    });
    html+='</tbody></table>';
  }
  html+='</div></section></div>';

  document.getElementById('content').innerHTML=html;

  destroyChart('dashChart');
  const months=lastNMonthsLabels(6);
  const incomeData=months.map(m=>
    pays.filter(p=>p.date.jy===m.jy && p.date.jm===m.jm).reduce((a,p)=>a+p.amount,0)+
    rpPayments.filter(p=>p.direction==='receivable'&&p.date.jy===m.jy&&p.date.jm===m.jm).reduce((a,p)=>a+p.amount,0)
  );
  const expenseData=months.map(m=>
    state.expenses.filter(e=>e.date.jy===m.jy && e.date.jm===m.jm).reduce((a,e)=>a+e.amount,0)+
    rpPayments.filter(p=>p.direction==='payable'&&p.date.jy===m.jy&&p.date.jm===m.jm).reduce((a,p)=>a+p.amount,0)
  );
  const styles=getComputedStyle(document.documentElement);
  const green=styles.getPropertyValue('--green').trim();
  const seal=styles.getPropertyValue('--seal').trim();
  const textMuted=styles.getPropertyValue('--text-muted').trim();
  const ctx=document.getElementById('dashChart').getContext('2d');
  chartInstances['dashChart']=new Chart(ctx,{
    type:'bar',
    data:{ labels:months.map(m=>m.label), datasets:[
      {label:'درآمد دریافتی', data:incomeData, backgroundColor:green, borderRadius:5, maxBarThickness:26},
      {label:'هزینه', data:expenseData, backgroundColor:seal, borderRadius:5, maxBarThickness:26}
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:textMuted, font:{family:'Vazirmatn'}}}},
      scales:{
        x:{ticks:{color:textMuted, font:{family:'Vazirmatn'}}, grid:{display:false}},
        y:{ticks:{color:textMuted, font:{family:'Vazirmatn'}}, grid:{color:'rgba(150,140,110,.15)'}}
      }
    }
  });
}

/* =========================================================
   مشتریان
   ========================================================= */
let custSearch=''; let custCatFilter='';
function renderCustomers(){
  const list=state.customers.filter(c=>(!custSearch || c.name.includes(custSearch) || (c.phone||'').includes(custSearch)) && (!custCatFilter || c.categoryId===custCatFilter));
  let html='<div class="spread"><div class="row">'+
    '<div class="search-box">'+icon('search')+'<input type="text" placeholder="جستجوی مشتری..." value="'+esc(custSearch)+'" oninput="custSearch=this.value; renderCustomers()"></div>'+
    '<select style="width:170px" onchange="custCatFilter=this.value; renderCustomers()"><option value="">همه دسته‌ها</option>'+state.customerCategories.map(c=>'<option value="'+c.id+'"'+(c.id===custCatFilter?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select>'+
    '</div>'+
    '<button class="btn btn-brand" onclick="openCustomerForm()">'+icon('plus')+'مشتری جدید</button></div>';
  if(list.length===0){
    html+=emptyState('users','مشتری‌ای یافت نشد','مشتریان خود را اضافه کنید تا بتوانید برایشان فاکتور صادر کنید','openCustomerForm()','افزودن مشتری');
  } else {
    html+='<div class="card"><table><thead><tr><th>نام مشتری</th><th>دسته‌بندی</th><th>تلفن</th><th>مجموع خرید</th><th></th></tr></thead><tbody>';
    list.forEach(c=>{
      const total=state.invoices.filter(i=>i.customerId===c.id && !i.voided).reduce((a,i)=>a+i.grandTotal,0);
      html+='<tr><td style="font-weight:600; cursor:pointer" onclick="nav(\'customer-ledger\',\''+c.id+'\')">'+esc(c.name)+'</td>'+
        '<td class="muted">'+esc(getCategoryName('customer',c.categoryId))+'</td>'+
        '<td class="num">'+fa(c.phone||'—')+'</td>'+
        '<td class="num">'+money(total)+'</td>'+
        '<td><div class="row" style="justify-content:flex-end">'+
          '<button class="btn btn-ghost btn-sm" onclick="nav(\'customer-ledger\',\''+c.id+'\')">کارت حساب</button>'+
          '<button class="btn btn-ghost icon-btn" title="ویرایش" onclick="openCustomerForm(\''+c.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" title="حذف" onclick="deleteCustomer(\''+c.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function openCustomerForm(id){
  const c=id?getCustomer(id):{id:null,name:'',phone:'',address:'',economicCode:'',note:'',categoryId:''};
  openModal('<div class="modal-head"><h3>'+(id?'ویرایش مشتری':'مشتری جدید')+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveCustomer(event, \''+(id||'')+'\')">'+
      '<div class="field"><label>نام مشتری / شرکت *</label><input required type="text" name="name" value="'+esc(c.name)+'"></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>شماره تماس</label><input type="tel" name="phone" value="'+esc(c.phone)+'"></div>'+
        '<div class="field"><label>کد اقتصادی</label><input type="text" name="economicCode" value="'+esc(c.economicCode)+'"></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>آدرس</label><input type="text" name="address" value="'+esc(c.address)+'"></div>'+
        '<div class="field"><label>دسته‌بندی مشتری</label><select name="categoryId"><option value="">— بدون دسته —</option>'+state.customerCategories.map(cc=>'<option value="'+cc.id+'"'+(cc.id===c.categoryId?' selected':'')+'>'+esc(cc.name)+'</option>').join('')+'</select></div>'+
      '</div>'+
      '<div class="field"><label>یادداشت</label><textarea name="note" rows="2">'+esc(c.note||'')+'</textarea></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveCustomer(ev,id){
  ev.preventDefault();
  const f=ev.target;
  const data={name:f.name.value.trim(), phone:f.phone.value.trim(), economicCode:f.economicCode.value.trim(), address:f.address.value.trim(), note:f.note.value.trim(), categoryId:f.categoryId.value||null};
  if(!data.name){ return false; }
  if(id){ Object.assign(getCustomer(id), data); logEvent('customer','مشتری «'+data.name+'» ویرایش شد'); showToast('اطلاعات مشتری بروزرسانی شد'); }
  else { data.id=uid(); state.customers.push(data); logEvent('customer','مشتری «'+data.name+'» ثبت شد'); showToast('مشتری جدید ثبت شد'); }
  save(); closeModal(); renderCustomers();
  return false;
}
function deleteCustomer(id){
  const used=state.invoices.some(i=>i.customerId===id);
  if(used && !confirm('این مشتری در فاکتورهای ثبت‌شده استفاده شده است. آیا مطمئن به حذف هستید؟')) return;
  if(!used && !confirm('مشتری حذف شود؟')) return;
  const c=getCustomer(id);
  state.customers=state.customers.filter(c=>c.id!==id);
  logEvent('customer','مشتری «'+(c?c.name:'')+'» حذف شد');
  save(); renderCustomers();
}
function renderCustomerLedger(customerId){
  const c=getCustomer(customerId);
  if(!c){ nav('customers'); return; }
  const invs=state.invoices.filter(i=>i.customerId===customerId && !i.voided).sort((a,b)=>jToJdn(a.date)-jToJdn(b.date));
  let entries=[];
  invs.forEach(inv=>{
    entries.push({jdn:jToJdn(inv.date), date:inv.date, label:'فاکتور #'+fa(inv.number), debit:inv.grandTotal, credit:0, ref:inv.id});
    (inv.payments||[]).forEach(p=>{
      entries.push({jdn:jToJdn(p.date), date:p.date, label:'دریافت وجه فاکتور #'+fa(inv.number)+(p.method?' ('+p.method+')':''), debit:0, credit:p.amount, ref:inv.id});
    });
  });
  entries.sort((a,b)=>a.jdn-b.jdn);
  let balance=0;
  const rows=entries.map(e=>{ balance+=e.debit-e.credit; return {...e, balance}; });
  const totalDebit=entries.reduce((a,e)=>a+e.debit,0);
  const totalCredit=entries.reduce((a,e)=>a+e.credit,0);

  let html='<div class="row no-print" style="justify-content:flex-end; margin-bottom:14px"><button class="btn btn-ghost" onclick="nav(\'customers\')">بازگشت</button></div>';
  html+='<div class="card" style="margin-bottom:18px"><div class="section-title">'+esc(c.name)+'</div>'+
    '<div class="muted" style="font-size:13px">'+(c.phone?fa(c.phone)+' · ':'')+(c.address||'')+(c.categoryId?' · '+esc(getCategoryName('customer',c.categoryId)):'')+'</div></div>';
  html+='<div class="stat-grid">'+
    statCard('جمع بدهکاری (فاکتورها)', totalDebit, '')+
    statCard('جمع بستانکاری (پرداخت‌ها)', totalCredit, 'income')+
    statCard('مانده حساب', balance, balance>0?'expense':'income')+
  '</div>';
  if(rows.length===0){ html+=emptyState('users','تراکنشی ثبت نشده','برای این مشتری هنوز فاکتوری صادر نشده', null,''); }
  else {
    html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr></thead><tbody>';
    rows.forEach(r=>{
      html+='<tr style="cursor:pointer" onclick="nav(\'invoice-view\',\''+r.ref+'\')"><td class="num">'+jStrShort(r.date)+'</td><td>'+esc(r.label)+'</td>'+
        '<td class="num">'+(r.debit?money(r.debit):'—')+'</td><td class="num">'+(r.credit?money(r.credit):'—')+'</td><td class="num">'+money(r.balance)+'</td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}

/* =========================================================
   خدمات
   ========================================================= */
let svcSearch='';
function renderServices(){
  const list=state.services.filter(s=>!svcSearch || s.name.includes(svcSearch));
  let html='<div class="spread"><div class="search-box">'+icon('search')+'<input type="text" placeholder="جستجوی خدمت..." value="'+esc(svcSearch)+'" oninput="svcSearch=this.value; renderServices()"></div>'+
    '<button class="btn btn-brand" onclick="openServiceForm()">'+icon('plus')+'خدمت جدید</button></div>';
  if(list.length===0){
    html+=emptyState('services','هنوز خدمتی تعریف نشده','خدمات یا کالاهای خود را با قیمت پیش‌فرض تعریف کنید','openServiceForm()','افزودن خدمت');
  } else {
    html+='<div class="card"><table><thead><tr><th>نام خدمت / کالا</th><th>دسته‌بندی</th><th>واحد</th><th>قیمت واحد</th><th>موجودی انبار</th><th></th></tr></thead><tbody>';
    list.forEach(s=>{
      html+='<tr><td style="font-weight:600">'+esc(s.name)+(s.note?'<div class="muted" style="font-size:11.5px">'+esc(s.note)+'</div>':'')+'</td>'+
        '<td class="muted">'+esc(getCategoryName('service',s.categoryId))+'</td><td>'+esc(s.unit||'—')+'</td>'+
        '<td class="num">'+money(s.price)+' '+esc(state.business.currency)+'</td>'+
        '<td class="num"'+(s.trackStock && s.stock<=0?' style="color:var(--seal)"':'')+'>'+(s.trackStock?fa(s.stock||0):'—')+'</td>'+
        '<td><div class="row" style="justify-content:flex-end">'+
          '<button class="btn btn-ghost icon-btn" onclick="openServiceForm(\''+s.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteService(\''+s.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function openServiceForm(id){
  const s=id?getService(id):{id:null,name:'',unit:'مورد',price:0,note:'',categoryId:'',trackStock:false,stock:0};
  openModal('<div class="modal-head"><h3>'+(id?'ویرایش خدمت':'خدمت جدید')+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveService(event, \''+(id||'')+'\')">'+
      '<div class="field"><label>نام خدمت / کالا *</label><input required type="text" name="name" value="'+esc(s.name)+'"></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>واحد</label><input type="text" name="unit" value="'+esc(s.unit||'')+'" placeholder="مورد، ساعت، ماه..."></div>'+
        '<div class="field"><label>قیمت واحد ('+esc(state.business.currency)+') *</label><input required type="number" min="0" name="price" value="'+s.price+'"></div>'+
      '</div>'+
      '<div class="field"><label>دسته‌بندی</label><select name="categoryId"><option value="">— بدون دسته —</option>'+state.serviceCategories.map(c=>'<option value="'+c.id+'"'+(c.id===s.categoryId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></div>'+
      '<div class="field"><label><input type="checkbox" style="width:auto; display:inline-block" name="trackStock" '+(s.trackStock?'checked':'')+' onchange="document.getElementById(\'stockFieldWrap\').style.display=this.checked?\'block\':\'none\'"> ردیابی موجودی انبار برای این قلم</label></div>'+
      '<div class="field" id="stockFieldWrap" style="display:'+(s.trackStock?'block':'none')+'"><label>موجودی فعلی</label><input type="number" name="stock" value="'+(s.stock||0)+'"></div>'+
      '<div class="field"><label>توضیحات</label><input type="text" name="note" value="'+esc(s.note||'')+'"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveService(ev,id){
  ev.preventDefault();
  const f=ev.target;
  const data={name:f.name.value.trim(), unit:f.unit.value.trim(), price:Number(f.price.value)||0, note:f.note.value.trim(),
    categoryId:f.categoryId.value||null, trackStock:f.trackStock.checked, stock:Number(f.stock.value)||0};
  if(!data.name){ return false; }
  if(id){ Object.assign(getService(id), data); logEvent('service','خدمت «'+data.name+'» ویرایش شد'); showToast('خدمت بروزرسانی شد'); }
  else { data.id=uid(); state.services.push(data); logEvent('service','خدمت «'+data.name+'» ثبت شد'); showToast('خدمت جدید ثبت شد'); }
  save(); closeModal(); renderServices();
  return false;
}
function deleteService(id){
  if(!confirm('این خدمت حذف شود؟')) return;
  const s=getService(id);
  state.services=state.services.filter(s=>s.id!==id);
  logEvent('service','خدمت «'+(s?s.name:'')+'» حذف شد');
  save(); renderServices();
}

/* =========================================================
   فاکتورها — فهرست
   ========================================================= */
let invFilter='all', invSearch='';
function renderInvoices(){
  let list=[...state.invoices].sort((a,b)=>jToJdn(b.date)-jToJdn(a.date));
  if(invFilter!=='all') list=list.filter(i=>computeInvoiceStatus(i)===invFilter);
  if(invSearch){
    list=list.filter(i=>{
      const c=getCustomer(i.customerId);
      return String(i.number).includes(invSearch) || (c && c.name.includes(invSearch));
    });
  }
  let html='<div class="spread">'+
    '<div class="row">'+
      ['all','pending','partial','paid','void'].map(f=>{
        const labels={all:'همه', pending:'در انتظار', partial:'جزئی', paid:'پرداخت‌شده', void:'باطل‌شده'};
        return '<button class="btn btn-sm '+(invFilter===f?'btn-brand':'btn-ghost')+'" onclick="invFilter=\''+f+'\'; renderInvoices()">'+labels[f]+'</button>';
      }).join('')+
    '</div>'+
    '<div class="row">'+
      '<div class="search-box">'+icon('search')+'<input type="text" placeholder="جستجو..." value="'+esc(invSearch)+'" oninput="invSearch=this.value; renderInvoices()"></div>'+
      '<button class="btn btn-brand" onclick="openInvoiceForm()">'+icon('plus')+'فاکتور جدید</button>'+
    '</div>'+
  '</div>';

  if(list.length===0){
    html+=emptyState('invoice','فاکتوری یافت نشد','فاکتور جدیدی صادر کنید یا فیلتر را تغییر دهید','openInvoiceForm()','فاکتور جدید');
  } else {
    html+='<div class="card"><table><thead><tr><th>شماره</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>مانده</th><th>وضعیت</th><th></th></tr></thead><tbody>';
    list.forEach(inv=>{
      const c=getCustomer(inv.customerId);
      html+='<tr style="cursor:pointer" onclick="nav(\'invoice-view\',\''+inv.id+'\')">'+
        '<td class="num">'+fa(inv.number)+'</td>'+
        '<td>'+esc(c?c.name:'مشتری حذف‌شده')+'</td>'+
        '<td class="num">'+jStrShort(inv.date)+'</td>'+
        '<td class="num">'+money(inv.grandTotal)+'</td>'+
        '<td class="num">'+money(invoiceRemaining(inv))+'</td>'+
        '<td>'+statusBadge(computeInvoiceStatus(inv))+'</td>'+
        '<td><div class="row" style="justify-content:flex-end" onclick="event.stopPropagation()">'+
          '<button class="btn btn-ghost icon-btn" title="مشاهده" onclick="nav(\'invoice-view\',\''+inv.id+'\')">'+icon('eye')+'</button>'+
          '<button class="btn btn-ghost icon-btn" title="ویرایش" onclick="openInvoiceForm(\''+inv.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" title="حذف" onclick="deleteInvoice(\''+inv.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function deleteInvoice(id){
  if(!confirm('این فاکتور برای همیشه حذف شود؟')) return;
  const inv=getInvoice(id);
  if(!inv) return;
  if(!inv.voided) applyStockDelta(inv.items, 1);
  (inv.payments||[]).forEach(p=>removeLinkedTransactions('invoice-payment', p.id));
  state.invoices=state.invoices.filter(i=>i.id!==id);
  logEvent('invoice','فاکتور #'+fa(inv.number)+' حذف شد');
  save(); renderInvoices();
}

/* =========================================================
   فاکتور — فرم ایجاد/ویرایش
   ========================================================= */
let draft=null;
function openInvoiceForm(id){
  if(id){
    const inv=getInvoice(id);
    draft={ id:inv.id, customerId:inv.customerId, date:{...inv.date}, includeTax:inv.includeTax, items:inv.items.map(it=>({...it})) };
  } else {
    draft={ id:null, customerId:state.customers[0]?state.customers[0].id:'', date:todayJalali(), includeTax:true,
      items:[{key:uid(), serviceId:'', name:'', qty:1, price:0, discount:0}] };
  }
  nav('invoice-form', id||null);
}
function draftCalc(){
  const subtotal=draft.items.reduce((a,it)=>a+(Number(it.qty)||0)*(Number(it.price)||0)-(Number(it.discount)||0),0);
  const tax=draft.includeTax? Math.round(subtotal*state.business.taxRate/100):0;
  return {subtotal, tax, grand:subtotal+tax};
}
function renderInvoiceForm(){
  if(!draft){ nav('invoices'); return; }
  if(state.customers.length===0){
    document.getElementById('content').innerHTML=emptyState('users','ابتدا یک مشتری ثبت کنید','برای صدور فاکتور به حداقل یک مشتری نیاز دارید','openCustomerForm()','افزودن مشتری');
    return;
  }
  const days=jDaysInMonth(draft.date.jy, draft.date.jm);
  let html='<div class="two-col">';
  html+='<div class="card">';
  html+='<div class="field"><label>مشتری *</label><select onchange="draft.customerId=this.value">'+
      state.customers.map(c=>'<option value="'+c.id+'"'+(c.id===draft.customerId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+
    '</select></div>';
  html+='<div class="field"><label>تاریخ فاکتور (شمسی)</label><div class="field-row3">'+
    '<select onchange="draft.date.jd=Number(this.value)">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===draft.date.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
    '<select onchange="draft.date.jm=Number(this.value); renderInvoiceForm()">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===draft.date.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
    '<select onchange="draft.date.jy=Number(this.value)">'+range(draft.date.jy-5,draft.date.jy+2).map(y=>'<option value="'+y+'"'+(y===draft.date.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
  '</div></div>';

  html+='<div class="section-title" style="margin-top:18px">اقلام فاکتور</div>';
  html+='<table class="items-table"><thead><tr><th style="width:30%">خدمت / کالا</th><th style="width:12%">تعداد</th><th style="width:18%">قیمت واحد</th><th style="width:18%">تخفیف</th><th style="width:16%">جمع</th><th></th></tr></thead><tbody id="itemsBody">'+itemsRows()+'</tbody></table>';
  html+='<button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="addItemRow()">'+icon('plus')+'افزودن ردیف</button>';

  html+='<div class="field" style="margin-top:16px"><label><input type="checkbox" style="width:auto; display:inline-block" '+(draft.includeTax?'checked':'')+' onchange="draft.includeTax=this.checked; updateTotals()"> احتساب مالیات بر ارزش افزوده ('+fa(state.business.taxRate)+'٪)</label></div>';

  const c=draftCalc();
  html+='<div class="totals-box" id="totalsBox">'+totalsHtml(c)+'</div>';

  html+='<div class="row" style="justify-content:flex-end; margin-top:18px">'+
    '<button type="button" class="btn btn-ghost" onclick="draft=null; nav(\'invoices\')">انصراف</button>'+
    '<button type="button" class="btn btn-brand" onclick="saveInvoiceDraft()">'+icon('check')+'ذخیره فاکتور</button>'+
  '</div>';
  html+='</div>';

  html+='<div class="card" style="align-self:flex-start"><div class="section-title">راهنما</div><div class="muted" style="font-size:13px; line-height:1.9">'+
    'با انتخاب خدمت از فهرست، قیمت واحد به‌صورت خودکار پر می‌شود. برای کالاهای دارای ردیابی انبار، موجودی به‌صورت خودکار پس از ثبت فاکتور کم می‌شود. ثبت پرداخت و چک از صفحهٔ مشاهدهٔ فاکتور، پس از ذخیره، انجام می‌شود.'+
    '</div></div>';
  html+='</div>';

  document.getElementById('content').innerHTML=html;
}
function itemsRows(){
  return draft.items.map(it=>{
    const lineTotal=(Number(it.qty)||0)*(Number(it.price)||0)-(Number(it.discount)||0);
    return '<tr id="row-'+it.key+'">'+
      '<td><select onchange="onItemServiceChange(\''+it.key+'\', this.value)">'+
        '<option value="">— آزاد —</option>'+
        state.services.map(s=>'<option value="'+s.id+'"'+(s.id===it.serviceId?' selected':'')+'>'+esc(s.name)+'</option>').join('')+
      '</select>'+(it.serviceId?'':'<input style="margin-top:6px" type="text" placeholder="شرح آزاد" value="'+esc(it.name)+'" oninput="updateItemField(\''+it.key+'\',\'name\',this.value)">')+'</td>'+
      '<td><input type="number" min="0" step="1" value="'+it.qty+'" oninput="updateItemField(\''+it.key+'\',\'qty\',this.value)"></td>'+
      '<td><input type="number" min="0" value="'+it.price+'" oninput="updateItemField(\''+it.key+'\',\'price\',this.value)"></td>'+
      '<td><input type="number" min="0" value="'+it.discount+'" oninput="updateItemField(\''+it.key+'\',\'discount\',this.value)"></td>'+
      '<td class="num" id="linetotal-'+it.key+'">'+money(lineTotal)+'</td>'+
      '<td><button type="button" class="btn btn-ghost icon-btn btn-danger" onclick="removeItemRow(\''+it.key+'\')">'+icon('trash')+'</button></td>'+
    '</tr>';
  }).join('');
}
function totalsHtml(c){
  return '<div class="trow"><span>جمع جزء</span><span class="num">'+money(c.subtotal)+' '+esc(state.business.currency)+'</span></div>'+
    (draft.includeTax?'<div class="trow"><span>مالیات بر ارزش افزوده ('+fa(state.business.taxRate)+'٪)</span><span class="num">'+money(c.tax)+' '+esc(state.business.currency)+'</span></div>':'')+
    '<div class="trow grand"><span>مبلغ نهایی</span><span class="num">'+money(c.grand)+' '+esc(state.business.currency)+'</span></div>';
}
function updateTotals(){
  const c=draftCalc();
  const box=document.getElementById('totalsBox');
  if(box) box.innerHTML=totalsHtml(c);
}
function updateItemField(key, field, value){
  const it=draft.items.find(i=>i.key===key);
  if(!it) return;
  if(field==='qty'||field==='price'||field==='discount') it[field]=Number(value)||0;
  else it[field]=value;
  const lineTotal=(Number(it.qty)||0)*(Number(it.price)||0)-(Number(it.discount)||0);
  const cell=document.getElementById('linetotal-'+key);
  if(cell) cell.textContent=money(lineTotal);
  updateTotals();
}
function onItemServiceChange(key, serviceId){
  const it=draft.items.find(i=>i.key===key);
  if(!it) return;
  it.serviceId=serviceId;
  if(serviceId){ const s=getService(serviceId); it.name=s.name; it.price=s.price; }
  else { it.name=''; }
  const body=document.getElementById('itemsBody');
  if(body) body.innerHTML=itemsRows();
  updateTotals();
}
function addItemRow(){
  draft.items.push({key:uid(), serviceId:'', name:'', qty:1, price:0, discount:0});
  document.getElementById('itemsBody').innerHTML=itemsRows();
  updateTotals();
}
function removeItemRow(key){
  if(draft.items.length<=1){ showToast('حداقل یک ردیف لازم است'); return; }
  draft.items=draft.items.filter(i=>i.key!==key);
  document.getElementById('itemsBody').innerHTML=itemsRows();
  updateTotals();
}
function saveInvoiceDraft(){
  if(!draft.customerId){ showToast('لطفاً مشتری را انتخاب کنید'); return; }
  const validItems=draft.items.filter(it=>(it.name||it.serviceId) && it.qty>0);
  if(validItems.length===0){ showToast('حداقل یک ردیف معتبر لازم است'); return; }
  const c=draftCalc();
  if(draft.id){
    const inv=getInvoice(draft.id);
    if(!inv) return;
    const paid=invoicePaidAmount(inv);
    if(paid>c.grand){ showToast('مبلغ فاکتور نمی‌تواند کمتر از مبلغ دریافت‌شده باشد'); return; }
    if(!inv.voided) applyStockDelta(inv.items, 1);
    inv.customerId=draft.customerId; inv.date=draft.date; inv.items=draft.items; inv.includeTax=draft.includeTax;
    inv.subtotal=c.subtotal; inv.tax=c.tax; inv.grandTotal=c.grand;
    if(!inv.voided) applyStockDelta(inv.items, -1);
    logEvent('invoice','فاکتور #'+fa(inv.number)+' ویرایش شد');
    showToast('فاکتور بروزرسانی شد');
    save(); draft=null; nav('invoice-view', inv.id);
  } else {
    const inv={ id:uid(), number:state.business.nextInvoiceNo, customerId:draft.customerId, date:draft.date,
      items:draft.items, includeTax:draft.includeTax, subtotal:c.subtotal, tax:c.tax, grandTotal:c.grand,
      voided:false, payments:[] };
    state.business.nextInvoiceNo++;
    state.invoices.push(inv);
    applyStockDelta(inv.items, -1);
    const custName=(getCustomer(inv.customerId)||{}).name||'';
    logEvent('invoice','فاکتور #'+fa(inv.number)+' برای «'+custName+'» صادر شد');
    showToast('فاکتور صادر شد');
    save(); draft=null; nav('invoice-view', inv.id);
  }
}

/* =========================================================
   فاکتور — نمایش/چاپ/پرداخت
   ========================================================= */
function sealSvg(){
  return '<svg class="seal" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><path id="sealArc" d="M 20 70 A 50 50 0 0 1 120 70" /></defs>'+
    '<circle cx="70" cy="70" r="58" fill="none" stroke="#9c3b34" stroke-width="2.5" stroke-dasharray="3 4"/>'+
    '<circle cx="70" cy="70" r="48" fill="none" stroke="#9c3b34" stroke-width="1.5"/>'+
    '<text font-size="13" fill="#9c3b34" font-family="Vazirmatn, sans-serif" font-weight="700"><textPath href="#sealArc" startOffset="50%" text-anchor="middle">پرداخت شده</textPath></text>'+
    '<text x="70" y="78" font-size="15" fill="#9c3b34" text-anchor="middle" font-family="Lalezar, sans-serif">تسویه</text>'+
    '<path d="M50 95 l8 8 l32 -30" fill="none" stroke="#9c3b34" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
  '</svg>';
}
function renderInvoiceView(id){
  const inv=getInvoice(id);
  if(!inv){ nav('invoices'); return; }
  const cust=getCustomer(inv.customerId);
  const status=computeInvoiceStatus(inv);
  const paid=invoicePaidAmount(inv);
  const remaining=invoiceRemaining(inv);

  let html='<div class="row no-print" style="justify-content:flex-end; margin-bottom:14px">'+
    '<button class="btn btn-ghost" onclick="nav(\'invoices\')">بازگشت</button>'+
    (cust?'<button class="btn btn-ghost" onclick="nav(\'customer-ledger\',\''+cust.id+'\')">'+icon('users')+'کارت حساب مشتری</button>':'')+
    '<button class="btn btn-ghost" onclick="openInvoiceForm(\''+inv.id+'\')">'+icon('edit')+'ویرایش اقلام</button>'+
    (status!=='void' && remaining>0?'<button class="btn btn-ghost" onclick="openPaymentForm(\''+inv.id+'\')">'+icon('check')+'ثبت پرداخت</button>':'')+
    (status!=='void' && remaining>0?'<button class="btn btn-ghost" onclick="openCheckForInvoice(\''+inv.id+'\')">'+icon('stamp')+'ثبت چک</button>':'')+
    '<button class="btn btn-ghost'+(inv.voided?'':' btn-danger')+'" onclick="toggleVoid(\''+inv.id+'\')">'+icon('x')+(inv.voided?'لغو ابطال':'باطل کردن')+'</button>'+
    '<button class="btn btn-brand" onclick="window.print()">'+icon('print')+'چاپ</button>'+
  '</div>';

  html+='<div class="invoice-paper">';
  html+='<div class="inv-head"><div><div class="biz-name">'+esc(state.business.name)+'</div>'+
    '<div class="biz-meta">'+esc(state.business.address||'')+(state.business.phone?'<br>تلفن: '+fa(state.business.phone):'')+(state.business.economicCode?'<br>کد اقتصادی: '+fa(state.business.economicCode):'')+'</div></div>'+
    '<div class="inv-meta"><div class="num">فاکتور #'+fa(inv.number)+'</div><div class="muted">تاریخ: '+jStr(inv.date)+'</div><div style="margin-top:6px">'+statusBadge(status)+'</div></div></div>';

  html+='<div class="bill-to"><div><div class="k">صورتحساب برای</div><div style="font-weight:700">'+esc(cust?cust.name:'مشتری حذف‌شده')+'</div>'+
    (cust&&cust.phone?'<div class="muted" style="font-size:12.5px">'+fa(cust.phone)+'</div>':'')+
    (cust&&cust.address?'<div class="muted" style="font-size:12.5px">'+esc(cust.address)+'</div>':'')+'</div></div>';

  html+='<table><thead><tr><th>شرح</th><th>تعداد</th><th>قیمت واحد</th><th>تخفیف</th><th>جمع</th></tr></thead><tbody>';
  inv.items.forEach(it=>{
    const lt=it.qty*it.price-it.discount;
    html+='<tr><td>'+esc(it.name)+'</td><td class="num">'+fa(it.qty)+'</td><td class="num">'+money(it.price)+'</td><td class="num">'+money(it.discount)+'</td><td class="num">'+money(lt)+'</td></tr>';
  });
  html+='</tbody></table>';

  html+='<div class="totals-box"><div class="trow"><span>جمع جزء</span><span class="num">'+money(inv.subtotal)+' '+esc(state.business.currency)+'</span></div>'+
    (inv.includeTax?'<div class="trow"><span>مالیات بر ارزش افزوده</span><span class="num">'+money(inv.tax)+' '+esc(state.business.currency)+'</span></div>':'')+
    '<div class="trow grand"><span>مبلغ نهایی</span><span class="num">'+money(inv.grandTotal)+' '+esc(state.business.currency)+'</span></div>'+
    '<div class="trow" style="margin-top:8px"><span>پرداخت‌شده</span><span class="num">'+money(paid)+' '+esc(state.business.currency)+'</span></div>'+
    '<div class="trow"><span>مانده قابل پرداخت</span><span class="num">'+money(remaining)+' '+esc(state.business.currency)+'</span></div></div>';

  html+='<div class="seal-wrap">'+(status==='paid'?sealSvg():'')+'</div>';
  html+='</div>';

  html+='<div class="card no-print" style="margin-top:18px"><div class="section-title">پرداخت‌های ثبت‌شده</div>';
  if(!inv.payments || inv.payments.length===0){ html+='<div class="muted">هنوز پرداختی ثبت نشده</div>'; }
  else{
    html+='<table><thead><tr><th>تاریخ</th><th>مبلغ</th><th>روش</th><th>حساب</th><th>یادداشت</th><th></th></tr></thead><tbody>';
    inv.payments.forEach(p=>{
      const acc=p.accountId?state.bankAccounts.find(a=>a.id===p.accountId):null;
      html+='<tr><td class="num">'+jStrShort(p.date)+'</td><td class="num">'+money(p.amount)+'</td><td>'+esc(p.method||'—')+'</td><td>'+esc(acc?acc.name:'—')+'</td><td class="muted">'+esc(p.note||'—')+'</td>'+
        '<td><button class="btn btn-ghost icon-btn btn-danger" onclick="deletePayment(\''+inv.id+'\',\''+p.id+'\')">'+icon('trash')+'</button></td></tr>';
    });
    html+='</tbody></table>';
  }
  html+='</div>';

  document.getElementById('content').innerHTML=html;
}
function openPaymentForm(invoiceId){
  const inv=getInvoice(invoiceId);
  const remaining=invoiceRemaining(inv);
  const t=todayJalali(); const days=jDaysInMonth(t.jy,t.jm);
  openModal('<div class="modal-head"><h3>ثبت پرداخت</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return savePayment(event,\''+invoiceId+'\')">'+
    '<div class="field"><label>مبلغ * (حداکثر '+money(remaining)+' '+esc(state.business.currency)+')</label><input required type="number" min="1" max="'+remaining+'" name="amount" value="'+remaining+'"></div>'+
    '<div class="field"><label>تاریخ (شمسی)</label><div class="field-row3">'+
      '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
      '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
      '<select name="jy">'+range(t.jy-2,t.jy+2).map(y=>'<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
    '</div></div>'+
    '<div class="field-row"><div class="field"><label>روش پرداخت</label><select name="method"><option>نقد</option><option>کارت‌خوان</option><option>انتقال بانکی</option><option>چک</option></select></div>'+
    '<div class="field"><label>واریز به حساب (اختیاری)</label><select name="accountId"><option value="">— ثبت نشود —</option>'+state.bankAccounts.map(a=>'<option value="'+a.id+'">'+esc(a.name)+'</option>').join('')+'</select></div></div>'+
    '<div class="field"><label>یادداشت</label><input type="text" name="note"></div>'+
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ثبت پرداخت</button></div>'+
    '</form>');
}
function savePayment(ev,invoiceId){
  ev.preventDefault(); const f=ev.target;
  const inv=getInvoice(invoiceId);
  const remaining=invoiceRemaining(inv);
  let amount=Number(f.amount.value)||0;
  if(amount<=0){ return false; }
  if(amount>remaining) amount=remaining;
  const payment={id:uid(), date:{jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)}, amount, method:f.method.value, accountId:f.accountId.value||null, note:f.note.value.trim()};
  inv.payments=inv.payments||[];
  inv.payments.push(payment);
  if(payment.accountId){ addTransaction(payment.accountId, payment.date, 'deposit', amount, 'دریافت وجه فاکتور #'+fa(inv.number), 'invoice-payment', payment.id); }
  const custName=(getCustomer(inv.customerId)||{}).name||'';
  logEvent('invoice','دریافت '+money(amount)+' '+esc(state.business.currency)+' بابت فاکتور #'+fa(inv.number)+' از «'+custName+'»');
  save(); closeModal(); renderInvoiceView(invoiceId);
  return false;
}
function deletePayment(invoiceId, paymentId){
  if(!confirm('این پرداخت حذف شود؟')) return;
  const inv=getInvoice(invoiceId);
  removeLinkedTransactions('invoice-payment', paymentId);
  inv.payments=inv.payments.filter(p=>p.id!==paymentId);
  logEvent('invoice','یک پرداخت از فاکتور #'+fa(inv.number)+' حذف شد');
  save(); renderInvoiceView(invoiceId);
}
function toggleVoid(id){
  const inv=getInvoice(id);
  if(!inv) return;
  if(inv.voided){ inv.voided=false; applyStockDelta(inv.items,-1); logEvent('invoice','ابطال فاکتور #'+fa(inv.number)+' لغو شد'); }
  else { if(invoicePaidAmount(inv)>0){ showToast('فاکتور دارای دریافت ثبت‌شده است؛ ابتدا دریافت‌ها را اصلاح یا حذف کنید'); return; } if(!confirm('این فاکتور باطل شود؟')) return; inv.voided=true; applyStockDelta(inv.items,1); logEvent('invoice','فاکتور #'+fa(inv.number)+' باطل شد'); }
  save(); renderInvoiceView(id);
}
function openCheckForInvoice(invoiceId){
  const inv=getInvoice(invoiceId); if(!inv) return;
  const cust=getCustomer(inv.customerId);
  const remaining=invoiceRemaining(inv);
  openCheckForm('receivable', null, {customerId:inv.customerId, invoiceId:inv.id, amount:remaining, partyName:cust?cust.name:''});
}

/* =========================================================
   چک‌ها
   ========================================================= */
let checkTab='receivable';
function checkBadge(status){
  const map={pending:['pending','در جریان وصول'], cashed:['paid','وصول‌شده'], bounced:['void','برگشت‌خورده']};
  const m=map[status]||map.pending;
  return '<span class="badge '+m[0]+'">'+m[1]+'</span>';
}
function renderChecks(){
  let html='<div class="tabs">'+
    ['receivable','payable'].map(d=>{
      const label=d==='receivable'?'چک‌های دریافتنی':'چک‌های پرداختنی';
      return '<div class="tab'+(checkTab===d?' active':'')+'" onclick="checkTab=\''+d+'\'; renderChecks()">'+label+'</div>';
    }).join('')+
  '</div>';
  const list=state.checks.filter(c=>c.direction===checkTab).sort((a,b)=>jToJdn(a.dueDate)-jToJdn(b.dueDate));
  html+='<div class="spread"><div></div><button class="btn btn-brand" onclick="openCheckForm(\''+checkTab+'\')">'+icon('plus')+'چک جدید</button></div>';
  if(list.length===0){
    html+=emptyState('stamp','چکی ثبت نشده', checkTab==='receivable'?'چک‌های دریافتی از مشتریان را اینجا ثبت کنید':'چک‌های صادرشده را اینجا ثبت کنید', "openCheckForm('"+checkTab+"')", 'ثبت چک');
  } else {
    html+='<div class="card"><table><thead><tr><th>شماره چک</th><th>طرف حساب</th><th>بانک</th><th>سررسید</th><th>مبلغ</th><th>وضعیت</th><th></th></tr></thead><tbody>';
    list.forEach(c=>{
      html+='<tr><td class="num">'+fa(c.number||'—')+'</td><td>'+esc(c.partyName||'—')+'</td><td>'+esc(c.bankName||'—')+'</td>'+
        '<td class="num">'+jStrShort(c.dueDate)+'</td><td class="num">'+money(c.amount)+'</td><td>'+checkBadge(c.status)+'</td>'+
        '<td><div class="row" style="justify-content:flex-end">'+
          (c.status==='pending'?'<button class="btn btn-ghost btn-sm" onclick="openCashCheckModal(\''+c.id+'\')">وصول شد</button><button class="btn btn-ghost btn-sm btn-danger" onclick="bounceCheck(\''+c.id+'\')">برگشت خورد</button>':'')+
          '<button class="btn btn-ghost icon-btn" onclick="openCheckForm(\''+c.direction+'\',\''+c.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteCheck(\''+c.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function openCheckForm(direction, id, prefill){
  const existing=id?state.checks.find(x=>x.id===id):null;
  const c=Object.assign({id:null, direction, number:'', bankName:'', amount:0, dueDate:todayJalali(), partyName:'', customerId:'', invoiceId:null, note:'', status:'pending'}, existing||{}, existing?{}:(prefill||{}));
  const days=jDaysInMonth(c.dueDate.jy,c.dueDate.jm);
  openModal('<div class="modal-head"><h3>'+(existing?'ویرایش چک':(direction==='receivable'?'چک دریافتنی جدید':'چک پرداختنی جدید'))+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveCheck(event,\''+direction+'\',\''+(id||'')+'\')">'+
    (direction==='receivable'?'<div class="field"><label>مشتری</label><select name="customerId"><option value="">— انتخاب نشود —</option>'+state.customers.map(cu=>'<option value="'+cu.id+'"'+(cu.id===c.customerId?' selected':'')+'>'+esc(cu.name)+'</option>').join('')+'</select></div>':'')+
    '<div class="field"><label>نام طرف حساب</label><input type="text" name="partyName" value="'+esc(c.partyName||'')+'" placeholder="'+(direction==='receivable'?'در صورت نبود در فهرست مشتریان':'دریافت‌کننده چک')+'"></div>'+
    '<div class="field-row"><div class="field"><label>شماره چک</label><input type="text" name="number" value="'+esc(c.number||'')+'"></div>'+
    '<div class="field"><label>نام بانک</label><input type="text" name="bankName" value="'+esc(c.bankName||'')+'"></div></div>'+
    '<div class="field"><label>مبلغ *</label><input required type="number" min="1" name="amount" value="'+c.amount+'"></div>'+
    '<div class="field"><label>تاریخ سررسید (شمسی)</label><div class="field-row3">'+
      '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===c.dueDate.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
      '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===c.dueDate.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
      '<select name="jy">'+range(c.dueDate.jy-2,c.dueDate.jy+3).map(y=>'<option value="'+y+'"'+(y===c.dueDate.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
    '</div></div>'+
    '<div class="field"><label>یادداشت</label><input type="text" name="note" value="'+esc(c.note||'')+'"></div>'+
    (c.invoiceId?'<input type="hidden" name="invoiceId" value="'+c.invoiceId+'">':'')+
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveCheck(ev,direction,id){
  ev.preventDefault(); const f=ev.target;
  const data={ direction, customerId:f.customerId?f.customerId.value:'', partyName:f.partyName.value.trim(), number:f.number.value.trim(), bankName:f.bankName.value.trim(),
    amount:Number(f.amount.value)||0, dueDate:{jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)}, note:f.note.value.trim() };
  if(f.invoiceId) data.invoiceId=f.invoiceId.value;
  if(!data.partyName && direction==='receivable' && data.customerId){ data.partyName=(getCustomer(data.customerId)||{}).name||''; }
  if(id){ const c=state.checks.find(x=>x.id===id); Object.assign(c, data); logEvent('check','چک شماره '+fa(data.number||'')+' ویرایش شد'); }
  else { data.id=uid(); data.status='pending'; state.checks.push(data); logEvent('check','چک '+(direction==='receivable'?'دریافتنی':'پرداختنی')+' شماره '+fa(data.number||'')+' ثبت شد'); }
  save(); closeModal(); renderChecks();
  return false;
}
function openCashCheckModal(id){
  const c=state.checks.find(x=>x.id===id);
  if(!c) return;
  const t=todayJalali(); const days=jDaysInMonth(t.jy,t.jm);
  openModal('<div class="modal-head"><h3>وصول چک</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return cashCheck(event,\''+id+'\')">'+
    '<div class="field"><label>واریز/برداشت به حساب</label><select required name="accountId">'+
      (state.bankAccounts.length?state.bankAccounts.map(a=>'<option value="'+a.id+'">'+esc(a.name)+'</option>').join(''):'<option value="">ابتدا یک حساب تعریف کنید</option>')+
    '</select></div>'+
    '<div class="field"><label>تاریخ وصول (شمسی)</label><div class="field-row3">'+
      '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
      '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
      '<select name="jy">'+range(t.jy-2,t.jy+2).map(y=>'<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
    '</div></div>'+
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ثبت وصول</button></div>'+
    '</form>');
}
function cashCheck(ev,id){
  ev.preventDefault(); const f=ev.target;
  const c=state.checks.find(x=>x.id===id);
  if(!c) return false;
  if(!f.accountId.value){ showToast('ابتدا یک حساب تعریف کنید'); return false; }
  const date={jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)};
  c.status='cashed'; c.accountId=f.accountId.value; c.cashDate=date;
  addTransaction(c.accountId, date, c.direction==='receivable'?'deposit':'withdraw', c.amount, (c.direction==='receivable'?'وصول چک دریافتی شماره ':'پرداخت چک شماره ')+(c.number||''), 'check', c.id);
  logEvent('check','چک شماره '+fa(c.number||'')+' وصول شد');
  save(); closeModal(); renderChecks();
  return false;
}
function bounceCheck(id){
  if(!confirm('این چک برگشت بخورد؟')) return;
  const c=state.checks.find(x=>x.id===id);
  if(!c) return;
  if(c.status!=='cashed'){ showToast('فقط چک وصول‌شده را می‌توان برگشت زد'); return; }
  removeLinkedTransactions('check', id);
  c.status='bounced'; c.bounceDate=todayJalali();
  logEvent('check','چک شماره '+fa(c.number||'')+' برگشت خورد و اثر وصول آن معکوس شد');
  save(); renderChecks();
}
function deleteCheck(id){
  if(!confirm('این چک حذف شود؟')) return;
  const c=state.checks.find(x=>x.id===id);
  removeLinkedTransactions('check', id);
  state.checks=state.checks.filter(x=>x.id!==id);
  logEvent('check','چک شماره '+fa(c?c.number:'')+' حذف شد');
  save(); renderChecks();
}

/* =========================================================
   حساب‌های دریافتنی و پرداختنی
   ========================================================= */
let rpTab='receivable';
let rpSearch='';

function renderReceivablesPayables(){
  const all=state.receivablesPayables||[];
  const list=all.filter(r=>
    r.direction===rpTab &&
    (!rpSearch || (r.partyName||'').includes(rpSearch) || (r.description||'').includes(rpSearch))
  ).sort((a,b)=>jToJdn(b.date)-jToJdn(a.date));

  const total=all.filter(r=>r.direction===rpTab && r.status!=='void').reduce((a,r)=>a+Number(r.amount||0),0);
  const paid=all.filter(r=>r.direction===rpTab && r.status!=='void').reduce((a,r)=>a+rpPaidAmount(r),0);
  const remaining=all.filter(r=>r.direction===rpTab && r.status!=='void').reduce((a,r)=>a+rpRemaining(r),0);

  let html='<div class="tabs">'+
    '<div class="tab'+(rpTab==='receivable'?' active':'')+'" onclick="rpTab=\'receivable\'; renderReceivablesPayables()">حساب‌های دریافتنی</div>'+
    '<div class="tab'+(rpTab==='payable'?' active':'')+'" onclick="rpTab=\'payable\'; renderReceivablesPayables()">حساب‌های پرداختنی</div>'+
  '</div>';

  html+='<div class="stat-grid">'+
    statCard('جمع اصل حساب‌ها',total,'')+
    statCard('پرداخت / دریافت‌شده',paid,'income')+
    statCard('مانده',remaining,rpTab==='payable'?'expense':'')+
  '</div>';

  html+='<div class="spread">'+
    '<div class="search-box">'+icon('search')+'<input type="text" placeholder="جستجوی طرف حساب یا شرح..." value="'+esc(rpSearch)+'" oninput="rpSearch=this.value; renderReceivablesPayables()"></div>'+
    '<button class="btn btn-brand" onclick="openReceivablePayableForm(\''+rpTab+'\')">'+icon('plus')+(rpTab==='receivable'?'حساب دریافتنی جدید':'حساب پرداختنی جدید')+'</button>'+
  '</div>';

  if(list.length===0){
    html+=emptyState('wallet',
      rpTab==='receivable'?'حساب دریافتنی ثبت نشده':'حساب پرداختنی ثبت نشده',
      rpTab==='receivable'?'مطالبات از مشتریان یا سایر طرف حساب‌ها را ثبت کنید.':'بدهی به تأمین‌کنندگان یا سایر طرف حساب‌ها را ثبت کنید.',
      "openReceivablePayableForm('"+rpTab+"')",
      rpTab==='receivable'?'ثبت دریافتنی':'ثبت پرداختنی');
  } else {
    html+='<div class="card"><table><thead><tr>'+
      '<th>طرف حساب</th><th>تاریخ</th><th>سررسید</th><th>مبلغ</th><th>مانده</th><th>وضعیت</th><th></th>'+
      '</tr></thead><tbody>';
    list.forEach(r=>{
      const due=jToJdn(r.dueDate)-jToJdn(todayJalali());
      const overdue=rpRemaining(r)>0 && due<0 && r.status!=='void';
      html+='<tr>'+
        '<td style="font-weight:600;cursor:pointer" onclick="nav(\'rp-view\',\''+r.id+'\')">'+esc(r.partyName||'—')+
          (r.description?'<div class="muted" style="font-size:11.5px">'+esc(r.description)+'</div>':'')+
        '</td>'+
        '<td class="num">'+jStrShort(r.date)+'</td>'+
        '<td class="num">'+jStrShort(r.dueDate)+(overdue?'<div style="color:var(--seal);font-size:11px">سررسید گذشته</div>':'')+'</td>'+
        '<td class="num">'+money(r.amount)+'</td>'+
        '<td class="num">'+money(rpRemaining(r))+'</td>'+
        '<td>'+rpStatusBadge(rpStatus(r))+'</td>'+
        '<td><div class="row" style="justify-content:flex-end" onclick="event.stopPropagation()">'+
          (rpRemaining(r)>0&&r.status!=='void'?'<button class="btn btn-ghost btn-sm" onclick="openRPSettlementForm(\''+r.id+'\')">'+(rpTab==='receivable'?'ثبت دریافت':'ثبت پرداخت')+'</button>':'')+
          '<button class="btn btn-ghost icon-btn" onclick="openReceivablePayableForm(\''+r.direction+'\',\''+r.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteReceivablePayable(\''+r.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}

function openReceivablePayableForm(direction,id){
  const existing=id?(state.receivablesPayables||[]).find(x=>x.id===id):null;
  const c=existing||{
    id:null,direction:direction,partyName:'',customerId:'',
    date:todayJalali(),dueDate:todayJalali(),amount:0,paid:0,
    description:'',note:'',status:'open',payments:[]
  };
  const days=jDaysInMonth(c.date.jy,c.date.jm);
  const dueDays=jDaysInMonth(c.dueDate.jy,c.dueDate.jm);

  openModal('<div class="modal-head"><h3>'+(existing?'ویرایش حساب':(direction==='receivable'?'ثبت حساب دریافتنی':'ثبت حساب پرداختنی'))+'</h3>'+
    '<button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveReceivablePayable(event,\''+direction+'\',\''+(id||'')+'\')">'+
      '<div class="field"><label>طرف حساب *</label><input required type="text" name="partyName" value="'+esc(c.partyName)+'" placeholder="نام مشتری، تأمین‌کننده یا شخص"></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>اتصال به مشتری (اختیاری)</label><select name="customerId"><option value="">— بدون اتصال —</option>'+
          state.customers.map(cu=>'<option value="'+cu.id+'"'+(cu.id===c.customerId?' selected':'')+'>'+esc(cu.name)+'</option>').join('')+
        '</select></div>'+
        '<div class="field"><label>مبلغ کل *</label><input required type="number" min="1" name="amount" value="'+Number(c.amount||0)+'"></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>تاریخ ثبت (شمسی)</label><div class="field-row3">'+
          '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===c.date.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
          '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===c.date.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
          '<select name="jy">'+range(c.date.jy-5,c.date.jy+2).map(y=>'<option value="'+y+'"'+(y===c.date.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
        '</div></div>'+
        '<div class="field"><label>سررسید (شمسی)</label><div class="field-row3">'+
          '<select name="dueJd">'+range(1,dueDays).map(d=>'<option value="'+d+'"'+(d===c.dueDate.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
          '<select name="dueJm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===c.dueDate.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
          '<select name="dueJy">'+range(c.dueDate.jy-5,c.dueDate.jy+2).map(y=>'<option value="'+y+'"'+(y===c.dueDate.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
        '</div></div>'+
      '</div>'+
      '<div class="field"><label>شرح</label><input type="text" name="description" value="'+esc(c.description||'')+'" placeholder="مثلاً خرید نسیه مواد اولیه"></div>'+
      '<div class="field"><label>یادداشت</label><textarea name="note" rows="2">'+esc(c.note||'')+'</textarea></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button>'+
      '<button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}

function saveReceivablePayable(ev,direction,id){
  ev.preventDefault();
  const f=ev.target;
  const amount=Number(f.amount.value)||0;
  if(amount<=0){ showToast('مبلغ باید بیشتر از صفر باشد'); return false; }

  const data={
    direction:direction,
    partyName:f.partyName.value.trim(),
    customerId:f.customerId.value||null,
    date:{jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)},
    dueDate:{jy:Number(f.dueJy.value),jm:Number(f.dueJm.value),jd:Number(f.dueJd.value)},
    amount:amount,
    description:f.description.value.trim(),
    note:f.note.value.trim()
  };
  if(!data.partyName){ showToast('طرف حساب را وارد کنید'); return false; }

  if(id){
    const r=state.receivablesPayables.find(x=>x.id===id);
    if(!r) return false;
    if(rpPaidAmount(r)>data.amount){ showToast('مبلغ جدید نمی‌تواند کمتر از مبلغ پرداخت/دریافت‌شده باشد'); return false; }
    Object.assign(r,data);
    r.status='open';
    if(rpRemaining(r)<=0) r.status='paid';
    logEvent('system',(direction==='receivable'?'حساب دریافتنی':'حساب پرداختنی')+' «'+data.partyName+'» ویرایش شد');
  } else {
    data.id=uid(); data.paid=0; data.payments=[]; data.status='open';
    state.receivablesPayables.push(data);
    logEvent('system',(direction==='receivable'?'حساب دریافتنی':'حساب پرداختنی')+' برای «'+data.partyName+'» به مبلغ '+money(amount)+' ثبت شد');
  }
  save(); closeModal(); renderReceivablesPayables();
  return false;
}

function openRPSettlementForm(id){
  const r=(state.receivablesPayables||[]).find(x=>x.id===id);
  if(!r || rpRemaining(r)<=0) return;
  const t=todayJalali(), days=jDaysInMonth(t.jy,t.jm);
  openModal('<div class="modal-head"><h3>'+(r.direction==='receivable'?'ثبت دریافت طلب':'ثبت پرداخت بدهی')+'</h3>'+
    '<button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveRPSettlement(event,\''+id+'\')">'+
      '<div class="field"><label>مبلغ '+(r.direction==='receivable'?'دریافت':'پرداخت')+' *</label>'+
        '<input required type="number" min="1" max="'+rpRemaining(r)+'" name="amount" value="'+rpRemaining(r)+'"></div>'+
      '<div class="field"><label>حساب '+(r.direction==='receivable'?'دریافت‌کننده':'پرداخت‌کننده')+' *</label><select required name="accountId">'+
        (state.bankAccounts.length?state.bankAccounts.map(a=>'<option value="'+a.id+'">'+esc(a.name)+'</option>').join(''):'<option value="">ابتدا یک حساب تعریف کنید</option>')+
      '</select></div>'+
      '<div class="field"><label>تاریخ (شمسی)</label><div class="field-row3">'+
        '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
        '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
        '<select name="jy">'+range(t.jy-2,t.jy+2).map(y=>'<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
      '</div></div>'+
      '<div class="field"><label>شرح پرداخت</label><input type="text" name="note" value="" placeholder="اختیاری"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button>'+
      '<button type="submit" class="btn btn-brand">'+icon('check')+(r.direction==='receivable'?'ثبت دریافت':'ثبت پرداخت')+'</button></div>'+
    '</form>');
}

function saveRPSettlement(ev,id){
  ev.preventDefault();
  const f=ev.target;
  const r=(state.receivablesPayables||[]).find(x=>x.id===id);
  if(!r) return false;
  const amount=Number(f.amount.value)||0;
  if(amount<=0 || amount>rpRemaining(r)){ showToast('مبلغ نامعتبر است'); return false; }
  if(!f.accountId.value){ showToast('ابتدا یک حساب بانکی یا صندوق تعریف کنید'); return false; }

  const date={jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)};
  const pay={id:uid(),date,amount,accountId:f.accountId.value,note:f.note.value.trim()};
  r.payments=r.payments||[];
  r.payments.push(pay);
  r.paid=rpPaidAmount(r)+amount;
  r.status=rpRemaining(r)<=0?'paid':'partial';

  addTransaction(
    pay.accountId,date,
    r.direction==='receivable'?'deposit':'withdraw',
    amount,
    (r.direction==='receivable'?'دریافت حساب از «':'پرداخت حساب به «')+r.partyName+'»',
    'receivable-payable-payment',pay.id
  );
  logEvent('system',(r.direction==='receivable'?'دریافت':'پرداخت')+' مبلغ '+money(amount)+' بابت «'+r.partyName+'» ثبت شد');
  save(); closeModal(); renderReceivablesPayables();
  return false;
}

function deleteReceivablePayable(id){
  const r=(state.receivablesPayables||[]).find(x=>x.id===id);
  if(!r) return;
  if((r.payments||[]).length && !confirm('برای این حساب پرداخت/دریافت ثبت شده است. حذف آن تراکنش‌های مرتبط را نیز حذف می‌کند. ادامه می‌دهید؟')) return;
  if(!(r.payments||[]).length && !confirm('این حساب حذف شود؟')) return;
  (r.payments||[]).forEach(p=>removeLinkedTransactions('receivable-payable-payment',p.id));
  state.receivablesPayables=state.receivablesPayables.filter(x=>x.id!==id);
  logEvent('system',(r.direction==='receivable'?'حساب دریافتنی':'حساب پرداختنی')+' «'+r.partyName+'» حذف شد');
  save(); renderReceivablesPayables();
}

function renderRPView(id){
  const r=(state.receivablesPayables||[]).find(x=>x.id===id);
  if(!r){ nav('receivables-payables'); return; }
  const payments=r.payments||[];
  const remaining=rpRemaining(r);

  let html='<div class="row no-print" style="justify-content:flex-end;margin-bottom:14px">'+
    '<button class="btn btn-ghost" onclick="nav(\'receivables-payables\')">بازگشت</button>'+
    (remaining>0&&r.status!=='void'?'<button class="btn btn-brand" onclick="openRPSettlementForm(\''+r.id+'\')">'+icon('check')+(r.direction==='receivable'?'ثبت دریافت':'ثبت پرداخت')+'</button>':'')+
    '<button class="btn btn-ghost" onclick="openReceivablePayableForm(\''+r.direction+'\',\''+r.id+'\')">'+icon('edit')+'ویرایش</button>'+
  '</div>';

  html+='<div class="card" style="margin-bottom:18px"><div class="section-title">'+esc(r.partyName)+'</div>'+
    '<div class="muted">'+(r.direction==='receivable'?'حساب دریافتنی':'حساب پرداختنی')+
    ' · ثبت: '+jStr(r.date)+' · سررسید: '+jStr(r.dueDate)+'</div>'+
    (r.description?'<div style="margin-top:8px">'+esc(r.description)+'</div>':'')+
  '</div>';

  html+='<div class="stat-grid">'+
    statCard('مبلغ کل',r.amount,'')+
    statCard(r.direction==='receivable'?'دریافت‌شده':'پرداخت‌شده',rpPaidAmount(r),'income')+
    statCard('مانده',remaining,r.direction==='payable'?'expense':'')+
  '</div>';

  if(payments.length===0){
    html+=emptyState('wallet','هنوز پرداخت/دریافتی ثبت نشده','برای تسویه بخشی یا کامل، دکمه ثبت را بزنید',null,'');
  } else {
    html+='<div class="card"><div class="section-title">گردش پرداخت‌ها</div><table><thead><tr><th>تاریخ</th><th>حساب</th><th>شرح</th><th>مبلغ</th></tr></thead><tbody>';
    payments.forEach(p=>{
      const a=state.bankAccounts.find(x=>x.id===p.accountId);
      html+='<tr><td class="num">'+jStrShort(p.date)+'</td><td>'+esc(a?a.name:'—')+'</td><td>'+esc(p.note||'—')+'</td><td class="num">'+money(p.amount)+'</td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}

/* =========================================================
   حساب‌ها و صندوق
   ========================================================= */
function renderAccounts(){
  let html='<div class="spread"><div class="muted">مجموع موجودی: <b class="num">'+money(state.bankAccounts.reduce((a,acc)=>a+accountBalance(acc.id),0))+' '+esc(state.business.currency)+'</b></div>'+
    '<button class="btn btn-brand" onclick="openAccountForm()">'+icon('plus')+'حساب جدید</button></div>';
  if(state.bankAccounts.length===0){
    html+=emptyState('bank','حسابی ثبت نشده','یک حساب بانکی یا صندوق نقدی اضافه کنید','openAccountForm()','افزودن حساب');
  } else {
    html+='<div class="card"><table><thead><tr><th>نام حساب</th><th>نوع</th><th>موجودی</th><th></th></tr></thead><tbody>';
    state.bankAccounts.forEach(a=>{
      html+='<tr style="cursor:pointer" onclick="nav(\'account-ledger\',\''+a.id+'\')"><td style="font-weight:600">'+esc(a.name)+'</td><td>'+(a.type==='cash'?'صندوق نقدی':'حساب بانکی')+'</td>'+
        '<td class="num">'+money(accountBalance(a.id))+'</td>'+
        '<td><div class="row" style="justify-content:flex-end" onclick="event.stopPropagation()">'+
          '<button class="btn btn-ghost icon-btn" onclick="openAccountForm(\''+a.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteAccount(\''+a.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function openAccountForm(id){
  const a=id?state.bankAccounts.find(x=>x.id===id):{id:null,name:'',type:'bank',initialBalance:0,note:''};
  openModal('<div class="modal-head"><h3>'+(id?'ویرایش حساب':'حساب جدید')+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveAccount(event,\''+(id||'')+'\')">'+
      '<div class="field"><label>نام حساب *</label><input required type="text" name="name" value="'+esc(a.name)+'"></div>'+
      '<div class="field-row"><div class="field"><label>نوع</label><select name="type"><option value="bank"'+(a.type==='bank'?' selected':'')+'>حساب بانکی</option><option value="cash"'+(a.type==='cash'?' selected':'')+'>صندوق نقدی</option></select></div>'+
      '<div class="field"><label>موجودی اولیه</label><input type="number" name="initialBalance" value="'+a.initialBalance+'"></div></div>'+
      '<div class="field"><label>یادداشت</label><input type="text" name="note" value="'+esc(a.note||'')+'"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveAccount(ev,id){
  ev.preventDefault(); const f=ev.target;
  const data={name:f.name.value.trim(), type:f.type.value, initialBalance:Number(f.initialBalance.value)||0, note:f.note.value.trim()};
  if(!data.name) return false;
  if(id){ Object.assign(state.bankAccounts.find(x=>x.id===id), data); logEvent('system','حساب «'+data.name+'» ویرایش شد'); }
  else { data.id=uid(); state.bankAccounts.push(data); logEvent('system','حساب «'+data.name+'» ثبت شد'); }
  save(); closeModal(); renderAccounts();
  return false;
}
function deleteAccount(id){
  const used=state.transactions.some(t=>t.accountId===id);
  if(used){ showToast('این حساب دارای تراکنش است و قابل حذف نیست'); return; }
  if(!confirm('این حساب حذف شود؟')) return;
  const a=state.bankAccounts.find(x=>x.id===id);
  state.bankAccounts=state.bankAccounts.filter(x=>x.id!==id);
  logEvent('system','حساب «'+(a?a.name:'')+'» حذف شد');
  save(); renderAccounts();
}
function renderAccountLedger(accountId){
  const a=state.bankAccounts.find(x=>x.id===accountId);
  if(!a){ nav('accounts'); return; }
  const txs=[...state.transactions.filter(t=>t.accountId===accountId)].sort((x,y)=>jToJdn(x.date)-jToJdn(y.date));
  let bal=a.initialBalance||0;
  const rows=txs.map(t=>{ bal+= t.type==='deposit'?t.amount:-t.amount; return {...t, balance:bal}; });
  let html='<div class="row no-print" style="justify-content:flex-end; margin-bottom:14px"><button class="btn btn-ghost" onclick="nav(\'accounts\')">بازگشت</button><button class="btn btn-brand" onclick="openTransactionForm(\''+accountId+'\')">'+icon('plus')+'ثبت تراکنش دستی</button></div>';
  html+='<div class="card" style="margin-bottom:18px"><div class="section-title">'+esc(a.name)+'</div><div class="muted">موجودی فعلی: <b class="num">'+money(bal)+' '+esc(state.business.currency)+'</b></div></div>';
  if(rows.length===0){ html+=emptyState('bank','تراکنشی ثبت نشده','واریز یا برداشت این حساب اینجا نمایش داده می‌شود', null,''); }
  else{
    html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>شرح</th><th>واریز</th><th>برداشت</th><th>مانده</th><th></th></tr></thead><tbody>';
    rows.forEach(t=>{
      html+='<tr><td class="num">'+jStrShort(t.date)+'</td><td>'+esc(t.description||'—')+'</td>'+
        '<td class="num">'+(t.type==='deposit'?money(t.amount):'—')+'</td>'+
        '<td class="num">'+(t.type==='withdraw'?money(t.amount):'—')+'</td>'+
        '<td class="num">'+money(t.balance)+'</td>'+
        '<td>'+(!t.relatedType?'<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteTransaction(\''+t.id+'\')">'+icon('trash')+'</button>':'<span class="muted" style="font-size:11px">خودکار</span>')+'</td>'+
      '</tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function openTransactionForm(accountId){
  const t=todayJalali(); const days=jDaysInMonth(t.jy,t.jm);
  openModal('<div class="modal-head"><h3>ثبت تراکنش دستی</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveTransaction(event,\''+accountId+'\')">'+
    '<div class="field"><label>نوع</label><select name="type"><option value="deposit">واریز</option><option value="withdraw">برداشت</option></select></div>'+
    '<div class="field"><label>مبلغ *</label><input required type="number" min="1" name="amount"></div>'+
    '<div class="field"><label>تاریخ (شمسی)</label><div class="field-row3">'+
      '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
      '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
      '<select name="jy">'+range(t.jy-5,t.jy+2).map(y=>'<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
    '</div></div>'+
    '<div class="field"><label>شرح</label><input type="text" name="description"></div>'+
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ثبت</button></div>'+
    '</form>');
}
function saveTransaction(ev,accountId){
  ev.preventDefault(); const f=ev.target;
  const amount=Number(f.amount.value)||0;
  if(amount<=0) return false;
  addTransaction(accountId, {jy:Number(f.jy.value),jm:Number(f.jm.value),jd:Number(f.jd.value)}, f.type.value, amount, f.description.value.trim(), null, null);
  logEvent('system', (f.type.value==='deposit'?'واریز':'برداشت')+' دستی به مبلغ '+money(amount)+' ثبت شد');
  save(); closeModal(); renderAccountLedger(accountId);
  return false;
}
function deleteTransaction(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t) return;
  if(t.relatedType){ showToast('این تراکنش خودکار است و باید از مبدأ آن حذف شود'); return; }
  if(!confirm('این تراکنش حذف شود؟')) return;
  const accId=t.accountId;
  state.transactions=state.transactions.filter(x=>x.id!==id);
  save(); renderAccountLedger(accId);
}

/* =========================================================
   هزینه‌ها
   ========================================================= */
function renderExpenses(){
  const list=[...state.expenses].sort((a,b)=>jToJdn(b.date)-jToJdn(a.date));
  const totalAll=list.reduce((a,e)=>a+e.amount,0);
  let html='<div class="spread"><div class="muted">مجموع هزینه‌های ثبت‌شده: <b class="num">'+money(totalAll)+' '+esc(state.business.currency)+'</b></div>'+
    '<button class="btn btn-brand" onclick="openExpenseForm()">'+icon('plus')+'هزینه جدید</button></div>';
  if(list.length===0){
    html+=emptyState('wallet','هنوز هزینه‌ای ثبت نشده','هزینه‌های کسب‌وکار خود را برای گزارش دقیق سود و زیان ثبت کنید','openExpenseForm()','افزودن هزینه');
  } else {
    html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>دسته‌بندی</th><th>شرح</th><th>مبلغ</th><th></th></tr></thead><tbody>';
    list.forEach(e=>{
      html+='<tr><td class="num">'+jStrShort(e.date)+'</td><td>'+esc(getCategoryName('expense',e.categoryId))+'</td><td class="muted">'+esc(e.description||'—')+'</td>'+
        '<td class="num">'+money(e.amount)+'</td>'+
        '<td><div class="row" style="justify-content:flex-end">'+
          '<button class="btn btn-ghost icon-btn" onclick="openExpenseForm(\''+e.id+'\')">'+icon('edit')+'</button>'+
          '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteExpense(\''+e.id+'\')">'+icon('trash')+'</button>'+
        '</div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function expenseCategoryOptions(selectedId){
  const top=state.expenseCategories.filter(c=>!c.parentId);
  return top.map(p=>{
    const children=state.expenseCategories.filter(c=>c.parentId===p.id);
    if(children.length===0) return '<option value="'+p.id+'"'+(p.id===selectedId?' selected':'')+'>'+esc(p.name)+'</option>';
    return '<optgroup label="'+esc(p.name)+'">'+
      '<option value="'+p.id+'"'+(p.id===selectedId?' selected':'')+'>'+esc(p.name)+' (عمومی)</option>'+
      children.map(c=>'<option value="'+c.id+'"'+(c.id===selectedId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+
    '</optgroup>';
  }).join('');
}
function openExpenseForm(id){
  const e=id?state.expenses.find(x=>x.id===id):{id:null, date:todayJalali(), categoryId:(state.expenseCategories[0]||{}).id||'', amount:0, description:'', accountId:''};
  const days=jDaysInMonth(e.date.jy, e.date.jm);
  openModal('<div class="modal-head"><h3>'+(id?'ویرایش هزینه':'هزینه جدید')+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveExpense(event, \''+(id||'')+'\')">'+
      '<div class="field"><label>تاریخ (شمسی)</label><div class="field-row3">'+
        '<select name="jd">'+range(1,days).map(d=>'<option value="'+d+'"'+(d===e.date.jd?' selected':'')+'>'+fa(d)+'</option>').join('')+'</select>'+
        '<select name="jm">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'"'+(i+1===e.date.jm?' selected':'')+'>'+m+'</option>').join('')+'</select>'+
        '<select name="jy">'+range(e.date.jy-5,e.date.jy+2).map(y=>'<option value="'+y+'"'+(y===e.date.jy?' selected':'')+'>'+fa(y)+'</option>').join('')+'</select>'+
      '</div></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>دسته‌بندی</label><select name="categoryId">'+expenseCategoryOptions(e.categoryId)+'</select></div>'+
        '<div class="field"><label>مبلغ ('+esc(state.business.currency)+') *</label><input required type="number" min="0" name="amount" value="'+e.amount+'"></div>'+
      '</div>'+
      '<div class="field"><label>پرداخت از حساب (اختیاری)</label><select name="accountId"><option value="">— ثبت نشود —</option>'+state.bankAccounts.map(a=>'<option value="'+a.id+'"'+(a.id===e.accountId?' selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>شرح</label><input type="text" name="description" value="'+esc(e.description||'')+'"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveExpense(ev,id){
  ev.preventDefault();
  const f=ev.target;
  const data={ date:{jy:Number(f.jy.value), jm:Number(f.jm.value), jd:Number(f.jd.value)}, categoryId:f.categoryId.value, amount:Number(f.amount.value)||0, description:f.description.value.trim(), accountId:f.accountId.value||null };
  let expenseId=id;
  if(id){ Object.assign(state.expenses.find(x=>x.id===id), data); removeLinkedTransactions('expense', id); logEvent('expense','هزینه «'+getCategoryName('expense',data.categoryId)+'» به مبلغ '+money(data.amount)+' ویرایش شد'); }
  else { data.id=uid(); expenseId=data.id; state.expenses.push(data); logEvent('expense','هزینه «'+getCategoryName('expense',data.categoryId)+'» به مبلغ '+money(data.amount)+' ثبت شد'); }
  if(data.accountId){ addTransaction(data.accountId, data.date, 'withdraw', data.amount, 'هزینه: '+getCategoryName('expense',data.categoryId), 'expense', expenseId); }
  save(); closeModal(); renderExpenses();
  return false;
}
function deleteExpense(id){
  if(!confirm('این هزینه حذف شود؟')) return;
  const e=state.expenses.find(x=>x.id===id);
  removeLinkedTransactions('expense', id);
  state.expenses=state.expenses.filter(e=>e.id!==id);
  logEvent('expense','هزینه «'+(e?getCategoryName('expense',e.categoryId):'')+'» به مبلغ '+(e?money(e.amount):'')+' حذف شد');
  save(); renderExpenses();
}

/* =========================================================
   دسته‌بندی‌ها
   ========================================================= */
let catTab='expense';
function catListFor(kind){ return kind==='expense'?state.expenseCategories:(kind==='service'?state.serviceCategories:state.customerCategories); }
function renderCategories(){
  let html='<div class="tabs">'+
    [['expense','دسته‌بندی هزینه‌ها'],['service','دسته‌بندی خدمات'],['customer','دسته‌بندی مشتریان']].map(k=>
      '<div class="tab'+(catTab===k[0]?' active':'')+'" onclick="catTab=\''+k[0]+'\'; renderCategories()">'+k[1]+'</div>'
    ).join('')+
  '</div>';

  if(catTab==='expense'){
    const cats=state.expenseCategories;
    const top=cats.filter(c=>!c.parentId);
    html+='<div class="spread"><div class="muted">دسته‌های اصلی می‌توانند زیرمجموعه داشته باشند؛ مثلاً «خرید» و زیرمجموعهٔ «خرید تجهیزات».</div><button class="btn btn-brand" onclick="openCategoryForm(\'expense\', null, null)">'+icon('plus')+'دسته اصلی جدید</button></div>';
    if(top.length===0){ html+=emptyState('tag','دسته‌بندی‌ای ثبت نشده','برای هزینه‌ها دسته‌بندی تعریف کنید','openCategoryForm(\'expense\',null,null)','افزودن دسته'); }
    else{
      html+='<div class="card">';
      top.forEach(p=>{
        const children=cats.filter(c=>c.parentId===p.id);
        html+='<div class="cat-row" style="flex-direction:column; align-items:stretch">'+
          '<div class="row" style="justify-content:space-between">'+
            '<div style="font-weight:700">'+esc(p.name)+'</div>'+
            '<div class="row">'+
              '<button class="btn btn-ghost btn-sm" onclick="openCategoryForm(\'expense\',null,\''+p.id+'\')">'+icon('plus')+'زیرمجموعه</button>'+
              '<button class="btn btn-ghost icon-btn" onclick="openCategoryForm(\'expense\',\''+p.id+'\',null)">'+icon('edit')+'</button>'+
              '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteCategory(\'expense\',\''+p.id+'\')">'+icon('trash')+'</button>'+
            '</div></div>'+
          (children.length?'<div class="cat-sub">'+children.map(c=>
            '<div class="row" style="justify-content:space-between"><div class="muted">– '+esc(c.name)+'</div><div class="row">'+
              '<button class="btn btn-ghost icon-btn" onclick="openCategoryForm(\'expense\',\''+c.id+'\',null)">'+icon('edit')+'</button>'+
              '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteCategory(\'expense\',\''+c.id+'\')">'+icon('trash')+'</button></div></div>'
          ).join('')+'</div>':'')+
        '</div>';
      });
      html+='</div>';
    }
  } else {
    const kind=catTab; const list=catListFor(kind);
    html+='<div class="spread"><div></div><button class="btn btn-brand" onclick="openCategoryForm(\''+kind+'\',null,null)">'+icon('plus')+'دسته جدید</button></div>';
    if(list.length===0){ html+=emptyState('tag','دسته‌بندی‌ای ثبت نشده','برای دسته‌بندی بهتر، یک گروه تعریف کنید','openCategoryForm(\''+kind+'\',null,null)','افزودن دسته'); }
    else{
      html+='<div class="card">'+list.map(c=>'<div class="cat-row"><div style="font-weight:600">'+esc(c.name)+'</div><div class="row">'+
        '<button class="btn btn-ghost icon-btn" onclick="openCategoryForm(\''+kind+'\',\''+c.id+'\',null)">'+icon('edit')+'</button>'+
        '<button class="btn btn-ghost icon-btn btn-danger" onclick="deleteCategory(\''+kind+'\',\''+c.id+'\')">'+icon('trash')+'</button></div></div>').join('')+'</div>';
    }
  }
  document.getElementById('content').innerHTML=html;
}
function openCategoryForm(kind,id,parentId){
  const list=catListFor(kind);
  const existing=id?list.find(c=>c.id===id):null;
  const isSub=kind==='expense' && (parentId || (existing&&existing.parentId));
  const parentName=kind==='expense'&&parentId?((list.find(c=>c.id===parentId)||{}).name||''):'';
  openModal('<div class="modal-head"><h3>'+(existing?'ویرایش دسته':'دسته جدید')+(isSub?' (زیرمجموعه'+(parentName?' «'+esc(parentName)+'»':'')+')':'')+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
    '<form onsubmit="return saveCategoryForm(event,\''+kind+'\',\''+(id||'')+'\',\''+(parentId||'')+'\')">'+
      '<div class="field"><label>نام دسته *</label><input required type="text" name="name" value="'+esc(existing?existing.name:'')+'"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">'+icon('check')+'ذخیره</button></div>'+
    '</form>');
}
function saveCategoryForm(ev,kind,id,parentId){
  ev.preventDefault();
  const name=ev.target.name.value.trim();
  if(!name) return false;
  const list=catListFor(kind);
  if(id){ const c=list.find(x=>x.id===id); c.name=name; logEvent('system','دسته‌بندی «'+name+'» ویرایش شد'); }
  else { const obj={id:uid(), name:name}; if(kind==='expense') obj.parentId=parentId||null; list.push(obj); logEvent('system','دسته‌بندی «'+name+'» ثبت شد'); }
  save(); closeModal(); renderCategories();
  return false;
}
function deleteCategory(kind,id){
  const list=catListFor(kind);
  if(kind==='expense'){
    const hasChildren=list.some(c=>c.parentId===id);
    if(hasChildren){ showToast('ابتدا زیرمجموعه‌های این دسته را حذف کنید'); return; }
  }
  if(!confirm('این دسته حذف شود؟')) return;
  const idx=list.findIndex(c=>c.id===id);
  if(idx>-1) list.splice(idx,1);
  save(); renderCategories();
}

/* =========================================================
   تاریخچه تغییرات
   ========================================================= */
const LOG_ICONS={customer:'users', service:'services', invoice:'invoice', expense:'wallet', check:'stamp', system:'gear', receivable:'wallet', payable:'wallet'};
const LOG_LABELS={customer:'مشتری', service:'خدمت', invoice:'فاکتور', expense:'هزینه', check:'چک', system:'سیستم'};
let logFilter='all';
function renderActivity(){
  const log=state.activityLog||[];
  const filtered=logFilter==='all'?log:log.filter(l=>l.type===logFilter);
  let html='<div class="spread"><div class="row">'+
    ['all','invoice','customer','service','expense','check','system'].map(f=>{
      const label=f==='all'?'همه':LOG_LABELS[f];
      return '<button class="btn btn-sm '+(logFilter===f?'btn-brand':'btn-ghost')+'" onclick="logFilter=\''+f+'\'; renderActivity()">'+label+'</button>';
    }).join('')+
  '</div>'+
  (log.length?'<button class="btn btn-ghost btn-danger" onclick="clearActivityLog()">'+icon('trash')+'پاک کردن همه تاریخچه</button>':'')+
  '</div>';

  if(filtered.length===0){
    html+=emptyState('history','رویدادی ثبت نشده','فعالیت‌های شما شامل ثبت، ویرایش و حذف در این‌جا نمایش داده می‌شود', null, '');
  } else {
    html+='<div class="card"><table><thead><tr><th>نوع</th><th>رویداد</th><th>تاریخ</th><th>ساعت</th><th></th></tr></thead><tbody>';
    filtered.forEach(l=>{
      html+='<tr><td>'+icon(LOG_ICONS[l.type]||'history')+'</td>'+
        '<td>'+esc(l.message)+'</td>'+
        '<td class="num muted">'+jStrShort(l.date)+'</td>'+
        '<td class="num muted">'+fa(l.time||'')+'</td>'+
        '<td><button class="btn btn-ghost icon-btn btn-danger" title="حذف رویداد" onclick="deleteLogEntry(\''+l.id+'\')">'+icon('trash')+'</button></td>'+
      '</tr>';
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
}
function deleteLogEntry(id){
  if(!confirm('این رویداد از تاریخچه حذف شود؟')) return;
  state.activityLog=(state.activityLog||[]).filter(l=>l.id!==id);
  save(); renderActivity();
}
function clearActivityLog(){
  if(!confirm('همه تاریخچه تغییرات پاک شود؟ این عمل قابل بازگشت نیست.')) return;
  state.activityLog=[];
  save(); renderActivity();
}

/* =========================================================
   گزارش‌ها
   ========================================================= */
function renderReports(){
  const t=todayJalali();
  const pays=allPayments();
  const yearPayments=pays.filter(p=>p.date.jy===t.jy);
  const yearInvoicesAll=state.invoices.filter(i=>!i.voided && i.date.jy===t.jy);
  const yearExpenses=state.expenses.filter(e=>e.date.jy===t.jy);
  const totalRevenue=yearPayments.reduce((a,p)=>a+p.amount,0);
  const totalExpense=yearExpenses.reduce((a,e)=>a+e.amount,0);
  const avgInvoice=yearInvoicesAll.length? yearInvoicesAll.reduce((a,i)=>a+i.grandTotal,0)/yearInvoicesAll.length : 0;

  let html='<div class="stat-grid">'+
    statCard('درآمد دریافتی سال '+fa(t.jy), totalRevenue, 'income')+
    statCard('هزینه سال '+fa(t.jy), totalExpense, 'expense')+
    statCard('سود خالص سال', totalRevenue-totalExpense, (totalRevenue-totalExpense)>=0?'income':'expense')+
    statCard('میانگین مبلغ فاکتور', Math.round(avgInvoice), '')+
  '</div>';

  html+='<div class="two-col">';
  html+='<div class="card"><div class="section-title">روند ۱۲ ماه اخیر (سود خالص)</div><div class="chart-wrap"><canvas id="repChart"></canvas></div></div>';
  html+='<div class="card"><div class="section-title">هزینه به تفکیک دسته (سال جاری)</div><div class="chart-wrap"><canvas id="catChart"></canvas></div></div>';
  html+='</div>';

  html+='<div class="two-col" style="margin-top:18px">';
  html+='<div class="card"><div class="section-title">مشتریان برتر</div>';
  const byCust={};
  state.invoices.filter(i=>!i.voided).forEach(i=>{ byCust[i.customerId]=(byCust[i.customerId]||0)+i.grandTotal; });
  const topCust=Object.entries(byCust).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if(topCust.length===0){ html+='<div class="muted">داده‌ای موجود نیست</div>'; }
  else{
    html+='<table><tbody>';
    topCust.forEach(([cid,total])=>{
      const c=getCustomer(cid);
      html+='<tr style="cursor:pointer" onclick="nav(\'customer-ledger\',\''+cid+'\')"><td>'+esc(c?c.name:'—')+'</td><td class="num">'+money(total)+' '+esc(state.business.currency)+'</td></tr>';
    });
    html+='</tbody></table>';
  }
  html+='</div>';

  html+='<div class="card"><div class="section-title">فاکتورهای معوق</div>';
  const pend=state.invoices.filter(i=>!i.voided && invoiceRemaining(i)>0).sort((a,b)=>jToJdn(a.date)-jToJdn(b.date));
  if(pend.length===0){ html+='<div class="muted">فاکتور معوقی وجود ندارد</div>'; }
  else{
    const todayJdn=jToJdn(t);
    html+='<table><tbody>';
    pend.forEach(i=>{
      const c=getCustomer(i.customerId);
      const days=todayJdn-jToJdn(i.date);
      html+='<tr style="cursor:pointer" onclick="nav(\'invoice-view\',\''+i.id+'\')"><td>'+esc(c?c.name:'—')+'<div class="muted" style="font-size:11px">فاکتور '+fa(i.number)+'</div></td>'+
        '<td class="num">'+money(invoiceRemaining(i))+'</td><td class="muted num">'+fa(days)+' روز</td></tr>';
    });
    html+='</tbody></table>';
  }
  html+='</div></div>';

  document.getElementById('content').innerHTML=html;

  destroyChart('repChart'); destroyChart('catChart');
  const styles=getComputedStyle(document.documentElement);
  const brass=styles.getPropertyValue('--brass').trim();
  const green=styles.getPropertyValue('--green').trim();
  const seal=styles.getPropertyValue('--seal').trim();
  const textMuted=styles.getPropertyValue('--text-muted').trim();
  const months=lastNMonthsLabels(12);
  const netData=months.map(m=>{
    const inc=pays.filter(p=>p.date.jy===m.jy && p.date.jm===m.jm).reduce((a,p)=>a+p.amount,0);
    const exp=state.expenses.filter(e=>e.date.jy===m.jy && e.date.jm===m.jm).reduce((a,e)=>a+e.amount,0);
    return inc-exp;
  });
  chartInstances['repChart']=new Chart(document.getElementById('repChart').getContext('2d'),{
    type:'line',
    data:{labels:months.map(m=>m.label), datasets:[{label:'سود خالص', data:netData, borderColor:brass, backgroundColor:'rgba(179,131,60,.15)', fill:true, tension:.3}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:textMuted,font:{family:'Vazirmatn'}},grid:{display:false}}, y:{ticks:{color:textMuted,font:{family:'Vazirmatn'}}, grid:{color:'rgba(150,140,110,.15)'}}}}
  });

  const byCat={};
  yearExpenses.forEach(e=>{ const label=getCategoryName('expense',e.categoryId); byCat[label]=(byCat[label]||0)+e.amount; });
  const catLabels=Object.keys(byCat);
  chartInstances['catChart']=new Chart(document.getElementById('catChart').getContext('2d'),{
    type:'doughnut',
    data:{labels:catLabels, datasets:[{data:catLabels.map(k=>byCat[k]), backgroundColor:[brass,green,seal,'#7a8fa6','#a48bc2','#c9975a','#6a9c8f','#b07fa8','#7fa87f']}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:textMuted, font:{family:'Vazirmatn', size:11}}}}}
  });
}

/* =========================================================
   تنظیمات
   ========================================================= */
function settingsInput(name,label,value,type='text',extra=''){
  return '<div class="field"><label>'+label+'</label><input '+extra+' type="'+type+'" name="'+name+'" value="'+esc(value==null?'':String(value))+'"></div>';
}
function settingsCheck(name,label,checked){
  return '<label style="display:flex;align-items:center;gap:8px;margin:9px 0;font-size:13px"><input type="checkbox" name="'+name+'" '+(checked?'checked':'')+' style="width:auto"> '+label+'</label>';
}
function renderSettings(){
  const b=state.business, s=state.settings||{};
  let html='<div class="two-col">';
  html+='<div class="card"><div class="section-title">🏢 اطلاعات کامل کسب‌وکار</div><form onsubmit="return saveSettings(event)">'+
    settingsInput('name','نام کسب‌وکار',b.name)+
    '<div class="field-row">'+settingsInput('phone','تلفن',b.phone,'tel')+settingsInput('email','ایمیل',b.email||'','email')+'</div>'+settingsInput('tradeName','نام تجاری',b.tradeName||'')+
    '<div class="field-row">'+settingsInput('economicCode','کد اقتصادی',b.economicCode)+settingsInput('nationalId','شناسه ملی',b.nationalId||'')+'</div>'+settingsInput('registrationNo','شماره ثبت',b.registrationNo||'')+settingsInput('postalCode','کدپستی',b.postalCode||'')+settingsInput('address','آدرس',b.address)+settingsInput('website','وب‌سایت',b.website||'')+
    '<button class="btn btn-brand" type="submit">'+icon('check')+'ذخیره اطلاعات</button></form></div>';

  html+='<div class="card"><div class="section-title">🧾 شماره‌گذاری و فاکتور</div><form onsubmit="return saveInvoiceSettings(event)">'+
    '<div class="field-row">'+settingsInput('invoicePrefix','پیشوند فاکتور',s.invoicePrefix)+settingsInput('nextInvoiceNo','شماره بعدی فاکتور',s.nextInvoiceNo,'number','min="1"')+'</div>'+
    '<div class="field-row">'+settingsInput('proformaPrefix','پیشوند پیش‌فاکتور',s.proformaPrefix)+settingsInput('nextProformaNo','شماره بعدی پیش‌فاکتور',s.nextProformaNo,'number','min="1"')+'</div>'+settingsInput('paymentTerms','شرایط پرداخت پیش‌فرض',s.paymentTerms)+settingsInput('invoiceHeader','متن سربرگ',s.invoiceHeader)+settingsInput('invoiceFooter','متن پایین فاکتور',s.invoiceFooter)+
    settingsCheck('showLogo','نمایش لوگو',s.showLogo)+settingsCheck('showBankInfo','نمایش اطلاعات بانکی',s.showBankInfo)+settingsCheck('showTax','نمایش مالیات',s.showTax)+settingsCheck('showDiscount','نمایش تخفیف',s.showDiscount)+settingsCheck('showSignature','نمایش محل مهر و امضا',s.showSignature)+
    '<button class="btn btn-brand" type="submit">ذخیره تنظیمات فاکتور</button></form></div>';

  html+='<div class="card"><div class="section-title">💰 مالی و حسابداری</div><form onsubmit="return saveFinancialSettings(event)">'+
    '<div class="field-row">'+settingsInput('currency','واحد پول',b.currency)+settingsInput('decimalPlaces','تعداد اعشار',s.decimalPlaces,'number','min="0" max="4"')+'</div>'+settingsInput('defaultTaxRate','مالیات پیش‌فرض (%)',s.defaultTaxRate,'number','min="0" max="100" step="0.01"')+
    '<div class="field"><label>حساب پیش‌فرض دریافت</label><select name="defaultReceiveAccountId"><option value="">— بدون انتخاب —</option>'+state.bankAccounts.map(a=>'<option value="'+a.id+'" '+(a.id===s.defaultReceiveAccountId?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></div>'+ '<div class="field"><label>حساب پیش‌فرض پرداخت</label><select name="defaultPayAccountId"><option value="">— بدون انتخاب —</option>'+state.bankAccounts.map(a=>'<option value="'+a.id+'" '+(a.id===s.defaultPayAccountId?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></div>'+
    '<button class="btn btn-brand" type="submit">ذخیره تنظیمات مالی</button></form></div>';

  html+='<div class="card"><div class="section-title">📅 تاریخ و سال مالی</div><form onsubmit="return saveDateSettings(event)">'+
    '<div class="field"><label>تقویم</label><select name="dateCalendar"><option value="jalali" '+(s.dateCalendar==='jalali'?'selected':'')+'>شمسی</option><option value="gregorian" '+(s.dateCalendar==='gregorian'?'selected':'')+'>میلادی</option></select></div>'+
    '<div class="field"><label>ماه شروع سال مالی</label><select name="fiscalYearStartMonth">'+J_MONTHS.map((m,i)=>'<option value="'+(i+1)+'" '+(i+1===Number(s.fiscalYearStartMonth)?'selected':'')+'>'+m+'</option>').join('')+'</select></div>'+ '<button class="btn btn-brand" type="submit">ذخیره تاریخ و سال مالی</button></form></div>';

  html+='<div class="card"><div class="section-title">🧮 مالیات</div><form onsubmit="return saveTaxSettings(event)">'+settingsInput('taxRate','نرخ مالیات بر ارزش افزوده (%)',b.taxRate,'number','min="0" max="100" step="0.01"')+settingsInput('defaultTaxRate2','نرخ پیش‌فرض فاکتور (%)',s.defaultTaxRate,'number','min="0" max="100" step="0.01"')+settingsCheck('showTax','نمایش مالیات در فاکتور',s.showTax)+'<button class="btn btn-brand" type="submit">ذخیره مالیات</button></form></div>';

  html+='<div class="card"><div class="section-title">🖨️ چاپ</div><form onsubmit="return savePrintSettings(event)">'+
    '<div class="field"><label>اندازه کاغذ</label><select name="paperSize"><option '+(s.paperSize==='A4'?'selected':'')+'>A4</option><option '+(s.paperSize==='A5'?'selected':'')+'>A5</option></select></div>'+ '<div class="field"><label>حاشیه چاپ</label><select name="printMargin"><option value="normal" '+(s.printMargin==='normal'?'selected':'')+'>معمولی</option><option value="narrow" '+(s.printMargin==='narrow'?'selected':'')+'>کم</option><option value="wide" '+(s.printMargin==='wide'?'selected':'')+'>زیاد</option></select></div>'+settingsCheck('showLogo','لوگو',s.showLogo)+settingsCheck('showBankInfo','اطلاعات بانکی',s.showBankInfo)+settingsCheck('showSignature','مهر و امضا',s.showSignature)+'<button class="btn btn-brand" type="submit">ذخیره تنظیمات چاپ</button></form></div>';

  html+='<div class="card"><div class="section-title">👥 کاربران و سطح دسترسی</div><div class="muted" style="font-size:12px;margin-bottom:12px">این بخش برای مدیریت کاربران محلی همین دستگاه است.</div>';
  if(!(state.appUsers||[]).length) html+='<div class="muted">هنوز کاربری تعریف نشده است.</div>';
  else state.appUsers.forEach((u,i)=>{ html+='<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--border);padding:9px 0"><span>'+esc(u.name)+' <small class="muted">('+esc(u.role)+')</small></span><button class="btn btn-ghost btn-sm btn-danger" onclick="deleteLocalUser('+i+')">حذف</button></div>'; });
  html+='<div style="margin-top:12px"><button class="btn btn-ghost" onclick="addLocalUser()">+ افزودن کاربر</button></div></div>';

  html+='<div class="card"><div class="section-title">🔐 امنیت</div><form onsubmit="return saveSecuritySettings(event)">'+settingsCheck('lockEnabled','قفل برنامه با PIN',s.lockEnabled)+settingsInput('lockPin','PIN چهار تا شش رقمی',s.lockPin,'password','inputmode="numeric" minlength="4" maxlength="6" pattern="[0-9]{4,6}"')+settingsInput('autoLockMinutes','قفل خودکار پس از (دقیقه؛ ۰=خاموش)',s.autoLockMinutes,'number','min="0" max="1440"')+'<button class="btn btn-brand" type="submit">ذخیره امنیت</button></form></div>';

  html+='<div class="card"><div class="section-title">💾 پشتیبان‌گیری و بازیابی</div><p class="muted" style="font-size:12px">یک نسخه کامل از اطلاعات، تنظیمات و اسناد ذخیره می‌شود.</p><div class="row"><button class="btn btn-brand" onclick="downloadBackup()">'+icon('download')+'پشتیبان‌گیری</button><button class="btn btn-ghost" onclick="document.getElementById(\'restoreFile\').click()">بازیابی Backup</button><input id="restoreFile" type="file" accept=".json,application/json" style="display:none" onchange="restoreBackup(event)"></div><div class="field" style="margin-top:14px">'+settingsCheck('autoBackup','یادآوری پشتیبان‌گیری',s.autoBackup)+'</div><div class="muted">آخرین پشتیبان: '+esc(localStorage.getItem('daftar_last_backup')||'ثبت نشده')+'</div></div>';

  html+='<div class="card"><div class="section-title">🎨 ظاهر</div><form onsubmit="return saveAppearanceSettings(event)">'+ '<div class="field"><label>حالت نمایش</label><select name="theme"><option value="system" '+(s.theme==='system'?'selected':'')+'>پیش‌فرض</option><option value="light" '+(s.theme==='light'?'selected':'')+'>روشن</option><option value="dark" '+(s.theme==='dark'?'selected':'')+'>تیره</option></select></div>'+settingsCheck('compactTables','جداول فشرده',s.compactTables)+'<button class="btn btn-brand" type="submit">ذخیره ظاهر</button></form></div>';

  html+='<div class="card"><div class="section-title">🗃️ مدیریت داده‌ها</div><div class="row"><button class="btn btn-ghost" onclick="exportCSVCustomers()">خروجی مشتریان CSV</button><button class="btn btn-ghost" onclick="exportCSVInvoices()">خروجی فاکتورها CSV</button></div><div style="margin-top:12px"><button class="btn btn-ghost btn-danger" onclick="resetAllData()">'+icon('trash')+'پاک کردن همه اطلاعات</button></div></div>';
  html+='</div>';
  document.getElementById('content').innerHTML=html;
}
function saveSettings(ev){ ev.preventDefault(); const f=ev.target; const b=state.business; b.name=f.name.value.trim()||b.name; b.phone=f.phone.value.trim(); b.email=f.email.value.trim(); b.tradeName=f.tradeName.value.trim(); b.economicCode=f.economicCode.value.trim(); b.nationalId=f.nationalId.value.trim(); b.registrationNo=f.registrationNo.value.trim(); b.postalCode=f.postalCode.value.trim(); b.address=f.address.value.trim(); b.website=f.website.value.trim(); save(); logEvent('system','اطلاعات کسب‌وکار بروزرسانی شد'); showToast('اطلاعات ذخیره شد'); renderSettings(); return false; }
function saveInvoiceSettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; s.invoicePrefix=f.invoicePrefix.value; s.nextInvoiceNo=Number(f.nextInvoiceNo.value)||1; state.business.nextInvoiceNo=s.nextInvoiceNo; s.proformaPrefix=f.proformaPrefix.value; s.nextProformaNo=Number(f.nextProformaNo.value)||1; s.paymentTerms=f.paymentTerms.value; s.invoiceHeader=f.invoiceHeader.value; s.invoiceFooter=f.invoiceFooter.value; ['showLogo','showBankInfo','showTax','showDiscount','showSignature'].forEach(k=>s[k]=!!f[k].checked); save(); showToast('تنظیمات فاکتور ذخیره شد'); renderSettings(); return false; }
function saveFinancialSettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; state.business.currency=f.currency.value.trim()||'تومان'; s.decimalPlaces=Math.max(0,Math.min(4,Number(f.decimalPlaces.value)||0)); s.defaultTaxRate=Number(f.defaultTaxRate.value)||0; s.defaultReceiveAccountId=f.defaultReceiveAccountId.value||null; s.defaultPayAccountId=f.defaultPayAccountId.value||null; state.business.taxRate=s.defaultTaxRate; save(); showToast('تنظیمات مالی ذخیره شد'); renderSettings(); return false; }
function saveDateSettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; s.dateCalendar=f.dateCalendar.value; s.fiscalYearStartMonth=Number(f.fiscalYearStartMonth.value)||1; save(); showToast('تنظیمات تاریخ ذخیره شد'); renderSettings(); return false; }
function saveTaxSettings(ev){ ev.preventDefault(); const f=ev.target; state.business.taxRate=Number(f.taxRate.value)||0; state.settings.defaultTaxRate=Number(f.defaultTaxRate2.value)||0; state.settings.showTax=!!f.showTax.checked; save(); showToast('تنظیمات مالیات ذخیره شد'); renderSettings(); return false; }
function savePrintSettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; s.paperSize=f.paperSize.value; s.printMargin=f.printMargin.value; s.showLogo=!!f.showLogo.checked; s.showBankInfo=!!f.showBankInfo.checked; s.showSignature=!!f.showSignature.checked; save(); showToast('تنظیمات چاپ ذخیره شد'); renderSettings(); return false; }
function saveSecuritySettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; const pin=f.lockPin.value.trim(); if(f.lockEnabled.checked && !/^\d{4,6}$/.test(pin)){showToast('PIN باید ۴ تا ۶ رقم باشد');return false;} s.lockEnabled=!!f.lockEnabled.checked; s.lockPin=pin; s.autoLockMinutes=Math.max(0,Number(f.autoLockMinutes.value)||0); save(); showToast('تنظیمات امنیت ذخیره شد'); renderSettings(); return false; }
function saveAppearanceSettings(ev){ ev.preventDefault(); const f=ev.target,s=state.settings; s.theme=f.theme.value; s.compactTables=!!f.compactTables.checked; document.documentElement.setAttribute('data-theme',s.theme==='system'?'':s.theme); save(); showToast('ظاهر ذخیره شد'); renderSettings(); return false; }
function addLocalUser(){ const name=prompt('نام کاربر:'); if(!name)return; const role=prompt('نقش کاربر (مدیر/حسابدار/اپراتور/مشاهده):','حسابدار')||'مشاهده'; state.appUsers.push({id:uid(),name,role,active:true}); save(); renderSettings(); }
function deleteLocalUser(i){ if(!confirm('این کاربر حذف شود؟'))return; state.appUsers.splice(i,1); save(); renderSettings(); }
function downloadBackup(){ const data=JSON.stringify({app:'Daftar Accounting',version:3,createdAt:new Date().toISOString(),state},null,2); const blob=new Blob([data],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='daftar-backup-'+Date.now()+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); localStorage.setItem('daftar_last_backup',new Date().toLocaleString('fa-IR')); showToast('پشتیبان تهیه شد'); }
function restoreBackup(ev){ const file=ev.target.files[0]; if(!file)return; const rd=new FileReader(); rd.onload=()=>{ try{const obj=JSON.parse(rd.result); const incoming=obj.state||obj; if(!incoming || !incoming.business || !Array.isArray(incoming.invoices)) throw new Error('invalid'); if(!confirm('اطلاعات فعلی با Backup جایگزین شود؟'))return; state=incoming; migrate(); save(); showToast('Backup بازیابی شد'); renderPage();}catch(e){showToast('فایل Backup معتبر نیست');} }; rd.readAsText(file); ev.target.value=''; }
function csvEscape(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
function downloadCSV(filename,rows){ const csv='\\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\\r\\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function exportCSVCustomers(){ downloadCSV('customers.csv',[['نام','تلفن','آدرس','کد اقتصادی'],...state.customers.map(c=>[c.name,c.phone,c.address,c.economicCode])]); }
function exportCSVInvoices(){ downloadCSV('invoices.csv',[['شماره','تاریخ','مشتری','مبلغ','پرداخت‌شده','مانده'],...state.invoices.map(i=>[i.number,jStrShort(i.date),getCustomer(i.customerId)?.name||'',i.grandTotal,invoicePaidAmount(i),invoiceRemaining(i)])]); }

/* =========================================================
   مودال
   ========================================================= */
function openModal(innerHtml){
  document.getElementById('modalRoot').innerHTML='<div class="modal-overlay" onclick="if(event.target===this) closeModal()"><div class="modal">'+innerHtml+'</div></div>';
}
function closeModal(){ document.getElementById('modalRoot').innerHTML=''; }

/* =========================================================
   رندر اصلی صفحه
   ========================================================= */
function renderPage(){
  renderShell();
  if(route.page==='dashboard') renderDashboard();
  else if(route.page==='invoices') renderInvoices();
  else if(route.page==='invoice-form') renderInvoiceForm();
  else if(route.page==='invoice-view') renderInvoiceView(route.id);
  else if(route.page==='customers') renderCustomers();
  else if(route.page==='customer-ledger') renderCustomerLedger(route.id);
  else if(route.page==='services') renderServices();
  else if(route.page==='checks') renderChecks();
  else if(route.page==='receivables-payables') renderReceivablesPayables();
  else if(route.page==='rp-form') { openReceivablePayableForm(route.id ? (state.receivablesPayables.find(x=>x.id===route.id)||{}).direction || 'receivable' : 'receivable', route.id); }
  else if(route.page==='rp-view') renderRPView(route.id);
  else if(route.page==='accounts') renderAccounts();
  else if(route.page==='account-ledger') renderAccountLedger(route.id);
  else if(route.page==='expenses') renderExpenses();
  else if(route.page==='reports') renderReports();
  else if(route.page==='categories') renderCategories();
  else if(route.page==='activity') renderActivity();
  else if(route.page==='settings') renderSettings();
}


/* =========================================================
   ارتقای جامع حسابداری خدماتی - نسخه حرفه‌ای
   ========================================================= */
function ensureProState(){
  if(!state.suppliers) state.suppliers=[];
  if(!state.projects) state.projects=[];
  if(!state.quotations) state.quotations=[];
  if(!state.journalEntries) state.journalEntries=[];
  if(!state.stockMoves) state.stockMoves=[];
  if(!state.purchaseInvoices) state.purchaseInvoices=[];
  if(!state.purchaseReturns) state.purchaseReturns=[];
  if(!state.business.nextPurchaseReturnNo) state.business.nextPurchaseReturnNo=1;
  if(!state.business.nextPurchaseNo) state.business.nextPurchaseNo=1;
  if(!state.taxRecords) state.taxRecords=[];
  if(!state.appUsers) state.appUsers=[{id:uid(),name:'مدیر سیستم',role:'admin',active:true}];
  if(!state.chartAccounts) state.chartAccounts=defaultChartAccounts();
  if(!state.business.fiscalYear) state.business.fiscalYear=todayJalali().jy;
  save();
}
function defaultChartAccounts(){ return [
 {id:uid(),code:'101',name:'صندوق',type:'asset',parent:null},
 {id:uid(),code:'102',name:'بانک',type:'asset',parent:null},
 {id:uid(),code:'103',name:'حساب‌های دریافتنی',type:'asset',parent:null},
 {id:uid(),code:'104',name:'موجودی کالا',type:'asset',parent:null},
 {id:uid(),code:'201',name:'حساب‌های پرداختنی',type:'liability',parent:null},
 {id:uid(),code:'202',name:'مالیات پرداختنی',type:'liability',parent:null},
 {id:uid(),code:'301',name:'سرمایه',type:'equity',parent:null},
 {id:uid(),code:'401',name:'درآمد خدمات',type:'revenue',parent:null},
 {id:uid(),code:'402',name:'سایر درآمدها',type:'revenue',parent:null},
 {id:uid(),code:'501',name:'هزینه خدمات',type:'expense',parent:null},
 {id:uid(),code:'502',name:'حقوق و دستمزد',type:'expense',parent:null},
 {id:uid(),code:'503',name:'اجاره',type:'expense',parent:null},
 {id:uid(),code:'504',name:'قبوض و اینترنت',type:'expense',parent:null},
 {id:uid(),code:'505',name:'بازاریابی و تبلیغات',type:'expense',parent:null},
 {id:uid(),code:'506',name:'سایر هزینه‌ها',type:'expense',parent:null}
]; }
function accByCode(code){ return (state.chartAccounts||[]).find(a=>a.code===code); }
function accBalance(code){
  let d=0,c=0; (state.journalEntries||[]).forEach(e=>(e.lines||[]).forEach(l=>{if(l.accountCode===code){d+=Number(l.debit||0);c+=Number(l.credit||0);}}));
  const a=accByCode(code)||{}; return ['asset','expense'].includes(a.type)?d-c:c-d;
}
function partyName(id){ const c=getCustomer(id); if(c)return c.name; const s=(state.suppliers||[]).find(x=>x.id===id); return s?s.name:'—'; }
function fmtDateInput(name,v){ const x=v||todayJalali(); return '<div class="field-row3"><input name="'+name+'J" type="number" min="1300" max="1600" value="'+x.jy+'" placeholder="سال"><input name="'+name+'M" type="number" min="1" max="12" value="'+x.jm+'" placeholder="ماه"><input name="'+name+'D" type="number" min="1" max="31" value="'+x.jd+'" placeholder="روز"></div>'; }
function readDateInput(f,n){ return {jy:Number(f[n+'J'].value),jm:Number(f[n+'M'].value),jd:Number(f[n+'D'].value)}; }
function openProModal(title,body){ openModal('<div class="modal-head"><h3>'+title+'</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+body); }
function saveJournalEntry(ev,id){
 ev.preventDefault(); const f=ev.target; const lines=[]; f.querySelectorAll('.jline').forEach(r=>{const code=r.querySelector('[name=account]').value,d=Number(r.querySelector('[name=debit]').value)||0,c=Number(r.querySelector('[name=credit]').value)||0,desc=r.querySelector('[name=ldesc]').value;if(code&&(d||c))lines.push({accountCode:code,debit:d,credit:c,description:desc});});
 const totalD=lines.reduce((a,x)=>a+x.debit,0),totalC=lines.reduce((a,x)=>a+x.credit,0); if(!lines.length||Math.abs(totalD-totalC)>0.01){showToast('سند باید حداقل یک ردیف داشته باشد و بدهکار و بستانکار برابر باشند');return false;}
 const old=id&&state.journalEntries.find(x=>x.id===id); const e=old||{id:uid()}; e.number=old?old.number:(fpNextJournalNo()); e.date=readDateInput(f,'date'); e.description=f.desc.value.trim()||'ثبت سند'; e.lines=lines; e.status='posted';
 if(!old) state.journalEntries.push(e); logEvent('journal','ثبت سند حسابداری #'+e.number); save(); closeModal(); nav('journals'); return false;
}
function addJournalLine(data={}){ const wrap=document.getElementById('journalLines'); const opts=(state.chartAccounts||[]).map(a=>'<option value="'+a.code+'"'+(data.accountCode===a.code?' selected':'')+'>'+esc(a.code+' - '+a.name)+'</option>').join(''); const row=document.createElement('div');row.className='jline field-row';row.innerHTML='<select name="account">'+opts+'</select><input name="debit" type="number" min="0" value="'+(data.debit||'')+'" placeholder="بدهکار"><input name="credit" type="number" min="0" value="'+(data.credit||'')+'" placeholder="بستانکار"><input name="ldesc" value="'+esc(data.description||'')+'" placeholder="شرح"><button type="button" class="btn btn-ghost btn-danger" onclick="this.parentNode.remove()">×</button>';wrap.appendChild(row); }
function openJournalForm(id){ const e=id?state.journalEntries.find(x=>x.id===id):null; openProModal(e?'ویرایش سند':'ثبت سند حسابداری','<form onsubmit="return saveJournalEntry(event,\''+(id||'')+'\')"><div class="field"><label>تاریخ</label>'+fmtDateInput('date',e&&e.date)+'</div><div class="field"><label>شرح</label><input name="desc" required value="'+esc(e?e.description:'')+'"></div><div id="journalLines"></div><div style="margin:10px 0"><button type="button" class="btn btn-ghost" onclick="addJournalLine()">'+icon('plus')+' افزودن ردیف</button></div><button class="btn btn-brand" type="submit">ثبت سند</button></form>'); if(e)e.lines.forEach(addJournalLine);else{addJournalLine();addJournalLine();} }
function renderJournals(){ let html='<div class="page-head"><div><div class="muted">ثبت دوطرفه بدهکار / بستانکار</div></div><button class="btn btn-brand" onclick="openJournalForm()">'+icon('plus')+' سند جدید</button></div><div class="card"><table><thead><tr><th>شماره</th><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th></th></tr></thead><tbody>';
 (state.journalEntries||[]).slice().sort((a,b)=>b.number-a.number).forEach(e=>{const d=e.lines.reduce((a,l)=>a+l.debit,0);html+='<tr><td>'+fa(e.number)+'</td><td>'+jStrShort(e.date)+'</td><td>'+esc(e.description)+'</td><td class="num">'+money(d)+'</td><td class="num">'+money(d)+'</td><td><button class="btn btn-ghost btn-sm" onclick="openJournalForm(\''+e.id+'\')">ویرایش</button></td></tr>';}); html+='</tbody></table></div>'; if(!(state.journalEntries||[]).length)html=emptyState('invoice','هنوز سندی ثبت نشده','برای شروع اولین سند حسابداری را ثبت کنید','openJournalForm()','ثبت سند'); document.getElementById('content').innerHTML=html; }
function renderChartAccounts(){ let html='<div class="page-head"><div><div class="muted">کدینگ استاندارد حساب‌ها و مانده هر حساب</div></div><button class="btn btn-brand" onclick="openAccountCodeForm()">'+icon('plus')+' حساب جدید</button></div><div class="card"><table><thead><tr><th>کد</th><th>نام حساب</th><th>ماهیت</th><th>مانده</th><th></th></tr></thead><tbody>';
 (state.chartAccounts||[]).forEach(a=>{html+='<tr><td>'+fa(a.code)+'</td><td>'+esc(a.name)+'</td><td>'+esc({asset:'دارایی',liability:'بدهی',equity:'سرمایه',revenue:'درآمد',expense:'هزینه'}[a.type]||a.type)+'</td><td class="num">'+money(accBalance(a.code))+'</td><td><button class="btn btn-ghost btn-sm" onclick="openAccountCodeForm(\''+a.id+'\')">ویرایش</button></td></tr>';}); html+='</tbody></table></div>';document.getElementById('content').innerHTML=html; }
function openAccountCodeForm(id){const a=id?state.chartAccounts.find(x=>x.id===id):null;openProModal(a?'ویرایش حساب':'حساب جدید','<form onsubmit="event.preventDefault();const f=this;const x='+ (a?JSON.stringify(a):'{id:null}') +';x.id=x.id||uid();x.code=f.code.value;x.name=f.name.value;x.type=f.type.value;'+(a?'state.chartAccounts=state.chartAccounts.map(z=>z.id===x.id?x:z);':'state.chartAccounts.push(x);')+'save();closeModal();nav(\'chart-accounts\')"><div class="field"><label>کد</label><input name="code" required value="'+esc(a?a.code:'')+'"></div><div class="field"><label>نام</label><input name="name" required value="'+esc(a?a.name:'')+'"></div><div class="field"><label>ماهیت</label><select name="type">'+['asset','liability','equity','revenue','expense'].map(t=>'<option value="'+t+'"'+(a&&a.type===t?' selected':'')+'>'+({'asset':'دارایی','liability':'بدهی','equity':'سرمایه','revenue':'درآمد','expense':'هزینه'}[t])+'</option>').join('')+'</select></div><button class="btn btn-brand">ذخیره</button></form>'); }
function renderSuppliers(){let html='<div class="page-head"><div class="muted">مدیریت تأمین‌کنندگان و بستانکاران</div><button class="btn btn-brand" onclick="openSupplierForm()">'+icon('plus')+' تأمین‌کننده جدید</button></div><div class="card"><table><thead><tr><th>نام</th><th>تلفن</th><th>کد اقتصادی</th><th>یادداشت</th><th></th></tr></thead><tbody>';(state.suppliers||[]).forEach(s=>html+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.phone||'—')+'</td><td>'+esc(s.economicCode||'—')+'</td><td>'+esc(s.note||'')+'</td><td><button class="btn btn-ghost btn-sm" onclick="openSupplierForm(\''+s.id+'\')">ویرایش</button></td></tr>');html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function openSupplierForm(id){const s=id?state.suppliers.find(x=>x.id===id):null;openProModal(s?'ویرایش تأمین‌کننده':'تأمین‌کننده جدید','<form onsubmit="event.preventDefault();const f=this;const x='+ (s?JSON.stringify(s):'{id:uid()}') +';x.name=f.name.value;x.phone=f.phone.value;x.economicCode=f.ec.value;x.note=f.note.value;'+(s?'state.suppliers=state.suppliers.map(z=>z.id===x.id?x:z);':'state.suppliers.push(x);')+'save();closeModal();nav(\'suppliers\')"><div class="field"><label>نام</label><input name="name" required value="'+esc(s?s.name:'')+'"></div><div class="field"><label>تلفن</label><input name="phone" value="'+esc(s?s.phone:'')+'"></div><div class="field"><label>شناسه/کد اقتصادی</label><input name="ec" value="'+esc(s?s.economicCode:'')+'"></div><div class="field"><label>یادداشت</label><textarea name="note">'+esc(s?s.note:'')+'</textarea></div><button class="btn btn-brand">ذخیره</button></form>');}
function renderProjects(){let html='<div class="page-head"><div class="muted">کنترل درآمد، هزینه و سود هر پروژه</div><button class="btn btn-brand" onclick="openProjectForm()">'+icon('plus')+' پروژه جدید</button></div><div class="card"><table><thead><tr><th>پروژه</th><th>مشتری</th><th>وضعیت</th><th>درآمد</th><th>هزینه</th><th>سود</th></tr></thead><tbody>';(state.projects||[]).forEach(p=>{const inc=state.invoices.filter(i=>i.projectId===p.id&&!i.voided).reduce((a,i)=>a+i.grandTotal,0);const exp=state.expenses.filter(e=>e.projectId===p.id).reduce((a,e)=>a+e.amount,0);html+='<tr><td>'+esc(p.name)+'</td><td>'+esc(partyName(p.customerId))+'</td><td>'+esc(p.status||'فعال')+'</td><td class="num">'+money(inc)+'</td><td class="num">'+money(exp)+'</td><td class="num">'+money(inc-exp)+'</td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function openProjectForm(){openProModal('پروژه جدید','<form onsubmit="event.preventDefault();const f=this;state.projects.push({id:uid(),name:f.name.value,customerId:f.customerId.value||null,status:f.status.value,note:f.note.value});save();closeModal();nav(\'projects\')"><div class="field"><label>نام پروژه</label><input name="name" required></div><div class="field"><label>مشتری</label><select name="customerId"><option value="">بدون مشتری</option>'+state.customers.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')+'</select></div><div class="field"><label>وضعیت</label><select name="status"><option>فعال</option><option>تکمیل‌شده</option><option>متوقف</option></select></div><div class="field"><label>یادداشت</label><textarea name="note"></textarea></div><button class="btn btn-brand">ذخیره</button></form>');}
function renderQuotations(){let html='<div class="page-head"><div class="muted">پیش‌فاکتور و پیشنهاد قیمت</div><button class="btn btn-brand" onclick="openQuotationForm()">'+icon('plus')+' پیش‌فاکتور جدید</button></div><div class="card"><table><thead><tr><th>شماره</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>';(state.quotations||[]).forEach(q=>html+='<tr><td>'+fa(q.number)+'</td><td>'+esc(partyName(q.customerId))+'</td><td>'+jStrShort(q.date)+'</td><td class="num">'+money(q.total)+'</td><td>'+esc(q.status)+'</td></tr>');html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function openQuotationForm(){openProModal('پیش‌فاکتور جدید','<form onsubmit="event.preventDefault();const f=this;const q={id:uid(),number:(Math.max(0,...state.quotations.map(x=>Number(x.number)||0))+1),customerId:f.customerId.value,date:readDateInput(f,\'date\'),total:Number(f.total.value)||0,status:f.status.value,note:f.note.value};state.quotations.push(q);save();closeModal();nav(\'quotations\')"><div class="field"><label>مشتری</label><select name="customerId" required>'+state.customers.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')+'</select></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><div class="field"><label>مبلغ کل</label><input name="total" type="number" required></div><div class="field"><label>وضعیت</label><select name="status"><option>پیش‌نویس</option><option>ارسال‌شده</option><option>تأییدشده</option><option>ردشده</option></select></div><div class="field"><label>یادداشت</label><textarea name="note"></textarea></div><button class="btn btn-brand">ثبت</button></form>');}
function renderStock(){let html='<div class="page-head"><div class="muted">کنترل موجودی خدمات/کالاهای قابل انبار</div><button class="btn btn-brand" onclick="openStockForm()">'+icon('plus')+' ورود/خروج موجودی</button></div><div class="card"><table><thead><tr><th>کالا/خدمت</th><th>موجودی فعلی</th><th>آخرین حرکت</th></tr></thead><tbody>';state.services.filter(s=>s.trackStock).forEach(s=>{const mv=state.stockMoves.filter(m=>m.serviceId===s.id).sort((a,b)=>jToJdn(b.date)-jToJdn(a.date))[0];html+='<tr><td>'+esc(s.name)+'</td><td class="num">'+fa(s.stock||0)+' '+esc(s.unit||'')+'</td><td>'+ (mv?jStrShort(mv.date)+' — '+(mv.type==='in'?'ورود':'خروج'):'—')+'</td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function openStockForm(){openProModal('ثبت حرکت انبار','<form onsubmit="event.preventDefault();const f=this;const sv=state.services.find(x=>x.id===f.serviceId.value);if(!sv)return;const qty=Number(f.qty.value)||0;sv.stock=(sv.stock||0)+(f.type.value===\'in\'?qty:-qty);state.stockMoves.push({id:uid(),serviceId:sv.id,type:f.type.value,qty,date:readDateInput(f,\'date\'),note:f.note.value});save();closeModal();nav(\'stock\')"><div class="field"><label>کالا</label><select name="serviceId">'+state.services.filter(s=>s.trackStock).map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join('')+'</select></div><div class="field"><label>نوع حرکت</label><select name="type"><option value="in">ورود</option><option value="out">خروج</option></select></div><div class="field"><label>تعداد</label><input name="qty" type="number" min="1" required></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><div class="field"><label>شرح</label><textarea name="note"></textarea></div><button class="btn btn-brand">ثبت</button></form>');}
function renderFinancialStatements(){const revenue=accBalance('401')+accBalance('402'),expense=Object.keys({}).length?0:0;const expCodes=(state.chartAccounts||[]).filter(a=>a.type==='expense').reduce((a,x)=>a+accBalance(x.code),0);const assets=(state.chartAccounts||[]).filter(a=>a.type==='asset').reduce((a,x)=>a+accBalance(x.code),0);const liabilities=(state.chartAccounts||[]).filter(a=>a.type==='liability').reduce((a,x)=>a+accBalance(x.code),0);const equity=(state.chartAccounts||[]).filter(a=>a.type==='equity').reduce((a,x)=>a+accBalance(x.code),0);let html='<div class="stat-grid">'+statCard('درآمد',revenue,'income')+statCard('هزینه',expCodes,'expense')+statCard('سود خالص',revenue-expCodes,(revenue-expCodes)>=0?'income':'expense')+statCard('دارایی‌ها',assets,'')+'</div><div class="two-col"><div class="card"><div class="section-title">صورت سود و زیان</div><table><tbody><tr><td>درآمد</td><td class="num">'+money(revenue)+'</td></tr><tr><td>هزینه</td><td class="num">'+money(expCodes)+'</td></tr><tr><th>سود خالص</th><th class="num">'+money(revenue-expCodes)+'</th></tr></tbody></table></div><div class="card"><div class="section-title">ترازنامه</div><table><tbody><tr><td>دارایی‌ها</td><td class="num">'+money(assets)+'</td></tr><tr><td>بدهی‌ها</td><td class="num">'+money(liabilities)+'</td></tr><tr><td>سرمایه</td><td class="num">'+money(equity)+'</td></tr><tr><th>بدهی + سرمایه</th><th class="num">'+money(liabilities+equity)+'</th></tr></tbody></table></div></div>';document.getElementById('content').innerHTML=html;}
function renderTrialBalance(){const rows=(state.chartAccounts||[]).map(a=>{let d=0,c=0;(state.journalEntries||[]).forEach(e=>e.lines.forEach(l=>{if(l.accountCode===a.code){d+=l.debit;c+=l.credit}}));return {a,d,c,b:d-c}}).filter(x=>x.d||x.c);let html='<div class="card"><div class="section-title">تراز آزمایشی</div><table><thead><tr><th>کد</th><th>حساب</th><th>بدهکار</th><th>بستانکار</th></tr></thead><tbody>';rows.forEach(x=>html+='<tr><td>'+fa(x.a.code)+'</td><td>'+esc(x.a.name)+'</td><td class="num">'+money(x.d)+'</td><td class="num">'+money(x.c)+'</td></tr>');const td=rows.reduce((a,x)=>a+x.d,0),tc=rows.reduce((a,x)=>a+x.c,0);html+='<tr><th colspan="2">جمع</th><th class="num">'+money(td)+'</th><th class="num">'+money(tc)+'</th></tr></tbody></table></div>';document.getElementById('content').innerHTML=html;}
function renderTax(){const rate=Number(state.business.taxRate||0);let tax=0;state.invoices.filter(i=>!i.voided).forEach(i=>tax+=Number(i.tax||0));let html='<div class="stat-grid">'+statCard('مالیات فروش ثبت‌شده',tax,'expense')+statCardCount('نرخ مالیات',rate+'%')+'</div><div class="card"><div class="section-title">خلاصه مالیات بر ارزش افزوده</div><table><thead><tr><th>فاکتور</th><th>مشتری</th><th>تاریخ</th><th>مالیات</th></tr></thead><tbody>';state.invoices.filter(i=>!i.voided&&i.tax).forEach(i=>html+='<tr><td>'+fa(i.number)+'</td><td>'+esc(partyName(i.customerId))+'</td><td>'+jStrShort(i.date)+'</td><td class="num">'+money(i.tax)+'</td></tr>');html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function downloadBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='daftar-backup-'+todayJalali().jy+'-'+todayJalali().jm+'-'+todayJalali().jd+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function restoreBackup(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const file=i.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.business||!Array.isArray(x.invoices))throw 0;state=x;ensureProState();renderPage();showToast('پشتیبان با موفقیت بازیابی شد')}catch(e){showToast('فایل پشتیبان معتبر نیست')}};r.readAsText(file)};i.click();}
function exportCSV(rows,name){const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=name+'.csv';a.click();}
function renderProReports(){const t=todayJalali();const sales=state.invoices.filter(i=>!i.voided&&i.date.jy===t.jy).reduce((a,i)=>a+i.grandTotal,0);const paid=allPayments().filter(p=>p.date.jy===t.jy).reduce((a,p)=>a+p.amount,0);const exp=state.expenses.filter(e=>e.date.jy===t.jy).reduce((a,e)=>a+e.amount,0);const ar=state.invoices.reduce((a,i)=>a+invoiceRemaining(i),0)+(state.receivablesPayables||[]).filter(x=>x.direction==='receivable').reduce((a,x)=>a+rpRemaining(x),0);const ap=(state.receivablesPayables||[]).filter(x=>x.direction==='payable').reduce((a,x)=>a+rpRemaining(x),0);let html='<div class="stat-grid">'+statCard('فروش سال جاری',sales,'income')+statCard('دریافت نقدی',paid,'income')+statCard('هزینه سال جاری',exp,'expense')+statCard('مطالبات',ar,'')+statCard('بدهی‌ها',ap,'expense')+'</div><div class="card"><div class="section-title">گزارش گردش مالی</div><table><thead><tr><th>شاخص</th><th>مبلغ</th></tr></thead><tbody><tr><td>فروش</td><td class="num">'+money(sales)+'</td></tr><tr><td>دریافت</td><td class="num">'+money(paid)+'</td></tr><tr><td>هزینه</td><td class="num">'+money(exp)+'</td></tr><tr><td>خالص جریان نقدی</td><td class="num">'+money(paid-exp)+'</td></tr></tbody></table><div style="margin-top:12px"><button class="btn btn-ghost" onclick="exportCSV([[\'شاخص\',\'مبلغ\'],[\'فروش\','+sales+'],[\'دریافت\','+paid+'],[\'هزینه\','+exp+'],[\'مطالبات\','+ar+'],[\'بدهی‌ها\','+ap+']],\'گزارش-مالی\')">خروجی Excel/CSV</button> <button class="btn btn-ghost" onclick="window.print()">چاپ / PDF</button></div></div>';document.getElementById('content').innerHTML=html;}
function renderAdvancedSettings(){let html='<div class="two-col"><div class="card"><div class="section-title">پشتیبان‌گیری</div><p class="muted">تمام اطلاعات این نسخه در مرورگر ذخیره می‌شود.</p><button class="btn btn-brand" onclick="downloadBackup()">'+icon('download')+' دریافت فایل پشتیبان</button> <button class="btn btn-ghost" onclick="restoreBackup()">بازیابی پشتیبان</button></div><div class="card"><div class="section-title">تنظیمات حسابداری</div><form onsubmit="event.preventDefault();state.business.taxRate=Number(this.tax.value)||0;state.business.fiscalYear=Number(this.fy.value)||todayJalali().jy;save();showToast(\'تنظیمات ذخیره شد\')"><div class="field"><label>نرخ مالیات %</label><input name="tax" type="number" min="0" max="100" value="'+Number(state.business.taxRate||0)+'"></div><div class="field"><label>سال مالی</label><input name="fy" type="number" value="'+Number(state.business.fiscalYear||todayJalali().jy)+'"></div><button class="btn btn-brand">ذخیره</button></form></div></div><div class="card" style="margin-top:18px"><div class="section-title">کاربران و سطح دسترسی</div><table><thead><tr><th>کاربر</th><th>نقش</th><th>وضعیت</th></tr></thead><tbody>'+(state.appUsers||[]).map(u=>'<tr><td>'+esc(u.name)+'</td><td>'+esc(u.role==='admin'?'مدیر':'کاربر')+'</td><td>'+ (u.active?'فعال':'غیرفعال')+'</td></tr>').join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html;}
function renderShell(){ const items=[['dashboard','home','داشبورد'],['invoices','invoice','فاکتورها'],['purchase-invoices','invoice','فاکتورهای خرید'],['purchase-returns','invoice','برگشت از خرید'],['quotations','invoice','پیش‌فاکتورها'],['customers','users','مشتریان'],['suppliers','users','تأمین‌کنندگان'],['services','services','خدمات'],['projects','services','پروژه‌ها'],['checks','stamp','چک‌ها'],['receivables-payables','wallet','دریافتنی / پرداختنی'],['accounts','bank','حساب‌ها و صندوق'],['expenses','wallet','هزینه‌ها'],['stock','bank','انبار'],['journals','invoice','اسناد حسابداری'],['chart-accounts','bank','کدینگ حساب‌ها'],['reports','chart','گزارش‌ها'],['financial-statements','chart','صورت‌های مالی'],['trial-balance','chart','تراز آزمایشی'],['tax','chart','مالیات'],['categories','tag','دسته‌بندی‌ها'],['activity','history','تاریخچه تغییرات'],['settings','gear','تنظیمات'],['advanced-settings','gear','پشتیبان و دسترسی']];let active=route.page;if(['invoice-form','invoice-view'].includes(active))active='invoices';if(['purchase-form','purchase-view'].includes(active))active='purchase-invoices';if(['purchase-return-form','purchase-return-view'].includes(active))active='purchase-returns';if(['customer-ledger'].includes(active))active='customers';if(['account-ledger'].includes(active))active='accounts';if(['rp-form','rp-view'].includes(active))active='receivables-payables';document.getElementById('sidebar').innerHTML='<div class="brand"><div class="mark">د</div><div><div class="word">دفتر</div><div class="sub">حسابداری کسب‌وکار خدماتی</div></div></div><nav class="mainnav">'+items.map(it=>'<a class="navlink'+(active===it[0]?' active':'')+'" onclick="nav(\''+it[0]+'\')">'+icon(it[1])+'<span>'+it[2]+'</span></a>').join('')+'</nav><div class="sidebar-foot"><div class="biz-line">'+esc(state.business.name)+'</div><div class="theme-toggle" onclick="toggleTheme()">'+icon('sun')+'<span>حالت روشن/تیره</span></div></div>';const titles={dashboard:'داشبورد',invoices:'فاکتورها','purchase-invoices':'فاکتورهای خرید','purchase-form':route.id?'ویرایش فاکتور خرید':'فاکتور خرید جدید','purchase-view':'مشاهده فاکتور خرید','purchase-returns':'برگشت از خرید','purchase-return-form':route.id?'ویرایش برگشت از خرید':'برگشت از خرید جدید','purchase-return-view':'مشاهده برگشت از خرید','invoice-form':route.id?'ویرایش فاکتور':'فاکتور جدید','invoice-view':'مشاهده فاکتور',quotations:'پیش‌فاکتورها',customers:'مشتریان','customer-ledger':'کارت حساب مشتری',suppliers:'تأمین‌کنندگان',services:'خدمات',projects:'پروژه‌ها',checks:'چک‌ها','receivables-payables':'دریافتنی / پرداختنی','rp-form':'ثبت حساب','rp-view':'جزئیات حساب',accounts:'حساب‌ها و صندوق','account-ledger':'گردش حساب',expenses:'هزینه‌ها',stock:'انبار',journals:'اسناد حسابداری','chart-accounts':'کدینگ حساب‌ها',reports:'گزارش‌ها','financial-statements':'صورت‌های مالی','trial-balance':'تراز آزمایشی',tax:'مالیات',categories:'دسته‌بندی‌ها',activity:'تاریخچه تغییرات',settings:'تنظیمات','advanced-settings':'پشتیبان و دسترسی'};document.getElementById('topbar').innerHTML='<h1>'+(titles[route.page]||'')+'</h1><div class="today">امروز: '+jStr(todayJalali())+'</div>'; }
function renderPage(){ensureProState();renderShell();if(route.page==='dashboard')renderDashboard();else if(route.page==='invoices')renderInvoices();else if(route.page==='purchase-invoices')renderPurchaseInvoices();else if(route.page==='purchase-form')renderPurchaseForm();else if(route.page==='purchase-view')renderPurchaseView(route.id);else if(route.page==='purchase-returns')renderPurchaseReturns();else if(route.page==='purchase-return-form')renderPurchaseReturnForm();else if(route.page==='purchase-return-view')renderPurchaseReturnView(route.id);else if(route.page==='invoice-form')renderInvoiceForm();else if(route.page==='invoice-view')renderInvoiceView(route.id);else if(route.page==='customers')renderCustomers();else if(route.page==='customer-ledger')renderCustomerLedger(route.id);else if(route.page==='services')renderServices();else if(route.page==='projects')renderProjects();else if(route.page==='suppliers')renderSuppliers();else if(route.page==='quotations')renderQuotations();else if(route.page==='checks')renderChecks();else if(route.page==='receivables-payables')renderReceivablesPayables();else if(route.page==='rp-form'){openReceivablePayableForm(route.id?(state.receivablesPayables.find(x=>x.id===route.id)||{}).direction||'receivable':'receivable',route.id)}else if(route.page==='rp-view')renderRPView(route.id);else if(route.page==='accounts')renderAccounts();else if(route.page==='account-ledger')renderAccountLedger(route.id);else if(route.page==='expenses')renderExpenses();else if(route.page==='stock')renderStock();else if(route.page==='journals')renderJournals();else if(route.page==='chart-accounts')renderChartAccounts();else if(route.page==='reports')renderProReports();else if(route.page==='financial-statements')renderFinancialStatements();else if(route.page==='trial-balance')renderTrialBalance();else if(route.page==='tax')renderTax();else if(route.page==='categories')renderCategories();else if(route.page==='activity')renderActivity();else if(route.page==='settings')renderSettings();else if(route.page==='advanced-settings')renderAdvancedSettings();}
loadState();
if(state.settings && state.settings.theme && state.settings.theme!=='system') document.documentElement.setAttribute('data-theme',state.settings.theme);
renderPage();
;

/* ===== Script block 2/26 ===== */
try{
(function(){
'use strict';
/* FINAL PROFESSIONAL PATCH v4 */
function fpEnsure(){
  state=state||{}; state.journalEntries=Array.isArray(state.journalEntries)?state.journalEntries:[];state.accountingVoids=state.accountingVoids&&typeof state.accountingVoids==='object'?state.accountingVoids:{};
  state.chartAccounts=Array.isArray(state.chartAccounts)?state.chartAccounts:[];
  state.suppliers=Array.isArray(state.suppliers)?state.suppliers:[]; state.projects=Array.isArray(state.projects)?state.projects:[];
  state.fixedAssets=Array.isArray(state.fixedAssets)?state.fixedAssets:[]; state.payroll=Array.isArray(state.payroll)?state.payroll:[];
  state.costCenters=Array.isArray(state.costCenters)?state.costCenters:[]; state.budgets=Array.isArray(state.budgets)?state.budgets:[];
  state.currencies=Array.isArray(state.currencies)?state.currencies:[{id:uid(),code:'IRR',name:'تومان',rate:1}];
  state.bankRecon=Array.isArray(state.bankRecon)?state.bankRecon:[]; state.fiscalPeriods=Array.isArray(state.fiscalPeriods)?state.fiscalPeriods:[];
  state.auditLog=Array.isArray(state.auditLog)?state.auditLog:[];
  state.settings=state.settings||{}; state.settings.roles=state.settings.roles||{admin:{all:true},accountant:{journals:true,reports:true,invoices:true,customers:true,expenses:true},viewer:{reports:true}};
  var need=[['101','صندوق','asset'],['102','بانک','asset'],['103','حساب‌های دریافتنی','asset'],['104','موجودی کالا','asset'],['105','دارایی ثابت','asset'],['201','حساب‌های پرداختنی','liability'],['202','مالیات پرداختنی','liability'],['301','سرمایه','equity'],['401','درآمد خدمات','revenue'],['402','سایر درآمدها','revenue'],['501','هزینه خدمات','expense'],['502','حقوق و دستمزد','expense'],['503','اجاره','expense'],['504','قبوض و اینترنت','expense'],['505','بازاریابی و تبلیغات','expense'],['506','سایر هزینه‌ها','expense']];
  need.forEach(function(x){if(!state.chartAccounts.some(function(a){return a.code===x[0]}))state.chartAccounts.push({id:uid(),code:x[0],name:x[1],type:x[2],parent:null});});
}
function fpAudit(action,ref,detail){fpEnsure();state.auditLog.unshift({id:uid(),date:todayJalali(),time:new Date().toLocaleTimeString('fa-IR'),action:action,ref:ref||'',detail:detail||''});if(state.auditLog.length>1000)state.auditLog.length=1000;}
function fpAccount(code){return state.chartAccounts.find(function(a){return a.code===code})}
function fpBalance(code){var d=0,c=0;state.journalEntries.forEach(function(e){if(e.status==='void')return;(e.lines||[]).forEach(function(l){if(l.accountCode===code){d+=+l.debit||0;c+=+l.credit||0}})});var a=fpAccount(code);return a&&['asset','expense'].indexOf(a.type)>=0?d-c:c-d}
function fpPost(sourceType,sourceId,date,desc,lines){fpEnsure();if(!lines||!lines.length)return false;var d=lines.reduce(function(x,l){return x+(+l.debit||0)},0),c=lines.reduce(function(x,l){return x+(+l.credit||0)},0);if(Math.abs(d-c)>0.01)throw new Error('سند نامتوازن');var old=state.journalEntries.find(function(e){return e.sourceType===sourceType&&e.sourceId===sourceId&&e.status!=='void'});if(old){old.date=date;old.description=desc;old.lines=lines;old.status='posted';return old}var n=fpNextJournalNo();var e={id:uid(),number:n,date:date||todayJalali(),description:desc,lines:lines,status:'posted',sourceType:sourceType,sourceId:sourceId,createdAt:new Date().toISOString()};state.journalEntries.push(e);fpAudit('post',sourceType+':'+sourceId,desc);return e}
/* Canonical accounting sync entry point. Before the core engine is initialized, early bootstrap calls are harmless. */
window.fpSyncLedger=function(){
  return typeof window.coreRebuildLedger==='function' ? window.coreRebuildLedger() : [];
};

function fpCashCode(accountId){var a=state.bankAccounts.find(function(x){return x.id===accountId});if(!a)return '101';return a.type==='bank'?'102':'101'}
function fpCheckPeriod(date){fpEnsure();var p=state.fiscalPeriods.find(function(x){return x.jy===date.jy&&x.jm===date.jm});return !p||p.status!=='closed'}
function fpMoney(n){return money(Math.round(+n||0))}
function fpRows(){return state.chartAccounts.map(function(a){var d=0,c=0;state.journalEntries.filter(function(e){return e.status!=='void'}).forEach(function(e){(e.lines||[]).forEach(function(l){if(l.accountCode===a.code){d+=+l.debit||0;c+=+l.credit||0}})});return {a:a,d:d,c:c,b:fpBalance(a.code)}}).filter(function(x){return x.d||x.c})}
function fpRoute(){var p=route.page;return p}
function fpRenderLedger(){var rows=fpRows(),td=rows.reduce(function(a,x){return a+x.d},0),tc=rows.reduce(function(a,x){return a+x.c},0);var html='<div class="page-head"><div><div class="muted">دفتر کل واقعی بر پایه اسناد ثبت‌شده</div></div><button class="btn btn-ghost" onclick="fpSyncLedger();renderPage()">به‌روزرسانی اسناد خودکار</button></div><div class="card"><table><thead><tr><th>کد</th><th>حساب</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr></thead><tbody>';rows.forEach(function(x){html+='<tr><td>'+esc(x.a.code)+'</td><td>'+esc(x.a.name)+'</td><td class="num">'+fpMoney(x.d)+'</td><td class="num">'+fpMoney(x.c)+'</td><td class="num">'+fpMoney(x.b)+'</td></tr>'});html+='<tr><th colspan="2">جمع</th><th class="num">'+fpMoney(td)+'</th><th class="num">'+fpMoney(tc)+'</th><th></th></tr></tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpRenderCashflow(){var ins=0,outs=0;(state.transactions||[]).forEach(function(t){if(t.type==='deposit')ins+=+t.amount||0;else outs+=+t.amount||0});var html='<div class="stat-grid">'+statCard('دریافت نقدی',ins,'income')+statCard('پرداخت نقدی',outs,'expense')+statCard('خالص نقدینگی',ins-outs,'income')+'</div><div class="card"><div class="section-title">صورت جریان وجوه نقد</div><p>دریافت‌ها: <b>'+fpMoney(ins)+'</b></p><p>پرداخت‌ها: <b>'+fpMoney(outs)+'</b></p><p>خالص: <b>'+fpMoney(ins-outs)+'</b></p></div>';document.getElementById('content').innerHTML=html}
function fpRenderAssets(){var html='<div class="page-head"><div class="muted">دارایی ثابت و استهلاک</div><button class="btn btn-brand" onclick="fpAssetForm()">افزودن دارایی</button></div><div class="card"><table><thead><tr><th>دارایی</th><th>بهای تمام‌شده</th><th>استهلاک انباشته</th><th>ارزش دفتری</th></tr></thead><tbody>';state.fixedAssets.forEach(function(a){html+='<tr><td>'+esc(a.name)+'</td><td class="num">'+fpMoney(a.cost)+'</td><td class="num">'+fpMoney(a.depr)+'</td><td class="num">'+fpMoney(a.cost-a.depr)+'</td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpAssetForm(){openProModal('دارایی ثابت','<form onsubmit="event.preventDefault();var f=this;var a={id:uid(),name:f.name.value,cost:+f.cost.value||0,depr:0,life:+f.life.value||1,date:todayJalali()};if(a.cost<=0)return;state.fixedAssets.push(a);save();closeModal();nav(\'fixed-assets\')"><div class="field"><label>نام</label><input name="name" required></div><div class="field"><label>بهای تمام‌شده</label><input name="cost" type="number" required></div><div class="field"><label>عمر مفید (سال)</label><input name="life" type="number" min="1" value="5"></div><button class="btn btn-brand">ثبت</button></form>')}
function fpRenderPayroll(){var total=state.payroll.reduce(function(a,x){return a+(+x.net||0)},0);var html='<div class="page-head"><div class="muted">حقوق و دستمزد</div><button class="btn btn-brand" onclick="fpPayrollForm()">ثبت حقوق</button></div><div class="card"><table><thead><tr><th>کارمند</th><th>دوره</th><th>خالص پرداختی</th><th>وضعیت</th></tr></thead><tbody>';state.payroll.forEach(function(x){html+='<tr><td>'+esc(x.name)+'</td><td>'+esc(x.period)+'</td><td class="num">'+fpMoney(x.net)+'</td><td>'+esc(x.paid?'پرداخت شده':'ثبت شده')+'</td></tr>'});html+='</tbody></table><p>جمع: <b>'+fpMoney(total)+'</b></p></div>';document.getElementById('content').innerHTML=html}
function fpPayrollForm(){openProModal('ثبت حقوق','<form onsubmit="event.preventDefault();var f=this,x={id:uid(),name:f.name.value,period:f.period.value,net:+f.net.value||0,paid:false,date:todayJalali()};if(x.net<=0)return;state.payroll.push(x);save();closeModal();nav(\'payroll\')"><div class="field"><label>نام کارمند</label><input name="name" required></div><div class="field"><label>دوره</label><input name="period" placeholder="مثلاً مهر ۱۴۰۵" required></div><div class="field"><label>خالص حقوق</label><input name="net" type="number" required></div><button class="btn btn-brand">ثبت</button></form>')}
function fpRenderBudget(){var html='<div class="page-head"><div class="muted">بودجه و مقایسه با عملکرد</div><button class="btn btn-brand" onclick="fpBudgetForm()">بودجه جدید</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>بودجه</th><th>عملکرد</th><th>انحراف</th></tr></thead><tbody>';state.budgets.forEach(function(b){var actual=state.expenses.filter(function(e){return e.categoryId===b.categoryId}).reduce(function(a,e){return a+e.amount},0);html+='<tr><td>'+esc(b.name)+'</td><td class="num">'+fpMoney(b.amount)+'</td><td class="num">'+fpMoney(actual)+'</td><td class="num">'+fpMoney(b.amount-actual)+'</td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpBudgetForm(){openProModal('بودجه','<form onsubmit="event.preventDefault();var f=this;state.budgets.push({id:uid(),name:f.name.value,amount:+f.amount.value||0,categoryId:f.cat.value});save();closeModal();nav(\'budgets\')"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>مبلغ</label><input name="amount" type="number" required></div><div class="field"><label>دسته هزینه</label><select name="cat">'+expenseCategoryOptions('')+'</select></div><button class="btn btn-brand">ثبت</button></form>')}
function fpRenderRecon(){var html='<div class="page-head"><div class="muted">مغایرت‌گیری بانکی</div><button class="btn btn-brand" onclick="fpReconForm()">ثبت تراکنش بانکی</button></div><div class="card"><table><thead><tr><th>شرح</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>';state.bankRecon.forEach(function(x){html+='<tr><td>'+esc(x.desc)+'</td><td class="num">'+fpMoney(x.amount)+'</td><td><button class="btn btn-ghost btn-sm" onclick="x=state.bankRecon.find(z=>z.id===\''+x.id+'\');x.cleared=!x.cleared;save();nav(\'bank-recon\')">'+(x.cleared?'تطبیق‌شده':'در انتظار تطبیق')+'</button></td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpReconForm(){openProModal('تراکنش بانکی','<form onsubmit="event.preventDefault();var f=this;state.bankRecon.push({id:uid(),desc:f.desc.value,amount:+f.amount.value||0,cleared:false});save();closeModal();nav(\'bank-recon\')"><div class="field"><label>شرح</label><input name="desc" required></div><div class="field"><label>مبلغ</label><input name="amount" type="number" required></div><button class="btn btn-brand">ثبت</button></form>')}
function fpRenderAudit(){var html='<div class="card"><div class="section-title">گزارش حسابرسی و تغییرات</div><table><thead><tr><th>تاریخ</th><th>عملیات</th><th>مرجع</th><th>شرح</th></tr></thead><tbody>';state.auditLog.forEach(function(x){html+='<tr><td>'+esc(jStrShort(x.date))+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.ref)+'</td><td>'+esc(x.detail)+'</td></tr>'});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpRenderPeriods(){var html='<div class="page-head"><div class="muted">کنترل دوره‌های مالی</div><button class="btn btn-brand" onclick="fpClosePeriod()">بستن ماه جاری</button></div><div class="card"><table><thead><tr><th>دوره</th><th>وضعیت</th></tr></thead><tbody>';var seen={};state.journalEntries.forEach(function(e){var k=e.date.jy+'-'+e.date.jm;if(!seen[k]){var closed=state.fiscalPeriods.some(function(p){return p.jy===e.date.jy&&p.jm===e.date.jm&&p.status==='closed'});seen[k]=1;html+='<tr><td>'+fa(e.date.jy)+'/'+fa(e.date.jm)+'</td><td>'+ (closed?'بسته':'باز')+'</td></tr>'}});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpClosePeriod(){var t=todayJalali();var x=state.fiscalPeriods.find(function(p){return p.jy===t.jy&&p.jm===t.jm});if(x)x.status='closed';else state.fiscalPeriods.push({id:uid(),jy:t.jy,jm:t.jm,status:'closed'});fpAudit('close-period',t.jy+'/'+t.jm,'بستن دوره');save();nav('fiscal-periods')}
function fpRenderCostCenters(){var html='<div class="page-head"><div class="muted">مراکز هزینه</div><button class="btn btn-brand" onclick="var n=prompt(\'نام مرکز هزینه\');if(n){state.costCenters.push({id:uid(),name:n});save();nav(\'cost-centers\')}">مرکز جدید</button></div><div class="card"><table><thead><tr><th>نام مرکز</th></tr></thead><tbody>'+state.costCenters.map(function(x){return '<tr><td>'+esc(x.name)+'</td></tr>'}).join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpRenderCurrencies(){var html='<div class="page-head"><div class="muted">ارزها و نرخ تبدیل</div><button class="btn btn-brand" onclick="var n=prompt(\'نام ارز\');var c=prompt(\'کد\');var r=Number(prompt(\'نرخ نسبت به ارز پایه\',1));if(n&&c){state.currencies.push({id:uid(),name:n,code:c,rate:r||1});save();nav(\'currencies\')}">ارز جدید</button></div><div class="card"><table><thead><tr><th>کد</th><th>ارز</th><th>نرخ</th></tr></thead><tbody>'+state.currencies.map(function(x){return '<tr><td>'+esc(x.code)+'</td><td>'+esc(x.name)+'</td><td class="num">'+fpMoney(x.rate)+'</td></tr>'}).join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html}
function fpRenderAll(){fpEnsure();fpSyncLedger()}
var _oldRenderPage=renderPage;renderPage=function(){fpEnsure();var p=route.page;if(p==='general-ledger')return fpRenderLedger();if(p==='cashflow')return fpRenderCashflow();if(p==='fixed-assets')return fpRenderAssets();if(p==='payroll')return fpRenderPayroll();if(p==='budgets')return fpRenderBudget();if(p==='bank-recon')return fpRenderRecon();if(p==='audit-log')return fpRenderAudit();if(p==='fiscal-periods')return fpRenderPeriods();if(p==='cost-centers')return fpRenderCostCenters();if(p==='currencies')return fpRenderCurrencies();return _oldRenderPage()};
var _oldShell=renderShell;renderShell=function(){_oldShell();var navEl=document.querySelector('.mainnav');if(navEl&&!document.getElementById('fp-extra-nav')){var d=document.createElement('div');d.id='fp-extra-nav';d.innerHTML='<div class="nav-section-title" style="padding:12px 14px 6px;opacity:.6">حسابداری پیشرفته</div>'+[['general-ledger','دفتر کل'],['cashflow','جریان وجوه نقد'],['fixed-assets','دارایی ثابت'],['payroll','حقوق و دستمزد'],['budgets','بودجه'],['bank-recon','مغایرت بانکی'],['cost-centers','مراکز هزینه'],['currencies','ارزها'],['fiscal-periods','دوره‌های مالی'],['audit-log','گزارش حسابرسی']].map(function(x){return '<a class="navlink" onclick="nav(\''+x[0]+'\')"><span>'+x[1]+'</span></a>'}).join('');navEl.appendChild(d)}};
var _oldSaveJournal=saveJournalEntry;saveJournalEntry=function(ev,id){var r=_oldSaveJournal(ev,id);if(r===false){fpSyncLedger();save()}return r};
fpEnsure();fpSyncLedger();
/* Export for later patch IIFEs that call this as a global. */
window.fpAudit=fpAudit;
})();
}catch(e){console.error('app.js block 2/23 failed:',e);}
;

/* ===== Script block 3/26 ===== */
try{
(function(){
'use strict';
/* FINAL ACCOUNTING INTEGRITY PATCH v5 */
function fpEnsure(){
  state=state||{};
  state.journalEntries=Array.isArray(state.journalEntries)?state.journalEntries:[];
  state.chartAccounts=Array.isArray(state.chartAccounts)?state.chartAccounts:[];
  state.suppliers=Array.isArray(state.suppliers)?state.suppliers:[];
  state.projects=Array.isArray(state.projects)?state.projects:[];
  state.fixedAssets=Array.isArray(state.fixedAssets)?state.fixedAssets:[];
  state.payroll=Array.isArray(state.payroll)?state.payroll:[];
  state.costCenters=Array.isArray(state.costCenters)?state.costCenters:[];
  state.budgets=Array.isArray(state.budgets)?state.budgets:[];
  state.currencies=Array.isArray(state.currencies)?state.currencies:[{id:uid(),code:'IRR',name:'تومان',rate:1}];
  state.bankRecon=Array.isArray(state.bankRecon)?state.bankRecon:[];
  state.fiscalPeriods=Array.isArray(state.fiscalPeriods)?state.fiscalPeriods:[];
  state.auditLog=Array.isArray(state.auditLog)?state.auditLog:[];
  state.settings=state.settings||{};
  state.settings.roles=state.settings.roles||{admin:{all:true},accountant:{journals:true,reports:true,invoices:true,customers:true,expenses:true},viewer:{reports:true}};
  var need=[
    ['101','صندوق','asset'],['102','بانک','asset'],['103','حساب‌های دریافتنی','asset'],['104','موجودی کالا','asset'],
    ['105','دارایی ثابت','asset'],['106','استهلاک انباشته دارایی ثابت','asset'],
    ['201','حساب‌های پرداختنی','liability'],['202','مالیات پرداختنی','liability'],['301','سرمایه','equity'],
    ['401','درآمد خدمات','revenue'],['402','سایر درآمدها','revenue'],['501','هزینه خدمات','expense'],
    ['502','حقوق و دستمزد','expense'],['503','اجاره','expense'],['504','قبوض و اینترنت','expense'],
    ['505','بازاریابی و تبلیغات','expense'],['506','سایر هزینه‌ها','expense'],['507','هزینه استهلاک','expense'],['508','تعدیلات انبار','expense'],['601','بهای تمام‌شده کالای فروش‌رفته','expense']
  ];
  need.forEach(function(x){if(!state.chartAccounts.some(function(a){return a.code===x[0]}))state.chartAccounts.push({id:uid(),code:x[0],name:x[1],type:x[2],parent:null});});
  (state.services||[]).forEach(function(x){if(x.costPrice===undefined)x.costPrice=0;});
  (state.fixedAssets||[]).forEach(function(a){if(a.depr===undefined)a.depr=0;if(!a.life)a.life=5;if(!a.accountId)a.accountId=(state.bankAccounts&&state.bankAccounts[0]||{}).id||null;});
  (state.payroll||[]).forEach(function(x){if(x.paid===undefined)x.paid=false;if(!x.payments)x.payments=[];});
  (state.receivablesPayables||[]).forEach(function(r){if(!r.payments)r.payments=[];if(r.paid===undefined)r.paid=0;});
}
function fpAccount(code){return state.chartAccounts.find(function(a){return a.code===code});}
function fpMoney(n){return money(Math.round(+n||0));}
function fpCashCode(accountId){var a=(state.bankAccounts||[]).find(function(x){return x.id===accountId});if(!a)throw new Error('حساب نقدی/بانکی نامعتبر است');return a.type==='bank'?'102':'101';}
function fpCheckPeriod(date){fpEnsure();date=date||todayJalali();var p=state.fiscalPeriods.find(function(x){return x.jy===date.jy&&x.jm===date.jm});return !p||p.status!=='closed';}
function fpRequireOpen(date){if(!fpCheckPeriod(date)){showToast('دوره مالی این تاریخ بسته است و امکان ثبت یا ویرایش وجود ندارد');return false;}return true;}
function fpPost(sourceType,sourceId,date,desc,lines){
  fpEnsure();
  if(!lines||!lines.length)return false;
  var d=lines.reduce(function(x,l){return x+(+l.debit||0)},0),c=lines.reduce(function(x,l){return x+(+l.credit||0)},0);
  if(Math.abs(d-c)>0.01)throw new Error('سند نامتوازن');
  var old=state.journalEntries.find(function(e){return e.sourceType===sourceType&&e.sourceId===sourceId});
  if(old){old.date=date;old.description=desc;old.lines=lines;old.status='posted';old.auto=true;return old;}
  var n=fpNextJournalNo();
  var e={id:uid(),number:n,date:date||todayJalali(),description:desc,lines:lines,status:'posted',sourceType:sourceType,sourceId:sourceId,auto:true,createdAt:new Date().toISOString()};
  state.journalEntries.push(e); return e;
}
/* Manual transactions: require a real counterpart account. */
window.openTransactionForm=function(accountId){var t=todayJalali(),days=jDaysInMonth(t.jy,t.jm);openModal('<div class="modal-head"><h3>ثبت تراکنش دستی</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div><form onsubmit="return saveTransaction(event,\''+accountId+'\')"><div class="field"><label>نوع</label><select name="type"><option value="deposit">واریز</option><option value="withdraw">برداشت</option></select></div><div class="field"><label>حساب مقابل *</label><select required name="counterAccount">'+state.chartAccounts.filter(function(a){return a.code!=='101'&&a.code!=='102'}).map(function(a){return '<option value="'+a.code+'">'+esc(a.code+' - '+a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>مبلغ *</label><input required type="number" min="1" name="amount"></div><div class="field"><label>تاریخ (شمسی)</label><div class="field-row3"><select name="jd">'+range(1,days).map(function(d){return '<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>';}).join('')+'</select><select name="jm">'+J_MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select name="jy">'+range(t.jy-5,t.jy+2).map(function(y){return '<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div></div><div class="field"><label>شرح</label><input type="text" name="description"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">ثبت</button></div></form>');};
window.saveTransaction=function(ev,accountId){ev.preventDefault();var f=ev.target,a=+f.amount.value||0,date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(a<=0||!fpRequireOpen(date))return false;if(!fpAccount(f.counterAccount.value)){showToast('حساب مقابل نامعتبر است');return false;}var t=addTransaction(accountId,date,f.type.value,a,f.description.value.trim(),null,null);t.counterAccountCode=f.counterAccount.value;logEvent('system',(f.type.value==='deposit'?'واریز':'برداشت')+' دستی به مبلغ '+money(a)+' ثبت شد');save();fpSyncLedger();closeModal();renderAccountLedger(accountId);return false;};
/* Strict period guard for cash movements. */
var _addTransactionV5=window.addTransaction;window.addTransaction=function(accountId,date,type,amount,description,relatedType,relatedId){if(!fpRequireOpen(date))return null;return _addTransactionV5(accountId,date,type,amount,description,relatedType,relatedId);};
/* Invoice edits/deletes respect closed periods and never erase a posted invoice with payments. */
var _saveInvoiceDraftV5=window.saveInvoiceDraft;window.saveInvoiceDraft=function(){if(draft&&!fpRequireOpen(draft.date))return;return _saveInvoiceDraftV5();};
var _deleteInvoiceV5=window.deleteInvoice;window.deleteInvoice=function(id){var inv=getInvoice(id);if(inv&&!fpRequireOpen(inv.date))return;var paid=inv?invoicePaidAmount(inv):0;if(paid>0){showToast('فاکتور دارای دریافت ثبت‌شده است؛ به‌جای حذف، آن را باطل کنید');return;}return _deleteInvoiceV5(id);};
/* Expense period guard. */
var _saveExpenseV5=window.saveExpense;window.saveExpense=function(ev,id){var f=ev.target;if(f&&f.jy&&f.jm&&f.jd){var d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;}return _saveExpenseV5(ev,id);};
var _deleteExpenseV5=window.deleteExpense;window.deleteExpense=function(id){var e=state.expenses.find(function(x){return x.id===id});if(e&&!fpRequireOpen(e.date))return;return _deleteExpenseV5(id);};
/* Receivable/payable period guard. */
var _saveRPV5=window.saveReceivablePayable;window.saveReceivablePayable=function(ev,direction,id){var f=ev.target,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;return _saveRPV5(ev,direction,id);};
var _saveRPSV5=window.saveRPSettlement;window.saveRPSettlement=function(ev,id){var f=ev.target,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;return _saveRPSV5(ev,id);};
/* Checks: bounce reverses cash transaction through source state; re-sync handles the journal reversal by removing the cashed state. */
var _cashCheckV5=window.cashCheck;window.cashCheck=function(ev,id){var f=ev.target,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;return _cashCheckV5(ev,id);};
var _bounceCheckV5=window.bounceCheck;window.bounceCheck=function(id){var c=state.checks.find(function(x){return x.id===id});if(c&&!fpRequireOpen(c.cashDate||c.dueDate))return;return _bounceCheckV5(id);};
/* Fixed assets: purchase account/date + explicit monthly depreciation. */
window.fpAssetForm=function(){var t=todayJalali(),days=jDaysInMonth(t.jy,t.jm);openProModal('دارایی ثابت','<form onsubmit="return fpSaveAsset(event)"><div class="field"><label>نام</label><input name="name" required></div><div class="field"><label>بهای تمام‌شده</label><input name="cost" type="number" min="1" required></div><div class="field"><label>عمر مفید (سال)</label><input name="life" type="number" min="1" value="5" required></div><div class="field"><label>پرداخت از حساب</label><select name="accountId">'+state.bankAccounts.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>تاریخ خرید</label><div class="field-row3"><select name="jd">'+range(1,days).map(function(d){return '<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>';}).join('')+'</select><select name="jm">'+J_MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select name="jy">'+range(t.jy-5,t.jy+2).map(function(y){return '<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div></div><button class="btn btn-brand">ثبت دارایی</button></form>');};
window.fpSaveAsset=function(ev){ev.preventDefault();var f=ev.target,date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(date))return false;var cost=+f.cost.value||0;if(cost<=0)return false;state.fixedAssets.push({id:uid(),name:f.name.value.trim(),cost:cost,depr:0,life:+f.life.value||1,date:date,accountId:f.accountId.value,lastDepDate:null});save();fpSyncLedger();closeModal();nav('fixed-assets');return false;};
window.fpPostDepreciation=function(id){var a=state.fixedAssets.find(function(x){return x.id===id});if(!a)return;var t=todayJalali();if(!fpRequireOpen(t))return;var start=jToJdn(a.date),now=jToJdn(t),months=Math.max(0,Math.floor((now-start)/30));var total=Math.min(+a.cost||0,Math.round((+a.cost||0)*months/((+a.life||1)*12)));var add=total-(+a.depr||0);if(add<=0){showToast('استهلاک جدیدی برای این دارایی ثبت نشده است');return;}a.depr=(+a.depr||0)+add;a.lastDepDate=t;save();fpSyncLedger();nav('fixed-assets');};
var _renderAssetsV5=window.fpRenderAssets;window.fpRenderAssets=function(){var html='<div class="page-head"><div class="muted">دارایی ثابت و استهلاک</div><button class="btn btn-brand" onclick="fpAssetForm()">افزودن دارایی</button></div><div class="card"><table><thead><tr><th>دارایی</th><th>بهای تمام‌شده</th><th>استهلاک انباشته</th><th>ارزش دفتری</th><th></th></tr></thead><tbody>';state.fixedAssets.forEach(function(a){html+='<tr><td>'+esc(a.name)+'</td><td class="num">'+fpMoney(a.cost)+'</td><td class="num">'+fpMoney(a.depr)+'</td><td class="num">'+fpMoney((+a.cost||0)-(+a.depr||0))+'</td><td><button class="btn btn-ghost btn-sm" onclick="fpPostDepreciation(\''+a.id+'\')">ثبت استهلاک تا امروز</button></td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
/* Payroll payment cycle. */
window.fpPayPayroll=function(id){var x=state.payroll.find(function(z){return z.id===id});if(!x)return;var rem=(+x.net||0)-(x.payments||[]).reduce(function(a,p){return a+(+p.amount||0)},0);if(rem<=0){showToast('این حقوق قبلاً تسویه شده است');return;}var account=(state.bankAccounts||[])[0];if(!account){showToast('حساب پرداخت وجود ندارد');return;}var d=todayJalali();if(!fpRequireOpen(d))return;x.payments=x.payments||[];var p={id:uid(),amount:rem,accountId:account.id,date:d};x.payments.push(p);x.paid=true;save();fpSyncLedger();nav('payroll');};
window.fpPayrollForm=function(){var t=todayJalali();openProModal('ثبت حقوق','<form onsubmit="event.preventDefault();var f=this,x={id:uid(),name:f.name.value.trim(),period:f.period.value,net:+f.net.value||0,paid:false,date:{jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value},payments:[]};if(x.net<=0||!fpRequireOpen(x.date))return;state.payroll.push(x);save();fpSyncLedger();closeModal();nav(\'payroll\')"><div class="field"><label>نام کارمند</label><input name="name" required></div><div class="field"><label>دوره</label><input name="period" placeholder="مثلاً مهر ۱۴۰۵" required></div><div class="field"><label>خالص حقوق</label><input name="net" type="number" min="1" required></div><div class="field"><label>تاریخ ثبت</label><div class="field-row3"><input name="jy" type="number" value="'+t.jy+'"><input name="jm" type="number" value="'+t.jm+'"><input name="jd" type="number" value="'+t.jd+'"></div></div><button class="btn btn-brand">ثبت</button></form>');};
var _renderPayrollV5=window.fpRenderPayroll;window.fpRenderPayroll=function(){var total=state.payroll.reduce(function(a,x){return a+(+x.net||0)},0);var html='<div class="page-head"><div class="muted">حقوق و دستمزد</div><button class="btn btn-brand" onclick="fpPayrollForm()">ثبت حقوق</button></div><div class="card"><table><thead><tr><th>کارمند</th><th>دوره</th><th>خالص</th><th>وضعیت</th><th></th></tr></thead><tbody>';state.payroll.forEach(function(x){var paid=(x.payments||[]).reduce(function(a,p){return a+(+p.amount||0)},0);html+='<tr><td>'+esc(x.name)+'</td><td>'+esc(x.period)+'</td><td class="num">'+fpMoney(x.net)+'</td><td>'+esc(paid>=x.net?'پرداخت شده':(paid?'بخشی پرداخت شده':'ثبت شده'))+'</td><td>'+(paid<x.net?'<button class="btn btn-ghost btn-sm" onclick="fpPayPayroll(\''+x.id+'\')">پرداخت</button>':'')+'</td></tr>';});html+='</tbody></table><p>جمع: <b>'+fpMoney(total)+'</b></p></div>';document.getElementById('content').innerHTML=html;};
/* Inventory: cost price + negative stock protection + COGS is posted from invoice cost price. */
window.openStockForm=function(){var t=todayJalali(),days=jDaysInMonth(t.jy,t.jm);openProModal('ثبت حرکت انبار','<form onsubmit="event.preventDefault();var f=this,sv=state.services.find(function(x){return x.id===f.serviceId.value}),q=+f.qty.value||0,cost=+f.unitCost.value||0,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value},type=f.type.value;if(!sv||q<=0||!fpRequireOpen(d))return;if(type===\'purchase\'&&cost<=0){showToast(\'برای خرید، بهای واحد باید بیشتر از صفر باشد\');return;}if((type===\'out\'||type===\'adjust-out\')&&(+sv.stock||0)<q){showToast(\'موجودی کافی نیست\');return;}sv.stock=(+sv.stock||0)+((type===\'out\'||type===\'adjust-out\')?-q:q);state.stockMoves.push({id:uid(),serviceId:sv.id,type:type,qty:q,unitCost:+f.unitCost.value||0,accountId:f.accountId.value||null,date:d,note:f.note.value});save();fpSyncLedger();closeModal();nav(\'stock\')"><div class="field"><label>کالا</label><select name="serviceId">'+state.services.filter(function(s){return s.trackStock}).map(function(s){return '<option value="'+s.id+'">'+esc(s.name)+'</option>';}).join('')+'</select></div><div class="field"><label>نوع حرکت</label><select name="type"><option value="purchase">خرید کالا</option><option value="out">خروج / فروش</option><option value="in">ورود تعدیلی</option><option value="adjust-out">خروج تعدیلی</option></select></div><div class="field"><label>تعداد</label><input name="qty" type="number" min="1" required></div><div class="field"><label>بهای واحد</label><input name="unitCost" type="number" min="0.01" step="0.01" value="0" required></div><div class="field"><label>حساب پرداخت (برای خرید، اختیاری)</label><select name="accountId"><option value="">خرید نسیه / پرداختنی</option>'+state.bankAccounts.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>تاریخ</label><div class="field-row3"><input name="jy" type="number" value="'+t.jy+'"><input name="jm" type="number" value="'+t.jm+'"><input name="jd" type="number" value="'+t.jd+'"></div></div><div class="field"><label>شرح</label><textarea name="note"></textarea></div><button class="btn btn-brand">ثبت</button></form>');};
/* Service cost price field migration is enough for COGS; expose it in service form through an extra field when saving is difficult, so existing price remains sales price. */
var _saveServiceV5=window.saveService;window.saveService=function(ev,id){var r=_saveServiceV5(ev,id);var sv=id&&getService(id);if(sv&&ev.target.costPrice)sv.costPrice=+ev.target.costPrice.value||0;else if(!id&&ev.target.costPrice){var latest=state.services[state.services.length-1];if(latest)latest.costPrice=+ev.target.costPrice.value||0;}save();return r;};
/* Extend service form by inserting cost price input into existing form if possible. */
var _openServiceFormV5=window.openServiceForm;window.openServiceForm=function(id){_openServiceFormV5(id);var modal=document.querySelector('.modal');if(modal&&!modal.querySelector('[name="costPrice"]')){var form=modal.querySelector('form');if(form){var d=document.createElement('div');d.className='field';var sv=id?getService(id):null;d.innerHTML='<label>بهای تمام‌شده واحد (برای COGS)</label><input name="costPrice" type="number" min="0" value="'+((sv&&sv.costPrice)||0)+'">';var btn=form.querySelector('.row');form.insertBefore(d,btn||null);}}};
/* Fiscal close uses explicit current period and all major mutation paths check it. */
window.fpClosePeriod=function(){var t=todayJalali();var x=state.fiscalPeriods.find(function(p){return p.jy===t.jy&&p.jm===t.jm});if(x&&x.status==='closed'){showToast('این دوره قبلاً بسته شده است');return;}if(x)x.status='closed';else state.fiscalPeriods.push({id:uid(),jy:t.jy,jm:t.jm,status:'closed'});fpAudit('close-period',t.jy+'/'+t.jm,'بستن دوره');save();nav('fiscal-periods');};
/* Rebuild once after all migrations. */
/* Export for later patch IIFEs (v6+), which call fpEnsure() as a global. */
window.fpEnsure=function(){fpEnsure();state.accountingVoids=state.accountingVoids&&typeof state.accountingVoids==='object'?state.accountingVoids:{};};
fpEnsure();fpSyncLedger();save();
/* Export for later patch IIFEs that call this as a global. */
window.fpAccount=fpAccount;window.fpCheckPeriod=fpCheckPeriod;window.fpMoney=fpMoney;window.fpRequireOpen=fpRequireOpen;
})();

/* FINAL ACCOUNTING INTEGRITY PATCH v6 */
(function(){
  'use strict';
  fpEnsure();

  /* ---------- Core validation ---------- */
  function v6Date(d){ return d&&Number.isFinite(+d.jy)&&Number.isFinite(+d.jm)&&Number.isFinite(+d.jd); }
  function v6SameMonth(a,b){ return a&&b&&+a.jy===+b.jy&&+a.jm===+b.jm; }
  function v6Closed(d){ return (state.fiscalPeriods||[]).some(function(p){return +p.jy===+d.jy&&+p.jm===+d.jm&&p.status==='closed';}); }
  function v6RequireOpen(d){ if(!v6Date(d)||v6Closed(d)){ showToast('این دوره مالی بسته است یا تاریخ نامعتبر است'); return false; } return true; }
  function v6Line(code,debit,credit,description){ return {accountCode:code,debit:+debit||0,credit:+credit||0,description:description||''}; }

  /* ---------- Journal integrity: generated journals are immutable ---------- */
  var _saveJournalEntryV6=window.saveJournalEntry;
  window.saveJournalEntry=function(ev,id){
    var old=id&&state.journalEntries.find(function(x){return x.id===id;});
    if(old && (old.auto || old.sourceType)){
      showToast('سند سیستمی قابل ویرایش نیست؛ برای اصلاح سند معکوس/اصلاحی ثبت کنید');
      return false;
    }
    var f=ev.target, d=readDateInput(f,'date');
    if(!v6RequireOpen(d)) return false;
    return _saveJournalEntryV6(ev,id);
  };

  var _openJournalFormV6=window.openJournalForm;
  window.openJournalForm=function(id){
    var e=id&&state.journalEntries.find(function(x){return x.id===id;});
    if(e && (e.auto||e.sourceType)){
      showToast('این سند توسط سیستم تولید شده و قابل ویرایش نیست');
      return;
    }
    return _openJournalFormV6(id);
  };

  /* ---------- Invoice payment: cash/bank account is mandatory ---------- */
  var _openPaymentFormV6=window.openPaymentForm;
  window.openPaymentForm=function(invoiceId){
    _openPaymentFormV6(invoiceId);
    var modal=document.querySelector('.modal');
    if(!modal) return;
    var sel=modal.querySelector('[name="accountId"]');
    if(sel){
      sel.required=true;
      if(sel.options.length && sel.options[0].value==='') sel.remove(0);
      var lab=sel.parentElement&&sel.parentElement.querySelector('label');
      if(lab) lab.textContent='واریز به حساب *';
    }
  };
  var _savePaymentV6=window.savePayment;
  window.savePayment=function(ev,invoiceId){
    var f=ev.target;
    if(!f.accountId || !f.accountId.value){ showToast('حساب دریافت وجه را انتخاب کنید'); return false; }
    var d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};
    if(!v6RequireOpen(d)) return false;
    return _savePaymentV6(ev,invoiceId);
  };

  /* ---------- Invoice COGS: snapshot cost at sale time ---------- */
  function v6SnapshotInvoiceCosts(inv){
    (inv.items||[]).forEach(function(it){
      if(!it.serviceId)return;
      var sv=getService(it.serviceId);
      if(!sv||!sv.trackStock)return;
      var target=jToJdn(inv.date||todayJalali()),q=0,total=0;
      (state.stockMoves||[]).forEach(function(m){
        if(m.serviceId!==it.serviceId || (m.sourceType==='invoice'&&m.sourceId===inv.id) || jToJdn(m.date)>target)return;
        var qty=+m.qty||0,u=+m.unitCost||0;
        if(qty>0&&u>0&&(m.type==='purchase'||m.type==='in'||m.type==='adjust-in')){q+=qty;total+=qty*u;}
      });
      if(q>0){it.costPriceAtSale=total/q;it.costMethod='moving-average';}
      else{it.costPriceAtSale=null;it.costMethod='unresolved';}
    });
  }
  var _saveInvoiceDraftV6=window.saveInvoiceDraft;
  window.saveInvoiceDraft=function(){
    if(draft && !v6RequireOpen(draft.date)) return;
    var before=draft&&draft.id?getInvoice(draft.id):null;
    var r=_saveInvoiceDraftV6();
    if(r===false) return r;
    var inv=draft&&draft.id?before:null;
    if(!inv && state.invoices && state.invoices.length) inv=state.invoices[state.invoices.length-1];
    if(inv){ v6SnapshotInvoiceCosts(inv); save(); }
    if(r!==false && typeof fpSyncLedger==='function'){ try{fpSyncLedger();}catch(e){ state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'invoice-save-sync',sourceId:inv.id,error:e.message}]); } }
    return r;
  };

  /* ---------- Bank/cash transfers: allow 101/102 as counterpart ---------- */
  window.openTransactionForm=function(accountId){
    var t=todayJalali(),days=jDaysInMonth(t.jy,t.jm);
    var opts=state.chartAccounts.filter(function(a){return a.code!=='101'&&a.code!=='102'||a.code==='101'||a.code==='102';}).map(function(a){return '<option value="'+a.code+'">'+esc(a.code+' - '+a.name)+'</option>';}).join('');
    openModal('<div class="modal-head"><h3>ثبت تراکنش دستی</h3><button class="btn btn-ghost icon-btn" onclick="closeModal()">'+icon('x')+'</button></div>'+
      '<form onsubmit="return saveTransaction(event,\''+accountId+'\')">'+
      '<div class="field"><label>نوع</label><select name="type"><option value="deposit">واریز</option><option value="withdraw">برداشت</option></select></div>'+
      '<div class="field"><label>حساب مقابل *</label><select required name="counterAccount">'+opts+'</select></div>'+
      '<div class="field"><label>مبلغ *</label><input required type="number" min="1" name="amount"></div>'+
      '<div class="field"><label>تاریخ</label><div class="field-row3"><select name="jd">'+range(1,days).map(function(d){return '<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>';}).join('')+'</select><select name="jm">'+J_MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select name="jy">'+range(t.jy-5,t.jy+2).map(function(y){return '<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div></div>'+
      '<div class="field"><label>شرح</label><input type="text" name="description"></div>'+
      '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="closeModal()">انصراف</button><button type="submit" class="btn btn-brand">ثبت</button></div></form>');
  };

  /* ---------- Expense payable settlement: give every unpaid expense a settlement path ---------- */
  window.fpPayExpense=function(id){
    var e=state.expenses.find(function(x){return x.id===id;});
    if(!e) return;
    if(e.accountId){ showToast('این هزینه هنگام ثبت پرداخت شده است'); return; }
    var amt=+e.amount||0;
    var already=(e.payments||[]).reduce(function(a,p){return a+(+p.amount||0)},0);
    var rem=amt-already;
    if(rem<=0){showToast('این هزینه تسویه شده است');return;}
    var a=(state.bankAccounts||[])[0];
    if(!a){showToast('حساب پرداخت وجود ندارد');return;}
    var d=todayJalali(); if(!v6RequireOpen(d))return;
    e.payments=e.payments||[];
    e.payments.push({id:uid(),amount:rem,accountId:a.id,date:d});
    save();fpSyncLedger();
    if(typeof renderExpenses==='function') renderExpenses(); else nav('expenses');
  };
  var _renderExpensesV6=window.renderExpenses;
  if(_renderExpensesV6) window.renderExpenses=function(){
    _renderExpensesV6();
    document.querySelectorAll('[data-expense-pay]').forEach(function(b){b.addEventListener('click',function(){fpPayExpense(this.getAttribute('data-expense-pay'));});});
  };

  /* ---------- Fixed assets: allow payable purchase instead of forcing cash ---------- */
  window.fpAssetForm=function(){
    var t=todayJalali(),days=jDaysInMonth(t.jy,t.jm);
    openProModal('دارایی ثابت','<form onsubmit="return fpSaveAsset(event)"><div class="field"><label>نام</label><input name="name" required></div><div class="field"><label>بهای تمام‌شده</label><input name="cost" type="number" min="1" required></div><div class="field"><label>عمر مفید (سال)</label><input name="life" type="number" min="1" value="5" required></div><div class="field"><label>روش تأمین</label><select name="accountId"><option value="">خرید نسیه / پرداختنی</option>'+state.bankAccounts.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>تاریخ خرید</label><div class="field-row3"><select name="jd">'+range(1,days).map(function(d){return '<option value="'+d+'"'+(d===t.jd?' selected':'')+'>'+fa(d)+'</option>';}).join('')+'</select><select name="jm">'+J_MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===t.jm?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select name="jy">'+range(t.jy-5,t.jy+2).map(function(y){return '<option value="'+y+'"'+(y===t.jy?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div></div><button class="btn btn-brand">ثبت دارایی</button></form>');
  };
  window.fpSaveAsset=function(ev){
    ev.preventDefault();var f=ev.target,date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!v6RequireOpen(date))return false;var cost=+f.cost.value||0;if(cost<=0)return false;
    state.fixedAssets.push({id:uid(),name:f.name.value.trim(),cost:cost,depr:0,life:+f.life.value||1,date:date,accountId:f.accountId.value||null,lastDepDate:null});save();fpSyncLedger();closeModal();nav('fixed-assets');return false;
  };

  /* ---------- Basic accounting health checker ---------- */
  window.fpAccountingHealth=function(){
    var d=0,c=0,errors=[];
    (state.journalEntries||[]).forEach(function(e){
      var ed=0,ec=0;(e.lines||[]).forEach(function(l){ed+=+l.debit||0;ec+=+l.credit||0;if(!fpAccount(l.accountCode))errors.push('حساب نامعتبر در سند '+e.number+': '+l.accountCode);});
      d+=ed;c+=ec;if(Math.abs(ed-ec)>0.01)errors.push('سند نامتوازن: '+e.number);
    });
    return {balanced:Math.abs(d-c)<=0.01,totalDebit:d,totalCredit:c,errors:errors};
  };

  fpEnsure();
  fpSyncLedger();
  save();
})();


/* FINAL ACCOUNTING INTEGRITY PATCH v7 */
(function(){
  'use strict';

  /* ---------- Expenses: true payable lifecycle ---------- */
  window.saveExpense=function(ev,id){
    ev.preventDefault();
    var f=ev.target, date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};
    if(!fpRequireOpen(date)) return false;
    var old=id&&state.expenses.find(function(x){return x.id===id});
    var paid=old?(old.payments||[]).reduce(function(a,p){return a+(+p.amount||0)},0):0;
    var amount=+f.amount.value||0;
    if(amount<=0){showToast('مبلغ هزینه باید بیشتر از صفر باشد');return false;}
    if(paid>amount){showToast('مبلغ هزینه نمی‌تواند از پرداخت‌های قبلی کمتر باشد');return false;}
    var data={date:date,categoryId:f.categoryId.value,amount:amount,description:f.description.value.trim(),accountId:f.accountId.value||null};
    if(old){
      old.payments=old.payments||[];
      if(old.accountId && old.payments.length){showToast('هزینه‌ای که پرداخت ثبت‌شده دارد، از مسیر پرداخت/ابطال اصلاح شود');return false;}
      Object.assign(old,data);
      old.payments=old.payments||[];
      logEvent('expense','هزینه «'+getCategoryName('expense',data.categoryId)+'» به مبلغ '+money(data.amount)+' ویرایش شد');
    }else{
      data.id=uid();data.payments=[];state.expenses.push(data);
      logEvent('expense','هزینه «'+getCategoryName('expense',data.categoryId)+'» به مبلغ '+money(data.amount)+' ثبت شد');
    }
    save();fpSyncLedger();closeModal();renderExpenses();return false;
  };

  window.renderExpenses=function(){
    var list=[...(state.expenses||[])].sort(function(a,b){return jToJdn(b.date)-jToJdn(a.date)});
    var totalAll=list.reduce(function(a,e){return a+(+e.amount||0)},0);
    var html='<div class="spread"><div class="muted">مجموع هزینه‌های ثبت‌شده: <b class="num">'+money(totalAll)+' '+esc(state.business.currency)+'</b></div><button class="btn btn-brand" onclick="openExpenseForm()">'+icon('plus')+'هزینه جدید</button></div>';
    if(!list.length){html+=emptyState('wallet','هنوز هزینه‌ای ثبت نشده','هزینه‌های کسب‌وکار خود را برای گزارش دقیق سود و زیان ثبت کنید','openExpenseForm()','افزودن هزینه');}
    else{
      html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>دسته‌بندی</th><th>شرح</th><th>مبلغ</th><th>مانده پرداخت</th><th></th></tr></thead><tbody>';
      list.forEach(function(e){
        var paid=(e.payments||[]).reduce(function(a,p){return a+(+p.amount||0)},0);
        var rem=Math.max(0,(+e.amount||0)-paid);
        html+='<tr><td class="num">'+jStrShort(e.date)+'</td><td>'+esc(getCategoryName('expense',e.categoryId))+'</td><td class="muted">'+esc(e.description||'—')+'</td><td class="num">'+money(e.amount)+'</td><td class="num">'+money(rem)+'</td><td><div class="row" style="justify-content:flex-end">'+
          (rem>0&&!e.accountId?'<button class="btn btn-ghost btn-sm" onclick="fpPayExpense(\''+e.id+'\')">پرداخت</button>':'')+
          '<button class="btn btn-ghost icon-btn" onclick="openExpenseForm(\''+e.id+'\')">'+icon('edit')+'</button><button class="btn btn-ghost icon-btn btn-danger" onclick="deleteExpense(\''+e.id+'\')">'+icon('trash')+'</button></div></td></tr>';
      });
      html+='</tbody></table></div>';
    }
    document.getElementById('content').innerHTML=html;
  };

  /* ---------- Safe expense deletion: never delete a paid payable silently ---------- */
  var _deleteExpenseV7=window.deleteExpense;
  window.deleteExpense=function(id){
    var e=state.expenses.find(function(x){return x.id===id});
    if(e && (e.accountId || (e.payments||[]).length)){
      showToast('این هزینه دارای اثر پرداختی است؛ برای حفظ سابقه حسابداری حذف مستقیم مجاز نیست');
      return;
    }
    return _deleteExpenseV7(id);
  };

  /* ---------- Check lifecycle: require cash/bank account on receipt/payment ---------- */
  var _openCashCheckModalV7=window.openCashCheckModal;
  if(_openCashCheckModalV7) window.openCashCheckModal=function(id){
    _openCashCheckModalV7(id);
    var modal=document.querySelector('.modal');
    if(modal){var sel=modal.querySelector('[name="accountId"]');if(sel){sel.required=true;if(sel.options.length&&sel.options[0].value==='')sel.remove(0);}}
  };

  /* ---------- Fixed-asset purchase validation ---------- */
  var _fpSaveAssetV7=window.fpSaveAsset;
  window.fpSaveAsset=function(ev){
    var f=ev.target;if(!f.name.value.trim()){showToast('نام دارایی الزامی است');return false;}
    return _fpSaveAssetV7(ev);
  };

  /* ---------- Global journal health report ---------- */
  window.fpAccountingHealth=function(){
    var d=0,c=0,errors=[],sources={};
    (state.journalEntries||[]).forEach(function(e){
      var ed=0,ec=0;
      (e.lines||[]).forEach(function(l){ed+=+l.debit||0;ec+=+l.credit||0;if(!fpAccount(l.accountCode))errors.push('حساب نامعتبر در سند '+e.number+': '+l.accountCode);});
      d+=ed;c+=ec;
      if(Math.abs(ed-ec)>0.01)errors.push('سند نامتوازن: '+e.number);
      if(e.sourceType){var k=e.sourceType+':'+e.sourceId;if(sources[k])errors.push('منبع تکراری: '+k);sources[k]=1;}
    });
    return {balanced:Math.abs(d-c)<=0.01,totalDebit:d,totalCredit:c,errors:errors};
  };

  fpSyncLedger();save();
})();
}catch(e){console.error('app.js block 3/23 failed:',e);}
;

/* ===== Script block 4/26 ===== */
try{
(function(){
'use strict';
/* =========================================================
   CORE ACCOUNTING ENGINE v9
   Single Ledger authority + immutable system journals + reversal
   Inventory quantity is rebuilt from movements/invoices.
   ========================================================= */
function coreEnsure(){
  state.journalEntries=Array.isArray(state.journalEntries)?state.journalEntries:[];
  state.transactions=Array.isArray(state.transactions)?state.transactions:[];
  state.stockMoves=Array.isArray(state.stockMoves)?state.stockMoves:[];
  state.invoices=Array.isArray(state.invoices)?state.invoices:[];
  state.purchaseInvoices=Array.isArray(state.purchaseInvoices)?state.purchaseInvoices:[];
  state.purchaseReturns=Array.isArray(state.purchaseReturns)?state.purchaseReturns:[];
  state.expenses=Array.isArray(state.expenses)?state.expenses:[];
  state.checks=Array.isArray(state.checks)?state.checks:[];
  state.receivablesPayables=Array.isArray(state.receivablesPayables)?state.receivablesPayables:[];
  state.fixedAssets=Array.isArray(state.fixedAssets)?state.fixedAssets:[];
  state.payroll=Array.isArray(state.payroll)?state.payroll:[];
  state.chartAccounts=Array.isArray(state.chartAccounts)?state.chartAccounts:[];
  var defs=[
    ['101','صندوق','asset'],['102','بانک','asset'],['103','حساب‌های دریافتنی','asset'],['104','موجودی کالا','asset'],
    ['105','دارایی ثابت','asset'],['106','استهلاک انباشته دارایی ثابت','asset'],['107','پیش‌پرداخت‌ها','asset'],['108','اسناد دریافتنی','asset'],
    ['201','حساب‌های پرداختنی','liability'],['202','مالیات پرداختنی','liability'],['203','پیش‌دریافت مشتریان','liability'],['204','اسناد پرداختنی','liability'],
    ['205','حقوق و مزایای پرداختنی','liability'],['206','مالیات خرید / اعتبار مالیاتی','asset'],
    ['301','سرمایه','equity'],['302','سود (زیان) انباشته','equity'],
    ['401','درآمد خدمات','revenue'],['402','سایر درآمدها','revenue'],['403','تخفیفات فروش','revenue'],['404','برگشت از فروش','revenue'],
    ['501','هزینه خدمات','expense'],['502','حقوق و دستمزد','expense'],['503','اجاره','expense'],['504','قبوض و اینترنت','expense'],['505','بازاریابی و تبلیغات','expense'],['506','سایر هزینه‌ها','expense'],['507','هزینه استهلاک','expense'],['508','تعدیلات انبار','expense'],['601','بهای تمام‌شده کالای فروش‌رفته','expense'],['602','تخفیفات خرید','expense'],['603','برگشت از خرید','expense']
  ];
  defs.forEach(function(d){if(!state.chartAccounts.some(function(a){return String(a.code)===d[0];}))state.chartAccounts.push({id:uid(),code:d[0],name:d[1],type:d[2],parent:null,system:true});});
}
function coreAcc(code){coreEnsure();return state.chartAccounts.find(function(a){return String(a.code)===String(code);});}
function coreDateKey(d){d=d||todayJalali();return String(d.jy).padStart(4,'0')+'/'+String(d.jm).padStart(2,'0')+'/'+String(d.jd).padStart(2,'0');}
function coreIsOpen(d){return typeof fpCheckPeriod==='function'?fpCheckPeriod(d):true;}
function coreLine(code,debit,credit,desc,extra){var l={accountCode:String(code),debit:+debit||0,credit:+credit||0};if(desc)l.description=desc;if(extra)Object.assign(l,extra);return l;}
function coreValidLines(lines){return lines.filter(function(l){return coreAcc(l.accountCode)&&((+l.debit||0)>0||(+l.credit||0)>0);});}
/* Journal numbers are permanent: a number is given once per source document and never reused or shifted. */
function fpNextJournalNo(){var mx=+state.journalSeq||0;(state.journalEntries||[]).forEach(function(e){var n=+e.number||0;if(n>mx)mx=n;});state.journalSeq=mx+1;return mx+1;}
window.fpNextJournalNo=fpNextJournalNo;
function corePost(st,id,date,desc,lines,meta){
  coreEnsure();if(state.accountingVoids[st+':'+id])return null; lines=coreValidLines(lines||[]);var d=lines.reduce(function(a,l){return a+(+l.debit||0);},0),c=lines.reduce(function(a,l){return a+(+l.credit||0);},0);
  if(!lines.length||Math.abs(d-c)>0.01)throw new Error('سند نامتوازن یا بدون ردیف');
  var e=state.journalEntries.find(function(x){return x.auto&&x.sourceType===st&&x.sourceId===id;});
  if(e && e.reversed)return e;
  if(e){e.date=date||e.date;e.description=desc;e.lines=lines;e.status='posted';e.auto=true;e.sourceType=st;e.sourceId=id;Object.assign(e,meta||{});return e;}
  state.journalNumbers=state.journalNumbers&&typeof state.journalNumbers==='object'?state.journalNumbers:{};var nk=st+':'+id,n=state.journalNumbers[nk];if(!n){n=fpNextJournalNo();state.journalNumbers[nk]=n;}
  e={id:'je:'+nk,number:n,date:date||todayJalali(),description:desc||'ثبت حسابداری',lines:lines,status:'posted',auto:true,sourceType:st,sourceId:id,createdAt:new Date().toISOString()};Object.assign(e,meta||{});state.journalEntries.push(e);return e;
}
function coreCashLine(accountId,debit,credit,desc){var a=(state.bankAccounts||[]).find(function(x){return x.id===accountId});if(!a)throw new Error('حساب نقد/بانک نامعتبر است');return coreLine(a.type==='bank'?'102':'101',debit,credit,desc,{cashAccountId:a.id});}
function corePartyLine(code,debit,credit,desc,partyId,partyType){return coreLine(code,debit,credit,desc,{partyId:partyId||null,partyType:partyType||null});}
function coreMovingAverageAtSale(serviceId,targetInvoiceId){
  var targetInv=(state.invoices||[]).find(function(i){return i.id===targetInvoiceId;});
  if(!targetInv)return null;
  var targetDate=jToJdn(targetInv.date||todayJalali()),events=[];
  (state.stockMoves||[]).forEach(function(m,idx){
    if(m.voided||m.serviceId!==serviceId||m.sourceType==='invoice')return;
    var d=jToJdn(m.date||todayJalali());if(d>targetDate)return;
    var qty=+m.qty||0;if(qty<=0)return;
    if(m.sourceType==='sale-return'){var rr=(state.saleReturns||[]).find(function(x){return x.id===m.sourceId;});if(rr&&rr.invoiceId===targetInvoiceId)return;events.push({date:d,priority:0,idx:idx,type:'in',qty:qty,unit:0,keepAvg:true});return;}
    if(m.type==='purchase'||m.type==='in'||m.type==='adjust-in'||m.type==='opening'){
      var unit=+m.unitCost||0;
      if(unit>0)events.push({date:d,priority:0,idx:idx,type:'in',qty:qty,unit:unit});
      else events.push({date:d,priority:0,idx:idx,type:'in',qty:qty,unit:0});
    }else if(m.type==='out'||m.type==='adjust-out'){
      events.push({date:d,priority:2,idx:idx,type:'out',qty:qty,unit:0});
    }
  });
  (state.invoices||[]).forEach(function(inv,ii){
    if(inv.voided||inv.id===targetInvoiceId)return;
    var d=jToJdn(inv.date||todayJalali());if(d>targetDate)return;
    var q=0;(inv.items||[]).forEach(function(it){if(it.serviceId===serviceId)q+=+it.qty||0;});
    if(q>0)events.push({date:d,priority:1,idx:ii,type:'sale',qty:q,unit:0});
  });
  events.sort(function(a,b){return a.date-b.date||a.priority-b.priority||a.idx-b.idx;});
  var qty=0,value=0;
  for(var i=0;i<events.length;i++){
    var e=events[i];
    if(e.type==='in'){
      var before=qty;qty+=e.qty;if(e.keepAvg){if(before>0)value+=e.qty*(value/before);}else if(e.unit>0)value+=e.qty*e.unit;
    }else{
      if(e.qty<=qty&&qty>0){var avg=value/qty;value-=e.qty*avg;qty-=e.qty;}
      else if(e.qty>0){qty-=e.qty;if(qty<0)qty=0;value=qty>0?Math.max(0,value):0;}
    }
  }
  return qty>0?value/qty:null;
}
function coreStampCosts(){
  (state.invoices||[]).forEach(function(inv){
    if(inv.voided)return;
    (inv.items||[]).forEach(function(it){
      if(!it.serviceId)return;
      var sv=getService(it.serviceId);if(!sv||!sv.trackStock)return;
      var avg=coreMovingAverageAtSale(it.serviceId,inv.id);
      if(avg!=null&&avg>0){it.costPriceAtSale=avg;it.costMethod='moving-average';}
      else{it.costPriceAtSale=null;it.costMethod='unresolved';}
    });
  });
}
function coreRebuildStock(){
  var qty={};
  /* Invoice sales are represented by explicit linked stock movements. This removes the old
     dual-source calculation where invoices and stockMoves could both reduce stock. */
  var invById={};
  (state.invoices||[]).forEach(function(inv){invById[inv.id]=inv;});
  (state.stockMoves||[]).forEach(function(m){
    if(m.sourceType==='invoice')m.voided=!invById[m.sourceId]||!!invById[m.sourceId].voided;
  });
  /* Purchase invoices are represented by explicit linked stock-in movements. */
  var pinvById={};
  (state.purchaseInvoices||[]).forEach(function(inv){pinvById[inv.id]=inv;});
  (state.stockMoves||[]).forEach(function(m){
    if(m.sourceType==='purchase-invoice')m.voided=!pinvById[m.sourceId]||!!pinvById[m.sourceId].voided;
  });
  (state.purchaseInvoices||[]).forEach(function(inv){
    var existing={};
    (state.stockMoves||[]).filter(function(m){return m.sourceType==='purchase-invoice'&&m.sourceId===inv.id;}).forEach(function(m){existing[m.sourceKey||m.id]=m;});
    var seen={};
    (inv.items||[]).forEach(function(it,idx){
      if(!it.serviceId)return;
      var sv=getService(it.serviceId);if(!sv||!sv.trackStock)return;
      var key=String(it.key||idx),moveId=inv.id+':stock:'+key,m=existing[moveId]||existing[key];
      if(!m){m={id:moveId,serviceId:it.serviceId,type:'purchase',qty:+it.qty||0,unitCost:+it.unitCost||0,date:inv.date,sourceType:'purchase-invoice',sourceId:inv.id,sourceKey:moveId,supplierId:inv.supplierId||null,note:'خرید بابت فاکتور خرید #'+(inv.number||'')};state.stockMoves.push(m);}
      m.id=moveId;m.sourceType='purchase-invoice';m.sourceId=inv.id;m.sourceKey=moveId;m.serviceId=it.serviceId;m.type='purchase';m.qty=+it.qty||0;var _pq=+it.qty||0,_pg=+it.unitCost||0,_pd=+it.discount||0;m.unitCost=_pq>0?Math.max(0,(_pq*_pg-_pd)/_pq):0;m.date=inv.date;m.supplierId=inv.supplierId||null;m.voided=!!inv.voided;seen[moveId]=1;
    });
    (state.stockMoves||[]).forEach(function(m){if(m.sourceType==='purchase-invoice'&&m.sourceId===inv.id&&m.sourceKey&&!seen[m.sourceKey])m.voided=true;});
  });

  (state.invoices||[]).forEach(function(inv){
    var existing={};
    (state.stockMoves||[]).filter(function(m){return m.sourceType==='invoice'&&m.sourceId===inv.id;}).forEach(function(m){existing[m.sourceKey||m.id]=m;});
    var seen={};
    (inv.items||[]).forEach(function(it,idx){
      if(!it.serviceId)return;
      var sv=getService(it.serviceId);if(!sv||!sv.trackStock)return;
      var key=String(it.key||idx),moveId=inv.id+':stock:'+key,m=existing[moveId]||existing[key];
      if(!m){m={id:moveId,serviceId:it.serviceId,type:'out',qty:+it.qty||0,unitCost:it.costPriceAtSale!=null?+it.costPriceAtSale:0,date:inv.date,sourceType:'invoice',sourceId:inv.id,sourceKey:moveId,note:'خروج بابت فاکتور #'+(inv.number||'')};state.stockMoves.push(m);}
      m.id=moveId;m.sourceType='invoice';m.sourceId=inv.id;m.sourceKey=moveId;m.serviceId=it.serviceId;m.type='out';m.qty=+it.qty||0;m.date=inv.date;m.unitCost=it.costPriceAtSale!=null?+it.costPriceAtSale:null;m.voided=!!inv.voided;seen[moveId]=1;
    });
    (state.stockMoves||[]).forEach(function(m){if(m.sourceType==='invoice'&&m.sourceId===inv.id&&m.sourceKey&&!seen[m.sourceKey])m.voided=true;});
  });
  /* Purchase returns are represented by linked stock-out movements. */
  var prById={};(state.purchaseReturns||[]).forEach(function(r){prById[r.id]=r;});
  (state.stockMoves||[]).forEach(function(m){if(m.sourceType==='purchase-return')m.voided=!prById[m.sourceId]||!!prById[m.sourceId].voided;});
  (state.purchaseReturns||[]).forEach(function(r){
    var existing={};(state.stockMoves||[]).filter(function(m){return m.sourceType==='purchase-return'&&m.sourceId===r.id;}).forEach(function(m){existing[m.sourceKey||m.id]=m;});
    var seen={};
    (r.items||[]).forEach(function(it,idx){
      if(!it.serviceId)return;var key=String(it.key||idx),moveId=r.id+':stock:'+key,m=existing[moveId]||existing[key];
      if(!m){m={id:moveId,serviceId:it.serviceId,type:'out',qty:+it.qty||0,unitCost:+it.unitCost||0,date:r.date,sourceType:'purchase-return',sourceId:r.id,sourceKey:moveId,purchaseInvoiceId:r.purchaseInvoiceId||null,note:'برگشت از خرید #'+(r.number||'')};state.stockMoves.push(m);}
      m.id=moveId;m.sourceType='purchase-return';m.sourceId=r.id;m.sourceKey=moveId;m.serviceId=it.serviceId;m.type='out';m.qty=+it.qty||0;m.unitCost=+it.unitCost||0;m.date=r.date;m.purchaseInvoiceId=r.purchaseInvoiceId||null;m.voided=!!r.voided;seen[moveId]=1;
    });
    (state.stockMoves||[]).forEach(function(m){if(m.sourceType==='purchase-return'&&m.sourceId===r.id&&m.sourceKey&&!seen[m.sourceKey])m.voided=true;});
  });
  (state.services||[]).forEach(function(s){
    if(!s.trackStock||s.openingStockMigrated)return;s.openingStockMigrated=true;
    var q=+s.stock||0,has=(state.stockMoves||[]).some(function(m){return m.serviceId===s.id;});
    if(q>0&&!has)state.stockMoves.push({id:'open:'+s.id,serviceId:s.id,type:'opening',qty:q,unitCost:+s.costPrice||0,date:todayJalali(),note:'موجودی افتتاحیه'});
  });
  (state.stockMoves||[]).forEach(function(m){
    if(m.voided)return;
    var q=+m.qty||0;if(!m.serviceId||!q)return;
    var sign=(m.type==='out'||m.type==='adjust-out')?-1:1;
    qty[m.serviceId]=(qty[m.serviceId]||0)+sign*q;
  });
  (state.services||[]).forEach(function(s){if(s.trackStock)s.stock=qty[s.id]||0;});
  return qty;
}
function coreInvoiceCogs(inv){
  var c=0;
  if(!inv||inv.voided)return 0;
  (inv.items||[]).forEach(function(it){
    var sv=it.serviceId&&getService(it.serviceId);
    if(!sv||!sv.trackStock)return;
    var unit=it.costPriceAtSale!=null?+it.costPriceAtSale:0;
    if(it.costPriceAtSale==null){
      var avg=coreMovingAverageAtSale(it.serviceId,inv.id);
      if(avg!=null&&avg>0){unit=avg;it.costPriceAtSale=avg;it.costMethod='moving-average';}
      else{
        it.costPriceAtSale=null;it.costMethod='unresolved';
        state.__accountingWarnings=(state.__accountingWarnings||[]).concat([{sourceType:'invoice-cogs',sourceId:inv.id,itemKey:it.key||null,message:'بهای تاریخی کالا برای محاسبه بهای تمام‌شده پیدا نشد.'}]);
        return;
      }
    }
    if(unit>0)c+=unit*(+it.qty||0);
  });
  return c;
}
function coreExpenseCode(e){if(e.accountCode&&coreAcc(e.accountCode))return String(e.accountCode);var n=getCategoryName('expense',e.categoryId)||'';if(/حقوق/.test(n))return '502';if(/اجاره/.test(n))return '503';if(/قبوض|اینترنت/.test(n))return '504';if(/بازاریابی|تبلیغات/.test(n))return '505';return '506';}
function coreRebuildLedger(){
  coreEnsure();(window.coreRebuildStock||coreRebuildStock)();coreStampCosts();(window.coreRebuildStock||coreRebuildStock)();
  state.journalEntries=state.journalEntries.filter(function(e){return !e.auto || e.reversed || e.status==='reversed';});
  var errors=[];function post(st,id,date,desc,lines,meta){try{corePost(st,id,date,desc,lines,meta);}catch(err){errors.push({sourceType:st,sourceId:id,error:err.message});}}
  /* Opening balances: preserve per-bank dimension. */
  (state.bankAccounts||[]).forEach(function(a){var amt=+a.initialBalance||0;if(amt&&!a.openingDate)a.openingDate=todayJalali();if(amt)post('opening-balance',a.id,a.openingDate,'مانده افتتاحیه '+a.name,[coreCashLine(a.id,amt,0,'مانده افتتاحیه'),coreLine('301',0,amt,'سرمایه افتتاحیه')]);});
  /* Sales */
  (state.invoices||[]).forEach(function(i){if(i.voided)return;var net=+i.subtotal||0,tax=+i.tax||0,total=+i.grandTotal||net+tax;if(total<0)return;var party=i.customerId||null;
    if(total>0)post('invoice',i.id,i.date,'ثبت فاکتور '+(i.number||''),[corePartyLine('103',total,0,'مطالبات فاکتور '+(i.number||''),party,'customer'),coreLine('401',0,net,'درآمد فاکتور '+(i.number||'')),tax?coreLine('202',0,tax,'مالیات فروش'):null].filter(Boolean),{documentId:i.id});
    var cogs=coreInvoiceCogs(i);if(cogs>0)post('invoice-cogs',i.id,i.date,'بهای تمام‌شده فاکتور '+(i.number||''),[coreLine('601',cogs,0,'بهای تمام‌شده'),coreLine('104',0,cogs,'خروج موجودی')],{documentId:i.id});
    (i.payments||[]).forEach(function(p){if(p.voided)return;var a=+p.amount||0;if(a<=0)return;var cash;try{cash=coreCashLine(p.accountId,a,0,'دریافت فاکتور '+(i.number||''));}catch(e){errors.push({sourceType:'invoice-payment',sourceId:p.id,error:e.message});return;}post('invoice-payment',i.id+':'+p.id,p.date||i.date,'دریافت فاکتور '+(i.number||''),[cash,corePartyLine('103',0,a,'تسویه مطالبات',party,'customer')],{documentId:i.id,paymentId:p.id});});
  });
  /* Purchase invoices */
  (state.purchaseInvoices||[]).forEach(function(i){
    if(i.voided)return;
    var net=+i.subtotal||0,tax=+i.tax||0,total=+i.grandTotal||net+tax;
    if(total<=0)return;
    var party=i.supplierId||null;
    var lines=[coreLine('104',net,0,'خرید موجودی '+(i.number||''))];
    if(tax>0)lines.push(coreLine('206',tax,0,'اعتبار مالیاتی خرید'));
    lines.push(corePartyLine('201',0,total,'بدهی به تأمین‌کننده '+(i.number||''),party,'supplier'));
    post('purchase-invoice',i.id,i.date,'ثبت فاکتور خرید '+(i.number||''),lines,{documentId:i.id,supplierId:party});
    (i.payments||[]).forEach(function(p){
      if(p.voided)return;var a=+p.amount||0;if(a<=0)return;
      try{post('purchase-payment',i.id+':'+p.id,p.date||i.date,'پرداخت فاکتور خرید '+(i.number||''),[corePartyLine('201',a,0,'تسویه بدهی تأمین‌کننده',party,'supplier'),coreCashLine(p.accountId,0,a,'پرداخت خرید')],{documentId:i.id,paymentId:p.id});}
      catch(e){errors.push({sourceType:'purchase-payment',sourceId:p.id,error:e.message});}
    });
  });
  /* Purchase returns */
  (state.purchaseReturns||[]).forEach(function(r){
    if(r.voided)return;var total=+r.grandTotal||0,net=+r.subtotal||0,tax=+r.tax||0;if(total<=0)return;
    var party=r.supplierId||null,lines=[corePartyLine('201',total,0,'کاهش بدهی تأمین‌کننده بابت برگشت خرید '+(r.number||''),party,'supplier')];
    if(tax>0)lines.push(coreLine('206',0,tax,'کاهش اعتبار مالیاتی خرید'));
    lines.push(coreLine('104',0,net,'کاهش موجودی بابت برگشت خرید '+(r.number||'')));
    post('purchase-return',r.id,r.date,'ثبت برگشت از خرید '+(r.number||''),lines,{documentId:r.id,supplierId:party,purchaseInvoiceId:r.purchaseInvoiceId||null});
  });
  /* Inventory purchase / adjustment */
  (state.stockMoves||[]).forEach(function(m){if(m.sourceType==='invoice'||m.sourceType==='purchase-invoice'||m.sourceType==='purchase-return'||m.sourceType==='sale-return'||m.voided)return;var q=+m.qty||0,cost=+m.unitCost||0,amt=q*cost;if(!q||!cost)return;var sv=getService(m.serviceId),name=sv?sv.name:'';
    if(m.type==='purchase'){var cr;try{cr=m.accountId?coreCashLine(m.accountId,0,amt,'خرید موجودی'):corePartyLine('201',0,amt,'بستانکاری تأمین‌کننده',m.supplierId,'supplier');}catch(e){cr=corePartyLine('201',0,amt,'بستانکاری تأمین‌کننده',m.supplierId,'supplier');}post('stock-move',m.id,m.date,'خرید موجودی '+name,[coreLine('104',amt,0,'افزایش موجودی'),cr],{supplierId:m.supplierId||null});}
    else if(m.type==='opening')post('stock-move',m.id,m.date,'موجودی افتتاحیه '+name,[coreLine('104',amt,0,'موجودی افتتاحیه'),coreLine('301',0,amt,'سرمایه افتتاحیه')]);
    else if(m.type==='in'||m.type==='adjust-in')post('stock-move',m.id,m.date,'افزایش/تعدیل موجودی '+name,[coreLine('104',amt,0),coreLine('508',0,amt)]);
    else post('stock-move',m.id,m.date,'کاهش/تعدیل موجودی '+name,[coreLine('508',amt,0),coreLine('104',0,amt)]);
  });
  /* Expenses */
  (state.expenses||[]).forEach(function(e){var amt=+e.amount||0;if(amt<=0)return;var code=coreExpenseCode(e),lines=[coreLine(code,amt,0,e.description||getCategoryName('expense',e.categoryId))];if(e.accountId){try{lines.push(coreCashLine(e.accountId,0,amt,'پرداخت هزینه'));}catch(x){lines.push(corePartyLine('201',0,amt,'هزینه پرداخت‌نشده'));}}else lines.push(corePartyLine('201',0,amt,'هزینه پرداخت‌نشده',e.supplierId,'supplier'));post('expense',e.id,e.date,'هزینه '+(e.description||''),lines,{supplierId:e.supplierId||null});if(!e.accountId)(e.payments||[]).forEach(function(p){if(p.voided)return;var a=+p.amount||0;if(!a)return;try{post('expense-payment',e.id+':'+p.id,p.date||e.date,'تسویه هزینه '+(e.description||''),[corePartyLine('201',a,0,'تسویه پرداختنی',e.supplierId,'supplier'),coreCashLine(p.accountId,0,a,'پرداخت هزینه')],{expenseId:e.id,paymentId:p.id});}catch(x){errors.push({sourceType:'expense-payment',sourceId:p.id,error:x.message});}});});
  /* Manual cash/bank movements. */
  (state.transactions||[]).filter(function(t){return !t.relatedType&&!t.voided;}).forEach(function(t){var amt=+t.amount||0;if(amt<=0)return;try{var cash=coreCashLine(t.accountId,t.type==='deposit'?amt:0,t.type==='withdraw'?amt:0,t.description);var cp=t.counterAccountCode;if(!coreAcc(cp))throw new Error('حساب مقابل نامعتبر');var other=coreLine(cp,t.type==='withdraw'?amt:0,t.type==='deposit'?amt:0,t.description);post('transaction',t.id,t.date,t.description||'تراکنش دستی',[cash,other],{transactionId:t.id});}catch(e){errors.push({sourceType:'transaction',sourceId:t.id,error:e.message});}});
  /* Checks: existence is represented in notes accounts; cashing settles the note. */
  (state.checks||[]).forEach(function(c){var amt=+c.amount||0;if(!amt)return;var party=c.customerId||c.supplierId||null;
    /* The original receipt/issue always happened; a later bounce is a separate reversing event. */
    if(c.direction==='receivable')post('check-receive',c.id,c.date||c.dueDate,'دریافت چک '+(c.number||''),[corePartyLine('108',amt,0,'اسناد دریافتنی',party,'customer'),corePartyLine('103',0,amt,'کاهش طلب مشتری',party,'customer')],{checkId:c.id});
    if(c.direction==='payable')post('check-issue',c.id,c.date||c.dueDate,'صدور چک '+(c.number||''),[corePartyLine('201',amt,0,'کاهش بدهی تأمین‌کننده',party,'supplier'),corePartyLine('204',0,amt,'اسناد پرداختنی',party,'supplier')],{checkId:c.id});
    /* A bounced check that was first cashed keeps its original cash entry; the later bounce entries reverse it. */
    if(c.status==='cashed'||(c.status==='bounced'&&c.cashDate&&c.accountId)){try{if(c.direction==='receivable')post('check-cash',c.id,(c.cashDate||c.dueDate),'وصول چک '+(c.number||''),[coreCashLine(c.accountId,amt,0,'وصول چک'),corePartyLine('108',0,amt,'تسویه سند دریافتنی',party,'customer')]);else post('check-cash',c.id,(c.cashDate||c.dueDate),'پرداخت چک '+(c.number||''),[corePartyLine('204',amt,0,'تسویه سند پرداختنی',party,'supplier'),coreCashLine(c.accountId,0,amt,'پرداخت چک')]);}catch(e){errors.push({sourceType:'check-cash',sourceId:c.id,error:e.message});}}
    if(c.status==='bounced'&&c.direction==='receivable'){
      /* A bounced received check reverses the cashing first, then restores the customer's receivable. */
      if(c.cashDate&&c.accountId)try{post('check-bounce-cash',c.id,c.bounceDate||todayJalali(),'برگشت وصول چک '+(c.number||''),[corePartyLine('108',amt,0,'برگشت سند دریافتنی',party,'customer'),coreCashLine(c.accountId,0,amt,'برگشت وجه چک')]);}catch(e){errors.push({sourceType:'check-bounce-cash',sourceId:c.id,error:e.message});}
      post('check-bounce-ar',c.id,c.bounceDate||todayJalali(),'بازگشت طلب چک '+(c.number||''),[corePartyLine('103',amt,0,'برگشت طلب مشتری',party,'customer'),corePartyLine('108',0,amt,'خروج از اسناد دریافتنی',party,'customer')]);
    }
    if(c.status==='bounced'&&c.direction==='payable'){
      /* A bounced issued check restores the supplier payable and removes the note payable. */
      post('check-bounce-ap',c.id,c.bounceDate||todayJalali(),'برگشت چک پرداختنی '+(c.number||''),[corePartyLine('204',amt,0,'برگشت سند پرداختنی',party,'supplier'),corePartyLine('201',0,amt,'بازگشت بدهی',party,'supplier')]);
      if(c.cashDate&&c.accountId)try{post('check-bounce-cash',c.id,c.bounceDate||todayJalali(),'برگشت پرداخت چک '+(c.number||''),[coreCashLine(c.accountId,amt,0,'برگشت وجه چک'),corePartyLine('204',0,amt,'معکوس وصول سند پرداختنی',party,'supplier')]);}catch(e){errors.push({sourceType:'check-bounce-cash',sourceId:c.id,error:e.message});}
    }
  });
  /* Other AR/AP */
  (state.receivablesPayables||[]).forEach(function(r){if(r.status==='void')return;var amt=+r.amount||0;if(!amt)return;var party=r.customerId||r.supplierId||null;var counterpart=r.counterAccountCode&&coreAcc(r.counterAccountCode)?r.counterAccountCode:(r.direction==='receivable'?'401':'501');var lines=r.direction==='receivable'?[corePartyLine('103',amt,0,r.description,party,'customer'),coreLine(counterpart,0,amt,r.description)]:[coreLine(counterpart,amt,0,r.description),corePartyLine('201',0,amt,r.description,party,'supplier')];post('receivable-payable',r.id,r.date,r.description||'حساب دریافتنی/پرداختنی',lines,{partyId:party,partyType:r.direction==='receivable'?'customer':'supplier'});(r.payments||[]).forEach(function(p){if(p.voided)return;var a=+p.amount||0;if(!a)return;try{var pl=r.direction==='receivable'?[coreCashLine(p.accountId,a,0,'تسویه دریافتنی'),corePartyLine('103',0,a,'کاهش دریافتنی',party,'customer')]:[corePartyLine('201',a,0,'کاهش پرداختنی',party,'supplier'),coreCashLine(p.accountId,0,a,'تسویه پرداختنی')];post('receivable-payable-payment',r.id+':'+p.id,p.date||r.date,'تسویه '+(r.description||''),pl,{paymentId:p.id});}catch(e){errors.push({sourceType:'receivable-payable-payment',sourceId:p.id,error:e.message});}});});
  /* Fixed assets */
  (state.fixedAssets||[]).forEach(function(a){var cost=+a.cost||0;if(!cost)return;var credit;try{credit=a.accountId?coreCashLine(a.accountId,0,cost,'خرید دارایی'):corePartyLine('201',0,cost,'خرید نسیه دارایی',a.supplierId,'supplier');}catch(e){credit=corePartyLine('201',0,cost,'خرید نسیه دارایی',a.supplierId,'supplier');}post('asset',a.id,a.date||todayJalali(),'خرید دارایی '+a.name,[coreLine('105',cost,0,'بهای دارایی'),credit],{supplierId:a.supplierId||null});var dep=+a.depr||0;if(Array.isArray(a.deprSchedule)&&a.deprSchedule.length){a.deprSchedule.forEach(function(s){var sa=+s.amount||0;if(sa>0)post('asset-depr',a.id+':'+s.id,s.date||a.lastDepDate||a.date||todayJalali(),'استهلاک '+a.name+' — '+(s.period||''),[coreLine('507',sa,0,'هزینه استهلاک ماهانه'),coreLine('106',0,sa,'استهلاک انباشته')],{assetId:a.id,period:s.period||null});});}else if(dep>0)post('asset-depr',a.id+':legacy',a.lastDepDate||a.date||todayJalali(),'استهلاک '+a.name,[coreLine('507',dep,0,'هزینه استهلاک'),coreLine('106',0,dep,'استهلاک انباشته')],{assetId:a.id,legacy:true});});
  /* Payroll */
  (state.payroll||[]).forEach(function(x){var net=+x.net||0;if(!net)return;post('payroll',x.id,x.date||todayJalali(),'حقوق '+x.name,[coreLine('502',net,0,'حقوق'),corePartyLine('205',0,net,'حقوق پرداختنی',x.employeeId,'employee')]);(x.payments||[]).forEach(function(p){if(p.voided)return;var a=+p.amount||0;if(!a)return;try{post('payroll-payment',x.id+':'+p.id,p.date||x.date,'پرداخت حقوق '+x.name,[corePartyLine('205',a,0,'تسویه حقوق',x.employeeId,'employee'),coreCashLine(p.accountId,0,a,'پرداخت حقوق')]);}catch(e){errors.push({sourceType:'payroll-payment',sourceId:p.id,error:e.message});}});});
  state.__accountingErrors=errors;state.__ledgerVersion=9;return errors;
}
window.coreRebuildLedger=coreRebuildLedger;
window.accountBalance=function(accId){window.coreRebuildLedger();var acc=(state.bankAccounts||[]).find(function(a){return a.id===accId});if(!acc)return 0;var code=acc.type==='bank'?'102':'101';var opening=+acc.initialBalance||0;var sum=0;(state.journalEntries||[]).forEach(function(e){if(e.voided)return;(e.lines||[]).forEach(function(l){if(l.accountCode===code&&l.cashAccountId===accId)sum+=(+l.debit||0)-(+l.credit||0);});});return opening+sum;};
window.fpLedgerBalance=function(code){window.coreRebuildLedger();var a=coreAcc(code),d=0,c=0;(state.journalEntries||[]).forEach(function(e){if(e.voided)return;(e.lines||[]).forEach(function(l){if(String(l.accountCode)===String(code)){d+=+l.debit||0;c+=+l.credit||0;}});});return a&&(['asset','expense'].includes(a.type)?d-c:c-d);};
window.fpReverseJournal=function(id){var e=state.journalEntries.find(function(x){return x.id===id});if(!e||e.reversed){showToast('سند قابل معکوس‌سازی نیست');return false;}if(!fpRequireOpen(e.date))return false;if(e.auto&&e.sourceType&&e.sourceId)state.accountingVoids[e.sourceType+':'+e.sourceId]=true;var lines=(e.lines||[]).map(function(l){return Object.assign({},l,{debit:+l.credit||0,credit:+l.debit||0});});var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:todayJalali(),description:'معکوس سند #'+e.number+' - '+e.description,lines:lines,status:'posted',auto:false,reversalOf:e.id,createdAt:new Date().toISOString()});e.reversed=true;e.reversedBy=state.journalEntries[state.journalEntries.length-1].id;e.status='reversed';logEvent('journal','سند #'+e.number+' معکوس شد');save();renderJournals();return false;};
window.saveJournalEntry=function(ev,id){ev.preventDefault();if(id){showToast('سند ثبت‌شده قابل ویرایش نیست؛ از «معکوس کردن» استفاده کنید');return false;}var f=ev.target;if(!fpRequireOpen(readDateInput(f,'date')))return false;var lines=[];f.querySelectorAll('.jline').forEach(function(r){var code=r.querySelector('[name=account]').value,d=+r.querySelector('[name=debit]').value||0,c=+r.querySelector('[name=credit]').value||0,desc=r.querySelector('[name=ldesc]').value;if(code&&(d||c))lines.push(coreLine(code,d,c,desc));});var d=lines.reduce(function(a,l){return a+l.debit},0),c=lines.reduce(function(a,l){return a+l.credit},0);if(!lines.length||Math.abs(d-c)>0.01){showToast('سند نامتوازن است');return false;}var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:readDateInput(f,'date'),description:f.desc.value.trim()||'سند دستی',lines:lines,status:'posted',auto:false,createdAt:new Date().toISOString()});logEvent('journal','ثبت سند دستی #'+n);save();closeModal();renderJournals();return false;};
window.openJournalForm=function(id){if(id){showToast('سند ثبت‌شده قابل ویرایش نیست؛ از گزینه معکوس استفاده کنید');return;}openProModal('ثبت سند حسابداری','<form onsubmit="return saveJournalEntry(event,\'\')"><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><div class="field"><label>شرح</label><input name="desc" required></div><div id="journalLines"></div><div style="margin:10px 0"><button type="button" class="btn btn-ghost" onclick="addJournalLine()">افزودن ردیف</button></div><button class="btn btn-brand" type="submit">ثبت سند</button></form>');addJournalLine();addJournalLine();};
window.renderJournals=function(){window.coreRebuildLedger();var html='<div class="page-head"><div><div class="muted">دفتر ثبت حسابداری — اسناد ثبت‌شده غیرقابل ویرایش هستند</div></div><button class="btn btn-brand" onclick="openJournalForm()">+ سند جدید</button></div><div class="card"><table><thead><tr><th>شماره</th><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>نوع</th><th></th></tr></thead><tbody>';(state.journalEntries||[]).slice().sort(function(a,b){return (+b.number||0)-(+a.number||0)}).forEach(function(e){var d=(e.lines||[]).reduce(function(a,l){return a+(+l.debit||0)},0),c=(e.lines||[]).reduce(function(a,l){return a+(+l.credit||0)},0);html+='<tr><td>'+fa(e.number)+'</td><td>'+jStrShort(e.date)+'</td><td>'+esc(e.description||'')+'</td><td class="num">'+money(d)+'</td><td class="num">'+money(c)+'</td><td>'+esc(e.auto?'سیستمی':'دستی')+(e.reversed?' / معکوس‌شده':'')+'</td><td>'+(e.reversed||e.auto===false&&e.reversalOf?'':('<button class="btn btn-ghost btn-sm" onclick="fpReverseJournal(\''+e.id+'\')">معکوس</button>'))+'</td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
/* Prevent direct chart-account mutation of system accounts already used by Ledger. */
window.openAccountCodeForm=function(id){var a=id?state.chartAccounts.find(function(x){return x.id===id}):null;if(a&&a.system){showToast('حساب سیستمی قابل تغییر نیست');return;}var used=a&&(state.journalEntries||[]).some(function(e){return (e.lines||[]).some(function(l){return String(l.accountCode)===String(a.code)})});if(a&&used){showToast('حساب دارای سابقه است؛ کد و ماهیت آن قابل تغییر نیست');return;}openProModal(a?'ویرایش حساب':'حساب جدید','<form onsubmit="event.preventDefault();var f=this;var code=f.code.value.trim();if(!/^\\d+$/.test(code)||coreAcc(code)){showToast(\'کد حساب تکراری یا نامعتبر است\');return;}state.chartAccounts.push({id:uid(),code:code,name:f.name.value.trim(),type:f.type.value,parent:null});save();closeModal();nav(\'chart-accounts\')"><div class="field"><label>کد</label><input name="code" required></div><div class="field"><label>نام</label><input name="name" required></div><div class="field"><label>ماهیت</label><select name="type"><option value="asset">دارایی</option><option value="liability">بدهی</option><option value="equity">سرمایه</option><option value="revenue">درآمد</option><option value="expense">هزینه</option></select></div><button class="btn btn-brand">ذخیره</button></form>');};
window.fpAccountingHealth=function(){window.coreRebuildLedger();var out={ok:true,unbalanced:[],invalidAccounts:[],duplicateAuto:[],orphanReversals:[],errors:state.__accountingErrors||[],inventoryMismatch:[]},seen={};(state.journalEntries||[]).forEach(function(e){var d=0,c=0;(e.lines||[]).forEach(function(l){d+=+l.debit||0;c+=+l.credit||0;if(!coreAcc(l.accountCode))out.invalidAccounts.push({journal:e.number,account:l.accountCode});});if(Math.abs(d-c)>0.01)out.unbalanced.push(e.number);if(e.auto){var k=e.sourceType+':'+e.sourceId;if(seen[k])out.duplicateAuto.push(k);seen[k]=1;}if(e.reversalOf&&!state.journalEntries.some(function(x){return x.id===e.reversalOf}))out.orphanReversals.push(e.number);});out.ok=!out.unbalanced.length&&!out.invalidAccounts.length&&!out.duplicateAuto.length&&!out.orphanReversals.length&&!out.errors.length;return out;};
/* Export so later patches (v10, v12, audit) can call/wrap window.coreRebuildStock. */
window.coreRebuildStock=coreRebuildStock;
coreEnsure();coreStampCosts();coreRebuildStock();coreRebuildLedger();save();
/* Export for later patch IIFEs that call this as a global. */
window.corePost=corePost;window.coreLine=coreLine;window.corePartyLine=corePartyLine;window.coreCashLine=coreCashLine;
})();
}catch(e){console.error('app.js block 4/23 failed:',e);}
;

/* ===== Script block 5/26 ===== */
try{
(function(){
'use strict';
/* FINAL CORE INTEGRITY PATCH v9.1 */

function corePaymentActive(p){return p && !p.voided && (+p.amount||0)>0;}
function coreInvoicePaidActive(inv){return (inv&&inv.payments||[]).filter(corePaymentActive).reduce(function(a,p){return a+(+p.amount||0)},0);}

/* Invoice edits become immutable once money has been received. */
var _coreOpenInvoiceForm=window.openInvoiceForm;
window.openInvoiceForm=function(id){
  if(id){var inv=state.invoices.find(function(x){return x.id===id});if(inv&&coreInvoicePaidActive(inv)>0){showToast('فاکتور دارای دریافت ثبت‌شده است؛ برای اصلاح باید دریافت را ابطال/معکوس کنید');return;}}
  return _coreOpenInvoiceForm(id);
};

/* Never hard-delete an invoice that has accounting impact. */
window.deleteInvoice=function(id){
  var inv=getInvoice(id);if(!inv)return;
  if(coreInvoicePaidActive(inv)>0){showToast('فاکتور دارای دریافت است و حذف مستقیم مجاز نیست؛ ابتدا دریافت را ابطال و سپس فاکتور را باطل کنید');return;}
  if(!confirm('این فاکتور برای همیشه حذف شود؟'))return;
  if(!inv.voided)applyStockDelta(inv.items,1);
  state.invoices=state.invoices.filter(function(x){return x.id!==id});
  logEvent('invoice','فاکتور #'+fa(inv.number)+' حذف شد');save();fpSyncLedger();renderInvoices();
};

/* Invoice payments: no silent overpayment, no payment without a real cash/bank account. */
var _coreSavePayment=window.savePayment;
window.savePayment=function(ev,invoiceId){
  ev.preventDefault();var f=ev.target,inv=getInvoice(invoiceId);if(!inv||inv.voided)return false;
  var amount=+f.amount.value||0,remaining=invoiceRemaining(inv);
  if(amount<=0||amount>remaining){showToast('مبلغ دریافت نامعتبر است');return false;}
  if(!f.accountId.value){showToast('برای ثبت دریافت باید حساب صندوق/بانک انتخاب شود');return false;}
  var date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(date))return false;
  if(f.method.value==='چک'){showToast('برای دریافت چک از گزینه «ثبت چک» استفاده کنید');return false;}
  return _coreSavePayment(ev,invoiceId);
};

/* Payment deletion is an accounting reversal, not a data deletion. */
window.deletePayment=function(invoiceId,paymentId){
  var inv=getInvoice(invoiceId),p=inv&&(inv.payments||[]).find(function(x){return x.id===paymentId});if(!p||p.voided)return;
  if(!confirm('این دریافت با سند معکوس ابطال شود؟'))return;
  var e=(state.journalEntries||[]).find(function(x){return x.auto&&x.sourceType==='invoice-payment'&&x.sourceId===invoiceId+':'+paymentId});
  if(e&&!e.reversed)fpReverseJournal(e.id);
  p.voided=true;
  save();fpSyncLedger();renderInvoiceView(invoiceId);
};

/* Checks with posted/cashed/bounced state are immutable. */
var _coreSaveCheck=window.saveCheck;
window.saveCheck=function(ev,direction,id){
  if(id){var c=state.checks.find(function(x){return x.id===id});if(c&&(c.status==='cashed'||c.status==='bounced')){showToast('چک وصول‌شده یا برگشتی قابل ویرایش نیست');return false;}}
  return _coreSaveCheck(ev,direction,id);
};

/* A check may be received/issued only against an existing party relationship. */
var _coreCashCheck=window.cashCheck;
window.cashCheck=function(ev,id){
  var c=state.checks.find(function(x){return x.id===id});if(!c||c.status!=='pending'){showToast('وضعیت این چک اجازه وصول/پرداخت نمی‌دهد');return false;}
  var f=ev.target,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;
  if(!f.accountId.value){showToast('حساب صندوق/بانک الزامی است');return false;}
  return _coreCashCheck(ev,id);
};

/* Deleting a posted check would erase accounting history. */
window.deleteCheck=function(id){
  var c=state.checks.find(function(x){return x.id===id});if(!c)return;
  if(c.status!=='pending'){showToast('چک دارای اثر حسابداری است و حذف مستقیم آن مجاز نیست');return;}
  if(!confirm('این چک حذف شود؟'))return;
  state.checks=state.checks.filter(function(x){return x.id!==id});save();fpSyncLedger();renderChecks();
};

/* AR/AP records with settlements are immutable; settlements themselves are reversed. */
var _coreSaveRP=window.saveReceivablePayable;
window.saveReceivablePayable=function(ev,direction,id){
  if(id){var r=(state.receivablesPayables||[]).find(function(x){return x.id===id});if(r&&(r.payments||[]).some(corePaymentActive)){showToast('این حساب دارای تسویه است؛ ویرایش مستقیم برای حفظ سابقه حسابداری مجاز نیست');return false;}}
  return _coreSaveRP(ev,direction,id);
};
window.deleteReceivablePayable=function(id){
  var r=(state.receivablesPayables||[]).find(function(x){return x.id===id});if(!r)return;
  if((r.payments||[]).some(corePaymentActive)){showToast('این حساب دارای تسویه است؛ حذف مستقیم مجاز نیست');return;}
  if(!confirm('این حساب حذف شود؟'))return;
  state.receivablesPayables=state.receivablesPayables.filter(function(x){return x.id!==id});save();fpSyncLedger();renderReceivablesPayables();
};

/* RP settlement validation and period lock. */
var _coreSaveRPSettlement=window.saveRPSettlement;
window.saveRPSettlement=function(ev,id){
  var r=(state.receivablesPayables||[]).find(function(x){return x.id===id});if(!r)return false;
  var f=ev.target,d={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(d))return false;
  var amount=+f.amount.value||0;if(amount<=0||amount>rpRemaining(r)){showToast('مبلغ تسویه نامعتبر است');return false;}
  if(!f.accountId.value){showToast('حساب صندوق/بانک الزامی است');return false;}
  return _coreSaveRPSettlement(ev,id);
};

/* Expense payments must not exceed the unpaid balance and cannot be silently removed. */
var _corePayExpense=window.fpPayExpense;
if(_corePayExpense)window.fpPayExpense=function(id){
  var e=(state.expenses||[]).find(function(x){return x.id===id});if(!e)return;
  var paid=(e.payments||[]).filter(corePaymentActive).reduce(function(a,p){return a+(+p.amount||0)},0),rem=Math.max(0,(+e.amount||0)-paid);if(rem<=0){showToast('این هزینه تسویه شده است');return;}
  return _corePayExpense(id);
};

/* Expense deletion: accounting source cannot disappear after posting. */
var _coreDeleteExpense=window.deleteExpense;
window.deleteExpense=function(id){var e=(state.expenses||[]).find(function(x){return x.id===id});if(e&&(e.accountId||(e.payments||[]).some(corePaymentActive))){showToast('این هزینه اثر حسابداری دارد و حذف مستقیم مجاز نیست');return;}return _coreDeleteExpense(id);};

/* Historical cost fallback: use weighted-average purchase history before falling back to current master data. */
window.coreHistoricalUnitCost=function(serviceId,date){
  var totalQty=0,totalCost=0,target=jToJdn(date||todayJalali());
  (state.stockMoves||[]).forEach(function(m){if(m.serviceId!==serviceId||jToJdn(m.date)>target)return;var q=+m.qty||0,c=+m.unitCost||0;if(q<=0||c<=0)return;if(m.type==='purchase'||m.type==='in'||m.type==='adjust-in'){totalQty+=q;totalCost+=q*c;}});
  return totalQty>0?totalCost/totalQty:null;
};

/* Stronger health checks. */
var _coreHealth=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_coreHealth();out.subledger={};out.cashAccounts=[];out.invalidPayments=[];out.invalidDates=[];
  (state.invoices||[]).forEach(function(inv){var paid=0;(inv.payments||[]).forEach(function(p){if(p.voided)return;var a=+p.amount||0;paid+=a;if(a<=0||a>inv.grandTotal)out.invalidPayments.push('invoice:'+inv.id+':'+p.id);if(!p.accountId)out.invalidPayments.push('invoice-payment-account:'+p.id);});if(paid>inv.grandTotal+0.01)out.invalidPayments.push('invoice-overpayment:'+inv.id);});
  (state.receivablesPayables||[]).forEach(function(r){var paid=(r.payments||[]).filter(corePaymentActive).reduce(function(a,p){return a+(+p.amount||0)},0);if(paid>+r.amount+0.01)out.invalidPayments.push('rp-overpayment:'+r.id);});
  (state.journalEntries||[]).forEach(function(e){if(!e.date||!Number.isFinite(+e.date.jy)||!Number.isFinite(+e.date.jm)||!Number.isFinite(+e.date.jd))out.invalidDates.push(e.number);});
  out.ok=out.ok&&!out.invalidPayments.length&&!out.invalidDates.length;return out;
};

coreRebuildStock();coreRebuildLedger();save();
/* Export for later patch IIFEs that call this as a global. */
window.corePaymentActive=corePaymentActive;
})();
}catch(e){console.error('app.js block 5/23 failed:',e);}
;

/* ===== Script block 6/26 ===== */
try{
(function(){
'use strict';
/* FINAL CORE AUDIT PATCH v9.2 */

/* Prevent corePost from mutating an existing posted automatic journal. Rebuilds recreate active journals; history stays immutable. */
var _corePost92=window.corePost;
if(typeof _corePost92==='function'){
  window.corePost=function(st,id,date,desc,lines,meta){
    var existing=(state.journalEntries||[]).find(function(e){return e.auto&&e.sourceType===st&&e.sourceId===id;});
    if(existing){
      if(existing.reversed || state.accountingVoids[st+':'+id]) return existing;
      throw new Error('سند سیستمی موجود است و قابل ویرایش نیست');
    }
    return _corePost92(st,id,date,desc,lines,meta);
  };
}

/* Correct cash/bank balance: opening balance is already represented by the opening journal, so never add it twice. */
window.accountBalance=function(accId){
  if(typeof window.fpSyncLedger==='function') window.fpSyncLedger();
  var acc=(state.bankAccounts||[]).find(function(a){return a.id===accId});
  if(!acc)return 0;
  var code=acc.type==='bank'?'102':'101',sum=0;
  (state.journalEntries||[]).forEach(function(e){
    if(e.status==='void')return;
    (e.lines||[]).forEach(function(l){
      if(String(l.accountCode)===code && l.cashAccountId===accId) sum+=(+l.debit||0)-(+l.credit||0);
    });
  });
  return sum;
};

/* Ledger-based cash-flow: never read the legacy transactions table for financial totals. */
window.fpRenderCashflow=function(){
  coreRebuildLedger();
  var ins=0,outs=0,rows=[];
  (state.journalEntries||[]).forEach(function(e){
    if(e.status==='void')return;
    (e.lines||[]).forEach(function(l){
      if(l.accountCode!=='101'&&l.accountCode!=='102')return;
      var d=+l.debit||0,c=+l.credit||0;
      ins+=d;outs+=c;
    });
  });
  var net=ins-outs;
  var html='<div class="stat-grid">'+statCard('ورودی نقد/بانک',ins,'income')+statCard('خروجی نقد/بانک',outs,'expense')+statCard('خالص تغییر نقدینگی',net,net>=0?'income':'expense')+'</div><div class="card"><div class="section-title">صورت جریان وجوه نقد — مبتنی بر دفتر کل</div><p>جمع بدهکار صندوق و بانک: <b>'+fpMoney(ins)+'</b></p><p>جمع بستانکار صندوق و بانک: <b>'+fpMoney(outs)+'</b></p><p>خالص تغییر: <b>'+fpMoney(net)+'</b></p><p class="muted">انتقال بین دو حساب نقدی در این جمع اثر خالص صفر دارد، ولی در گردش حساب هر بانک/صندوق قابل مشاهده است.</p></div>';
  document.getElementById('content').innerHTML=html;
};

/* Stronger health checks for duplicate opening balances, paid expenses with extra payments, and reversed history. */
var _health92=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_health92();
  out.doubleOpening=[];out.expenseOverpayment=[];out.reversalHistory=[];
  var openings={};
  (state.journalEntries||[]).forEach(function(e){
    if(e.sourceType==='opening-balance'){
      var k=e.sourceType+':'+e.sourceId;
      if(openings[k])out.doubleOpening.push(k); openings[k]=1;
    }
    if(e.reversalOf && !state.journalEntries.some(function(x){return x.id===e.reversalOf}))out.reversalHistory.push(e.number);
  });
  (state.expenses||[]).forEach(function(e){
    var paid=(e.payments||[]).filter(corePaymentActive).reduce(function(a,p){return a+(+p.amount||0)},0);
    if(e.accountId && paid>0)out.expenseOverpayment.push(e.id);
    if(paid>(+e.amount||0)+0.01)out.expenseOverpayment.push(e.id+':over');
  });
  out.ok=out.ok&&!out.doubleOpening.length&&!out.expenseOverpayment.length&&!out.reversalHistory.length;
  return out;
};

coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 6/23 failed:',e);}
;

/* ===== Script block 7/26 ===== */
try{
(function(){
'use strict';
/* FINAL CORE AUDIT PATCH v9.3 */

/* Bank/cash account ledger is Ledger-only. The legacy transactions table is a source document, never the financial balance. */
window.renderAccountLedger=function(accountId){
  coreRebuildLedger();
  var a=(state.bankAccounts||[]).find(function(x){return x.id===accountId});
  if(!a){nav('accounts');return;}
  var code=a.type==='bank'?'102':'101',rows=[],bal=0;
  var entries=(state.journalEntries||[]).slice().sort(function(x,y){return jToJdn(x.date)-jToJdn(y.date)||(x.number||0)-(y.number||0)});
  entries.forEach(function(e){
    if(e.status==='void')return;
    (e.lines||[]).forEach(function(l){
      if(l.accountCode===code&&l.cashAccountId===accountId){
        var d=+l.debit||0,c=+l.credit||0;bal+=d-c;
        rows.push({date:e.date,description:l.description||e.description||'—',deposit:d,withdraw:c,balance:bal,journal:e});
      }
    });
  });
  var html='<div class="row no-print" style="justify-content:flex-end;margin-bottom:14px"><button class="btn btn-ghost" onclick="nav(\'accounts\')">بازگشت</button><button class="btn btn-brand" onclick="openTransactionForm(\''+accountId+'\')">'+icon('plus')+'ثبت تراکنش دستی</button></div>';
  html+='<div class="card" style="margin-bottom:18px"><div class="section-title">'+esc(a.name)+'</div><div class="muted">موجودی فعلی از دفتر کل: <b class="num">'+money(bal)+' '+esc(state.business.currency)+'</b></div></div>';
  if(!rows.length) html+=emptyState('bank','گردش ثبت‌شده‌ای وجود ندارد','گردش این حساب از دفتر کل نمایش داده می‌شود',null,'');
  else{
    html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>شرح</th><th>واریز</th><th>برداشت</th><th>مانده</th><th>سند</th></tr></thead><tbody>';
    rows.forEach(function(r){html+='<tr><td class="num">'+jStrShort(r.date)+'</td><td>'+esc(r.description)+'</td><td class="num">'+(r.deposit?money(r.deposit):'—')+'</td><td class="num">'+(r.withdraw?money(r.withdraw):'—')+'</td><td class="num">'+money(r.balance)+'</td><td class="num">#'+fa(r.journal.number||'')+'</td></tr>';});
    html+='</tbody></table></div>';
  }
  document.getElementById('content').innerHTML=html;
};

/* Manual cash transaction deletion becomes a reversal/void operation. */
window.deleteTransaction=function(id){
  var t=(state.transactions||[]).find(function(x){return x.id===id});if(!t)return;
  if(t.relatedType){showToast('تراکنش خودکار باید از سند اصلی اصلاح شود');return;}
  if(!fpRequireOpen(t.date))return;
  if(!confirm('این تراکنش باطل و اثر حسابداری آن معکوس شود؟'))return;
  var e=(state.journalEntries||[]).find(function(x){return x.auto&&x.sourceType==='transaction'&&x.sourceId===id});
  if(e&&!e.reversed)fpReverseJournal(e.id);
  t.voided=true;save();fpSyncLedger();renderAccountLedger(t.accountId);
};

/* Account opening balance/type is immutable once it has accounting history. */
var _saveAccount93=window.saveAccount;
window.saveAccount=function(ev,id){
  if(id){
    var old=(state.bankAccounts||[]).find(function(x){return x.id===id});
    if(old){
      var used=(state.transactions||[]).some(function(t){return t.accountId===id&&!t.voided}) || (state.journalEntries||[]).some(function(e){return (e.lines||[]).some(function(l){return l.cashAccountId===id;})});
      if(used){
        var f=ev.target;
        var newType=f.type.value,newOpening=Number(f.initialBalance.value)||0;
        if(newType!==old.type||newOpening!==(Number(old.initialBalance)||0)){
          showToast('نوع حساب و مانده افتتاحیه پس از ایجاد گردش حساب قابل تغییر نیست');return false;
        }
      }
    }
  }
  return _saveAccount93(ev,id);
};

/* Health: legacy source rows that were voided must never regenerate a journal. */
var _health93=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_health93();out.voidedSources=[];
  (state.transactions||[]).forEach(function(t){if(t.voided){var j=(state.journalEntries||[]).find(function(e){return e.auto&&e.sourceType==='transaction'&&e.sourceId===t.id});if(j)out.voidedSources.push(t.id);}});
  out.ok=out.ok&&!out.voidedSources.length;return out;
};

coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 7/23 failed:',e);}
;

/* ===== Script block 8/26 ===== */
try{
(function(){
'use strict';
/* FINAL BUGFIX PATCH v9.4 */
function v94InvoiceHasFinancialEffect(inv){
  return !!(inv && (((inv.payments||[]).some(function(p){return !p.voided&&(+p.amount||0)>0;})) ||
    (state.journalEntries||[]).some(function(e){return e.auto&&e.sourceType==='invoice'&&e.sourceId===inv.id&&e.status!=='void';}) ||
    (state.checks||[]).some(function(c){return c.invoiceId===inv.id&&c.status!=='cancelled';})));
}
window.openInvoiceForm=function(id){
  if(id){var inv=getInvoice(id);if(!inv){showToast('فاکتور پیدا نشد');return;}if(inv.voided){showToast('فاکتور باطل‌شده قابل ویرایش نیست');return;}if(!fpRequireOpen(inv.date))return;if(v94InvoiceHasFinancialEffect(inv)){showToast('فاکتور دارای اثر مالی است؛ برای اصلاح از ابطال و صدور فاکتور اصلاحی استفاده کنید');return;}draft={id:inv.id,customerId:inv.customerId,date:Object.assign({},inv.date),includeTax:!!inv.includeTax,items:(inv.items||[]).map(function(it){return Object.assign({},it);})};}
  else draft={id:null,customerId:state.customers[0]?state.customers[0].id:'',date:todayJalali(),includeTax:true,items:[{key:uid(),serviceId:'',name:'',qty:1,price:0,discount:0}]};
  nav('invoice-form',id||null);
};
window.savePayment=function(ev,invoiceId){
  ev.preventDefault();var f=ev.target,inv=getInvoice(invoiceId);if(!inv||inv.voided){showToast('فاکتور قابل پرداخت نیست');return false;}
  var date={jy:+f.jy.value,jm:+f.jm.value,jd:+f.jd.value};if(!fpRequireOpen(date))return false;
  var remaining=invoiceRemaining(inv),amount=+f.amount.value||0;if(amount<=0){showToast('مبلغ پرداخت باید بیشتر از صفر باشد');return false;}if(amount>remaining+0.001){showToast('مبلغ پرداخت از مانده فاکتور بیشتر است');return false;}
  var accountId=f.accountId.value||null;if(!accountId){showToast('حساب دریافت وجه را انتخاب کنید');return false;}
  var payment={id:uid(),date:date,amount:amount,method:f.method.value,accountId:accountId,note:f.note.value.trim()};inv.payments=inv.payments||[];inv.payments.push(payment);
  try{addTransaction(accountId,date,'deposit',amount,'دریافت وجه فاکتور #'+fa(inv.number),'invoice-payment',payment.id);}catch(e){inv.payments.pop();showToast('ثبت پرداخت ناموفق بود: '+(e.message||e));return false;}
  logEvent('invoice','دریافت '+money(amount)+' بابت فاکتور #'+fa(inv.number));save();closeModal();renderInvoiceView(invoiceId);return false;
};
window.deletePayment=function(invoiceId,paymentId){
  var inv=getInvoice(invoiceId);if(!inv)return;var p=(inv.payments||[]).find(function(x){return x.id===paymentId});if(!p||p.voided){showToast('پرداخت پیدا نشد');return;}if(!fpRequireOpen(p.date||inv.date))return;if(!confirm('پرداخت باطل و اثر حسابداری آن معکوس شود؟'))return;
  p.voided=true;p.voidedAt=new Date().toISOString();p.voidReason='ابطال پرداخت';var idx=inv.payments.indexOf(p),j=(state.journalEntries||[]).find(function(e){return e.auto&&e.sourceType==='invoice-payment'&&e.sourceId===inv.id+':p:'+idx});if(j&&!j.reversed)fpReverseJournal(j.id);
  var tx=(state.transactions||[]).find(function(t){return t.relatedType==='invoice-payment'&&t.relatedId===paymentId});if(tx)tx.voided=true;logEvent('invoice','پرداخت فاکتور #'+fa(inv.number)+' باطل شد');save();renderInvoiceView(invoiceId);
};
window.toggleVoid=function(id){
  var inv=getInvoice(id);if(!inv)return;if(inv.voided){showToast('ابطال فاکتور قطعی است؛ فاکتور اصلاحی صادر کنید');return;}if(!fpRequireOpen(inv.date))return;
  if((inv.payments||[]).some(function(p){return !p.voided&&(+p.amount||0)>0})||(state.checks||[]).some(function(c){return c.invoiceId===inv.id&&c.status!=='cancelled'})){showToast('فاکتور دارای دریافت یا چک است؛ ابتدا آثار مالی را اصلاح کنید');return;}
  if(!confirm('فاکتور باطل شود؟ این عمل برگشت‌پذیر نیست.'))return;inv.voided=true;inv.voidedAt=new Date().toISOString();inv.voidReason='ابطال فاکتور';logEvent('invoice','فاکتور #'+fa(inv.number)+' باطل شد');save();renderInvoiceView(id);
};
window.deleteInvoice=function(id){var inv=getInvoice(id);if(!inv)return;if(v94InvoiceHasFinancialEffect(inv)){showToast('فاکتور دارای اثر مالی است و قابل حذف نیست؛ آن را ابطال یا اصلاح کنید');return;}if(!fpRequireOpen(inv.date))return;if(!confirm('فاکتور بدون اثر مالی حذف شود؟'))return;if(!inv.voided)applyStockDelta(inv.items||[],1);state.invoices=state.invoices.filter(function(i){return i.id!==id});logEvent('invoice','فاکتور #'+fa(inv.number)+' حذف شد');save();renderInvoices();};
var _v94RenderInvoiceView=window.renderInvoiceView;window.renderInvoiceView=function(id){_v94RenderInvoiceView(id);var inv=getInvoice(id);if(!inv||inv.voided)return;var effect=v94InvoiceHasFinancialEffect(inv);document.querySelectorAll('#content .no-print button').forEach(function(b){var t=(b.textContent||'').trim();if(t.indexOf('ویرایش اقلام')>=0&&effect)b.disabled=true;});};
window.renderJournals=function(){window.coreRebuildLedger();var html='<div class="page-head"><div><div class="muted">دفتر ثبت حسابداری — اسناد ثبت‌شده غیرقابل ویرایش هستند</div></div><button class="btn btn-brand" onclick="openJournalForm()">+ سند جدید</button></div><div class="card"><table><thead><tr><th>شماره</th><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>نوع</th><th></th></tr></thead><tbody>';(state.journalEntries||[]).slice().sort(function(a,b){return(+b.number||0)-(+a.number||0)}).forEach(function(e){var d=(e.lines||[]).reduce(function(a,l){return a+(+l.debit||0)},0),c=(e.lines||[]).reduce(function(a,l){return a+(+l.credit||0)},0),can=e.status!=='void'&&!e.reversed&&!e.reversalOf;html+='<tr><td>'+fa(e.number)+'</td><td>'+jStrShort(e.date)+'</td><td>'+esc(e.description||'')+'</td><td class="num">'+money(d)+'</td><td class="num">'+money(c)+'</td><td>'+esc(e.auto?'سیستمی':'دستی')+(e.reversed?' / معکوس‌شده':'')+'</td><td>'+(can?'<button class="btn btn-ghost btn-sm" data-id="'+e.id+'" onclick="fpReverseJournal(this.dataset.id)">معکوس</button>':'—')+'</td></tr>';});html+='</tbody></table></div>';if(!(state.journalEntries||[]).length)html=emptyState('invoice','هنوز سندی ثبت نشده','برای شروع اولین سند حسابداری را ثبت کنید','openJournalForm()','ثبت سند');document.getElementById('content').innerHTML=html;};
window.accountBalance=function(accId){window.coreRebuildLedger();var acc=(state.bankAccounts||[]).find(function(a){return a.id===accId});if(!acc)return 0;var code=acc.type==='bank'?'102':'101',sum=0,hasOpening=false;(state.journalEntries||[]).forEach(function(e){(e.lines||[]).forEach(function(l){if(l.accountCode===code&&l.cashAccountId===accId){sum+=(+l.debit||0)-(+l.credit||0);if(e.sourceType==='opening-balance')hasOpening=true;}})});return hasOpening?sum:(+acc.initialBalance||0)+sum;};
window.openAccountCodeForm=function(id){var a=id?state.chartAccounts.find(function(x){return x.id===id}):null;if(a&&a.system){showToast('حساب سیستمی قابل تغییر نیست');return;}var used=a&&(state.journalEntries||[]).some(function(e){return(e.lines||[]).some(function(l){return String(l.accountCode)===String(a.code);});});if(a&&used){showToast('حساب دارای سابقه است؛ برای تغییر از حساب جدید استفاده کنید');return;}var body='<form id="v94AccountForm"><div class="field"><label>کد</label><input name="code" required value="'+esc(a?a.code:'')+'"></div><div class="field"><label>نام</label><input name="name" required value="'+esc(a?a.name:'')+'"></div><div class="field"><label>ماهیت</label><select name="type">'+['asset','liability','equity','revenue','expense'].map(function(t){var L={asset:'دارایی',liability:'بدهی',equity:'سرمایه',revenue:'درآمد',expense:'هزینه'};return'<option value="'+t+'"'+(a&&a.type===t?' selected':'')+'>'+L[t]+'</option>';}).join('')+'</select></div><button class="btn btn-brand">ذخیره</button></form>';openProModal(a?'ویرایش حساب':'حساب جدید',body);document.getElementById('v94AccountForm').onsubmit=function(ev){ev.preventDefault();var f=this,code=f.code.value.trim();if(!/^\d+$/.test(code)){showToast('کد حساب نامعتبر است');return false;}var other=(state.chartAccounts||[]).find(function(x){return x.code===code&&(!a||x.id!==a.id)});if(other){showToast('کد حساب تکراری است');return false;}if(a){a.code=code;a.name=f.name.value.trim();a.type=f.type.value;}else state.chartAccounts.push({id:uid(),code:code,name:f.name.value.trim(),type:f.type.value,parent:null});save();closeModal();nav('chart-accounts');return false;};};
var _v94Health=window.fpAccountingHealth;window.fpAccountingHealth=function(){window.coreRebuildLedger();var out=_v94Health();out.errors=(out.errors||[]).concat(state.__accountingWarnings||[]);out.ok=out.ok&&!out.errors.length;return out;};
coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 8/23 failed:',e);}
;

/* ===== Script block 9/26 ===== */
try{
(function(){
'use strict';
/* V10.1 STAGE 1 — invoice payment reversal identity + immediate ledger sync */
window.deletePayment=function(invoiceId,paymentId){
  var inv=getInvoice(invoiceId);if(!inv)return;
  var p=(inv.payments||[]).find(function(x){return x.id===paymentId});
  if(!p||p.voided){showToast('پرداخت پیدا نشد');return;}
  if(!fpRequireOpen(p.date||inv.date))return;
  if(!confirm('پرداخت باطل و اثر حسابداری آن معکوس شود؟'))return;
  var sourceId=inv.id+':'+p.id;
  var j=(state.journalEntries||[]).find(function(e){return e.auto&&e.sourceType==='invoice-payment'&&e.sourceId===sourceId&&!e.reversed});
  if(j) fpReverseJournal(j.id);
  p.voided=true;p.voidedAt=new Date().toISOString();p.voidReason='ابطال پرداخت';
  var tx=(state.transactions||[]).find(function(t){return t.relatedType==='invoice-payment'&&t.relatedId===paymentId});
  if(tx)tx.voided=true;
  logEvent('invoice','پرداخت فاکتور #'+fa(inv.number)+' باطل شد');
  save();fpSyncLedger();renderInvoiceView(invoiceId);
};
var _v101SavePayment=window.savePayment;
window.savePayment=function(ev,invoiceId){
  var r=_v101SavePayment(ev,invoiceId);
  if(r!==false)fpSyncLedger();
  return r;
};
})();
}catch(e){console.error('app.js block 9/23 failed:',e);}
;

/* ===== Script block 10/26 ===== */
try{
(function(){
'use strict';
/* V10.2 STAGE 2 — check lifecycle: bounced checks always reverse an existing note */
var _v102CoreRebuildLedger=window.coreRebuildLedger;
window.coreRebuildLedger=function(){
  return _v102CoreRebuildLedger();
};
/* The actual check rules live in the core rebuild function. Replace it once with a corrected version
   by wrapping journal generation for bounced checks after the core rebuild. Existing incorrect bounce
   journals are removed before regeneration. */
var _v102Rebuild=window.coreRebuildLedger;
window.coreRebuildLedger=function(){
  var result=_v102Rebuild();
  /* Remove legacy check-bounce auto journals; corrected lifecycle journals are generated below. */
  state.journalEntries=(state.journalEntries||[]).filter(function(e){
    return !(e.auto && !e.reversed && e.status!=='reversed' && (e.sourceType==='check-bounce-ar'||e.sourceType==='check-bounce-ap'||e.sourceType==='check-bounce-cash'));
  });
  function post(st,id,date,desc,lines,meta){
    if(!lines||!lines.length)return;
    var d=lines.reduce(function(a,l){return a+(+l.debit||0)},0),c=lines.reduce(function(a,l){return a+(+l.credit||0)},0);
    if(Math.abs(d-c)>0.01)return;
    var existing=state.journalEntries.find(function(e){return e.auto&&e.sourceType===st&&e.sourceId===id&&!e.reversed});
    if(existing)return existing;
    var n=fpNextJournalNo();
    var e={id:uid(),number:n,date:date||todayJalali(),description:desc,lines:lines,status:'posted',auto:true,sourceType:st,sourceId:id,createdAt:new Date().toISOString()};Object.assign(e,meta||{});state.journalEntries.push(e);return e;
  }
  (state.checks||[]).forEach(function(c){
    if(c.status!=='bounced')return;
    var amt=+c.amount||0;if(amt<=0)return;
    var party=c.customerId||c.supplierId||null,d=c.bounceDate||todayJalali();
    /* A bounced check still has an original issuance/receipt event. Recreate it if legacy data skipped it. */
    if(c.direction==='receivable')post('check-receive',c.id,c.date||c.dueDate,'دریافت چک '+(c.number||''),[corePartyLine('108',amt,0,'اسناد دریافتنی',party,'customer'),corePartyLine('103',0,amt,'کاهش طلب مشتری',party,'customer')],{checkId:c.id});
    else if(c.direction==='payable')post('check-issue',c.id,c.date||c.dueDate,'صدور چک '+(c.number||''),[corePartyLine('201',amt,0,'کاهش بدهی تأمین‌کننده',party,'supplier'),corePartyLine('204',0,amt,'اسناد پرداختنی',party,'supplier')],{checkId:c.id});
    if(c.direction==='receivable'){
      /* If it was never cashed: reverse the note itself. If it was cashed: reverse cash first, then restore AR. */
      if(c.cashDate&&c.accountId){
        try{post('check-bounce-cash',c.id,d,'برگشت وصول چک '+(c.number||''),[corePartyLine('108',amt,0,'برگشت سند دریافتنی',party,'customer'),coreCashLine(c.accountId,0,amt,'برگشت وجه چک')],{checkId:c.id});}
        catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'check-bounce-cash',sourceId:c.id,error:e.message}]);}
      }
      post('check-bounce-ar',c.id,d,'بازگشت طلب چک '+(c.number||''),[corePartyLine('103',amt,0,'بازگشت طلب مشتری',party,'customer'),corePartyLine('108',0,amt,'خروج از اسناد دریافتنی',party,'customer')],{checkId:c.id});
    }else if(c.direction==='payable'){
      if(c.cashDate&&c.accountId){
        try{post('check-bounce-cash',c.id,d,'برگشت پرداخت چک '+(c.number||''),[coreCashLine(c.accountId,amt,0,'برگشت وجه چک'),corePartyLine('204',0,amt,'معکوس پرداخت سند',party,'supplier')],{checkId:c.id});}
        catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'check-bounce-cash',sourceId:c.id,error:e.message}]);}
        post('check-bounce-ap',c.id,d,'بازگشت بدهی چک '+(c.number||''),[coreLine('204',amt,0,'خروج از اسناد پرداختنی'),coreLine('201',0,amt,'بازگشت بدهی تأمین‌کننده')],{checkId:c.id});
      }else{
        post('check-bounce-ap',c.id,d,'ابطال چک پرداختنی '+(c.number||''),[coreLine('204',amt,0,'خروج از اسناد پرداختنی'),coreLine('201',0,amt,'بازگشت بدهی تأمین‌کننده')],{checkId:c.id});
      }
    }
  });
  return result;
};
})();
}catch(e){console.error('app.js block 10/23 failed:',e);}
;

/* ===== Script block 11/26 ===== */
try{
(function(){
'use strict';
/* V10.4 STAGE 5 — expense settlement invariant */
var _v104SaveExpense=window.saveExpense;
if(_v104SaveExpense)window.saveExpense=function(ev,id){
  if(id){var old=state.expenses.find(function(x){return x.id===id});if(old){var paid=(old.payments||[]).filter(function(p){return !p.voided}).reduce(function(a,p){return a+(+p.amount||0)},0);var accountId=ev&&ev.target&&ev.target.accountId?ev.target.accountId.value||null:null;if(paid>0&&accountId){showToast('هزینه دارای تسویه است؛ حساب پرداخت مستقیم نمی‌تواند هم‌زمان فعال باشد');return false;}}}
  return _v104SaveExpense(ev,id);
};
var _v104Health=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_v104Health();out.expenseSettlementConflict=[];
  (state.expenses||[]).forEach(function(e){var paid=(e.payments||[]).filter(function(p){return !p.voided}).reduce(function(a,p){return a+(+p.amount||0)},0);if(e.accountId&&paid>0)out.expenseSettlementConflict.push(e.id);});
  out.ok=out.ok&&!out.expenseSettlementConflict.length;return out;
};
coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 11/23 failed:',e);}
;

/* ===== Script block 12/26 ===== */
try{
(function(){
'use strict';
/* V10.5 STAGE 6 — historical COGS integrity */
var _v105Health=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_v105Health();out.unresolvedCOGS=[];
  (state.invoices||[]).forEach(function(inv){if(inv.voided)return;(inv.items||[]).forEach(function(it){var sv=it.serviceId&&getService(it.serviceId);if(sv&&sv.trackStock&&(it.costPriceAtSale==null||it.costPriceAtSale===undefined))out.unresolvedCOGS.push({invoice:inv.number,item:it.name||it.serviceId});});});
  out.ok=out.ok&&!out.unresolvedCOGS.length;return out;
};
coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 12/23 failed:',e);}
;

/* ===== Script block 13/26 ===== */
try{
(function(){
'use strict';
/* V10.6 STAGE 7 — monthly fixed-asset depreciation schedule */
function v106PeriodKey(d){return String(d.jy)+'/'+String(d.jm).padStart(2,'0');}
function v106BuildSchedule(a,today){
  var cost=+a.cost||0,life=Math.max(1,+a.life||1),maxMonths=life*12;if(cost<=0)return [];
  a.deprSchedule=Array.isArray(a.deprSchedule)?a.deprSchedule:[];
  if(!a.deprSchedule.length&&+a.depr>0){a.deprSchedule.push({id:'legacy-'+uid(),date:a.lastDepDate||a.date,period:v106PeriodKey(a.lastDepDate||a.date),amount:+a.depr||0,legacy:true});}
  var used={};a.deprSchedule.forEach(function(s){used[s.period||v106PeriodKey(s.date)]=1;});
  var base=Math.round(cost/maxMonths),sum=a.deprSchedule.reduce(function(x,s){return x+(+s.amount||0)},0);
  var start=a.lastDepDate?jToJdn(a.lastDepDate):jToJdn(a.date);
  var now=jToJdn(today),due=Math.max(0,Math.floor((now-start)/30));
  var existingCount=Math.max(0,a.deprSchedule.filter(function(s){return !s.legacy}).length);
  for(var n=existingCount;n<Math.min(due,maxMonths);n++){
    var d=d2j(jToJdn(a.date)+30*(n+1)),period=v106PeriodKey(d);if(used[period])continue;
    var remaining=Math.max(0,cost-sum),amount=n===maxMonths-1?remaining:Math.min(base,remaining);if(amount<=0)break;
    a.deprSchedule.push({id:uid(),date:d,period:period,amount:amount});used[period]=1;sum+=amount;
  }
  a.depr=Math.min(cost,a.deprSchedule.reduce(function(x,s){return x+(+s.amount||0)},0));
  a.lastDepDate=a.deprSchedule.length?a.deprSchedule[a.deprSchedule.length-1].date:a.lastDepDate||null;
  return a.deprSchedule;
}
window.fpPostDepreciation=function(id){
  var a=state.fixedAssets.find(function(x){return x.id===id});if(!a)return;
  var t=todayJalali();if(!fpRequireOpen(t))return;
  var before=(a.deprSchedule||[]).length;v106BuildSchedule(a,t);var after=(a.deprSchedule||[]).length;
  if(after<=before){showToast('استهلاک جدیدی برای این دارایی ثبت نشده است');return;}
  save();fpSyncLedger();nav('fixed-assets');
};
var _v106Health=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_v106Health();out.depreciationScheduleErrors=[];
  (state.fixedAssets||[]).forEach(function(a){if(!Array.isArray(a.deprSchedule)||!a.deprSchedule.length)return;var total=a.deprSchedule.reduce(function(x,s){return x+(+s.amount||0)},0);if(total>(+a.cost||0)+0.01)out.depreciationScheduleErrors.push(a.id+':over');if(Math.abs(total-(+a.depr||0))>0.01)out.depreciationScheduleErrors.push(a.id+':aggregate');});
  out.ok=out.ok&&!out.depreciationScheduleErrors.length;return out;
};
coreRebuildLedger();save();
})();
}catch(e){console.error('app.js block 13/23 failed:',e);}
;

/* ===== Script block 14/26 ===== */
try{
(function(){
'use strict';
/* V10.8 — sales/payment/check lifecycle hardening */
function v108Sync(){try{if(typeof fpSyncLedger==='function')fpSyncLedger();}catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'v108-sync',error:e.message}]);}}

/* Invoice save must finish with operational stock + accounting state rebuilt. */
var _v108SaveInvoice=window.saveInvoiceDraft;
window.saveInvoiceDraft=function(){
  var r=_v108SaveInvoice.apply(this,arguments);
  if(r!==false){v108Sync();}
  return r;
};

/* Payment void: locate the journal by the stable payment id, never by array index. */
window.deletePayment=function(invoiceId,paymentId){
  var inv=getInvoice(invoiceId),p=inv&&(inv.payments||[]).find(function(x){return x.id===paymentId});
  if(!p||p.voided){showToast('پرداخت پیدا نشد');return;}
  if(!fpRequireOpen(p.date||inv.date))return;
  if(!confirm('پرداخت باطل و اثر حسابداری آن معکوس شود؟'))return;
  p.voided=true;p.voidedAt=new Date().toISOString();p.voidReason='ابطال پرداخت';
  var j=(state.journalEntries||[]).find(function(e){return e.auto&&e.sourceType==='invoice-payment'&&e.sourceId===inv.id+':'+paymentId&&!e.reversed});
  if(j)fpReverseJournal(j.id);
  var tx=(state.transactions||[]).find(function(t){return t.relatedType==='invoice-payment'&&t.relatedId===paymentId&&!t.voided});
  if(tx)tx.voided=true;
  logEvent('invoice','پرداخت فاکتور #'+fa(inv.number)+' باطل شد');
  save();v108Sync();renderInvoiceView(invoiceId);
};

/* Invoice void must immediately rebuild Ledger and stock. */
var _v108ToggleVoid=window.toggleVoid;
window.toggleVoid=function(id){
  var before=getInvoice(id);
  var r=_v108ToggleVoid.apply(this,arguments);
  var after=getInvoice(id);
  if(after&&after.voided&&!before.voided)v108Sync();
  return r;
};

/* Check cashing must immediately rebuild cash/bank Ledger. */
var _v108CashCheck=window.cashCheck;
window.cashCheck=function(ev,id){
  var c=state.checks.find(function(x){return x.id===id}),before=c&&c.status;
  var r=_v108CashCheck.apply(this,arguments);
  var after=state.checks.find(function(x){return x.id===id});
  if(after&&before==='pending'&&after.status==='cashed')v108Sync();
  return r;
};

/* Bounce must rebuild the full check lifecycle immediately and only once. */
var _v108BounceCheck=window.bounceCheck;
window.bounceCheck=function(id){
  var c=state.checks.find(function(x){return x.id===id});
  if(!c||c.status==='bounced'){showToast('این چک قبلاً برگشت خورده است');return;}
  var before=c.status;
  var r=_v108BounceCheck.apply(this,arguments);
  var after=state.checks.find(function(x){return x.id===id});
  if(after&&before!=='bounced'&&after.status==='bounced')v108Sync();
  return r;
};

/* Pending check deletion is safe; posted checks remain immutable. */
var _v108DeleteCheck=window.deleteCheck;
window.deleteCheck=function(id){
  var c=state.checks.find(function(x){return x.id===id});
  if(!c)return;
  if(c.status!=='pending'){showToast('چک دارای اثر حسابداری است و حذف مستقیم آن مجاز نیست');return;}
  return _v108DeleteCheck.apply(this,arguments);
};

/* Strong lifecycle health checks. */
var _v108Health=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=_v108Health();out.salesLifecycle=[];out.checkLifecycle=[];
  (state.invoices||[]).forEach(function(inv){
    var paid=(inv.payments||[]).filter(function(p){return p&&!p.voided}).reduce(function(a,p){return a+(+p.amount||0)},0);
    if(paid>+inv.grandTotal+0.01)out.salesLifecycle.push('overpayment:'+inv.id);
    if(inv.voided&&paid>0)out.salesLifecycle.push('void-invoice-paid:'+inv.id);
  });
  (state.checks||[]).forEach(function(c){
    if(c.status==='bounced'){
      var hasOriginal=(state.journalEntries||[]).some(function(e){return e.auto&&(e.sourceType==='check-receive'||e.sourceType==='check-issue')&&e.sourceId===c.id&&!e.reversed});
      if(!hasOriginal)out.checkLifecycle.push('missing-original:'+c.id);
    }
  });
  out.ok=out.ok&&!out.salesLifecycle.length&&!out.checkLifecycle.length;return out;
};

v108Sync();
})();
}catch(e){console.error('app.js block 14/23 failed:',e);}
;

/* ===== Script block 15/26 ===== */
try{
(function(){
'use strict';
/* V10.7 FINAL FIX — historical cost + invoice sync + balance consistency */
if(typeof v6SnapshotInvoiceCosts==='function'){
  v6SnapshotInvoiceCosts=function(inv){
    (inv&&inv.items||[]).forEach(function(it){
      if(!it.serviceId||it.costPriceAtSale!=null)return;
      var sv=getService(it.serviceId); if(!sv||!sv.trackStock)return;
      var target=jToJdn(inv.date||todayJalali()),q=0,total=0;
      (state.stockMoves||[]).forEach(function(m){
        if(m.voided||m.serviceId!==it.serviceId||m.sourceType==='invoice'&&m.sourceId===inv.id||jToJdn(m.date)>target)return;
        var qty=+m.qty||0,u=+m.unitCost||0;
        if(qty>0&&u>0&&(m.type==='purchase'||m.type==='in'||m.type==='adjust-in')){q+=qty;total+=qty*u;}
      });
      if(q>0){it.costPriceAtSale=total/q;it.costMethod='moving-average';}
      else{it.costPriceAtSale=null;it.costMethod='unresolved';}
    });
  };
}
/* Rebuild once so legacy invoices are brought into the same invariant immediately. */
try{if(typeof fpSyncLedger==='function')fpSyncLedger();}catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'final-integrity-sync',error:e.message}]);}
})();
}catch(e){console.error('app.js block 15/23 failed:',e);}
;

/* ===== Script block 16/26 ===== */
try{
(function(){
'use strict';
function purchaseById(id){return (state.purchaseInvoices||[]).find(function(x){return x.id===id;});}
function purchasePaid(p){return (p.payments||[]).filter(function(x){return x&&!x.voided;}).reduce(function(a,x){return a+(+x.amount||0)},0);}
function purchaseRemaining(p){return Math.max(0,(+p.grandTotal||0)-purchasePaid(p));}
function purchaseStatus(p){if(p.voided)return 'void';var r=purchaseRemaining(p);return r<=.01?'paid':purchasePaid(p)>0?'partial':'pending';}
window.renderPurchaseInvoices=function(){
 var list=(state.purchaseInvoices||[]).slice().sort(function(a,b){return jToJdn(b.date)-jToJdn(a.date);});
 var html='<div class="spread"><div><div class="muted">خرید کالا و ایجاد بدهی تأمین‌کننده</div></div><div class="row"><button class="btn btn-brand" onclick="openPurchaseForm()">'+icon('plus')+' فاکتور خرید</button></div></div>';
 if(!list.length){html+=emptyState('invoice','هنوز فاکتور خریدی ثبت نشده','برای ثبت خرید و افزایش موجودی، اولین فاکتور خرید را ثبت کنید','openPurchaseForm()','فاکتور خرید');document.getElementById('content').innerHTML=html;return;}
 html+='<div class="card"><table><thead><tr><th>شماره</th><th>تأمین‌کننده</th><th>تاریخ</th><th>مبلغ</th><th>مانده</th><th>وضعیت</th><th></th></tr></thead><tbody>';
 list.forEach(function(p){var s=(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});html+='<tr style="cursor:pointer" onclick="nav(\'purchase-view\',\''+p.id+'\')"><td class="num">'+fa(p.number)+'</td><td>'+esc(s?s.name:'تأمین‌کننده حذف‌شده')+'</td><td>'+jStrShort(p.date)+'</td><td class="num">'+money(p.grandTotal)+'</td><td class="num">'+money(purchaseRemaining(p))+'</td><td>'+statusBadge(purchaseStatus(p))+'</td><td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openPurchaseForm(\''+p.id+'\')">ویرایش</button></td></tr>';});
 html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;
};
var pDraft=null;
window.openPurchaseForm=function(id){
 var p=id?purchaseById(id):null;
 if(p){if(purchasePaid(p)>0){showToast('فاکتور خرید دارای پرداخت است و برای حفظ سابقه قابل ویرایش نیست');return;}pDraft=JSON.parse(JSON.stringify(p));}
 else pDraft={id:null,number:null,supplierId:(state.suppliers||[])[0]?state.suppliers[0].id:'',date:todayJalali(),includeTax:true,items:[{key:uid(),serviceId:'',name:'',qty:1,unitCost:0,discount:0}],payments:[]};
 nav('purchase-form',id||null);
};
window.renderPurchaseForm=function(){
 if(!pDraft){nav('purchase-invoices');return;}
 if(!(state.suppliers||[]).length){document.getElementById('content').innerHTML=emptyState('users','ابتدا یک تأمین‌کننده ثبت کنید','برای ثبت فاکتور خرید به تأمین‌کننده نیاز دارید','openSupplierForm()','افزودن تأمین‌کننده');return;}
 var days=jDaysInMonth(pDraft.date.jy,pDraft.date.jm),html='<div class="two-col"><div class="card">';
 html+='<div class="field"><label>تأمین‌کننده *</label><select onchange="pDraft.supplierId=this.value">'+state.suppliers.map(function(s){return '<option value="'+s.id+'"'+(s.id===pDraft.supplierId?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select></div>';
 html+='<div class="field"><label>تاریخ خرید</label><div class="field-row3"><select onchange="pDraft.date.jd=Number(this.value)">'+range(1,days).map(function(d){return '<option value="'+d+'"'+(d===pDraft.date.jd?' selected':'')+'>'+fa(d)+'</option>';}).join('')+'</select><select onchange="pDraft.date.jm=Number(this.value);renderPurchaseForm()">'+J_MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(i+1===pDraft.date.jm?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select onchange="pDraft.date.jy=Number(this.value)">'+range(pDraft.date.jy-5,pDraft.date.jy+2).map(function(y){return '<option value="'+y+'"'+(y===pDraft.date.jy?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div></div>';
 html+='<div class="section-title" style="margin-top:18px">اقلام خرید</div><table class="items-table"><thead><tr><th>کالا</th><th>تعداد</th><th>بهای واحد</th><th>تخفیف</th><th>جمع</th><th></th></tr></thead><tbody id="purchaseItems">'+purchaseRows()+'</tbody></table><button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="addPurchaseRow()">'+icon('plus')+' افزودن ردیف</button>';
 html+='<div class="field" style="margin-top:16px"><label><input type="checkbox" style="width:auto;display:inline-block" '+(pDraft.includeTax?'checked':'')+' onchange="pDraft.includeTax=this.checked;updatePurchaseTotals()"> احتساب مالیات خرید ('+fa(state.business.taxRate)+'٪)</label></div>';
 var c=purchaseCalc();html+='<div class="totals-box" id="purchaseTotals"><div class="trow"><span>جمع خرید</span><span class="num">'+money(c.subtotal)+'</span></div>'+(pDraft.includeTax?'<div class="trow"><span>اعتبار مالیاتی</span><span class="num">'+money(c.tax)+'</span></div>':'')+'<div class="trow grand"><span>مبلغ نهایی</span><span class="num">'+money(c.grand)+'</span></div></div>';
 html+='<div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-ghost" onclick="pDraft=null;nav(\'purchase-invoices\')">انصراف</button><button class="btn btn-brand" onclick="savePurchaseDraft()">'+icon('check')+' ذخیره فاکتور خرید</button></div></div>';
 html+='<div class="card" style="align-self:flex-start"><div class="section-title">نکته حسابداری</div><div class="muted" style="font-size:13px;line-height:1.9">با ثبت فاکتور خرید، موجودی کالا افزایش یافته و بدهی تأمین‌کننده ایجاد می‌شود. مالیات خرید در حساب اعتبار مالیاتی ثبت می‌شود. پرداخت از صفحه مشاهده فاکتور انجام می‌شود.</div></div></div>';
 document.getElementById('content').innerHTML=html;
};
function purchaseRows(){return pDraft.items.map(function(it){var total=(+it.qty||0)*(+it.unitCost||0)- (+it.discount||0);return '<tr><td><select onchange="purchaseServiceChange(\''+it.key+'\',this.value)"><option value="">— کالا —</option>'+state.services.filter(function(s){return s.trackStock;}).map(function(s){return '<option value="'+s.id+'"'+(s.id===it.serviceId?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select>'+(it.serviceId?'':'<input style="margin-top:6px" placeholder="شرح کالا" value="'+esc(it.name||'')+'" oninput="purchaseField(\''+it.key+'\',\'name\',this.value)">')+'</td><td><input type="number" min="1" step="1" value="'+it.qty+'" oninput="purchaseField(\''+it.key+'\',\'qty\',this.value)"></td><td><input type="number" min="0.01" step="0.01" value="'+it.unitCost+'" oninput="purchaseField(\''+it.key+'\',\'unitCost\',this.value)"></td><td><input type="number" min="0" value="'+it.discount+'" oninput="purchaseField(\''+it.key+'\',\'discount\',this.value)"></td><td class="num" id="pt-'+it.key+'">'+money(total)+'</td><td><button type="button" class="btn btn-ghost icon-btn btn-danger" onclick="removePurchaseRow(\''+it.key+'\')">×</button></td></tr>';}).join('');}
function purchaseCalc(){var subtotal=pDraft.items.reduce(function(a,it){return a+(+it.qty||0)*(+it.unitCost||0)- (+it.discount||0);},0);var tax=pDraft.includeTax?Math.round(subtotal*Number(state.business.taxRate||0)/100):0;return {subtotal:subtotal,tax:tax,grand:subtotal+tax};}
window.purchaseField=function(k,f,v){var it=pDraft.items.find(function(x){return x.key===k;});if(!it)return;it[f]=['qty','unitCost','discount'].includes(f)?Number(v)||0:v;var cell=document.getElementById('pt-'+k);if(cell)cell.textContent=money((+it.qty||0)*(+it.unitCost||0)- (+it.discount||0));updatePurchaseTotals();};
window.purchaseServiceChange=function(k,id){var it=pDraft.items.find(function(x){return x.key===k;});if(!it)return;it.serviceId=id;if(id){var s=getService(id);it.name=s.name;}else it.name='';document.getElementById('purchaseItems').innerHTML=purchaseRows();};
window.addPurchaseRow=function(){pDraft.items.push({key:uid(),serviceId:'',name:'',qty:1,unitCost:0,discount:0});document.getElementById('purchaseItems').innerHTML=purchaseRows();};
window.removePurchaseRow=function(k){if(pDraft.items.length<=1){showToast('حداقل یک ردیف لازم است');return;}pDraft.items=pDraft.items.filter(function(x){return x.key!==k;});document.getElementById('purchaseItems').innerHTML=purchaseRows();updatePurchaseTotals();};
window.updatePurchaseTotals=function(){var c=purchaseCalc(),b=document.getElementById('purchaseTotals');if(b)b.innerHTML='<div class="trow"><span>جمع خرید</span><span class="num">'+money(c.subtotal)+'</span></div>'+(pDraft.includeTax?'<div class="trow"><span>اعتبار مالیاتی</span><span class="num">'+money(c.tax)+'</span></div>':'')+'<div class="trow grand"><span>مبلغ نهایی</span><span class="num">'+money(c.grand)+'</span></div>';};
window.savePurchaseDraft=function(){if(!pDraft.supplierId){showToast('تأمین‌کننده را انتخاب کنید');return;}var valid=pDraft.items.filter(function(it){return it.serviceId&&it.qty>0&&it.unitCost>0;});if(!valid.length||valid.length!==pDraft.items.length){showToast('همه ردیف‌ها باید کالا، تعداد و بهای واحد معتبر داشته باشند');return;}var c=purchaseCalc();if(c.grand<=0){showToast('مبلغ خرید باید بیشتر از صفر باشد');return;}if(pDraft.id){var p=purchaseById(pDraft.id);if(!p)return;p.supplierId=pDraft.supplierId;p.date=pDraft.date;p.items=pDraft.items;p.includeTax=pDraft.includeTax;p.subtotal=c.subtotal;p.tax=c.tax;p.grandTotal=c.grand;showToast('فاکتور خرید بروزرسانی شد');}else{var no=state.business.nextPurchaseNo||1;state.business.nextPurchaseNo=no+1;var p={id:uid(),number:no,supplierId:pDraft.supplierId,date:pDraft.date,items:pDraft.items,includeTax:pDraft.includeTax,subtotal:c.subtotal,tax:c.tax,grandTotal:c.grand,voided:false,payments:[]};state.purchaseInvoices.push(p);pDraft.id=p.id;showToast('فاکتور خرید ثبت شد');}var savedId=pDraft.id;save();pDraft=null;fpSyncLedger();nav('purchase-view',savedId);};
window.renderPurchaseView=function(id){var p=purchaseById(id);if(!p){nav('purchase-invoices');return;}var s=(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});var html='<div class="spread"><div><button class="btn btn-ghost" onclick="nav(\'purchase-invoices\')">بازگشت</button></div><div class="row">'+(!p.voided&&purchasePaid(p)<=.01?'<button class="btn btn-ghost" onclick="openPurchaseForm(\''+p.id+'\')">ویرایش</button>':'')+(!p.voided&&purchaseRemaining(p)>.01?'<button class="btn btn-brand" onclick="openPurchasePayment(\''+p.id+'\')">ثبت پرداخت</button>':'')+'</div></div><div class="card"><div class="section-title">فاکتور خرید #'+fa(p.number)+'</div><p>تأمین‌کننده: <b>'+esc(s?s.name:'—')+'</b> — تاریخ: '+jStrShort(p.date)+'</p><table><thead><tr><th>کالا</th><th>تعداد</th><th>بهای واحد</th><th>جمع</th></tr></thead><tbody>'+p.items.map(function(it){return '<tr><td>'+esc(it.name||((getService(it.serviceId)||{}).name)||'—')+'</td><td class="num">'+fa(it.qty)+'</td><td class="num">'+money(it.unitCost)+'</td><td class="num">'+money((+it.qty||0)*(+it.unitCost||0)- (+it.discount||0))+'</td></tr>';}).join('')+'</tbody></table><div class="totals-box"><div class="trow"><span>جمع</span><span>'+money(p.subtotal)+'</span></div>'+(p.tax?'<div class="trow"><span>اعتبار مالیاتی</span><span>'+money(p.tax)+'</span></div>':'')+'<div class="trow grand"><span>نهایی</span><span>'+money(p.grandTotal)+'</span></div><div class="trow"><span>پرداخت‌شده</span><span>'+money(purchasePaid(p))+'</span></div><div class="trow"><span>مانده بدهی</span><span>'+money(purchaseRemaining(p))+'</span></div></div>';
 var payRows=(p.payments||[]).filter(function(x){return !x.voided;}).map(function(x){var a=(state.bankAccounts||[]).find(function(b){return b.id===x.accountId;});return '<tr><td>'+jStrShort(x.date||p.date)+'</td><td class="num">'+money(x.amount)+'</td><td>'+esc(a?a.name:'—')+'</td><td><button class="btn btn-ghost btn-sm btn-danger" onclick="voidPurchasePayment(\''+p.id+'\',\''+x.id+'\')">ابطال پرداخت</button></td></tr>';}).join('');
 html+='<div class="section-title" style="margin-top:18px">پرداخت‌ها</div><table><thead><tr><th>تاریخ</th><th>مبلغ</th><th>حساب</th><th></th></tr></thead><tbody>'+(payRows||'<tr><td colspan="4" class="muted">پرداختی ثبت نشده است.</td></tr>')+'</tbody></table>';
 if(p.voided)html+='<div class="muted">این فاکتور ابطال شده است.</div>';else html+='<div style="margin-top:12px"><button class="btn btn-danger" onclick="voidPurchase(\''+p.id+'\')">ابطال فاکتور خرید</button></div>';
 html+='</div>';document.getElementById('content').innerHTML=html;};
window.openPurchasePayment=function(id){var p=purchaseById(id);if(!p)return;var rem=purchaseRemaining(p);var opts=state.bankAccounts.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('');openProModal('پرداخت فاکتور خرید','<form onsubmit="return savePurchasePayment(event,\''+id+'\')"><div class="field"><label>مبلغ</label><input name="amount" type="number" min="0.01" max="'+rem+'" step="0.01" value="'+rem+'" required></div><div class="field"><label>حساب پرداخت</label><select name="accountId">'+opts+'</select></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><button class="btn btn-brand">ثبت پرداخت</button></form>');};
window.savePurchasePayment=function(ev,id){ev.preventDefault();var f=ev.target,p=purchaseById(id);if(!p)return false;var amount=Number(f.amount.value)||0,rem=purchaseRemaining(p);if(amount<=0||amount>rem+.01){showToast('مبلغ پرداخت نامعتبر است');return false;}if(!f.accountId.value){showToast('حساب پرداخت را انتخاب کنید');return false;}p.payments=p.payments||[];p.payments.push({id:uid(),amount:amount,accountId:f.accountId.value,date:readDateInput(f,'date'),voided:false});save();closeModal();fpSyncLedger();renderPurchaseView(id);return false;};
window.voidPurchasePayment=function(id,pid){var p=purchaseById(id);if(!p)return;var x=(p.payments||[]).find(function(z){return z.id===pid;});if(!x||x.voided)return;if(!confirm('این پرداخت ابطال شود؟'))return;x.voided=true;x.voidedAt=new Date().toISOString();save();fpSyncLedger();renderPurchaseView(id);};
window.voidPurchase=function(id){var p=purchaseById(id);if(!p)return;if(purchasePaid(p)>0){showToast('فاکتور خرید دارای پرداخت است؛ ابتدا پرداخت‌ها را ابطال کنید');return;}if(!confirm('فاکتور خرید ابطال شود؟ موجودی و بدهی تأمین‌کننده نیز برمی‌گردد.'))return;p.voided=true;p.voidedAt=new Date().toISOString();save();fpSyncLedger();renderPurchaseView(id);};
/* Export for later patch IIFEs that call this as a global. */
window.purchaseById=purchaseById;window.purchasePaid=purchasePaid;window.purchaseRemaining=purchaseRemaining;
})();
}catch(e){console.error('app.js block 16/23 failed:',e);}
;

/* ===== Script block 17/26 ===== */
try{
(function(){
  if(!state.purchaseReturns) state.purchaseReturns=[];
  if(!state.business.nextPurchaseReturnNo) state.business.nextPurchaseReturnNo=1;
  function prById(id){return (state.purchaseReturns||[]).find(function(x){return x.id===id;});}
  function prPaidForInvoice(invId){return (state.purchaseReturns||[]).filter(function(r){return r.purchaseInvoiceId===invId&&!r.voided;}).reduce(function(a,r){return a+(+r.grandTotal||0);},0);}
  function prReturnedForItem(invId,key){return (state.purchaseReturns||[]).filter(function(r){return r.purchaseInvoiceId===invId&&!r.voided;}).reduce(function(a,r){return a+(r.items||[]).filter(function(x){return String(x.sourceKey)===String(key);}).reduce(function(q,x){return q+(+x.qty||0);},0);},0);}
  function prPurchaseOptions(){return (state.purchaseInvoices||[]).filter(function(p){return !p.voided&&p.items&&p.items.some(function(it,idx){var k=String(it.key||idx);return (+it.qty||0)-prReturnedForItem(p.id,k)>0;});}).map(function(p){var s=(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});return '<option value="'+p.id+'">#'+fa(p.number)+' — '+esc(s?s.name:'—')+' — '+jStrShort(p.date)+'</option>';}).join('');}
  window.renderPurchaseReturns=function(){var list=(state.purchaseReturns||[]).slice().sort(function(a,b){return jToJdn(b.date)-jToJdn(a.date);});var html='<div class="spread"><div><div class="muted">برگشت کالا به تأمین‌کننده و کاهش بدهی</div></div><button class="btn btn-brand" onclick="openPurchaseReturnForm()">'+icon('plus')+' برگشت از خرید</button></div>';if(!list.length){html+=emptyState('invoice','هنوز برگشت خریدی ثبت نشده','برای برگرداندن کالا به تأمین‌کننده، یک برگشت خرید ثبت کنید','openPurchaseReturnForm()','برگشت از خرید');document.getElementById('content').innerHTML=html;return;}html+='<div class="card"><table><thead><tr><th>شماره</th><th>فاکتور خرید</th><th>تأمین‌کننده</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>';list.forEach(function(r){var p=purchaseById(r.purchaseInvoiceId),s=p&&(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});html+='<tr style="cursor:pointer" onclick="nav(\'purchase-return-view\',\''+r.id+'\')"><td>'+fa(r.number)+'</td><td>#'+fa(p?p.number:'—')+'</td><td>'+esc(s?s.name:'—')+'</td><td>'+jStrShort(r.date)+'</td><td class="num">'+money(r.grandTotal)+'</td><td>'+statusBadge(r.voided?'باطل':'ثبت‌شده')+'</td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
  window.openPurchaseReturnForm=function(id){var r=id?prById(id):null;if(r){if(r.voided){showToast('برگشت ابطال‌شده قابل ویرایش نیست');return;}r=JSON.parse(JSON.stringify(r));var p=purchaseById(r.purchaseInvoiceId);if(p)(r.items||[]).forEach(function(it){var src=(p.items||[]).find(function(x,idx){return String(x.key||idx)===String(it.sourceKey);});it.maxQty=Math.max(0,(src?+src.qty:0)-prReturnedForItem(p.id,it.sourceKey,r.id));});}else r={id:null,number:null,purchaseInvoiceId:'',supplierId:null,date:todayJalali(),items:[],subtotal:0,tax:0,grandTotal:0,includeTax:false,voided:false};window.prDraft=r;renderPurchaseReturnForm();};
  window.renderPurchaseReturnForm=function(){var r=window.prDraft;if(!r){nav('purchase-returns');return;}var days=jDaysInMonth(r.date.jy,r.date.jm);var html='<div class="spread"><button class="btn btn-ghost" onclick="prDraft=null;nav(\'purchase-returns\')">بازگشت</button><button class="btn btn-brand" onclick="savePurchaseReturnDraft()">'+icon('check')+' ثبت برگشت</button></div><div class="card"><div class="field"><label>فاکتور خرید مرجع *</label><select onchange="prSelectPurchase(this.value)" '+(r.id?'disabled':'')+'><option value="">— انتخاب فاکتور خرید —</option>'+prPurchaseOptions().replace('value="'+r.purchaseInvoiceId+'"','value="'+r.purchaseInvoiceId+'" selected')+'</select></div>'+(r.purchaseInvoiceId?'<div class="field"><label>تاریخ برگشت</label><div class="field-row3"><input type="number" value="'+r.date.jy+'" onchange="prDraft.date.jy=+this.value"><input type="number" value="'+r.date.jm+'" onchange="prDraft.date.jm=+this.value"><input type="number" value="'+r.date.jd+'" onchange="prDraft.date.jd=+this.value"></div></div><table><thead><tr><th>کالا</th><th>خرید</th><th>قبلاً برگشت</th><th>این برگشت</th><th>بهای واحد</th><th>جمع</th></tr></thead><tbody>'+prRows()+'</tbody></table><div id="prTotals" class="totals-box" style="margin-top:14px"></div>':'<p class="muted">ابتدا فاکتور خرید مرجع را انتخاب کنید.</p>')+'</div>';document.getElementById('content').innerHTML=html;updatePurchaseReturnTotals();};
  window.prSelectPurchase=function(id){var p=purchaseById(id);if(!p)return;prDraft.purchaseInvoiceId=p.id;prDraft.supplierId=p.supplierId;prDraft.date=todayJalali();prDraft.includeTax=!!p.includeTax;prDraft.items=(p.items||[]).map(function(it,idx){var key=String(it.key||idx),remaining=(+it.qty||0)-prReturnedForItem(p.id,key);return {key:uid(),sourceKey:key,serviceId:it.serviceId,name:it.name||((getService(it.serviceId)||{}).name)||'',qty:0,maxQty:Math.max(0,remaining),unitCost:Math.max(0,((+it.qty||0)*(+it.unitCost||0)-(+it.discount||0))/(+it.qty||1)),taxRate:remaining>0&&p.subtotal>0?((+p.tax||0)/(+p.subtotal||1)):0};});renderPurchaseReturnForm();};
  function prRows(){return (prDraft.items||[]).filter(function(it){return it.maxQty>0;}).map(function(it){var total=(+it.qty||0)*(+it.unitCost||0);return '<tr><td>'+esc(it.name)+'</td><td class="num">'+fa(it.maxQty)+'</td><td class="num">'+fa((+it.maxQty||0)-(+it.qty||0))+'</td><td><input type="number" min="0" max="'+it.maxQty+'" step="1" value="'+it.qty+'" oninput="prField(\''+it.key+'\',this.value)"></td><td class="num">'+money(it.unitCost)+'</td><td class="num">'+money(total)+'</td></tr>';}).join('');}
  window.prField=function(k,v){var it=prDraft.items.find(function(x){return x.key===k;});if(!it)return;it.qty=Math.max(0,Math.min(+it.maxQty||0,+v||0));var rows=document.querySelectorAll('tbody tr');renderPurchaseReturnForm();};
  window.updatePurchaseReturnTotals=function(){var r=window.prDraft;if(!r)return;var sub=(r.items||[]).reduce(function(a,it){return a+(+it.qty||0)*(+it.unitCost||0);},0),tax=r.includeTax?sub*((r.items[0]&&+r.items[0].taxRate)||0):0;r.subtotal=sub;r.tax=tax;r.grandTotal=sub+tax;var el=document.getElementById('prTotals');if(el)el.innerHTML='<div class="trow"><span>مبلغ برگشت</span><span class="num">'+money(sub)+'</span></div>'+(tax?'<div class="trow"><span>کاهش اعتبار مالیاتی</span><span class="num">'+money(tax)+'</span></div>':'')+'<div class="trow grand"><span>نهایی</span><span class="num">'+money(r.grandTotal)+'</span></div>';};
  window.savePurchaseReturnDraft=function(){var r=window.prDraft;if(!r||!r.purchaseInvoiceId){showToast('فاکتور خرید مرجع را انتخاب کنید');return;}var p=purchaseById(r.purchaseInvoiceId);if(!p||p.voided){showToast('فاکتور خرید معتبر نیست');return;}var items=(r.items||[]).filter(function(it){return (+it.qty||0)>0;});if(!items.length){showToast('حداقل یک قلم برای برگشت انتخاب کنید');return;}if(items.some(function(it){return (+it.qty||0)>(+it.maxQty||0)+.0001;})){showToast('مقدار برگشت بیشتر از مقدار قابل برگشت است');return;}var sub=items.reduce(function(a,it){return a+(+it.qty||0)*(+it.unitCost||0);},0),tax=r.includeTax?sub*((items[0]&&+items[0].taxRate)||0):0;r.items=items;r.subtotal=sub;r.tax=tax;r.grandTotal=sub+tax;r.voided=false;if(r.id){var old=prById(r.id);Object.assign(old,r);}else{var no=state.business.nextPurchaseReturnNo||1;state.business.nextPurchaseReturnNo=no+1;r.id=uid();r.number=no;state.purchaseReturns.push(r);}save();prDraft=null;fpSyncLedger();nav('purchase-return-view',r.id);};
  window.renderPurchaseReturnView=function(id){var r=prById(id);if(!r){nav('purchase-returns');return;}var p=purchaseById(r.purchaseInvoiceId),s=p&&(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});var html='<div class="spread"><button class="btn btn-ghost" onclick="nav(\'purchase-returns\')">بازگشت</button><div class="row">'+(!r.voided?'<button class="btn btn-ghost" onclick="openPurchaseReturnForm(\''+r.id+'\')">ویرایش</button><button class="btn btn-danger" onclick="voidPurchaseReturn(\''+r.id+'\')">ابطال برگشت</button>':'')+'</div></div><div class="card"><div class="section-title">برگشت از خرید #'+fa(r.number)+'</div><p>فاکتور مرجع: <b>#'+fa(p?p.number:'—')+'</b> — تأمین‌کننده: <b>'+esc(s?s.name:'—')+'</b> — تاریخ: '+jStrShort(r.date)+'</p><table><thead><tr><th>کالا</th><th>تعداد</th><th>بهای واحد</th><th>جمع</th></tr></thead><tbody>'+(r.items||[]).map(function(it){return '<tr><td>'+esc(it.name)+'</td><td class="num">'+fa(it.qty)+'</td><td class="num">'+money(it.unitCost)+'</td><td class="num">'+money((+it.qty||0)*(+it.unitCost||0))+'</td></tr>';}).join('')+'</tbody></table><div class="totals-box"><div class="trow"><span>مبلغ برگشت</span><span>'+money(r.subtotal)+'</span></div>'+(r.tax?'<div class="trow"><span>کاهش اعتبار مالیاتی</span><span>'+money(r.tax)+'</span></div>':'')+'<div class="trow grand"><span>نهایی</span><span>'+money(r.grandTotal)+'</span></div></div>'+(r.voided?'<p class="muted">این برگشت ابطال شده است.</p>':'')+'</div>';document.getElementById('content').innerHTML=html;};
  window.voidPurchaseReturn=function(id){var r=prById(id);if(!r||r.voided)return;if(!confirm('این برگشت از خرید ابطال شود؟ موجودی و بدهی تأمین‌کننده برمی‌گردد.'))return;r.voided=true;r.voidedAt=new Date().toISOString();save();fpSyncLedger();renderPurchaseReturnView(id);};
  var oldRenderPage=window.renderPage;window.renderPage=function(){var p=route.page;if(p==='purchase-returns')return renderPurchaseReturns();if(p==='purchase-return-form')return renderPurchaseReturnForm();if(p==='purchase-return-view')return renderPurchaseReturnView(route.id);return oldRenderPage();};
  var oldPurchaseView=window.renderPurchaseView;
  window.renderPurchaseView=function(id){oldPurchaseView(id);};
})();
}catch(e){console.error('app.js block 17/23 failed:',e);}
;

/* ===== Script block 18/26 ===== */
try{
(function(){
'use strict';
/* DAFTAR V12 — complete remaining accounting cycle */

function v12Ensure(){
  if(!state.saleReturns) state.saleReturns=[];
  if(!state.prepayments) state.prepayments=[];
  if(!state.bankReconciliations) state.bankReconciliations=[];
  if(!state.recurringTemplates) state.recurringTemplates=[];
  if(!state.closePeriods) state.closePeriods=[];
  if(!state.costCenters) state.costCenters=[];
  if(!state.accruals) state.accruals=[];
  if(!state.loans) state.loans=[];
  if(!state.currencies) state.currencies=[{code:'IRR',name:'تومان',rate:1,base:true}];
  if(!state.business.nextSaleReturnNo) state.business.nextSaleReturnNo=1;
}
v12Ensure();

function v12DateCmp(a,b){return jToJdn(a)-jToJdn(b);}
function v12Active(x){return x&&!x.voided;}
function v12PartyName(type,id){if(type==='customer'){var c=getCustomer(id);return c?c.name:'—';}if(type==='supplier'){var s=(state.suppliers||[]).find(function(x){return x.id===id;});return s?s.name:'—';}return '—';}
function v12TaxRate(){return Number(state.business.taxRate||0);}

/* ---------- sales returns / credit notes ---------- */
function v12SaleById(id){return (state.invoices||[]).find(function(x){return x.id===id;});}
function v12ReturnById(id){return (state.saleReturns||[]).find(function(x){return x.id===id;});}
function v12ReturnedQty(invId,sourceKey,excludeId){return (state.saleReturns||[]).filter(function(r){return r.invoiceId===invId&&!r.voided&&r.id!==excludeId;}).reduce(function(a,r){return a+(r.items||[]).filter(function(it){return String(it.sourceKey)===String(sourceKey);}).reduce(function(q,it){return q+(+it.qty||0);},0);},0);}
function v12ReturnOptions(){return (state.invoices||[]).filter(function(i){return !i.voided&&(i.items||[]).some(function(it,idx){return (+it.qty||0)-v12ReturnedQty(i.id,String(it.key||idx),null)>0;});}).map(function(i){return '<option value="'+i.id+'">#'+fa(i.number)+' — '+esc(partyName(i.customerId))+' — '+jStrShort(i.date)+'</option>';}).join('');}
window.renderSaleReturns=function(){
  var list=(state.saleReturns||[]).slice().sort(function(a,b){return v12DateCmp(b.date,a.date);});
  var html='<div class="spread"><div><div class="muted">برگشت کالا از مشتری و اصلاح فروش</div></div><button class="btn btn-brand" onclick="openSaleReturnForm()">+ برگشت از فروش</button></div>';
  if(!list.length){html+=emptyState('invoice','برگشت فروشی ثبت نشده','برای ثبت اعتبار مشتری و بازگشت کالا، برگشت فروش ایجاد کنید','openSaleReturnForm()','برگشت از فروش');document.getElementById('content').innerHTML=html;return;}
  html+='<div class="card"><table><thead><tr><th>شماره</th><th>فاکتور</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>';
  list.forEach(function(r){var i=v12SaleById(r.invoiceId);html+='<tr style="cursor:pointer" onclick="nav(\'sale-return-view\',\''+r.id+'\')"><td>'+fa(r.number)+'</td><td>#'+fa(i?i.number:'—')+'</td><td>'+esc(i?partyName(i.customerId):'—')+'</td><td>'+jStrShort(r.date)+'</td><td class="num">'+money(r.grandTotal)+'</td><td>'+statusBadge(r.voided?'باطل':'ثبت‌شده')+'</td></tr>';});
  html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;
};
var v12SaleDraft=null;
window.openSaleReturnForm=function(id){
  var r=id?v12ReturnById(id):null;if(r){if(r.voided){showToast('برگشت ابطال‌شده قابل ویرایش نیست');return;}r=JSON.parse(JSON.stringify(r));}
  else r={id:null,number:null,invoiceId:'',date:todayJalali(),items:[],subtotal:0,tax:0,grandTotal:0,voided:false};
  if(r.invoiceId){var inv=v12SaleById(r.invoiceId);if(inv)(r.items||[]).forEach(function(it){var src=(inv.items||[]).find(function(x,idx){return String(x.key||idx)===String(it.sourceKey);});it.maxQty=Math.max(0,(src?+src.qty:0)-v12ReturnedQty(inv.id,it.sourceKey,r.id));});}
  v12SaleDraft=r;renderSaleReturnForm();
};
window.renderSaleReturnForm=function(){
  var r=v12SaleDraft;if(!r){nav('sale-returns');return;}var html='<div class="spread"><button class="btn btn-ghost" onclick="v12SaleDraft=null;nav(\'sale-returns\')">بازگشت</button><button class="btn btn-brand" onclick="saveSaleReturn()">ثبت برگشت</button></div><div class="card"><div class="field"><label>فاکتور فروش مرجع *</label><select onchange="selectSaleReturnInvoice(this.value)" '+(r.id?'disabled':'')+'><option value="">— انتخاب فاکتور —</option>'+((v12ReturnOptions()).replace('value="'+r.invoiceId+'"','value="'+r.invoiceId+'" selected'))+'</select></div>';
  if(r.invoiceId){html+='<div class="field"><label>تاریخ برگشت</label>'+fmtDateInput('srdate',r.date)+'</div><table><thead><tr><th>کالا</th><th>قابل برگشت</th><th>این برگشت</th><th>بهای فروش</th><th>جمع</th></tr></thead><tbody>'+(r.items||[]).filter(function(it){return (+it.maxQty||0)>0;}).map(function(it){return '<tr><td>'+esc(it.name)+'</td><td class="num">'+fa(it.maxQty)+'</td><td><input type="number" min="0" max="'+it.maxQty+'" value="'+it.qty+'" oninput="saleReturnQty(\''+it.key+'\',this.value)"></td><td class="num">'+money(it.unitPrice)+'</td><td class="num">'+money((+it.qty||0)*(+it.unitPrice||0)-(+it.discount||0))+'</td></tr>';}).join('')+'</tbody></table><div id="srTotals" class="totals-box"></div>';}else html+='<p class="muted">ابتدا فاکتور مرجع را انتخاب کنید.</p>';
  html+='</div>';document.getElementById('content').innerHTML=html;updateSaleReturnTotals();
};
window.selectSaleReturnInvoice=function(id){var inv=v12SaleById(id);if(!inv)return;v12SaleDraft.invoiceId=id;v12SaleDraft.date=todayJalali();v12SaleDraft.items=(inv.items||[]).map(function(it,idx){var key=String(it.key||idx),max=Math.max(0,(+it.qty||0)-v12ReturnedQty(inv.id,key,null));return {key:uid(),sourceKey:key,serviceId:it.serviceId,name:it.name||((getService(it.serviceId)||{}).name)||'',qty:0,maxQty:max,unitPrice:+it.price||0,discount:+it.discount||0,taxRate:inv.subtotal>0?(+inv.tax||0)/(+inv.subtotal||1):0};});renderSaleReturnForm();};
window.saleReturnQty=function(k,v){var it=(v12SaleDraft.items||[]).find(function(x){return x.key===k;});if(it){it.qty=Math.max(0,Math.min(+it.maxQty||0,+v||0));renderSaleReturnForm();}};
window.updateSaleReturnTotals=function(){var r=v12SaleDraft;if(!r)return;var sub=(r.items||[]).reduce(function(a,it){return a+(+it.qty||0)*(+it.unitPrice||0)-Math.min(+it.discount||0,(+it.qty||0)*(+it.unitPrice||0));},0);var rate=(r.items||[]).length?(+r.items[0].taxRate||0):0;r.subtotal=sub;r.tax=Math.round(sub*rate);r.grandTotal=r.subtotal+r.tax;var e=document.getElementById('srTotals');if(e)e.innerHTML='<div class="trow"><span>برگشت فروش</span><span>'+money(r.subtotal)+'</span></div><div class="trow"><span>کاهش مالیات</span><span>'+money(r.tax)+'</span></div><div class="trow grand"><span>نهایی</span><span>'+money(r.grandTotal)+'</span></div>';};
window.saveSaleReturn=function(){var r=v12SaleDraft,inv=r&&v12SaleById(r.invoiceId);if(!inv||inv.voided){showToast('فاکتور فروش معتبر نیست');return;}var items=(r.items||[]).filter(function(it){return (+it.qty||0)>0;});if(!items.length){showToast('حداقل یک قلم انتخاب کنید');return;}if(items.some(function(it){return (+it.qty||0)>(+it.maxQty||0)+.0001;})){showToast('مقدار برگشت بیشتر از مقدار مجاز است');return;}var sub=items.reduce(function(a,it){return a+(+it.qty||0)*(+it.unitPrice||0)-Math.min(+it.discount||0,(+it.qty||0)*(+it.unitPrice||0));},0),rate=(items[0]&&+items[0].taxRate)||0;r.items=items;var dj=document.querySelector('[name=srdateJ]'),dm=document.querySelector('[name=srdateM]'),dd=document.querySelector('[name=srdateD]');if(dj&&dm&&dd)r.date={jy:+dj.value,jm:+dm.value,jd:+dd.value};r.subtotal=sub;r.tax=Math.round(sub*rate);r.grandTotal=sub+r.tax;r.voided=false;if(r.id)Object.assign(v12ReturnById(r.id),r);else{r.id=uid();r.number=state.business.nextSaleReturnNo++;state.saleReturns.push(r);}save();v12SaleDraft=null;fpSyncLedger();nav('sale-return-view',r.id);};
window.renderSaleReturnView=function(id){var r=v12ReturnById(id);if(!r){nav('sale-returns');return;}var inv=v12SaleById(r.invoiceId);var html='<div class="spread"><button class="btn btn-ghost" onclick="nav(\'sale-returns\')">بازگشت</button><div>'+(!r.voided?'<button class="btn btn-ghost" onclick="openSaleReturnForm(\''+r.id+'\')">ویرایش</button> <button class="btn btn-danger" onclick="voidSaleReturn(\''+r.id+'\')">ابطال</button>':'')+'</div></div><div class="card"><div class="section-title">برگشت از فروش #'+fa(r.number)+'</div><p>فاکتور مرجع: #'+fa(inv?inv.number:'—')+' — مشتری: '+esc(inv?partyName(inv.customerId):'—')+' — تاریخ: '+jStrShort(r.date)+'</p><table><thead><tr><th>کالا</th><th>تعداد</th><th>قیمت</th><th>جمع</th></tr></thead><tbody>'+(r.items||[]).map(function(it){return '<tr><td>'+esc(it.name)+'</td><td class="num">'+fa(it.qty)+'</td><td class="num">'+money(it.unitPrice)+'</td><td class="num">'+money((+it.qty||0)*(+it.unitPrice||0)-Math.min(+it.discount||0,(+it.qty||0)*(+it.unitPrice||0)))+'</td></tr>';}).join('')+'</tbody></table><div class="totals-box"><div class="trow"><span>خالص برگشت</span><span>'+money(r.subtotal)+'</span></div><div class="trow"><span>کاهش مالیات</span><span>'+money(r.tax)+'</span></div><div class="trow grand"><span>نهایی</span><span>'+money(r.grandTotal)+'</span></div></div></div>';document.getElementById('content').innerHTML=html;};
window.voidSaleReturn=function(id){var r=v12ReturnById(id);if(!r||r.voided)return;if(!confirm('این برگشت از فروش ابطال شود؟'))return;r.voided=true;r.voidedAt=new Date().toISOString();save();fpSyncLedger();renderSaleReturnView(id);};

/* Hook sale returns into the accounting rebuild. */
var v12OldRebuild=window.coreRebuildLedger;
window.coreRebuildLedger=function(){var out=v12OldRebuild();var errs=state.__accountingErrors||[];(state.saleReturns||[]).forEach(function(r){if(r.voided)return;var inv=v12SaleById(r.invoiceId);if(!inv)return;var party=inv.customerId||null,net=+r.subtotal||0,tax=+r.tax||0,total=+r.grandTotal||net+tax;if(total<=0)return;try{var lines=[coreLine('404',net,0,'برگشت از فروش #'+(r.number||'')),corePartyLine('103',0,total,'کاهش مطالبات مشتری',party,'customer')];if(tax>0)lines.push(coreLine('202',tax,0,'کاهش مالیات فروش'));corePost('sale-return',r.id,r.date,'برگشت از فروش #'+(r.number||''),lines,{documentId:r.id,invoiceId:r.invoiceId});
      var cogs=0;(r.items||[]).forEach(function(it){var src=(inv.items||[]).find(function(x,idx){return String(x.key||idx)===String(it.sourceKey);});if(src&&src.costPriceAtSale!=null)cogs+=(+src.costPriceAtSale||0)*(+it.qty||0);});if(cogs>0)corePost('sale-return-cogs',r.id,r.date,'برگشت بهای تمام‌شده فروش #'+(r.number||''),[coreLine('104',cogs,0,'بازگشت کالا به موجودی'),coreLine('601',0,cogs,'معکوس بهای تمام‌شده')],{documentId:r.id,invoiceId:r.invoiceId});
    }catch(e){errs.push({sourceType:'sale-return',sourceId:r.id,error:e.message});}});state.__accountingErrors=errs;return out;};
/* Stock-in for sale returns is linked here. */
var v12OldStock=window.coreRebuildStock;
window.coreRebuildStock=function(){var q=v12OldStock();(state.saleReturns||[]).forEach(function(r){var existing=(state.stockMoves||[]).filter(function(m){return m.sourceType==='sale-return'&&m.sourceId===r.id;});var seen={};(r.items||[]).forEach(function(it,idx){if(!it.serviceId)return;var id=r.id+':stock:'+String(it.sourceKey||idx),m=existing.find(function(x){return x.id===id;});if(!m){m={id:id,serviceId:it.serviceId,type:'in',qty:+it.qty||0,unitCost:0,date:r.date,sourceType:'sale-return',sourceId:r.id,sourceKey:id,voided:!!r.voided};state.stockMoves.push(m);}m.qty=+it.qty||0;m.serviceId=it.serviceId;m.date=r.date;m.type='in';m.voided=!!r.voided;seen[id]=1;});existing.forEach(function(m){if(!seen[m.id])m.voided=true;});});var qty={};(state.stockMoves||[]).forEach(function(m){if(m.voided||!m.serviceId)return;var n=+m.qty||0;qty[m.serviceId]=(qty[m.serviceId]||0)+((m.type==='out'||m.type==='adjust-out')?-n:n);});(state.services||[]).forEach(function(s){if(s.trackStock)s.stock=qty[s.id]||0;});return qty;};

/* ---------- aging / party ledgers ---------- */
window.renderAging=function(){var today=jToJdn(todayJalali()),rows=[];
 (state.invoices||[]).forEach(function(i){if(i.voided)return;var rem=invoiceRemaining(i);if(rem>0)rows.push({type:'مشتری',party:partyName(i.customerId),date:i.date,due:i.dueDate||i.date,amount:rem,ref:'#'+i.number});});
 (state.purchaseInvoices||[]).forEach(function(p){if(p.voided)return;var rem=purchaseRemaining(p);if(rem>0){var s=(state.suppliers||[]).find(function(x){return x.id===p.supplierId;});rows.push({type:'تأمین‌کننده',party:s?s.name:'—',date:p.date,due:p.dueDate||p.date,amount:rem,ref:'#'+p.number});}});
 (state.receivablesPayables||[]).forEach(function(r){if(r.status==='void'||rpRemaining(r)<=0)return;rows.push({type:r.direction==='receivable'?'مشتری':'تأمین‌کننده',party:r.partyName,date:r.date,due:r.dueDate||r.date,amount:rpRemaining(r),ref:r.id.slice(-6)});});
 var buckets=[0,0,0,0],buckets2=[0,0,0,0];rows.forEach(function(r){var days=Math.max(0,Math.floor((today-jToJdn(r.due))));var idx=days<=0?0:days<=30?1:days<=60?2:3;(r.type==='مشتری'?buckets:buckets2)[idx]+=r.amount;});
 var html='<div class="stat-grid">'+statCard('مطالبات جاری',buckets[0],'income')+statCard('مطالبات ۱–۳۰ روز',buckets[1],'')+statCard('مطالبات ۳۱–۶۰ روز',buckets[2],'')+statCard('مطالبات +۶۰ روز',buckets[3],'expense')+'</div><div class="card"><div class="section-title">سررسید مشتریان و تأمین‌کنندگان</div><table><thead><tr><th>نوع</th><th>طرف حساب</th><th>مرجع</th><th>سررسید</th><th>روز گذشته</th><th>مانده</th></tr></thead><tbody>';
 rows.sort(function(a,b){return jToJdn(a.due)-jToJdn(b.due);}).forEach(function(r){var d=Math.max(0,today-jToJdn(r.due));html+='<tr><td>'+r.type+'</td><td>'+esc(r.party)+'</td><td>'+esc(r.ref)+'</td><td>'+jStrShort(r.due)+'</td><td class="num">'+fa(d)+'</td><td class="num">'+money(r.amount)+'</td></tr>';});
 html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};

window.renderSupplierLedger=function(id){var s=(state.suppliers||[]).find(function(x){return x.id===id;});if(!s){nav('suppliers');return;}var rows=[];(state.purchaseInvoices||[]).filter(function(p){return p.supplierId===id&&!p.voided;}).forEach(function(p){rows.push({date:p.date,label:'فاکتور خرید #'+p.number,debit:0,credit:p.grandTotal});(p.payments||[]).filter(function(x){return !x.voided;}).forEach(function(x){rows.push({date:x.date,label:'پرداخت فاکتور خرید #'+p.number,debit:x.amount,credit:0});});});(state.purchaseReturns||[]).filter(function(r){var p=purchaseById(r.purchaseInvoiceId);return p&&p.supplierId===id&&!r.voided;}).forEach(function(r){rows.push({date:r.date,label:'برگشت خرید #'+r.number,debit:r.grandTotal,credit:0});});rows.sort(function(a,b){return jToJdn(a.date)-jToJdn(b.date);});var bal=0,html='<div class="row no-print" style="justify-content:flex-end"><button class="btn btn-ghost" onclick="nav(\'suppliers\')">بازگشت</button></div><div class="card"><div class="section-title">کارت حساب '+esc(s.name)+'</div><table><thead><tr><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr></thead><tbody>';rows.forEach(function(r){bal+=r.credit-r.debit;html+='<tr><td>'+jStrShort(r.date)+'</td><td>'+esc(r.label)+'</td><td class="num">'+money(r.debit)+'</td><td class="num">'+money(r.credit)+'</td><td class="num">'+money(bal)+'</td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};

/* ---------- tax report ---------- */
window.renderTax=function(){var salesTax=(state.invoices||[]).filter(function(i){return !i.voided;}).reduce(function(a,i){return a+(+i.tax||0);},0);var saleReturnTax=(state.saleReturns||[]).filter(function(r){return !r.voided;}).reduce(function(a,r){return a+(+r.tax||0);},0);var purchaseTax=(state.purchaseInvoices||[]).filter(function(i){return !i.voided;}).reduce(function(a,i){return a+(+i.tax||0);},0);var purchaseReturnTax=(state.purchaseReturns||[]).filter(function(r){return !r.voided;}).reduce(function(a,r){return a+(+r.tax||0);},0);var output=Math.max(0,salesTax-saleReturnTax),input=Math.max(0,purchaseTax-purchaseReturnTax),net=output-input;var html='<div class="stat-grid">'+statCard('مالیات فروش',output,'expense')+statCard('اعتبار خرید',input,'income')+statCard('مالیات خالص',net,net>=0?'expense':'income')+'</div><div class="card"><div class="section-title">خلاصه ارزش افزوده</div><table><tbody><tr><td>مالیات فروش</td><td class="num">'+money(output)+'</td></tr><tr><td>اعتبار مالیاتی خرید</td><td class="num">'+money(input)+'</td></tr><tr><th>قابل پرداخت / طلب از مالیات</th><th class="num">'+money(net)+'</th></tr></tbody></table></div>';document.getElementById('content').innerHTML=html;};

/* ---------- financial statements / cash flow ---------- */
window.renderFinancialStatements=function(){coreRebuildLedger();var rev=['401','402'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0),salesReturn=Math.max(0,fpLedgerBalance('404'));var cogs=Math.max(0,fpLedgerBalance('601')),opex=['501','502','503','504','505','506','507','508','603'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0),net=rev-salesReturn-cogs-opex;var assets=['101','102','103','104','105','107','108','206'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0)-Math.max(0,-fpLedgerBalance('106'));var liab=['201','202','203','204','205'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0);var eq=['301','302'].reduce(function(a,c){return a+fpLedgerBalance(c);},0)+net;var html='<div class="stat-grid">'+statCard('درآمد خالص',rev-salesReturn,'income')+statCard('بهای تمام‌شده',cogs,'expense')+statCard('سایر هزینه‌ها',opex,'expense')+statCard('سود خالص',net,net>=0?'income':'expense')+'</div><div class="two-col"><div class="card"><div class="section-title">صورت سود و زیان</div><table><tbody><tr><td>درآمد</td><td class="num">'+money(rev)+'</td></tr><tr><td>برگشت از فروش</td><td class="num">'+money(salesReturn)+'</td></tr><tr><td>بهای تمام‌شده</td><td class="num">'+money(cogs)+'</td></tr><tr><td>هزینه‌ها</td><td class="num">'+money(opex)+'</td></tr><tr><th>سود خالص</th><th class="num">'+money(net)+'</th></tr></tbody></table></div><div class="card"><div class="section-title">ترازنامه</div><table><tbody><tr><td>دارایی‌ها</td><td class="num">'+money(assets)+'</td></tr><tr><td>بدهی‌ها</td><td class="num">'+money(liab)+'</td></tr><tr><td>حقوق مالکانه با سود جاری</td><td class="num">'+money(eq)+'</td></tr><tr><th>بدهی + سرمایه</th><th class="num">'+money(liab+eq)+'</th></tr></tbody></table></div></div>';document.getElementById('content').innerHTML=html;};

window.renderTrialBalance=function(){coreRebuildLedger();var rows=(state.chartAccounts||[]).map(function(a){var d=0,c=0;(state.journalEntries||[]).filter(function(e){return !e.voided;}).forEach(function(e){(e.lines||[]).forEach(function(l){if(String(l.accountCode)===String(a.code)){d+=+l.debit||0;c+=+l.credit||0;}});});return {a:a,d:d,c:c};}).filter(function(x){return x.d||x.c;});var td=rows.reduce(function(a,x){return a+x.d;},0),tc=rows.reduce(function(a,x){return a+x.c;},0);var html='<div class="card"><div class="spread"><div class="section-title">تراز آزمایشی</div><span class="badge '+(Math.abs(td-tc)<=.01?'paid':'void')+'">'+(Math.abs(td-tc)<=.01?'متوازن':'نامتوازن')+'</span></div><table><thead><tr><th>کد</th><th>حساب</th><th>بدهکار</th><th>بستانکار</th></tr></thead><tbody>';rows.forEach(function(x){html+='<tr><td>'+fa(x.a.code)+'</td><td>'+esc(x.a.name)+'</td><td class="num">'+money(x.d)+'</td><td class="num">'+money(x.c)+'</td></tr>';});html+='<tr><th colspan="2">جمع</th><th class="num">'+money(td)+'</th><th class="num">'+money(tc)+'</th></tr></tbody></table></div>';document.getElementById('content').innerHTML=html;};

/* ---------- year-end close ---------- */
window.renderYearEnd=function(){var fy=Number(state.business.fiscalYear||todayJalali().jy),closed=(state.closePeriods||[]).find(function(x){return x.fiscalYear===fy;});coreRebuildLedger();var rev=['401','402'].reduce(function(a,c){return a+fpLedgerBalance(c);},0),exp=['403','404','501','502','503','504','505','506','507','508','601','602','603'].reduce(function(a,c){return a+fpLedgerBalance(c);},0),profit=rev-exp;var html='<div class="card"><div class="section-title">بستن سال مالی '+fa(fy)+'</div><p class="muted">سود/زیان سال جاری به حساب سود (زیان) انباشته منتقل می‌شود. بستن سال فقط یک بار انجام می‌شود.</p><div class="stat-grid">'+statCard('سود / زیان قابل انتقال',profit,profit>=0?'income':'expense')+'</div>'+(closed?'<div class="badge paid">این سال قبلاً بسته شده — سند #'+fa(closed.journalNumber)+'</div>':'<button class="btn btn-brand" onclick="closeFiscalYear('+fy+')">بستن سال مالی</button>')+'</div>';document.getElementById('content').innerHTML=html;};
window.closeFiscalYear=function(fy){if((state.closePeriods||[]).some(function(x){return x.fiscalYear===fy;})){showToast('این سال قبلاً بسته شده است');return;}coreRebuildLedger();var rev=['401','402'].reduce(function(a,c){return a+fpLedgerBalance(c);},0),exp=['403','404','501','502','503','504','505','506','507','508','601','602','603'].reduce(function(a,c){return a+fpLedgerBalance(c);},0),profit=rev-exp;if(Math.abs(profit)<.01){showToast('سودی برای بستن وجود ندارد');return;}var lines=[];
  (state.chartAccounts||[]).filter(function(a){return a.type==='revenue';}).forEach(function(a){var b=fpLedgerBalance(a.code);if(Math.abs(b)>0.01)lines.push(coreLine(a.code,b,0,'بستن درآمد '+a.name));});
  (state.chartAccounts||[]).filter(function(a){return a.type==='expense';}).forEach(function(a){var b=fpLedgerBalance(a.code);if(Math.abs(b)>0.01)lines.push(coreLine(a.code,0,b,'بستن هزینه '+a.name));});
  if(profit>0)lines.push(coreLine('302',0,profit,'انتقال سود به انباشته'));else if(profit<0)lines.push(coreLine('302',-profit,0,'انتقال زیان به انباشته'));var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:todayJalali(),description:'بستن سال مالی '+fy,lines:lines,status:'posted',auto:false,closeFiscalYear:fy,createdAt:new Date().toISOString()});state.closePeriods.push({fiscalYear:fy,journalNumber:n,date:todayJalali()});save();renderYearEnd();};

/* ---------- bank reconciliation ---------- */
window.renderBankReconciliation=function(){var rows=[];(state.bankAccounts||[]).forEach(function(a){var tx=(state.transactions||[]).filter(function(t){return t.accountId===a.id&&!t.voided;});var reconciled=tx.filter(function(t){return t.reconciled;}).reduce(function(s,t){return s+(t.type==='deposit'?+t.amount:-+t.amount);},0);var book=accountBalance(a.id);rows.push({a:a,book:book,reconciled:reconciled,count:tx.length});});var html='<div class="card"><div class="section-title">مغایرت‌گیری بانکی</div><p class="muted">تراکنش‌های ثبت‌شده را پس از تطبیق با صورت‌حساب بانک علامت بزنید.</p><table><thead><tr><th>حساب</th><th>مانده دفاتر</th><th>جمع تطبیق‌شده</th><th>اختلاف</th><th>تراکنش‌ها</th><th></th></tr></thead><tbody>';rows.forEach(function(r){html+='<tr><td>'+esc(r.a.name)+'</td><td class="num">'+money(r.book)+'</td><td class="num">'+money(r.reconciled)+'</td><td class="num">'+money(r.book-r.reconciled)+'</td><td>'+fa(r.count)+'</td><td><button class="btn btn-ghost btn-sm" onclick="openBankTxs(\''+r.a.id+'\')">تطبیق</button></td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openBankTxs=function(accountId){var a=(state.bankAccounts||[]).find(function(x){return x.id===accountId});if(!a)return;var tx=(state.transactions||[]).filter(function(t){return t.accountId===accountId&&!t.voided;});openProModal('تطبیق '+a.name,'<div class="muted" style="margin-bottom:10px">تراکنش‌های تطبیق‌شده را علامت بزنید.</div>'+tx.map(function(t){return '<label style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><input type="checkbox" '+(t.reconciled?'checked':'')+' onchange="toggleReconciled(\''+t.id+'\',this.checked)"><span>'+jStrShort(t.date)+' — '+esc(t.description||'')+' — '+money(t.amount)+'</span></label>';}).join('')+'<button class="btn btn-brand" style="margin-top:14px" onclick="closeModal();renderBankReconciliation()">بستن</button>');};
window.toggleReconciled=function(id,v){var t=(state.transactions||[]).find(function(x){return x.id===id});if(t){t.reconciled=!!v;t.reconciledAt=v?new Date().toISOString():null;save();}};

/* ---------- recurring journals ---------- */
window.renderRecurring=function(){var html='<div class="spread"><div class="muted">قالب اسناد تکرارشونده</div><button class="btn btn-brand" onclick="openRecurringForm()">+ قالب جدید</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>دوره</th><th>مبلغ</th><th>وضعیت</th><th></th></tr></thead><tbody>';(state.recurringTemplates||[]).forEach(function(t){html+='<tr><td>'+esc(t.name)+'</td><td>'+esc(t.frequency)+'</td><td class="num">'+money(t.amount)+'</td><td>'+(t.active?'فعال':'متوقف')+'</td><td><button class="btn btn-ghost btn-sm" onclick="generateRecurring(\''+t.id+'\')">ثبت این دوره</button></td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openRecurringForm=function(){openProModal('قالب سند تکرارشونده','<form onsubmit="event.preventDefault();var f=this;state.recurringTemplates.push({id:uid(),name:f.name.value,frequency:f.frequency.value,amount:+f.amount.value||0,debit:f.debit.value,credit:f.credit.value,active:true});save();closeModal();renderRecurring()"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>دوره</label><select name="frequency"><option>ماهانه</option><option>فصلی</option><option>سالانه</option></select></div><div class="field"><label>مبلغ</label><input name="amount" type="number" min="1" required></div><div class="field"><label>حساب بدهکار</label><select name="debit">'+state.chartAccounts.map(function(a){return '<option value="'+a.code+'">'+a.code+' — '+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>حساب بستانکار</label><select name="credit">'+state.chartAccounts.map(function(a){return '<option value="'+a.code+'">'+a.code+' — '+esc(a.name)+'</option>';}).join('')+'</select></div><button class="btn btn-brand">ذخیره</button></form>');};
window.generateRecurring=function(id){var t=(state.recurringTemplates||[]).find(function(x){return x.id===id});if(!t)return;if(t.debit===t.credit){showToast('حساب بدهکار و بستانکار نمی‌توانند یکسان باشند');return;}var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:todayJalali(),description:t.name,lines:[coreLine(t.debit,t.amount,0,t.name),coreLine(t.credit,0,t.amount,t.name)],status:'posted',auto:false,recurringTemplateId:id,createdAt:new Date().toISOString()});save();showToast('سند تکرارشونده ثبت شد');renderRecurring();};

/* ---------- lightweight prepayment / accrual / loan registers ---------- */
window.renderPrepayments=function(){var html='<div class="spread"><div class="muted">پیش‌پرداخت‌ها و تعهدات انتقالی</div><button class="btn btn-brand" onclick="openPrepaymentForm()">+ ثبت پیش‌پرداخت</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>نوع</th><th>مبلغ</th><th>مانده</th><th>تاریخ</th></tr></thead><tbody>';(state.prepayments||[]).forEach(function(p){html+='<tr><td>'+esc(p.name)+'</td><td>'+esc(p.type==='asset'?'پیش‌پرداخت دارایی':'پیش‌دریافت مشتری')+'</td><td class="num">'+money(p.amount)+'</td><td class="num">'+money(p.remaining)+'</td><td>'+jStrShort(p.date)+'</td></tr>';});html+='</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openPrepaymentForm=function(){openProModal('ثبت پیش‌پرداخت / پیش‌دریافت','<form onsubmit="event.preventDefault();var f=this,amt=+f.amount.value||0;if(amt<=0)return;var p={id:uid(),name:f.name.value,type:f.type.value,amount:amt,remaining:amt,date:readDateInput(f,\'date\')};state.prepayments.push(p);var lines=p.type===\'asset\'?[coreLine(\'107\',amt,0,p.name),coreCashLine(f.account.value,0,amt,p.name)]:[coreCashLine(f.account.value,amt,0,p.name),coreLine(\'203\',0,amt,p.name)];var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:p.date,description:p.name,lines:lines,status:\'posted\',auto:false,prepaymentId:p.id,createdAt:new Date().toISOString()});save();closeModal();renderPrepayments()"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>نوع</label><select name="type"><option value="asset">پیش‌پرداخت</option><option value="liability">پیش‌دریافت مشتری</option></select></div><div class="field"><label>مبلغ</label><input name="amount" type="number" min="1" required></div><div class="field"><label>حساب صندوق/بانک</label><select name="account">'+(state.bankAccounts||[]).map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><button class="btn btn-brand">ثبت</button></form>');};

/* ---------- enhanced health check ---------- */
var v12OldHealth=window.fpAccountingHealth;
window.fpAccountingHealth=function(){var o=v12OldHealth?v12OldHealth():{ok:true,errors:[]};o.saleReturnOverrun=[];o.purchaseReturnOverrun=[];o.unbalancedClose=[];(state.saleReturns||[]).forEach(function(r){var inv=v12SaleById(r.invoiceId);if(!inv||r.voided)return;(r.items||[]).forEach(function(it){if(+it.qty>+it.maxQty&&it.maxQty!=null)o.saleReturnOverrun.push(r.id);});});(state.purchaseReturns||[]).forEach(function(r){if(r.voided)return;var p=purchaseById(r.purchaseInvoiceId);if(!p)o.purchaseReturnOverrun.push(r.id);});o.ok=o.ok&&!o.saleReturnOverrun.length&&!o.purchaseReturnOverrun.length;return o;};

/* ---------- routing / shell ---------- */
var v12OldRenderShell=window.renderShell;
window.renderShell=function(){v12OldRenderShell();var navEl=document.querySelector('.mainnav');if(!navEl)return;var extra=[['sale-returns','invoice','برگشت از فروش'],['aging','chart','سنی مطالبات'],['bank-reconciliation','bank','مغایرت‌گیری بانک'],['recurring','invoice','اسناد تکرارشونده'],['prepayments','wallet','پیش‌پرداخت / پیش‌دریافت'],['year-end','chart','بستن سال مالی']];extra.forEach(function(it){if(!navEl.innerHTML.includes('nav(\''+it[0])){navEl.insertAdjacentHTML('beforeend','<a class="navlink'+(route.page===it[0]?' active':'')+'" onclick="nav(\''+it[0]+'\')">'+icon(it[1])+'<span>'+it[2]+'</span></a>');}});};
var v12OldRenderPage=window.renderPage;
window.renderPage=function(){if(route.page==='sale-returns')return renderSaleReturns();if(route.page==='sale-return-form')return renderSaleReturnForm();if(route.page==='sale-return-view')return renderSaleReturnView(route.id);if(route.page==='aging')return renderAging();if(route.page==='bank-reconciliation')return renderBankReconciliation();if(route.page==='recurring')return renderRecurring();if(route.page==='prepayments')return renderPrepayments();if(route.page==='year-end')return renderYearEnd();return v12OldRenderPage();};
var v12OldNav=window.nav;
window.nav=function(page,id){v12OldNav(page,id);};
/* supplier cards link to ledger */
var v12OldSup=window.renderSuppliers;
window.renderSuppliers=function(){v12OldSup();document.querySelectorAll('#content tbody tr').forEach(function(tr){var btn=tr.querySelector('button');if(btn){var nameCell=tr.querySelector('td');var s=(state.suppliers||[]).find(function(x){return x.name===nameCell.textContent;});if(s)tr.querySelector('td').style.cursor='pointer',tr.querySelector('td').onclick=function(){nav('supplier-ledger',s.id)};}});};
var v12OldPage2=window.renderPage;
window.renderPage=function(){if(route.page==='supplier-ledger')return renderSupplierLedger(route.id);return v12OldPage2();};

/* final migration + save */
v12Ensure();
try{fpSyncLedger();}catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'v12-sync',error:e.message}]);}
save();
})();
}catch(e){console.error('app.js block 18/23 failed:',e);}
;

/* ===== Script block 19/26 ===== */
try{
(function(){
'use strict';
/* V12.1 — loans, accruals, cost centers and currencies */
function v12bEnsure(){
  if(!state.costCenters)state.costCenters=[];if(!state.loans)state.loans=[];if(!state.accruals)state.accruals=[];if(!state.currencies)state.currencies=[{code:'IRR',name:'تومان',rate:1,base:true}];
  if(!state.chartAccounts)state.chartAccounts=[];
  if(!state.chartAccounts.some(function(a){return a.code==='207';}))state.chartAccounts.push({id:uid(),code:'207',name:'تسهیلات و وام‌ها',type:'liability',parent:null,system:true});
  if(!state.chartAccounts.some(function(a){return a.code==='509';}))state.chartAccounts.push({id:uid(),code:'509',name:'هزینه بهره وام',type:'expense',parent:null,system:true});
}
v12bEnsure();
window.renderCostCenters=function(){var html='<div class="spread"><div class="muted">مرکز هزینه برای تحلیل سودآوری</div><button class="btn btn-brand" onclick="openCostCenterForm()">+ مرکز هزینه</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>کد</th><th>هزینه</th><th>درآمد</th><th>سود</th></tr></thead><tbody>'+(state.costCenters||[]).map(function(c){var exp=0,rev=0;(state.journalEntries||[]).forEach(function(e){(e.lines||[]).forEach(function(l){if(l.costCenterId===c.id){exp+=(+l.debit||0);rev+=(+l.credit||0);}});});return '<tr><td>'+esc(c.name)+'</td><td>'+esc(c.code)+'</td><td class="num">'+money(exp)+'</td><td class="num">'+money(rev)+'</td><td class="num">'+money(rev-exp)+'</td></tr>';}).join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openCostCenterForm=function(){openProModal('مرکز هزینه','<form onsubmit="event.preventDefault();var f=this;state.costCenters.push({id:uid(),name:f.name.value.trim(),code:f.code.value.trim()||String((state.costCenters||[]).length+1)});save();closeModal();renderCostCenters()"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>کد</label><input name="code"></div><button class="btn btn-brand">ذخیره</button></form>');};
window.renderLoans=function(){var html='<div class="spread"><div class="muted">ثبت تسهیلات و اقساط</div><button class="btn btn-brand" onclick="openLoanForm()">+ وام جدید</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>اصل وام</th><th>پرداخت اصل</th><th>بهره</th><th>مانده</th></tr></thead><tbody>'+(state.loans||[]).map(function(l){var principalPaid=(l.payments||[]).reduce(function(a,p){return a+(+p.principal||0);},0),interest=(l.payments||[]).reduce(function(a,p){return a+(+p.interest||0);},0);return '<tr><td>'+esc(l.name)+'</td><td class="num">'+money(l.principal)+'</td><td class="num">'+money(principalPaid)+'</td><td class="num">'+money(interest)+'</td><td class="num">'+money(Math.max(0,l.principal-principalPaid))+'</td></tr>';}).join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openLoanForm=function(){openProModal('وام جدید','<form onsubmit="event.preventDefault();var f=this,amt=+f.amount.value||0;if(amt<=0)return;var l={id:uid(),name:f.name.value,principal:amt,date:readDateInput(f,\'date\'),payments:[]};state.loans.push(l);var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:l.date,description:\'دریافت وام — \'+l.name,lines:[coreCashLine(f.account.value,amt,0,\'دریافت وام\'),coreLine(\'207\',0,amt,\'تسهیلات وام\')],status:\'posted\',auto:false,loanId:l.id,createdAt:new Date().toISOString()});save();closeModal();renderLoans()"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>اصل وام</label><input name="amount" type="number" min="1" required></div><div class="field"><label>حساب دریافت</label><select name="account">'+(state.bankAccounts||[]).map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('')+'</select></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><button class="btn btn-brand">ثبت</button></form>');};
window.renderAccruals=function(){var html='<div class="spread"><div class="muted">هزینه‌ها و درآمدهای تعهدی</div><button class="btn btn-brand" onclick="openAccrualForm()">+ ثبت تعهد</button></div><div class="card"><table><thead><tr><th>عنوان</th><th>نوع</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>'+(state.accruals||[]).map(function(a){return '<tr><td>'+esc(a.name)+'</td><td>'+esc(a.type==='expense'?'هزینه تعهدی':'درآمد تعهدی')+'</td><td class="num">'+money(a.amount)+'</td><td>'+jStrShort(a.date)+'</td><td>'+esc(a.status||'باز')+'</td></tr>';}).join('')+'</tbody></table></div>';document.getElementById('content').innerHTML=html;};
window.openAccrualForm=function(){openProModal('ثبت تعهد','<form onsubmit="event.preventDefault();var f=this,amt=+f.amount.value||0;if(amt<=0)return;var a={id:uid(),name:f.name.value,type:f.type.value,amount:amt,date:readDateInput(f,\'date\'),status:\'باز\'};state.accruals.push(a);var lines=a.type===\'expense\'?[coreLine(\'506\',amt,0,a.name),coreLine(\'201\',0,amt,a.name)]:[coreLine(\'103\',amt,0,a.name),coreLine(\'401\',0,amt,a.name)];var n=fpNextJournalNo();state.journalEntries.push({id:uid(),number:n,date:a.date,description:a.name,lines:lines,status:\'posted\',auto:false,accrualId:a.id,createdAt:new Date().toISOString()});save();closeModal();renderAccruals()"><div class="field"><label>عنوان</label><input name="name" required></div><div class="field"><label>نوع</label><select name="type"><option value="expense">هزینه تعهدی</option><option value="revenue">درآمد تعهدی</option></select></div><div class="field"><label>مبلغ</label><input name="amount" type="number" min="1" required></div><div class="field"><label>تاریخ</label>'+fmtDateInput('date')+'</div><button class="btn btn-brand">ثبت</button></form>');};
window.renderCurrencies=function(){var html='<div class="spread"><div class="muted">ارزها و نرخ تبدیل به ارز پایه</div><button class="btn btn-brand" onclick="openCurrencyForm()">+ ارز</button></div><div class="card"><table><thead><tr><th>کد</th><th>نام</th><th>نرخ به ارز پایه</th><th>پایه</th></tr></thead><tbody>'+(state.currencies||[]).map(function(c){return '<tr><td>'+esc(c.code)+'</td><td>'+esc(c.name)+'</td><td class="num">'+money(c.rate)+'</td><td>'+(c.base?'بله':'—')+'</td></tr>';}).join('')+'</tbody></table><p class="muted" style="margin-top:12px">Ledger این نسخه همچنان با ارز پایه ثبت می‌شود؛ ارز و نرخ روی اسناد برای ردیابی و توسعه بعدی نگهداری می‌شوند.</p></div>';document.getElementById('content').innerHTML=html;};
window.openCurrencyForm=function(){openProModal('ارز جدید','<form onsubmit="event.preventDefault();var f=this;var code=f.code.value.trim().toUpperCase();if(!code)return;state.currencies.push({id:uid(),code:code,name:f.name.value,rate:+f.rate.value||1,base:false});save();closeModal();renderCurrencies()"><div class="field"><label>کد ارز</label><input name="code" maxlength="5" required></div><div class="field"><label>نام</label><input name="name" required></div><div class="field"><label>نرخ نسبت به ارز پایه</label><input name="rate" type="number" min="0.000001" step="0.000001" required></div><button class="btn btn-brand">ذخیره</button></form>');};
var oldShell=window.renderShell;window.renderShell=function(){oldShell();var navEl=document.querySelector('.mainnav');if(!navEl)return;[['cost-centers','tag','مراکز هزینه'],['loans','wallet','وام‌ها'],['accruals','wallet','تعهدات'],['currencies','chart','ارزها']].forEach(function(it){navEl.insertAdjacentHTML('beforeend','<a class="navlink'+(route.page===it[0]?' active':'')+'" onclick="nav(\''+it[0]+'\')">'+icon(it[1])+'<span>'+it[2]+'</span></a>');});};
var oldPage=window.renderPage;window.renderPage=function(){if(route.page==='cost-centers')return renderCostCenters();if(route.page==='loans')return renderLoans();if(route.page==='accruals')return renderAccruals();if(route.page==='currencies')return renderCurrencies();return oldPage();};
v12bEnsure();save();
})();
}catch(e){console.error('app.js block 19/23 failed:',e);}
;

/* ===== Script block 20/26 ===== */
try{
(function(){
'use strict';
/* V12.1 FINAL AUDIT PATCH — inventory returns, year-end closing, period locks, duplicate recurring */

/* Sale-return stock must carry the historical cost back into inventory, otherwise future moving-average COGS ignores returned goods. */
var _auditOldStock=window.coreRebuildStock;
window.coreRebuildStock=function(){
  var q=_auditOldStock();
  (state.saleReturns||[]).forEach(function(r){
    var inv=(state.invoices||[]).find(function(x){return x.id===r.invoiceId;});
    if(!inv)return;
    (r.items||[]).forEach(function(it,idx){
      var id=r.id+':stock:'+String(it.sourceKey||idx);
      var m=(state.stockMoves||[]).find(function(x){return x.id===id;});
      var src=(inv.items||[]).find(function(x,k){return String(x.key||k)===String(it.sourceKey);});
      if(!m)return;
      m.unitCost=src&&src.costPriceAtSale!=null?(+src.costPriceAtSale||0):0;
    });
  });
  return q;
};

/* Rebuild year-end closing with correct debit-normal contra-revenue accounts (403/404). */
window.closeFiscalYear=function(fy){
  if((state.closePeriods||[]).some(function(x){return x.fiscalYear===fy;})){showToast('این سال قبلاً بسته شده است');return;}
  if(!fpRequireOpen(todayJalali()))return;
  coreRebuildLedger();
  var revenueCodes=['401','402'], contraRevenueCodes=['403','404'];
  var expenseCodes=(state.chartAccounts||[]).filter(function(a){return a.type==='expense';}).map(function(a){return String(a.code);});
  var profit=0,lines=[];
  revenueCodes.forEach(function(code){var b=fpLedgerBalance(code);profit+=b; if(Math.abs(b)>.01)lines.push(coreLine(code,b>0?b:0,b<0?-b:0,'بستن درآمد '+code));});
  contraRevenueCodes.forEach(function(code){var b=fpLedgerBalance(code);profit-=b; if(Math.abs(b)>.01)lines.push(coreLine(code,b>0?0:-b,b>0?b:0,'بستن حساب کاهنده درآمد '+code));});
  expenseCodes.forEach(function(code){var b=fpLedgerBalance(code);profit-=b; if(Math.abs(b)>.01)lines.push(coreLine(code,b<0?-b:0,b>0?b:0,'بستن هزینه '+code));});
  if(Math.abs(profit)<.01){showToast('سودی برای بستن وجود ندارد');return;}
  if(profit>0)lines.push(coreLine('302',0,profit,'انتقال سود به سود انباشته'));else lines.push(coreLine('302',-profit,0,'انتقال زیان به سود انباشته'));
  var n=fpNextJournalNo();
  state.journalEntries.push({id:uid(),number:n,date:todayJalali(),description:'بستن سال مالی '+fy,lines:lines,status:'posted',auto:false,closeFiscalYear:fy,createdAt:new Date().toISOString()});
  state.closePeriods.push({fiscalYear:fy,journalNumber:n,date:todayJalali()});
  save();renderYearEnd();
};

/* Recurring entries: period must be open and the same template/date cannot be generated twice. */
var _auditOldGenerateRecurring=window.generateRecurring;
window.generateRecurring=function(id){
  var t=(state.recurringTemplates||[]).find(function(x){return x.id===id;});
  if(!t)return;
  if(!t.active){showToast('این قالب متوقف است');return;}
  if(!fpRequireOpen(todayJalali()))return;
  var today=todayJalali(),key=id+':'+today.jy+'/'+today.jm+'/'+today.jd;
  if((state.journalEntries||[]).some(function(e){return e.recurringKey===key;})){showToast('این قالب برای امروز قبلاً ثبت شده است');return;}
  var r=_auditOldGenerateRecurring(id);
  var e=state.journalEntries[state.journalEntries.length-1];
  if(e&&e.recurringTemplateId===id)e.recurringKey=key;
  save();
  return r;
};

/* New direct-journal modules must respect period lock before mutating state. */
var _auditOpenLoanForm=window.openLoanForm;
window.openLoanForm=function(){
  if(!fpRequireOpen(todayJalali()))return;
  return _auditOpenLoanForm.apply(this,arguments);
};
var _auditOpenAccrualForm=window.openAccrualForm;
window.openAccrualForm=function(){
  if(!fpRequireOpen(todayJalali()))return;
  return _auditOpenAccrualForm.apply(this,arguments);
};
var _auditOpenPrepaymentForm=window.openPrepaymentForm;
window.openPrepaymentForm=function(){
  if(!fpRequireOpen(todayJalali()))return;
  return _auditOpenPrepaymentForm.apply(this,arguments);
};

/* Health checks for the final invariants. */
var _auditHealth=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var o=_auditHealth();
  o.saleReturnCostIntegrity=[];o.closeJournalIntegrity=[];o.recurringDuplicates=[];
  (state.saleReturns||[]).forEach(function(r){
    if(r.voided)return;
    var inv=(state.invoices||[]).find(function(x){return x.id===r.invoiceId;});if(!inv)return;
    (r.items||[]).forEach(function(it,idx){
      var m=(state.stockMoves||[]).find(function(x){return x.id===r.id+':stock:'+String(it.sourceKey||idx);});
      var src=(inv.items||[]).find(function(x,k){return String(x.key||k)===String(it.sourceKey);});
      var expected=src&&src.costPriceAtSale!=null?(+src.costPriceAtSale||0):0;
      if(m&&Math.abs((+m.unitCost||0)-expected)>.01)o.saleReturnCostIntegrity.push(r.id+':'+(it.sourceKey||idx));
    });
  });
  (state.closePeriods||[]).forEach(function(cp){var j=(state.journalEntries||[]).find(function(e){return e.number===cp.journalNumber;});if(!j||Math.abs((j.lines||[]).reduce(function(a,l){return a+(+l.debit||0)-(+l.credit||0);},0))>.01)o.closeJournalIntegrity.push(cp.fiscalYear);});
  var seen={};(state.journalEntries||[]).forEach(function(e){if(e.recurringKey){if(seen[e.recurringKey])o.recurringDuplicates.push(e.recurringKey);seen[e.recurringKey]=1;}});
  o.ok=o.ok&&!o.saleReturnCostIntegrity.length&&!o.closeJournalIntegrity.length&&!o.recurringDuplicates.length;return o;
};

try{fpSyncLedger();}catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'v12.1-audit-patch',error:e.message}]);}
save();
})();
}catch(e){console.error('app.js block 20/23 failed:',e);}
;

/* ===== Script block 21/26 ===== */
try{
(function(){
'use strict';
/* V12.2 REPORTING AUDIT PATCH */

/* Customer ledger must include non-voided sales returns as credits. */
var _auditCustomerLedger=window.renderCustomerLedger;
window.renderCustomerLedger=function(customerId){
  var c=getCustomer(customerId);if(!c){nav('customers');return;}
  var entries=[];
  (state.invoices||[]).filter(function(i){return i.customerId===customerId&&!i.voided;}).forEach(function(inv){
    entries.push({jdn:jToJdn(inv.date),date:inv.date,label:'فاکتور #'+fa(inv.number),debit:+inv.grandTotal||0,credit:0,ref:inv.id,route:'invoice-view'});
    (inv.payments||[]).filter(function(p){return !p.voided;}).forEach(function(p){entries.push({jdn:jToJdn(p.date||inv.date),date:p.date||inv.date,label:'دریافت وجه فاکتور #'+fa(inv.number),debit:0,credit:+p.amount||0,ref:inv.id,route:'invoice-view'});});
  });
  (state.saleReturns||[]).filter(function(r){if(r.voided)return false;var inv=(state.invoices||[]).find(function(i){return i.id===r.invoiceId;});return inv&&inv.customerId===customerId;}).forEach(function(r){entries.push({jdn:jToJdn(r.date),date:r.date,label:'برگشت از فروش #'+fa(r.number),debit:0,credit:+r.grandTotal||0,ref:r.id,route:'sale-return-view'});});
  entries.sort(function(a,b){return a.jdn-b.jdn;});
  var balance=0;entries.forEach(function(e){balance+=e.debit-e.credit;e.balance=balance;});
  var totalDebit=entries.reduce(function(a,e){return a+e.debit;},0),totalCredit=entries.reduce(function(a,e){return a+e.credit;},0);
  var html='<div class="row no-print" style="justify-content:flex-end;margin-bottom:14px"><button class="btn btn-ghost" onclick="nav(\'customers\')">بازگشت</button></div><div class="card" style="margin-bottom:18px"><div class="section-title">'+esc(c.name)+'</div><div class="muted" style="font-size:13px">'+(c.phone?fa(c.phone)+' · ':'')+(c.address||'')+'</div></div>';
  html+='<div class="stat-grid">'+statCard('جمع بدهکاری',totalDebit,'')+statCard('جمع بستانکاری',totalCredit,'income')+statCard('مانده حساب',balance,balance>0?'expense':'income')+'</div>';
  if(!entries.length)html+=emptyState('users','تراکنشی ثبت نشده','برای این مشتری هنوز گردش مالی ثبت نشده',null,'');
  else{html+='<div class="card"><table><thead><tr><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr></thead><tbody>';entries.forEach(function(r){html+='<tr style="cursor:pointer" onclick="nav(\''+r.route+'\',\''+r.ref+'\')"><td>'+jStrShort(r.date)+'</td><td>'+esc(r.label)+'</td><td class="num">'+(r.debit?money(r.debit):'—')+'</td><td class="num">'+(r.credit?money(r.credit):'—')+'</td><td class="num">'+money(r.balance)+'</td></tr>';});html+='</tbody></table></div>';}
  document.getElementById('content').innerHTML=html;
};

/* Financial statements: include loan liability 207 and interest expense 509. */
var _auditFS=window.renderFinancialStatements;
window.renderFinancialStatements=function(){
  coreRebuildLedger();
  var rev=['401','402'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0),salesReturn=Math.max(0,fpLedgerBalance('404'));
  var cogs=Math.max(0,fpLedgerBalance('601')),opex=['501','502','503','504','505','506','507','508','509','603'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0),net=rev-salesReturn-cogs-opex;
  var assets=['101','102','103','104','105','107','108','206'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0)-Math.max(0,-fpLedgerBalance('106'));
  var liab=['201','202','203','204','205','207'].reduce(function(a,c){return a+Math.max(0,fpLedgerBalance(c));},0);
  var eq=['301','302'].reduce(function(a,c){return a+fpLedgerBalance(c);},0)+net;
  var html='<div class="stat-grid">'+statCard('درآمد خالص',rev-salesReturn,'income')+statCard('بهای تمام‌شده',cogs,'expense')+statCard('سایر هزینه‌ها',opex,'expense')+statCard('سود خالص',net,net>=0?'income':'expense')+'</div><div class="two-col"><div class="card"><div class="section-title">صورت سود و زیان</div><table><tbody><tr><td>درآمد</td><td class="num">'+money(rev)+'</td></tr><tr><td>برگشت از فروش</td><td class="num">'+money(salesReturn)+'</td></tr><tr><td>بهای تمام‌شده</td><td class="num">'+money(cogs)+'</td></tr><tr><td>هزینه‌ها شامل بهره</td><td class="num">'+money(opex)+'</td></tr><tr><th>سود خالص</th><th class="num">'+money(net)+'</th></tr></tbody></table></div><div class="card"><div class="section-title">ترازنامه</div><table><tbody><tr><td>دارایی‌ها</td><td class="num">'+money(assets)+'</td></tr><tr><td>بدهی‌ها</td><td class="num">'+money(liab)+'</td></tr><tr><td>حقوق مالکانه با سود جاری</td><td class="num">'+money(eq)+'</td></tr><tr><th>بدهی + سرمایه</th><th class="num">'+money(liab+eq)+'</th></tr></tbody></table></div></div>';
  document.getElementById('content').innerHTML=html;
};

try{fpSyncLedger();}catch(e){state.__accountingErrors=(state.__accountingErrors||[]).concat([{sourceType:'v12.2-reporting-audit',error:e.message}]);}
save();
})();
}catch(e){console.error('app.js block 21/23 failed:',e);}
;

/* ===== Script block 22/26 ===== */
try{
/* V12.6 navigation audit: only routes with real render handlers are exposed. */
(function(){
  'use strict';
  var groups={
    dashboard:{label:'خانه',icon:'home',accent:'#2f6fed',items:[['dashboard','home','داشبورد']]},
    sales:{label:'فروش',icon:'invoice',accent:'#2f8fa3',items:[['invoices','invoice','فاکتورها'],['quotations','invoice','پیش‌فاکتورها'],['sale-returns','invoice','برگشت از فروش'],['customers','users','مشتریان']]},
    purchases:{label:'خرید',icon:'invoice',accent:'#e58b00',items:[['purchase-invoices','invoice','فاکتورهای خرید'],['purchase-returns','invoice','برگشت از خرید'],['suppliers','users','تأمین‌کنندگان']]},
    treasury:{label:'خزانه',icon:'wallet',accent:'#187d72',items:[['checks','stamp','چک‌ها'],['receivables-payables','wallet','دریافتنی / پرداختنی'],['accounts','bank','حساب‌ها و صندوق'],['expenses','wallet','هزینه‌ها'],['prepayments','wallet','پیش‌پرداخت / پیش‌دریافت'],['loans','wallet','وام‌ها']]},
    inventory:{label:'انبار',icon:'bank',accent:'#a97b08',items:[['stock','bank','انبار'],['services','services','کالا و خدمات'],['categories','tag','دسته‌بندی‌ها']]},
    accounting:{label:'حسابداری',icon:'bank',accent:'#7140a0',items:[['journals','invoice','اسناد حسابداری'],['chart-accounts','bank','کدینگ حساب‌ها'],['general-ledger','chart','دفتر کل'],['trial-balance','chart','تراز آزمایشی'],['cashflow','chart','جریان وجوه نقد'],['fixed-assets','bank','دارایی ثابت'],['payroll','users','حقوق و دستمزد'],['budgets','chart','بودجه'],['accruals','wallet','تعهدات'],['year-end','chart','بستن سال مالی'],['fiscal-periods','history','دوره‌های مالی'],['cost-centers','tag','مراکز هزینه'],['currencies','chart','ارزها']]},
    reports:{label:'گزارش‌ها',icon:'chart',accent:'#c94b32',items:[['reports','chart','گزارش‌ها'],['financial-statements','chart','صورت‌های مالی'],['aging','chart','سنی مطالبات'],['tax','chart','مالیات'],['bank-reconciliation','bank','مغایرت‌گیری بانک'],['recurring','invoice','اسناد تکرارشونده'],['audit-log','history','گزارش حسابرسی'],['activity','history','تاریخچه تغییرات']]},
    settings:{label:'تنظیمات',icon:'gear',accent:'#52657d',items:[['projects','services','پروژه‌ها'],['settings','gear','تنظیمات'],['advanced-settings','gear','پشتیبان و دسترسی']]}
  };
  var pageGroup={};
  Object.keys(groups).forEach(function(g){groups[g].items.forEach(function(it){pageGroup[it[0]]=g;});});
  pageGroup['invoice-form']='sales';pageGroup['invoice-view']='sales';
  pageGroup['purchase-form']='purchases';pageGroup['purchase-view']='purchases';
  pageGroup['purchase-return-form']='purchases';pageGroup['purchase-return-view']='purchases';
  pageGroup['customer-ledger']='sales';pageGroup['supplier-ledger']='purchases';
  pageGroup['account-ledger']='treasury';pageGroup['rp-form']='treasury';pageGroup['rp-view']='treasury';pageGroup['sale-return-form']='sales';pageGroup['sale-return-view']='sales';
  var openGroup=null; /* menus are closed by default; only a tab click opens one */
  var oldNav=window.nav;
  window.nav=function(page,id){
    openGroup=null;
    var navEl=document.querySelector('.mainnav');
    var left=navEl?navEl.scrollLeft:0;
    oldNav(page,id);
    requestAnimationFrame(function(){var n=document.querySelector('.mainnav');if(n)n.scrollLeft=left;});
  };
  function escAttr(v){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;');}
  function activePage(page){
    if(page==='invoice-form'||page==='invoice-view')return 'invoices';
    if(page==='purchase-form'||page==='purchase-view')return 'purchase-invoices';
    if(page==='purchase-return-form'||page==='purchase-return-view')return 'purchase-returns';
    if(page==='sale-return-form'||page==='sale-return-view')return 'sale-returns';
    if(page==='customer-ledger')return 'customers';
    if(page==='supplier-ledger')return 'suppliers';
    if(page==='account-ledger')return 'accounts';
    if(page==='rp-form'||page==='rp-view')return 'receivables-payables';
    return page;
  }
  window.renderShell=function(){
    var p=activePage(route.page), group=pageGroup[p]||'dashboard';
    var navEl=document.getElementById('sidebar');
    var groupsHtml=Object.keys(groups).map(function(key){
      var g=groups[key],is=key===group,isOpen=key===openGroup;
      var menu=g.items.map(function(it){
        var on=p===it[0];
        return '<button type="button" class="nav-subitem'+(on?' active':'')+'" onclick="nav(\''+escAttr(it[0])+'\')">'+icon(it[1])+'<span>'+esc(it[2])+'</span></button>';
      }).join('');
      return '<div class="nav-group" data-group="'+key+'"><button type="button" class="nav-group-tab'+(is?' active':'')+(isOpen?' open':'')+'" data-group="'+key+'" aria-expanded="'+(isOpen?'true':'false')+'" onclick="toggleNavGroup(\''+key+'\')">'+icon(g.icon)+'<span>'+esc(g.label)+'</span>'+(g.items.length>1?'<svg class="nav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>':'')+'</button><div class="nav-group-menu'+(isOpen?' open':'')+'">'+menu+'</div></div>';
    }).join('');
    navEl.innerHTML='<div class="brand"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 20V12M12 20V5M19 20v-5"/></svg></div><div><div class="word">دفتر</div><div class="sub">حسابداری کسب‌وکار</div></div></div><nav class="mainnav">'+groupsHtml+'</nav><div class="sidebar-foot"><div class="user-card"><div class="avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div><div class="who"><b>'+esc(state.business.name||'کاربر')+'</b><small>مدیر سیستم</small></div><button type="button" class="theme-btn" onclick="toggleTheme()" title="حالت روشن/تیره" aria-label="حالت روشن/تیره">'+icon('sun')+'</button></div></div>';
    navEl.style.setProperty('--nav-accent',groups[group].accent);
    document.getElementById('topbar').style.setProperty('--nav-accent',groups[group].accent);
    var titles={dashboard:'داشبورد',invoices:'فاکتورها','purchase-invoices':'فاکتورهای خرید','purchase-form':route.id?'ویرایش فاکتور خرید':'فاکتور خرید جدید','purchase-view':'مشاهده فاکتور خرید','purchase-returns':'برگشت از خرید','purchase-return-form':route.id?'ویرایش برگشت از خرید':'برگشت از خرید جدید','purchase-return-view':'مشاهده برگشت از خرید','invoice-form':route.id?'ویرایش فاکتور':'فاکتور جدید','invoice-view':'مشاهده فاکتور',quotations:'پیش‌فاکتورها','sale-returns':'برگشت از فروش','sale-return-form':'ثبت برگشت از فروش','sale-return-view':'مشاهده برگشت از فروش',customers:'مشتریان','customer-ledger':'کارت حساب مشتری',suppliers:'تأمین‌کنندگان','supplier-ledger':'کارت حساب تأمین‌کننده',services:'کالا و خدمات',projects:'پروژه‌ها',checks:'چک‌ها','receivables-payables':'دریافتنی / پرداختنی','rp-form':'ثبت حساب','rp-view':'جزئیات حساب',accounts:'حساب‌ها و صندوق','account-ledger':'گردش حساب',expenses:'هزینه‌ها',stock:'انبار',journals:'اسناد حسابداری','chart-accounts':'کدینگ حساب‌ها','general-ledger':'دفتر کل',reports:'گزارش‌ها','financial-statements':'صورت‌های مالی','trial-balance':'تراز آزمایشی',tax:'مالیات',aging:'سنی مطالبات',cashflow:'جریان وجوه نقد','bank-reconciliation':'مغایرت‌گیری بانک',recurring:'اسناد تکرارشونده',prepayments:'پیش‌پرداخت / پیش‌دریافت','year-end':'بستن سال مالی','fixed-assets':'دارایی ثابت','cost-centers':'مراکز هزینه',accruals:'تعهدات',currencies:'ارزها','fiscal-periods':'دوره‌های مالی','audit-log':'گزارش حسابرسی',activity:'تاریخچه تغییرات',budgets:'بودجه',payroll:'حقوق و دستمزد',settings:'تنظیمات','advanced-settings':'پشتیبان و دسترسی',categories:'دسته‌بندی‌ها',loans:'وام‌ها'};
    document.getElementById('topbar').innerHTML='<h1>'+esc(titles[route.page]||'')+'</h1><div class="today">امروز: '+jStr(todayJalali())+'</div>';
    document.getElementById('topbar').style.setProperty('--nav-accent',groups[group].accent);
  };
  /* Several page handlers (returns, ledger, cashflow, payroll, budgets, audit, periods, cost centers, currencies, ...)
     return before the base renderPage() reaches renderShell(), so the menu and title kept showing the PREVIOUS page.
     This outermost wrapper makes sure the shell always matches the current route. */
  var shellSafeRenderPage=window.renderPage;
  window.renderPage=function(){
    var out=shellSafeRenderPage.apply(this,arguments);
    var bar=document.querySelector('.mainnav'),left=bar?bar.scrollLeft:0;
    window.renderShell();
    var bar2=document.querySelector('.mainnav');if(bar2)bar2.scrollLeft=left;
    return out;
  };
  function closeNavMenus(){
    openGroup=null;
    var navEl=document.querySelector('.mainnav');if(!navEl)return;
    navEl.querySelectorAll('.nav-group-menu.open,.nav-group-tab.open').forEach(function(e){e.classList.remove('open');});
    navEl.querySelectorAll('.nav-group-tab').forEach(function(b){b.setAttribute('aria-expanded','false');});
  }
  window.toggleNavGroup=function(key){
    var g=groups[key];
    /* A group with a single page (dashboard) has nothing to choose from: go straight there. */
    if(g&&g.items.length===1){closeNavMenus();nav(g.items[0][0]);return;}
    var navEl=document.querySelector('.mainnav'),target=navEl&&navEl.querySelector('[data-group="'+key+'"]');if(!target)return;
    var wasOpen=openGroup===key;
    closeNavMenus();
    if(!wasOpen){
      openGroup=key;
      target.querySelector('.nav-group-menu').classList.add('open');
      var tab=target.querySelector('.nav-group-tab');tab.classList.add('open');tab.setAttribute('aria-expanded','true');
    }
  };
  document.addEventListener('click',function(e){if(openGroup&&!(e.target.closest&&e.target.closest('.nav-group')))closeNavMenus();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&openGroup)closeNavMenus();});
})();
}catch(e){console.error('app.js block 22/23 failed:',e);}
;

/* ===== Script block 23/26 ===== */
try{
(function(){
'use strict';
/* =====================================================================
   ACCOUNTING CORE FIXES v13
   1. one ledger rebuild (skipped when nothing changed)   5. closed-period lock gaps
   2. balances in a single pass                           6. VAT report from the ledger + settlement
   3. type-driven, year-based financial statements        7. control accounts need a party
   4. fiscal-year closing at year end                     8. stock and subledger health checks
   ===================================================================== */

/* ---------- 1. ledger rebuild only when source data changed ---------- */
var fullRebuild=window.coreRebuildLedger,lastFp=null,lastState=null;
var SKIP={journalEntries:1,activityLog:1,auditLog:1,__accountingErrors:1,journalNumbers:1,journalSeq:1,alertsRead:1};
function fingerprint(){var parts=[];Object.keys(state).forEach(function(k){if(!SKIP[k]){parts.push(k);parts.push(state[k]);}});try{return JSON.stringify(parts);}catch(e){return null;}}
window.coreRebuildLedger=function(force){
  if(force!==true&&lastState===state&&lastFp!==null&&(state.journalEntries||[]).length){
    var fp=fingerprint();if(fp!==null&&fp===lastFp)return state.__accountingErrors||[];
  }
  var r=fullRebuild.apply(this,arguments);lastFp=fingerprint();lastState=state;return r;
};

/* ---------- fiscal-year helpers ---------- */
function startMonth(){var s=Number((state.settings||{}).fiscalYearStartMonth)||1;return s>=1&&s<=12?s:1;}
function fyRange(fy){
  var s=startMonth(),ey=s===1?fy:fy+1,em=s===1?12:s-1,months=[],y=fy,m=s,i;
  for(i=0;i<12;i++){months.push({jy:y,jm:m});m++;if(m>12){m=1;y++;}}
  return {start:{jy:fy,jm:s,jd:1},end:{jy:ey,jm:em,jd:jDaysInMonth(ey,em)},months:months};
}
function fyOf(d){var s=startMonth();return d.jm>=s?d.jy:d.jy-1;}
function isClosing(e){return e.closeFiscalYear!==undefined&&e.closeFiscalYear!==null;}
function fiscalYears(){
  var set={};set[fyOf(todayJalali())]=1;
  (state.journalEntries||[]).forEach(function(e){if(e.date)set[fyOf(e.date)]=1;});
  return Object.keys(set).map(Number).sort(function(a,b){return b-a;});
}
window.fpFiscalRange=fyRange;

/* ---------- 2. all balances in one pass (optionally for a date window) ---------- */
window.fpAllBalances=function(o){
  o=o||{};window.coreRebuildLedger();
  var lo=o.from?jToJdn(o.from):-1e12,hi=o.to?jToJdn(o.to):1e12,map={};
  (state.chartAccounts||[]).forEach(function(a){map[String(a.code)]={acc:a,d:0,c:0,bal:0};});
  (state.journalEntries||[]).forEach(function(e){
    if(e.voided||e.status==='void')return;
    if(o.excludeClosing&&isClosing(e))return;
    var j=jToJdn(e.date);if(j<lo||j>hi)return;
    (e.lines||[]).forEach(function(l){var r=map[String(l.accountCode)];if(r){r.d+=+l.debit||0;r.c+=+l.credit||0;}});
  });
  Object.keys(map).forEach(function(k){var r=map[k];r.bal=(r.acc.type==='asset'||r.acc.type==='expense')?r.d-r.c:r.c-r.d;});
  return map;
};

/* ---------- 3. financial statements: by account type, per fiscal year, no clamping ---------- */
function tr(label,val,cls){return '<tr'+(cls?' class="'+cls+'"':'')+'><td>'+label+'</td><td class="num"><span dir="ltr">'+money(val)+'</span></td></tr>';}
function sumType(map,type){var t=0;Object.keys(map).forEach(function(k){if(map[k].acc.type===type)t+=map[k].bal;});return t;}
window.renderFinancialStatements=function(){
  var cur=fyOf(todayJalali()),Y=+window.__fsYear||cur,years=fiscalYears();
  if(years.indexOf(Y)<0){years.push(Y);years.sort(function(a,b){return b-a;});}
  var r=fyRange(Y),pl=window.fpAllBalances({from:r.start,to:r.end,excludeClosing:true}),bs=window.fpAllBalances({to:r.end});
  var rev=sumType(pl,'revenue'),exp=sumType(pl,'expense'),cogs=pl['601']?pl['601'].bal:0,otherExp=exp-cogs,net=rev-exp;
  var h='<div class="spread"><div class="row"><label style="margin:0">سال مالی</label><select style="width:130px" onchange="window.__fsYear=+this.value;renderFinancialStatements()">'+
    years.map(function(y){return '<option value="'+y+'"'+(y===Y?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select></div>'+
    '<div class="muted" style="font-size:12px">'+jStrShort(r.start)+' تا '+jStrShort(r.end)+'</div></div>';
  /* income statement */
  var inc='';
  Object.keys(pl).forEach(function(k){var x=pl[k];if(x.acc.type==='revenue'&&Math.abs(x.bal)>0.5)inc+=tr(esc(x.acc.code+' - '+x.acc.name),x.bal);});
  inc+=tr('<b>جمع درآمد خالص</b>',rev,'');
  inc+=tr('بهای تمام‌شده کالای فروش‌رفته (۶۰۱)',-cogs,'');
  inc+=tr('<b>سود ناخالص</b>',rev-cogs,'');
  Object.keys(pl).forEach(function(k){var x=pl[k];if(x.acc.type==='expense'&&k!=='601'&&Math.abs(x.bal)>0.5)inc+=tr(esc(x.acc.code+' - '+x.acc.name),-x.bal);});
  inc+=tr('<b>سود (زیان) خالص</b>',net,'');
  /* balance sheet at fiscal-year end; wrong-side balances are reclassified, never hidden */
  var A=[],L=[],E=[];
  Object.keys(bs).forEach(function(k){
    var x=bs[k],b=x.bal,lab=esc(x.acc.code+' - '+x.acc.name);if(Math.abs(b)<0.5)return;
    if(x.acc.type==='asset'){if(b>=0||k==='106')A.push([lab,b]);else L.push([lab+' (مانده بستانکار)',-b]);}
    else if(x.acc.type==='liability'){if(b>=0)L.push([lab,b]);else A.push([lab+' (مانده بدهکار)',-b]);}
    else if(x.acc.type==='equity'){E.push([lab,b]);}
  });
  var profitToDate=sumType(bs,'revenue')-sumType(bs,'expense');
  if(Math.abs(profitToDate)>=0.5)E.push(['سود (زیان) جاری — بسته‌نشده',profitToDate]);
  var sA=A.reduce(function(a,x){return a+x[1];},0),sL=L.reduce(function(a,x){return a+x[1];},0),sE=E.reduce(function(a,x){return a+x[1];},0);
  var diff=Math.round((sA-(sL+sE))*100)/100;
  function rowsHtml(arr){return arr.map(function(x){return tr(x[0],x[1]);}).join('')||'<tr><td class="muted">—</td><td></td></tr>';}
  h+='<div class="two-col"><div class="card"><div class="section-title">صورت سود و زیان</div><table><tbody>'+inc+'</tbody></table></div>'+
     '<div class="card"><div class="section-title">ترازنامه در پایان سال مالی</div><table><tbody>'+
     '<tr><td colspan="2"><b>دارایی‌ها</b></td></tr>'+rowsHtml(A)+tr('<b>جمع دارایی‌ها</b>',sA)+
     '<tr><td colspan="2"><b>بدهی‌ها</b></td></tr>'+rowsHtml(L)+tr('<b>جمع بدهی‌ها</b>',sL)+
     '<tr><td colspan="2"><b>حقوق مالکانه</b></td></tr>'+rowsHtml(E)+tr('<b>جمع حقوق مالکانه</b>',sE)+
     tr('<b>جمع بدهی‌ها و حقوق مالکانه</b>',sL+sE)+
     (Math.abs(diff)>0.5?'<tr><td style="color:var(--seal)">اختلاف تراز (باید صفر باشد)</td><td class="num" style="color:var(--seal)">'+money(diff)+'</td></tr>':'')+
     '</tbody></table></div></div>';
  document.getElementById('content').innerHTML=h;
};

/* ---------- 4. fiscal-year closing: dated at year end, only that year's activity ---------- */
function closedRec(fy){return (state.closePeriods||[]).find(function(x){return x.fiscalYear===fy;});}
function yearPL(fy){
  var r=fyRange(fy),m=window.fpAllBalances({from:r.start,to:r.end,excludeClosing:true}),rev=0,exp=0,any=false;
  Object.keys(m).forEach(function(k){var a=m[k].acc;if(a.type==='revenue'){rev+=m[k].bal;if(Math.abs(m[k].bal)>0.5)any=true;}else if(a.type==='expense'){exp+=m[k].bal;if(Math.abs(m[k].bal)>0.5)any=true;}});
  return {range:r,map:m,profit:rev-exp,hasActivity:any};
}
window.renderYearEnd=function(){
  var years=fiscalYears(),h='<div class="card"><div class="section-title">بستن سال مالی</div><p class="muted">سود/زیان هر سال مالی با تاریخ پایان همان سال به سود (زیان) انباشته منتقل می‌شود و ماه‌های آن سال قفل می‌شوند. سال‌ها باید به ترتیب بسته شوند و بستن فقط یک بار انجام می‌شود.</p></div>';
  years.forEach(function(y){
    var p=yearPL(y),rec=closedRec(y);if(!p.hasActivity&&!rec)return;
    h+='<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><div><div class="section-title" style="margin:0">سال مالی '+fa(y)+'</div><div class="muted" style="font-size:12px">'+jStrShort(p.range.start)+' تا '+jStrShort(p.range.end)+'</div></div>'+
      '<div class="stat-card" style="min-width:210px"><div class="label">سود / زیان قابل انتقال</div><div class="value">'+money(rec?0:p.profit)+'<small>'+esc(state.business.currency)+'</small></div></div>'+
      (rec?'<div class="badge paid">بسته شد — سند #'+fa(rec.journalNumber)+'</div>':'<button class="btn btn-brand" onclick="closeFiscalYear('+y+')">بستن سال مالی</button>')+'</div></div>';
  });
  document.getElementById('content').innerHTML=h;
};
window.closeFiscalYear=function(fy){
  fy=+fy;if(!fy)return;state.closePeriods=state.closePeriods||[];
  if(closedRec(fy)){showToast('این سال قبلاً بسته شده است');return;}
  var prev=fy-1;if(yearPL(prev).hasActivity&&!closedRec(prev)){showToast('ابتدا سال مالی '+fa(prev)+' را ببندید');return;}
  var p=yearPL(fy),r=p.range;
  if(!p.hasActivity||Math.abs(p.profit)<0.01&&!Object.keys(p.map).some(function(k){return (p.map[k].acc.type==='revenue'||p.map[k].acc.type==='expense')&&Math.abs(p.map[k].bal)>0.5;})){showToast('برای این سال چیزی برای بستن وجود ندارد');return;}
  if(jToJdn(todayJalali())<jToJdn(r.end)&&!confirm('سال مالی هنوز تمام نشده است. بستن زودهنگام، همه ماه‌های این سال را قفل می‌کند. ادامه می‌دهید؟'))return;
  var lines=[],profit=p.profit;
  Object.keys(p.map).forEach(function(k){
    var x=p.map[k],b=x.bal;if(Math.abs(b)<0.5)return;
    if(x.acc.type==='revenue')lines.push(coreLine(k,b>0?b:0,b<0?-b:0,'بستن '+x.acc.name));
    else if(x.acc.type==='expense')lines.push(coreLine(k,b<0?-b:0,b>0?b:0,'بستن '+x.acc.name));
  });
  if(profit>0)lines.push(coreLine('302',0,profit,'انتقال سود سال '+fy+' به سود انباشته'));
  else if(profit<0)lines.push(coreLine('302',-profit,0,'انتقال زیان سال '+fy+' به سود انباشته'));
  var n=fpNextJournalNo();
  state.journalEntries.push({id:uid(),number:n,date:r.end,description:'بستن سال مالی '+fy,lines:lines,status:'posted',auto:false,closeFiscalYear:fy,createdAt:new Date().toISOString()});
  state.closePeriods.push({fiscalYear:fy,journalNumber:n,date:r.end});
  state.fiscalPeriods=state.fiscalPeriods||[];
  r.months.forEach(function(m){var x=state.fiscalPeriods.find(function(q){return +q.jy===m.jy&&+q.jm===m.jm;});if(x)x.status='closed';else state.fiscalPeriods.push({id:uid(),jy:m.jy,jm:m.jm,status:'closed'});});
  fpAudit('close-year',String(fy),'بستن سال مالی — سند '+n);
  save();renderYearEnd();
};

/* ---------- 5. closed-period lock: the remaining paths ---------- */
function guard(name,dateOf){
  var old=window[name];if(typeof old!=='function')return;
  window[name]=function(){var d=null;try{d=dateOf.apply(null,arguments);}catch(e){}if(d&&!fpRequireOpen(d))return;return old.apply(this,arguments);};
}
function byId(list,id){return (list||[]).find(function(x){return x.id===id;});}
guard('voidPurchase',function(id){var p=byId(state.purchaseInvoices,id);return p&&p.date;});
guard('voidSaleReturn',function(id){var r=byId(state.saleReturns,id);return r&&r.date;});
guard('voidPurchaseReturn',function(id){var r=byId(state.purchaseReturns,id);return r&&r.date;});
guard('deleteReceivablePayable',function(id){var r=byId(state.receivablesPayables,id);return r&&r.date;});
guard('deleteCheck',function(id){var c=byId(state.checks,id);return c&&(c.date||c.dueDate);});

/* periods page: close / reopen any month (months of a closed fiscal year stay locked) */
function inClosedYear(jy,jm){return (state.closePeriods||[]).some(function(c){return fyRange(c.fiscalYear).months.some(function(m){return m.jy===jy&&m.jm===jm;});});}
function findPeriod(jy,jm){return (state.fiscalPeriods||[]).find(function(p){return +p.jy===+jy&&+p.jm===+jm;});}
window.fpClosePeriod=function(jy,jm){
  var t=todayJalali();jy=+jy||t.jy;jm=+jm||t.jm;fpEnsure();
  var x=findPeriod(jy,jm);if(x&&x.status==='closed'){showToast('این دوره قبلاً بسته شده است');return;}
  if(x)x.status='closed';else state.fiscalPeriods.push({id:uid(),jy:jy,jm:jm,status:'closed'});
  fpAudit('close-period',jy+'/'+jm,'بستن دوره');save();nav('fiscal-periods');
};
window.fpReopenPeriod=function(jy,jm){
  jy=+jy;jm=+jm;
  if(inClosedYear(jy,jm)){showToast('این ماه جزو سال مالی بسته‌شده است و قابل بازگشایی نیست');return;}
  if(!confirm('این دوره دوباره باز شود؟ ثبت و ویرایش سند در این ماه ممکن می‌شود.'))return;
  var x=findPeriod(jy,jm);if(x)x.status='open';
  fpAudit('reopen-period',jy+'/'+jm,'بازگشایی دوره');save();nav('fiscal-periods');
};
function renderPeriodsPage(){
  fpEnsure();var seen={},list=[];
  (state.journalEntries||[]).forEach(function(e){if(e.date){var k=e.date.jy+'-'+e.date.jm;if(!seen[k]){seen[k]=1;list.push({jy:e.date.jy,jm:e.date.jm});}}});
  (state.fiscalPeriods||[]).forEach(function(p){var k=p.jy+'-'+p.jm;if(!seen[k]){seen[k]=1;list.push({jy:+p.jy,jm:+p.jm});}});
  var t=todayJalali(),k0=t.jy+'-'+t.jm;if(!seen[k0])list.push({jy:t.jy,jm:t.jm});
  list.sort(function(a,b){return b.jy-a.jy||b.jm-a.jm;});
  var h='<div class="spread"><div class="muted">قفل دوره‌ها: در ماه بسته، ثبت، ویرایش و ابطال سند ممکن نیست.</div></div><div class="card"><table><thead><tr><th>دوره</th><th>وضعیت</th><th></th></tr></thead><tbody>';
  list.forEach(function(p){
    var x=findPeriod(p.jy,p.jm),closed=!!x&&x.status==='closed',lockedYear=inClosedYear(p.jy,p.jm);
    h+='<tr><td>'+esc(J_MONTHS[p.jm-1])+' '+fa(p.jy)+'</td><td>'+(closed?'<span class="badge void">بسته</span>':'<span class="badge paid">باز</span>')+(lockedYear?' <span class="muted" style="font-size:11px">سال مالی بسته</span>':'')+'</td><td>'+
      (closed?(lockedYear?'':'<button class="btn btn-ghost btn-sm" onclick="fpReopenPeriod('+p.jy+','+p.jm+')">بازگشایی</button>'):'<button class="btn btn-ghost btn-sm" onclick="fpClosePeriod('+p.jy+','+p.jm+')">بستن</button>')+'</td></tr>';
  });
  h+='</tbody></table></div>';document.getElementById('content').innerHTML=h;
}
var rpBeforePeriods=window.renderPage;
window.renderPage=function(){
  if(route&&route.page==='fiscal-periods'){fpEnsure();renderShell();return renderPeriodsPage();}
  return rpBeforePeriods.apply(this,arguments);
};

/* ---------- 6. VAT report from the ledger, by period, with settlement ---------- */
function vatPeriod(sel,Y){
  var m1=1,m2=12,lab='سال '+fa(Y);
  if(/^q[1-4]$/.test(sel)){var q=+sel[1];m1=(q-1)*3+1;m2=q*3;lab='فصل '+fa(q)+' سال '+fa(Y);}
  else if(/^m([1-9]|1[0-2])$/.test(sel)){m1=m2=+sel.slice(1);lab=J_MONTHS[m1-1]+' '+fa(Y);}
  return {m1:m1,m2:m2,label:lab,end:{jy:Y,jm:m2,jd:jDaysInMonth(Y,m2)}};
}
function vatNumbers(Y,m1,m2){
  var out=0,inp=0,paid=0,settled=0,byM={};for(var i=1;i<=12;i++)byM[i]={out:0,inp:0};
  (state.journalEntries||[]).forEach(function(e){
    if(e.voided||e.status==='void'||!e.date||e.date.jy!==Y||e.date.jm<m1||e.date.jm>m2)return;
    var o=0,ii=0,other=0;
    (e.lines||[]).forEach(function(l){
      var code=String(l.accountCode),d=+l.debit||0,c=+l.credit||0;
      if(code==='202'){if(e.sourceType==='invoice'||e.sourceType==='sale-return')o+=c-d;else if(e.vatSettlement)settled+=d;else other+=d-c;}
      if(code==='206'&&(e.sourceType==='purchase-invoice'||e.sourceType==='purchase-return'))ii+=d-c;
    });
    out+=o;inp+=ii;paid+=other;byM[e.date.jm].out+=o;byM[e.date.jm].inp+=ii;
  });
  return {out:out,inp:inp,paid:paid,settled:settled,byM:byM};
}
window.renderTax=function(){
  var Y=+window.__taxYear||todayJalali().jy,sel=window.__taxPeriod||'y',per=vatPeriod(sel,Y);
  var n=vatNumbers(Y,per.m1,per.m2),bal=window.fpAllBalances({to:per.end}),b202=bal['202']?bal['202'].bal:0,b206=bal['206']?bal['206'].bal:0;
  var key=Y+':'+sel,done=(state.journalEntries||[]).some(function(e){return e.vatSettlement===key;});
  var offset=Math.max(0,Math.min(b202,b206));
  var opts=[['y','کل سال']].concat([1,2,3,4].map(function(q){return ['q'+q,'فصل '+fa(q)];})).concat(J_MONTHS.map(function(m,i){return ['m'+(i+1),m];}));
  var years=fiscalYears().map(function(y){return y;});if(years.indexOf(Y)<0)years.unshift(Y);
  var h='<div class="spread"><div class="row"><select style="width:120px" onchange="window.__taxYear=+this.value;renderTax()">'+years.map(function(y){return '<option value="'+y+'"'+(y===Y?' selected':'')+'>'+fa(y)+'</option>';}).join('')+'</select>'+
    '<select style="width:150px" onchange="window.__taxPeriod=this.value;renderTax()">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>'+
    '<div class="muted" style="font-size:12px">'+esc(per.label)+' — محاسبه از دفتر کل</div></div>';
  h+='<div class="stat-grid">'+statCard('مالیات فروش (خالص از برگشتی)',n.out,'expense')+statCard('اعتبار مالیات خرید (خالص از برگشتی)',n.inp,'income')+statCard('مالیات خالص دوره',n.out-n.inp,n.out-n.inp>0?'expense':'income')+statCard('پرداخت‌ها و تعدیلات',n.paid,'')+'</div>';
  h+='<div class="stat-grid">'+statCard('مانده مالیات پرداختنی (۲۰۲) تا پایان دوره',b202,'expense')+statCard('مانده اعتبار مالیاتی (۲۰۶) تا پایان دوره',b206,'income')+'</div>';
  h+='<div class="card"><div class="section-title">تسویه مالیات دوره</div><p class="muted" style="font-size:12.5px">تسویه، اعتبار مالیات خرید را با مالیات فروش تهاتر می‌کند (بدهکار ۲۰۲ / بستانکار ۲۰۶). پرداخت باقی‌مانده به سازمان مالیاتی را از «حساب‌ها و صندوق ← تراکنش دستی» با حساب مقابل ۲۰۲ ثبت کنید.</p>'+
    (done?'<span class="badge paid">این دوره تسویه شده است</span>':(offset>0?'<button class="btn btn-brand" onclick="fpVatSettle(\''+key+'\')">ثبت تسویه ('+money(offset)+' '+esc(state.business.currency)+')</button>':'<span class="muted">مبلغی برای تهاتر وجود ندارد</span>'))+'</div>';
  h+='<div class="card" style="margin-top:14px"><div class="section-title">به تفکیک ماه</div><table><thead><tr><th>ماه</th><th>مالیات فروش</th><th>اعتبار خرید</th><th>خالص</th></tr></thead><tbody>';
  for(var mm=1;mm<=12;mm++){var r=n.byM[mm];if(mm<per.m1||mm>per.m2)continue;h+='<tr><td>'+J_MONTHS[mm-1]+'</td><td class="num">'+money(r.out)+'</td><td class="num">'+money(r.inp)+'</td><td class="num">'+money(r.out-r.inp)+'</td></tr>';}
  h+='</tbody></table></div>';
  document.getElementById('content').innerHTML=h;
};
window.fpVatSettle=function(key){
  var parts=String(key).split(':'),Y=+parts[0],per=vatPeriod(parts[1],Y);
  if(!fpRequireOpen(per.end))return;
  if((state.journalEntries||[]).some(function(e){return e.vatSettlement===key;})){showToast('این دوره قبلاً تسویه شده است');return;}
  var bal=window.fpAllBalances({to:per.end}),amt=Math.max(0,Math.min(bal['202']?bal['202'].bal:0,bal['206']?bal['206'].bal:0));
  if(amt<1){showToast('مبلغی برای تسویه وجود ندارد');return;}
  var n=fpNextJournalNo();
  state.journalEntries.push({id:uid(),number:n,date:per.end,description:'تسویه مالیات ارزش افزوده — '+per.label,lines:[coreLine('202',amt,0,'تهاتر مالیات فروش با اعتبار خرید'),coreLine('206',0,amt,'تهاتر اعتبار خرید')],status:'posted',auto:false,vatSettlement:key,createdAt:new Date().toISOString()});
  fpAudit('vat-settlement',key,'تسویه مالیات — سند '+n);save();renderTax();
};

/* ---------- 7. control accounts, stock and subledger checks ---------- */
var CONTROL=['103','201'];
var CONTROL_MSG='حساب‌های دریافتنی (۱۰۳) و پرداختنی (۲۰۱) حساب کنترلی‌اند؛ دریافت و پرداخت را از فاکتور، «دریافتنی/پرداختنی» یا چک ثبت کنید تا به طرف حساب وصل شود';
var stBefore=window.saveTransaction;
window.saveTransaction=function(ev,accountId){
  var f=ev&&ev.target;
  if(f&&f.counterAccount&&CONTROL.indexOf(String(f.counterAccount.value))>=0){if(ev.preventDefault)ev.preventDefault();showToast(CONTROL_MSG);return false;}
  return stBefore.apply(this,arguments);
};
var sjBefore=window.saveJournalEntry;
window.saveJournalEntry=function(ev,id){
  var f=ev&&ev.target,bad=false;
  if(f&&f.querySelectorAll)f.querySelectorAll('.jline').forEach(function(r){var a=r.querySelector('[name=account]'),d=r.querySelector('[name=debit]'),c=r.querySelector('[name=credit]');if(a&&CONTROL.indexOf(String(a.value))>=0&&((d&&+d.value)||(c&&+c.value)))bad=true;});
  if(bad){if(ev.preventDefault)ev.preventDefault();showToast(CONTROL_MSG);return false;}
  return sjBefore.apply(this,arguments);
};
var sidBefore=window.saveInvoiceDraft;
window.saveInvoiceDraft=function(){
  if(typeof draft!=='undefined'&&draft&&draft.items){
    var need={},prevQ={},prev=draft.id?getInvoice(draft.id):null;
    draft.items.forEach(function(it){if(it.serviceId&&(+it.qty)>0)need[it.serviceId]=(need[it.serviceId]||0)+(+it.qty);});
    if(prev&&!prev.voided)(prev.items||[]).forEach(function(it){if(it.serviceId)prevQ[it.serviceId]=(prevQ[it.serviceId]||0)+(+it.qty||0);});
    for(var sid in need){var sv=getService(sid);if(sv&&sv.trackStock){var avail=(+sv.stock||0)+(prevQ[sid]||0);if(need[sid]>avail){showToast('موجودی «'+sv.name+'» کافی نیست (موجودی: '+fa(avail)+' — درخواست: '+fa(need[sid])+')');return;}}}
  }
  return sidBefore.apply(this,arguments);
};
var healthBefore=window.fpAccountingHealth;
window.fpAccountingHealth=function(){
  var out=healthBefore.apply(this,arguments)||{};
  try{
    var sub={},missing=[];
    CONTROL.forEach(function(code){
      var control=0,tagged=0;
      (state.journalEntries||[]).forEach(function(e){
        if(e.voided||e.status==='void')return;
        (e.lines||[]).forEach(function(l){
          if(String(l.accountCode)!==code)return;
          var amt=(+l.debit||0)-(+l.credit||0);control+=amt;
          if(l.partyId)tagged+=amt;else if(Math.abs(amt)>0.5&&(e.auto===false||e.sourceType==='transaction'))missing.push({account:code,entry:e.number,amount:amt});
        });
      });
      var sign=code==='103'?1:-1;sub[code]={control:sign*control,assignedToParties:sign*tagged,unassigned:sign*(control-tagged)};
    });
    out.subledger=sub;out.controlAccountsWithoutParty=missing;
    out.ok=(out.ok===undefined?true:out.ok)&&!missing.length;
  }catch(e){}
  return out;
};

/* ---------- 8. quantities typed on an item become stock movements (the rebuild used to overwrite them) ---------- */
var ssBefore=window.saveService;
window.saveService=function(ev,id){
  var f=ev&&ev.target,track=!!(f&&f.trackStock&&f.trackStock.checked),entered=f&&f.stock?(Number(f.stock.value)||0):0;
  var old=id?getService(id):null,cur=old?(+old.stock||0):0,had=id?(state.stockMoves||[]).some(function(m){return m.serviceId===id;}):false,n0=state.services.length;
  var r=ssBefore.apply(this,arguments);
  var sv=id?getService(id):(state.services.length>n0?state.services[state.services.length-1]:null);
  if(sv&&track&&entered!==cur){
    var diff=entered-cur,cost=(f.costPrice?(+f.costPrice.value||0):(+sv.costPrice||0));
    state.stockMoves.push({id:uid(),serviceId:sv.id,type:diff>0?((had||cur>0)?'adjust-in':'opening'):'adjust-out',qty:Math.abs(diff),unitCost:cost,date:todayJalali(),note:'تعدیل موجودی از فرم کالا'});
    sv.openingStockMigrated=true;save();window.fpSyncLedger();
  }
  return r;
};

/* ---------- 9. documents' own journals are corrected through the document, not by reversing the journal ---------- */
var rjBefore=window.fpReverseJournal;
window.fpReverseJournal=function(id){
  var e=(state.journalEntries||[]).find(function(x){return x.id===id;});
  if(e&&e.auto){showToast('این سند به‌صورت خودکار از یک سند مبدأ ساخته شده است؛ برای اصلاح، همان سند (فاکتور، خرید، ...) را ابطال کنید یا برگشت ثبت کنید');return false;}
  return rjBefore.apply(this,arguments);
};
var saBefore=window.saveAccount;
window.saveAccount=function(ev,id){
  var f=ev&&ev.target,a=id?(state.bankAccounts||[]).find(function(x){return x.id===id;}):null;
  if(a&&f&&f.initialBalance&&a.openingDate&&(Number(f.initialBalance.value)||0)!==(Number(a.initialBalance)||0)&&!fpRequireOpen(a.openingDate)){if(ev.preventDefault)ev.preventDefault();return false;}
  return saBefore.apply(this,arguments);
};
})();
}catch(e){console.error('app.js block 23/23 failed:',e);}
;

/* ===== Script block 24/26 ===== */
try{
(function(){
'use strict';
/* =====================================================================
   WINDOW MANAGER v14 — every page except the dashboard opens in a window
   (title bar with maximize and close, drag, resize, blurred desktop behind)
   ===================================================================== */
var ICON_MAX='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
var ICON_RESTORE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
var ICON_CLOSE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
var KEY='winGeometry.v15',geo=null,maximized=false,lastPage=null,ro=null;
try{geo=JSON.parse(localStorage.getItem(KEY)||'null');maximized=!!(geo&&geo.max);}catch(e){}

function main(){return document.querySelector('.main');}
function win(){return document.getElementById('appWin');}
function compact(){return window.innerWidth<=900||window.innerHeight<=520;}
function navH(){var h=document.getElementById('appHeader');return h?Math.round(h.getBoundingClientRect().bottom):72;}
function sideW(){var s=document.getElementById('sidebar');return (s&&!compact())?Math.round(s.getBoundingClientRect().width):0;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({x:geo&&geo.x,y:geo&&geo.y,w:geo&&geo.w,h:geo&&geo.h,max:maximized}));}catch(e){}}

function defaultGeo(){
  var vw=window.innerWidth,vh=window.innerHeight,top=navH()+16,sw=sideW(),aw=vw-sw,w=Math.min(1240,aw-48),h=Math.max(320,vh-top-22);
  return {x:Math.round(sw+(aw-w)/2),y:top,w:w,h:h};
}
function clampGeo(g){
  var vw=window.innerWidth,vh=window.innerHeight,top=navH(),sw=sideW();
  g.w=Math.max(340,Math.min(g.w,vw-sw));g.h=Math.max(240,Math.min(g.h,vh-top));
  g.x=Math.min(Math.max(g.x,sw),Math.max(sw,vw-140));g.y=Math.min(Math.max(g.y,top),vh-52); /* the buttons are at the left edge: it must stay on screen (right of the sidebar) */
  return g;
}
function applyGeo(){
  var w=win();if(!w)return;
  w.classList.toggle('maximized',maximized&&!compact());
  if(compact()||maximized){w.style.left=w.style.top=w.style.width=w.style.height='';return;}
  geo=clampGeo(geo&&geo.w?geo:defaultGeo());
  w.style.left=geo.x+'px';w.style.top=geo.y+'px';w.style.width=geo.w+'px';w.style.height=geo.h+'px';
}
function setMaxIcon(){
  var b=document.getElementById('winMax');if(!b)return;
  b.innerHTML=maximized?ICON_RESTORE:ICON_MAX;
  b.title=b.ariaLabel=maximized?'بازگرداندن اندازه':'تمام‌صفحه';
}
function toggleMax(){
  if(compact())return;
  if(!maximized){var r=win().getBoundingClientRect();geo={x:r.left,y:r.top,w:r.width,h:r.height};}
  maximized=!maximized;save();applyGeo();setMaxIcon();
}
function closeWindow(){
  var w=win();if(!w)return;
  w.classList.add('closing');
  setTimeout(function(){w.classList.remove('closing');nav('dashboard');},140);
}
window.closeWindow=closeWindow;window.toggleWindowMax=toggleMax;

function ensureFrame(){
  var m=main();if(!m||win())return;
  var w=document.createElement('section');w.id='appWin';w.className='appwin';w.setAttribute('role','dialog');w.setAttribute('aria-modal','false');
  var snap=document.createElement('div');snap.id='desktopSnap';snap.setAttribute('aria-hidden','true');
  var bar=document.createElement('div');bar.className='win-titlebar';bar.id='winBar';
  bar.innerHTML='<span class="win-dot"></span><div class="win-titles"><div class="win-title" id="winTitle"></div><div class="win-sub" id="winSub"></div></div>'+
    '<div class="win-ctrl"><button type="button" class="win-btn win-max" id="winMax"></button><button type="button" class="win-btn win-close" id="winClose" title="بستن" aria-label="بستن">'+ICON_CLOSE+'</button></div>';
  var top=document.getElementById('topbar'),content=document.getElementById('content');
  m.insertBefore(snap,top);m.insertBefore(w,top);w.appendChild(bar);w.appendChild(top);w.appendChild(content);
  setMaxIcon();
  document.getElementById('winClose').addEventListener('click',closeWindow);
  document.getElementById('winMax').addEventListener('click',toggleMax);
  bar.addEventListener('dblclick',function(e){if(!e.target.closest('.win-btn'))toggleMax();});
  /* drag by the title bar */
  bar.addEventListener('pointerdown',function(e){
    if(e.target.closest('.win-btn')||maximized||compact()||e.button>0)return;
    var r=w.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,ox=r.left,oy=r.top;
    try{bar.setPointerCapture(e.pointerId);}catch(x){}
    w.classList.add('dragging');
    function mv(ev){
      var g=clampGeo({x:ox+ev.clientX-sx,y:oy+ev.clientY-sy,w:r.width,h:r.height});
      w.style.left=g.x+'px';w.style.top=g.y+'px';
    }
    function up(){
      bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);bar.removeEventListener('pointercancel',up);
      w.classList.remove('dragging');var b=w.getBoundingClientRect();geo={x:b.left,y:b.top,w:b.width,h:b.height};save();
    }
    bar.addEventListener('pointermove',mv);bar.addEventListener('pointerup',up);bar.addEventListener('pointercancel',up);
  });
  /* remember the size the user resizes to */
  if(window.ResizeObserver){
    ro=new ResizeObserver(function(){
      if(maximized||compact()||!w.classList.contains('dragging')&&!document.body.classList.contains('win-open'))return;
      var b=w.getBoundingClientRect();if(b.width>0&&geo&&(Math.abs(b.width-geo.w)>1||Math.abs(b.height-geo.h)>1)){geo.w=b.width;geo.h=b.height;save();}
    });
    ro.observe(w);
  }
  window.addEventListener('resize',function(){if(document.body.classList.contains('win-open'))applyGeo();});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape'||!document.body.classList.contains('win-open'))return;
    if(/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return; /* Esc inside a field only leaves the field */
    var modal=document.getElementById('modalRoot');
    if(modal&&modal.children.length)return;
    if(document.querySelector('.nav-group-menu.open'))return;
    closeWindow();
  });
}
function snapshotDesktop(){
  var c=document.getElementById('content'),snap=document.getElementById('desktopSnap');if(!c||!snap)return;
  var cl=c.cloneNode(true);cl.removeAttribute('id');
  cl.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id');});
  cl.querySelectorAll('[onclick],[onchange],[oninput],[onsubmit]').forEach(function(el){['onclick','onchange','oninput','onsubmit'].forEach(function(a){el.removeAttribute(a);});});
  snap.innerHTML='';snap.appendChild(cl);
}
function syncWindow(opening){
  var w=win(),m=main();if(!w)return;
  var tb=document.getElementById('topbar'),h=tb&&tb.querySelector('h1'),today=tb&&tb.querySelector('.today');
  document.getElementById('winTitle').textContent=h?h.textContent.trim():'';
  document.getElementById('winSub').textContent=today?today.textContent.trim():'';
  var acc=tb&&(tb.style.getPropertyValue('--nav-accent')||getComputedStyle(tb).getPropertyValue('--nav-accent'));
  if(acc&&acc.trim())w.style.setProperty('--win-accent',acc.trim());
  w.setAttribute('aria-label',h?h.textContent.trim():'پنجره');
  applyGeo();setMaxIcon();
  var c=document.getElementById('content');if(c&&route.page!==lastPage)c.scrollTop=0;
  if(opening){w.classList.remove('opening');void w.offsetWidth;w.classList.add('opening');setTimeout(function(){w.classList.remove('opening');},320);}
}
var before=window.renderPage;
window.renderPage=function(){
  ensureFrame();
  var m=main(),page=route&&route.page,home=(page==='dashboard');
  var wasWindow=m.classList.contains('win-mode');
  if(!home&&!wasWindow)snapshotDesktop();
  var out;
  try{out=before.apply(this,arguments);}
  finally{
    if(home){
      m.classList.remove('win-mode');document.body.classList.remove('win-open');
      var s=document.getElementById('desktopSnap');if(s)s.innerHTML='';
    }else{
      m.classList.add('win-mode');document.body.classList.add('win-open');
      syncWindow(!wasWindow);
    }
    lastPage=page;
  }
  return out;
};
})();
}catch(e){console.error('app.js block 24/23 failed:',e);}
;

/* ===== Script block 25/26 ===== */
try{
(function(){
'use strict';
/* =====================================================================
   UI v15 — header (search, alerts, date), new dashboard, quick actions
   ===================================================================== */
var DAYS=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
var S='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
var IC={
  burger:S+'<path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  search:S+'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bell:S+'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  cal:S+'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  up:S+'<path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down:S+'<path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  wallet:S+'<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><circle cx="16.5" cy="13.5" r="1.2"/></svg>',
  doc:S+'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  swap:S+'<path d="M7 7h13l-3-3M17 17H4l3 3"/></svg>',
  user:S+'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  bolt:S+'<path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>',
  chart:S+'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  list:S+'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  chev:S+'<path d="m15 18-6-6 6-6"/></svg>',
  arrow:S+'<path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  box:S+'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  warn:S+'<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/></svg>',
  clock:S+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};
function norm(s){return String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
function cur(){return esc(state.business.currency||'');}

/* ---------- header ---------- */
function buildHeader(){
  var m=document.querySelector('.main');if(!m||document.getElementById('appHeader'))return;
  var h=document.createElement('header');h.id='appHeader';h.className='app-header';
  h.innerHTML='<button type="button" class="hdr-burger" id="hdrBurger" aria-label="منو">'+IC.burger+'</button>'+
    '<div class="hdr-search"><input id="globalSearch" type="text" autocomplete="off" placeholder="جستجو در بخش‌ها..." aria-label="جستجو در بخش‌ها"><span class="hdr-search-ic">'+IC.search+'</span><div class="hdr-results" id="searchResults" hidden></div></div>'+
    '<div class="hdr-actions"><div class="hdr-bellwrap"><button type="button" class="hdr-bell" id="hdrBell" aria-label="اعلان‌ها">'+IC.bell+'<i class="hdr-dot" id="hdrDot" hidden></i></button><div class="hdr-pop" id="alertPop" hidden></div></div>'+
    '<div class="hdr-date" id="hdrDate">'+IC.cal+'<span></span></div></div>';
  m.insertBefore(h,m.firstChild);
  var scrim=document.createElement('div');scrim.id='navScrim';scrim.className='nav-scrim';document.body.appendChild(scrim);
  scrim.addEventListener('click',function(){document.body.classList.remove('nav-open');});
  document.getElementById('hdrBurger').addEventListener('click',function(e){e.stopPropagation();document.body.classList.toggle('nav-open');});
  var inp=document.getElementById('globalSearch'),res=document.getElementById('searchResults'),act=-1,list=[];
  function index(){
    var out=[];document.querySelectorAll('#sidebar .nav-group').forEach(function(g){
      var gl=((g.querySelector('.nav-group-tab span')||{}).textContent||'').trim();
      g.querySelectorAll('.nav-subitem').forEach(function(b){var mm=(b.getAttribute('onclick')||'').match(/nav\('([^']+)'/);if(mm)out.push({page:mm[1],label:((b.querySelector('span')||b).textContent||'').trim(),group:gl});});
    });return out;
  }
  function draw(){
    var q=norm(inp.value);if(!q){res.hidden=true;res.innerHTML='';list=[];return;}
    list=index().filter(function(x){return norm(x.label+' '+x.group).indexOf(q)>=0;}).slice(0,8);act=list.length?0:-1;
    res.innerHTML=list.length?list.map(function(x,i){return '<button type="button" class="hdr-res'+(i===act?' on':'')+'" data-i="'+i+'"><span>'+esc(x.label)+'</span><small>'+esc(x.group)+'</small></button>';}).join(''):'<div class="hdr-empty">بخشی با این نام پیدا نشد</div>';
    res.hidden=false;
  }
  function go(i){var x=list[i];if(!x)return;inp.value='';res.hidden=true;inp.blur();nav(x.page);}
  inp.addEventListener('input',draw);inp.addEventListener('focus',draw);
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!list.length)return;act=(act+(e.key==='ArrowDown'?1:-1)+list.length)%list.length;res.querySelectorAll('.hdr-res').forEach(function(b,i){b.classList.toggle('on',i===act);});}
    else if(e.key==='Enter'){e.preventDefault();go(act<0?0:act);}
    else if(e.key==='Escape'){inp.value='';res.hidden=true;inp.blur();}
  });
  res.addEventListener('mousedown',function(e){var b=e.target.closest('.hdr-res');if(b){e.preventDefault();go(+b.dataset.i);}});
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')&&!document.getElementById('modalRoot').children.length){e.preventDefault();inp.focus();}
  });
  /* alerts */
  var bell=document.getElementById('hdrBell'),pop=document.getElementById('alertPop'),dotEl=document.getElementById('hdrDot');
  function closePanel(){if(pop.hidden)return;pop.hidden=true;markRead(shown);shown=[];refreshHeader();}   /* once seen, they are read */
  bell.addEventListener('click',function(e){e.stopPropagation();if(pop.hidden){drawAlerts();pop.hidden=false;dotEl.hidden=true;}else closePanel();});
  pop.addEventListener('click',function(e){
    e.stopPropagation();
    var x=e.target.closest('[data-dismiss]');
    if(x){var row=x.closest('.pop-row');markRead([x.dataset.dismiss]);shown=shown.filter(function(k){return k!==x.dataset.dismiss;});if(row)row.remove();
      var left=pop.querySelectorAll('.pop-row').length;if(!left)drawAlerts();else{var sp=pop.querySelector('.pop-title b span');if(sp)sp.textContent=fa(alerts().length);}return;}
    if(e.target.closest('[data-clear]')){markRead(shown);shown=[];drawAlerts();return;}
    var b=e.target.closest('[data-page]');if(b){var pg=b.dataset.page;closePanel();nav(pg);}
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.hdr-bellwrap'))closePanel();
    if(!e.target.closest('.hdr-search'))res.hidden=true;
  });
}
function readMap(){if(!state.alertsRead||typeof state.alertsRead!=='object')state.alertsRead={};return state.alertsRead;}
function rawAlerts(){
  var out=[],t=todayJalali(),td=jToJdn(t);
  (state.invoices||[]).forEach(function(i){
    if(i.voided||!i.date)return;var rem=invoiceRemaining(i),age=td-jToJdn(i.date);
    if(rem>0&&age>30)out.push({key:'inv:'+i.id,ic:'clock',tone:'red',text:'فاکتور '+fa(i.number)+' بیش از '+fa(age)+' روز پرداخت نشده ('+money(rem)+' '+state.business.currency+')',page:'invoices'});
  });
  (state.checks||[]).forEach(function(c){
    if(c.status==='bounced')out.push({key:'chkb:'+c.id,ic:'warn',tone:'red',text:'چک '+fa(c.number||'')+' برگشت خورده است ('+money(c.amount)+')',page:'checks'});
    else if(c.status==='pending'&&c.dueDate){var d=jToJdn(c.dueDate)-td;if(d<=7)out.push({key:'chkd:'+c.id+':'+(d<0?'late':d===0?'today':'soon'),ic:'clock',tone:d<0?'red':'amber',text:'چک '+fa(c.number||'')+(d<0?' '+fa(-d)+' روز از سررسید گذشته':d===0?' امروز سررسید است':' تا '+fa(d)+' روز دیگر سررسید دارد'),page:'checks'});}
  });
  (state.services||[]).forEach(function(s){if(s.trackStock&&(+s.stock||0)<=0)out.push({key:'stk:'+s.id,ic:'box',tone:'amber',text:'موجودی «'+s.name+'» تمام شده است',page:'stock'});});
  return out;
}
/* what is still unread; read keys that no longer apply are forgotten so a new problem can alert again */
function alerts(){
  var all=rawAlerts(),m=readMap(),live={};all.forEach(function(a){live[a.key]=1;});
  Object.keys(m).forEach(function(k){if(!live[k])delete m[k];});
  return all.filter(function(a){return !m[a.key];});
}
var shown=[];
function markRead(keys){if(!keys.length)return;var m=readMap();keys.forEach(function(k){m[k]=true;});save();}
function drawAlerts(){
  var a=alerts(),pop=document.getElementById('alertPop');
  shown=a.slice(0,8).map(function(x){return x.key;});
  pop.innerHTML='<div class="pop-title"><b>اعلان‌ها'+(a.length?' <span>'+fa(a.length)+'</span>':'')+'</b>'+(a.length?'<button type="button" class="pop-clear" data-clear="1">پاک کردن همه</button>':'')+'</div>'+
    (a.length?a.slice(0,8).map(function(x){return '<div class="pop-row" data-key="'+esc(x.key)+'"><button type="button" class="pop-item '+x.tone+'" data-page="'+x.page+'"><i>'+IC[x.ic]+'</i><span>'+esc(x.text)+'</span></button><button type="button" class="pop-x" data-dismiss="'+esc(x.key)+'" aria-label="حذف اعلان" title="حذف">×</button></div>';}).join('')+(a.length>8?'<div class="pop-more">و '+fa(a.length-8)+' مورد دیگر</div>':''):'<div class="pop-empty">اعلان جدیدی وجود ندارد</div>');
}
function refreshHeader(){
  var t=todayJalali(),d=document.querySelector('#hdrDate span'),dot=document.getElementById('hdrDot');
  if(d)d.textContent=DAYS[new Date().getDay()]+' '+fa(t.jd)+' '+J_MONTHS[t.jm-1]+' '+fa(t.jy);
  if(dot){try{dot.hidden=alerts().length===0;}catch(e){dot.hidden=true;}}
}

/* ---------- quick actions ---------- */
window.openPartyChooser=function(){
  openProModal('افزودن طرف حساب','<div style="display:grid;gap:10px"><button class="btn btn-brand" onclick="closeModal();openCustomerForm()">'+IC.user+' مشتری جدید</button><button class="btn" onclick="closeModal();openSupplierForm()">'+IC.user+' تأمین‌کننده جدید</button></div>');
};
window.uiQuick=function(kind){
  if(kind==='invoice')return openInvoiceForm();
  if(kind==='party')return openPartyChooser();
  var acc=(state.bankAccounts||[])[0];openTransactionForm(acc&&acc.id);
  var f=document.querySelector('#modalRoot form');if(!f)return;
  f.type.value=kind==='in'?'deposit':'withdraw';
  var want=kind==='in'?'revenue':'expense';
  for(var i=0;i<f.counterAccount.options.length;i++){var o=f.counterAccount.options[i],a=(state.chartAccounts||[]).find(function(x){return x.code===o.value;});if(a&&a.type===want){f.counterAccount.value=o.value;break;}}
};
var otfBefore=window.openTransactionForm;
window.openTransactionForm=function(){
  var r=otfBefore.apply(this,arguments);
  var sel=document.querySelector('#modalRoot select[name=counterAccount]');
  if(sel)Array.prototype.slice.call(sel.options).forEach(function(o){if(o.value==='103'||o.value==='201')o.remove();});
  return r;
};

/* ---------- dashboard ---------- */
function addDays(t,delta){
  var y=t.jy,m=t.jm,d=t.jd+delta;
  while(d<1){m--;if(m<1){m=12;y--;}d+=jDaysInMonth(y,m);}
  while(d>jDaysInMonth(y,m)){d-=jDaysInMonth(y,m);m++;if(m>12){m=1;y++;}}
  return {jy:y,jm:m,jd:d};
}
function cashItems(){
  var items=[];
  allPayments().forEach(function(p){if(!p.voided&&p.date)items.push({d:p.date,a:+p.amount||0,k:'i'});});
  (state.receivablesPayables||[]).forEach(function(r){(r.payments||[]).forEach(function(p){if(!p.voided&&p.date)items.push({d:p.date,a:+p.amount||0,k:r.direction==='receivable'?'i':'e'});});});
  (state.expenses||[]).forEach(function(e){if(!e.voided&&e.date)items.push({d:e.date,a:+e.amount||0,k:'e'});});
  return items;
}
function sumOn(items,k,pred){return items.reduce(function(a,x){return a+(x.k===k&&pred(x.d)?x.a:0);},0);}
function series(mode){
  var t=todayJalali(),items=cashItems(),labels=[],inc=[],exp=[],i;
  if(mode==='30'){
    var base=jToJdn(addDays(t,-29)),bi=new Array(30).fill(0),be=new Array(30).fill(0);
    items.forEach(function(x){var ix=jToJdn(x.d)-base;if(ix>=0&&ix<30){if(x.k==='i')bi[ix]+=x.a;else be[ix]+=x.a;}});
    for(i=0;i<30;i++){var dd=addDays(t,i-29);labels.push(fa(dd.jd)+' '+J_MONTHS[dd.jm-1]);inc.push(bi[i]);exp.push(be[i]);}
  }else{
    lastNMonthsLabels(mode==='6'?6:12).forEach(function(m){labels.push(m.label);inc.push(sumOn(items,'i',function(d){return d.jy===m.jy&&d.jm===m.jm;}));exp.push(sumOn(items,'e',function(d){return d.jy===m.jy&&d.jm===m.jm;}));});
  }
  return {labels:labels,inc:inc,exp:exp};
}
function niceMax(v){if(v<=0)return 1000;var p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;}
function smooth(pts){
  if(pts.length<2)return pts.length?'M'+pts[0][0]+','+pts[0][1]:'';
  /* control points stay inside the plot: a curve never dips below zero or above the top line */
  var lo=G.t,hi=G.h-G.b;function cl(y){return Math.min(hi,Math.max(lo,y)).toFixed(1);}
  var d='M'+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
  for(var i=0;i<pts.length-1;i++){
    var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2,t=.18;
    d+=' C'+(p1[0]+(p2[0]-p0[0])*t).toFixed(1)+','+cl(p1[1]+(p2[1]-p0[1])*t)+' '+(p2[0]-(p3[0]-p1[0])*t).toFixed(1)+','+cl(p2[1]-(p3[1]-p1[1])*t)+' '+p2[0].toFixed(1)+','+p2[1].toFixed(1);
  }
  return d;
}
var G={w:800,h:250,l:84,r:14,t:12,b:30};
function chartSVG(sr){
  var n=sr.labels.length,pw=G.w-G.l-G.r,ph=G.h-G.t-G.b,mx=niceMax(Math.max.apply(null,sr.inc.concat(sr.exp,[0]))),i;
  function X(i){return G.l+(n<2?pw/2:pw*i/(n-1));}
  function Y(v){return G.t+ph-ph*(v/mx);}
  var grid='',ylab='';
  for(i=0;i<=4;i++){var v=mx*i/4,y=Y(v);grid+='<line x1="'+G.l+'" x2="'+(G.w-G.r)+'" y1="'+y+'" y2="'+y+'" class="cg"/>';ylab+='<text x="'+(G.l-10)+'" y="'+(y+4)+'" class="cy">'+fa(Math.round(v).toLocaleString('en-US'))+'</text>';}
  var xl='',step=Math.max(1,Math.ceil(n/6));
  for(i=0;i<n;i+=step)xl+='<text x="'+X(i)+'" y="'+(G.h-8)+'" class="cx">'+esc(sr.labels[i])+'</text>';
  var pi=sr.inc.map(function(v,i){return [X(i),Y(v)];}),pe=sr.exp.map(function(v,i){return [X(i),Y(v)];});
  var base=G.t+ph;
  function area(pts,id){var d=smooth(pts);return d?'<path d="'+d+' L'+pts[pts.length-1][0]+','+base+' L'+pts[0][0]+','+base+' Z" fill="url(#'+id+')"/>':'';}
  return '<svg viewBox="0 0 '+G.w+' '+G.h+'" class="dash-svg" preserveAspectRatio="none" role="img" aria-label="نمودار درآمد و هزینه">'+
    '<defs><linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22a869" stop-opacity=".32"/><stop offset="1" stop-color="#22a869" stop-opacity="0"/></linearGradient>'+
    '<linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4b5f" stop-opacity=".28"/><stop offset="1" stop-color="#ef4b5f" stop-opacity="0"/></linearGradient></defs>'+
    grid+ylab+xl+area(pe,'gE')+area(pi,'gI')+
    '<path d="'+smooth(pe)+'" class="cl exp"/><path d="'+smooth(pi)+'" class="cl inc"/>'+
    '<line id="cGuide" class="cguide" y1="'+G.t+'" y2="'+base+'" x1="0" x2="0" style="display:none"/><circle id="cDotI" r="4.5" class="cdot inc" style="display:none"/><circle id="cDotE" r="4.5" class="cdot exp" style="display:none"/></svg>';
}
function bindChart(wrap,sr){
  var svg=wrap.querySelector('svg'),tip=wrap.querySelector('.chart-tip');if(!svg||!tip)return;
  var n=sr.labels.length,pw=G.w-G.l-G.r,mx=niceMax(Math.max.apply(null,sr.inc.concat(sr.exp,[0]))),ph=G.h-G.t-G.b;
  function X(i){return G.l+(n<2?pw/2:pw*i/(n-1));}function Y(v){return G.t+ph-ph*(v/mx);}
  function show(ev){
    var r=svg.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*G.w,i=Math.round((x-G.l)/pw*(n-1));i=Math.max(0,Math.min(n-1,i));
    var g=svg.querySelector('#cGuide'),a=svg.querySelector('#cDotI'),b=svg.querySelector('#cDotE');
    g.setAttribute('x1',X(i));g.setAttribute('x2',X(i));g.style.display='';a.setAttribute('cx',X(i));a.setAttribute('cy',Y(sr.inc[i]));a.style.display='';b.setAttribute('cx',X(i));b.setAttribute('cy',Y(sr.exp[i]));b.style.display='';
    tip.innerHTML='<b>'+esc(sr.labels[i])+'</b><div><i class="d inc"></i>درآمد: '+money(sr.inc[i])+'</div><div><i class="d exp"></i>هزینه: '+money(sr.exp[i])+'</div>';
    tip.style.display='block';var px=X(i)/G.w*r.width;tip.style.left=Math.max(8,Math.min(r.width-tip.offsetWidth-8,px-tip.offsetWidth/2))+'px';
  }
  function hide(){tip.style.display='none';['#cGuide','#cDotI','#cDotE'].forEach(function(q){svg.querySelector(q).style.display='none';});}
  svg.addEventListener('pointermove',show);svg.addEventListener('pointerleave',hide);
}
window.uiSetRange=function(v){window.__dashRange=v;var w=document.getElementById('dashChartWrap');if(!w)return;var sr=series(v);w.querySelector('.chart-body').innerHTML=chartSVG(sr)+'<div class="chart-tip"></div>';bindChart(w.querySelector('.chart-body'),sr);};
function kpi(tone,ic,label,val,isMoney){
  return '<div class="kpi '+tone+'"><div class="kpi-ic">'+IC[ic]+'</div><div class="kpi-label">'+esc(label)+'</div><div class="kpi-val">'+(isMoney?'<small>'+cur()+'</small> '+money(val):fa(val))+'</div></div>';
}
function miniKpi(label,val,money_){return '<div class="kpi-mini"><span>'+esc(label)+'</span><b>'+(money_?money(val)+' <small>'+cur()+'</small>':fa(val))+'</b></div>';}
function calendar(t){var h=dashboardCalendarHTML(t);var i=h.indexOf('<div class="quick-title"');return i>0?h.slice(0,i):h;}
var HERO='<svg viewBox="0 0 260 150" class="hero-svg" aria-hidden="true"><defs><linearGradient id="hcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b6fa8"/><stop offset="1" stop-color="#27457a"/></linearGradient><linearGradient id="hsc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe2f7"/><stop offset="1" stop-color="#9dbfe3"/></linearGradient></defs>'+
  '<ellipse cx="130" cy="140" rx="112" ry="9" fill="#2f6fed" opacity=".08"/>'+
  '<g transform="rotate(-6 96 96)"><rect x="40" y="56" width="104" height="80" rx="9" fill="url(#hcb)"/><rect x="48" y="63" width="88" height="20" rx="4" fill="url(#hsc)"/><text x="130" y="78" font-size="13" fill="#27457a" text-anchor="end" font-family="monospace">12,500</text>'+
  '<g fill="#e6eefb" opacity=".95"><rect x="48" y="90" width="16" height="10" rx="2.5"/><rect x="68" y="90" width="16" height="10" rx="2.5"/><rect x="88" y="90" width="16" height="10" rx="2.5"/><rect x="108" y="90" width="16" height="10" rx="2.5"/><rect x="48" y="104" width="16" height="10" rx="2.5"/><rect x="68" y="104" width="16" height="10" rx="2.5"/><rect x="88" y="104" width="16" height="10" rx="2.5"/><rect x="108" y="104" width="16" height="10" rx="2.5" fill="#7fb2ff"/><rect x="48" y="118" width="16" height="10" rx="2.5"/><rect x="68" y="118" width="16" height="10" rx="2.5"/><rect x="88" y="118" width="16" height="10" rx="2.5"/><rect x="108" y="118" width="16" height="10" rx="2.5" fill="#7fb2ff"/></g></g>'+
  '<g transform="rotate(5 190 86)"><rect x="140" y="38" width="78" height="96" rx="6" fill="#fff" stroke="#dbe5f5"/><rect x="150" y="82" width="9" height="36" rx="2" fill="#7fb2ff"/><rect x="164" y="68" width="9" height="50" rx="2" fill="#2f6fed"/><rect x="178" y="90" width="9" height="28" rx="2" fill="#7fb2ff"/><rect x="192" y="58" width="9" height="60" rx="2" fill="#2f6fed"/><path d="M150 54h50M150 62h32" stroke="#c7d6ee" stroke-width="3" stroke-linecap="round"/></g>'+
  '<g><rect x="224" y="92" width="26" height="38" rx="6" fill="#e8eef8" stroke="#d3deef"/><path d="M237 92c-14-14-16-34-4-46 6 10 12 22 4 46zM237 92c10-10 24-22 20-40-12 8-22 20-20 40zM237 92c0-18 4-36-6-52 10 8 14 30 6 52z" fill="#3c9a64"/></g></svg>';

window.renderDashboard=function(){
  var t=todayJalali(),items=cashItems(),today=function(d){return d.jy===t.jy&&d.jm===t.jm&&d.jd===t.jd;};
  var inToday=sumOn(items,'i',today),exToday=sumOn(items,'e',today),cash=(state.bankAccounts||[]).reduce(function(a,x){return a+accountBalance(x.id);},0);
  var active=(state.invoices||[]).filter(function(i){return !i.voided;}),out=active.reduce(function(a,i){return a+invoiceRemaining(i);},0);
  var rpR=(state.receivablesPayables||[]).filter(function(r){return r.direction==='receivable'&&r.status!=='void';}).reduce(function(a,r){return a+rpRemaining(r);},0);
  var rpP=(state.receivablesPayables||[]).filter(function(r){return r.direction==='payable'&&r.status!=='void';}).reduce(function(a,r){return a+rpRemaining(r);},0);
  var checks=(state.checks||[]).filter(function(c){return c.status==='pending';}).length;
  var range=window.__dashRange||'30',sr=series(range);
  /* recent money movements = the cash and bank lines of the ledger */
  window.coreRebuildLedger();
  var tx=[];(state.journalEntries||[]).forEach(function(e){
    if(e.voided||e.status==='void'||e.sourceType==='opening-balance')return;
    var net=0,hit=false;(e.lines||[]).forEach(function(l){var c=String(l.accountCode);if(c==='101'||c==='102'){hit=true;net+=(+l.debit||0)-(+l.credit||0);}});
    if(hit&&Math.abs(net)>0.5)tx.push({e:e,net:net});
  });
  tx.sort(function(a,b){return jToJdn(b.e.date)-jToJdn(a.e.date)||(b.e.number-a.e.number);});
  var rows=tx.slice(0,6).map(function(x){var inn=x.net>0;
    return '<tr onclick="nav(\'journals\')"><td class="tx-date">'+jStrShort(x.e.date)+'</td><td>'+esc(x.e.description||'')+'</td><td><span class="tx-badge '+(inn?'in':'out')+'">'+(inn?'دریافت':'پرداخت')+'</span></td><td class="num">'+money(Math.abs(x.net))+' <small>'+cur()+'</small></td><td class="tx-ic"><i class="'+(inn?'in':'out')+'">'+IC.arrow+'</i></td></tr>';}).join('');
  var qa=function(cls,ic,txt,k){return '<button type="button" class="qa '+cls+'" onclick="uiQuick(\''+k+'\')"><i>'+IC[ic]+'</i><span>'+txt+'</span><em>'+IC.chev+'</em></button>';};
  var net=sumOn(items,'i',function(d){return d.jy===t.jy&&d.jm===t.jm;})-sumOn(items,'e',function(d){return d.jy===t.jy&&d.jm===t.jm;});
  var h='<div class="dash2"><div class="dash2-main">'+
    '<section class="hero2"><div class="hero2-text"><h1>سلام، به حسابداری '+esc(state.business.name||'')+' خوش آمدید</h1><p>امروز یک قدم دیگر به مدیریت بهتر امور مالی نزدیک‌تر هستید.</p></div><div class="hero2-art">'+HERO+'</div></section>'+
    '<div class="kpi4">'+kpi('green','up','درآمدهای امروز',inToday,true)+kpi('red','down','هزینه‌های امروز',exToday,true)+kpi('blue','wallet','مانده حساب',cash,true)+kpi('purple','doc','کل فاکتورها',active.length,false)+'</div>'+
    '<div class="kpi-minis">'+miniKpi('مطالبات فاکتورها',out,true)+miniKpi('حساب‌های دریافتنی',rpR,true)+miniKpi('حساب‌های پرداختنی',rpP,true)+miniKpi('چک‌های در جریان',checks,false)+'</div>'+
    '<section class="card chart2" id="dashChartWrap"><div class="card-head"><div class="card-title"><i>'+IC.chart+'</i>روند درآمد و هزینه‌ها</div><select class="range-sel" onchange="uiSetRange(this.value)"><option value="30"'+(range==='30'?' selected':'')+'>۳۰ روز گذشته</option><option value="6"'+(range==='6'?' selected':'')+'>۶ ماه گذشته</option><option value="12"'+(range==='12'?' selected':'')+'>۱۲ ماه گذشته</option></select></div>'+
    '<div class="chart-legend"><span><i class="d inc"></i>درآمد</span><span><i class="d exp"></i>هزینه</span></div><div class="chart-body">'+chartSVG(sr)+'<div class="chart-tip"></div></div></section>'+
    '<section class="card tx2"><div class="card-head"><div class="card-title"><i>'+IC.list+'</i>تراکنش‌های اخیر</div><button type="button" class="link-btn" onclick="nav(\'journals\')">مشاهده همه</button></div>'+
    (rows?'<div class="tx-wrap"><table><thead><tr><th>تاریخ</th><th>شرح</th><th>نوع</th><th>مبلغ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty-mini">هنوز تراکنش نقدی ثبت نشده است</div>')+'</section></div>'+
    '<aside class="dash2-side"><section class="card"><div class="card-head"><div class="card-title"><i>'+IC.bolt+'</i>عملیات سریع</div></div><div class="qa-list">'+
      qa('blue','doc','ثبت فاکتور جدید','invoice')+qa('green','wallet','ثبت دریافت','in')+qa('red','swap','ثبت پرداخت','out')+qa('purple','user','افزودن مشتری / تأمین‌کننده','party')+'</div></section>'+
    '<section class="card cal2"><div class="card-head"><div class="card-title"><i>'+IC.cal+'</i>نمای کلی ماه جاری</div></div>'+calendar(t)+'</section>'+
    '<section class="card promo2" onclick="nav(\'financial-statements\')"><div><div class="promo-t">سازماندهی مالی، آغاز رشد پایدار است.</div><div class="promo-s">سود این ماه: <b class="'+(net>=0?'pos':'neg')+'">'+money(net)+' '+cur()+'</b></div></div><i>'+IC.chart+'</i></section></aside></div>';
  document.getElementById('content').innerHTML=h;
  bindChart(document.querySelector('#dashChartWrap .chart-body'),sr);
};

/* ---------- wiring ---------- */
var navBefore=window.nav;
window.nav=function(){document.body.classList.remove('nav-open');return navBefore.apply(this,arguments);};
var renderBefore=window.renderPage;
window.renderPage=function(){
  buildHeader();
  var out=renderBefore.apply(this,arguments);
  refreshHeader();
  return out;
};
buildHeader();
})();
}catch(e){console.error('app.js block 25/23 failed:',e);}
;

/* ===== Script block 26/26 ===== */
try{
/* V12.6.1 — render the final grouped navigation on initial load.
   The legacy shell is rendered earlier in the file; without this pass the
   old navigation is visible until the first click. */
(function(){
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ try{ renderPage(); }catch(e){} }, {once:true});
    } else {
      renderPage();
    }
  } catch(e) {}
})();
}catch(e){console.error('app.js block 26/23 failed:',e);}
