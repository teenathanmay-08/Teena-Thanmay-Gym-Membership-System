// Shared browser code for dashboard, members, plans and subscriptions.
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value)||0);
const dateLabel = value => value ? new Date(`${String(value).slice(0,10)}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

async function api(url, options={}) {
  const response = await fetch(url, {headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
function message(id, text, error=false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('error', Boolean(error));
}
function setToday(input) {
  if (input && !input.value) {
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }
}
function statusPill(value) {
  const cls = String(value||'').toLowerCase();
  return `<span class="status status-${escapeHtml(cls)}">${escapeHtml(value)}</span>`;
}
function emptyRow(cols, text) { return `<tr><td class="empty" colspan="${cols}">${escapeHtml(text)}</td></tr>`; }

document.addEventListener('DOMContentLoaded', () => {
  $('.menu-toggle')?.addEventListener('click', () => $('nav')?.classList.toggle('open'));
  const page = document.body.dataset.page;
  if (page === 'dashboard') loadDashboard();
  if (page === 'members') setupMembers();
  if (page === 'plans') setupPlans();
  if (page === 'subscriptions') setupSubscriptions();
});

async function loadDashboard() {
  try {
    const d = await api('/api/dashboard');
    $('#dashboard-stats').innerHTML = [
      ['Total members',d.members,'REGISTERED MEMBERS'],
      ['Membership plans',d.plans,'AVAILABLE TIERS'],
      ['Subscriptions',d.subscriptions,'TOTAL RECORDS'],
      ['Paid revenue',money(d.revenue),'SUCCESSFUL PAYMENTS']
    ].map(([label,value,sub])=>`<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${sub}</small></article>`).join('');
    $('#recent-subscriptions').innerHTML = d.recent.length ? d.recent.map(s=>`<tr><td>${escapeHtml(s.member_name)}</td><td>${escapeHtml(s.plan_name)}</td><td>${dateLabel(s.start_date)}</td><td>${dateLabel(s.end_date)}</td><td>${statusPill(s.payment_status)}</td><td>${money(s.amount_paid)}</td></tr>`).join('') : emptyRow(6,'No subscriptions yet. Create your first one to see activity here.');
  } catch (e) {
    $('#notice').textContent = e.message;
    $('#dashboard-stats').innerHTML = `<div class="notice">${escapeHtml(e.message)}</div>`;
    $('#recent-subscriptions').innerHTML = emptyRow(6,'Could not load recent subscriptions.');
  }
}

async function setupMembers() {
  setToday($('#member-form [name="joining_date"]'));
  $('#member-form').addEventListener('submit', async event => {
    event.preventDefault(); message('member-message','');
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      await api('/api/members',{method:'POST',body:JSON.stringify(body)});
      form.reset(); setToday(form.elements.joining_date);
      message('member-message','Member registered successfully.');
      await renderMembers();
    } catch(e) { message('member-message',e.message,true); }
  });
  await renderMembers();
}
async function renderMembers() {
  const tbody = $('#members-table');
  try {
    const rows = await api('/api/members');
    $('#member-count').textContent = `${rows.length} MEMBER${rows.length===1?'':'S'}`;
    tbody.innerHTML = rows.length ? rows.map(m=>`<tr><td><strong>${escapeHtml(m.first_name)} ${escapeHtml(m.last_name)}</strong></td><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.phone)}</td><td>${escapeHtml(m.gender)}</td><td>${dateLabel(m.joining_date)}</td><td><button class="delete-btn" data-delete-member="${m.id}">Delete</button></td></tr>`).join('') : emptyRow(6,'No members registered yet.');
    tbody.querySelectorAll('[data-delete-member]').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Delete this member? Their subscriptions will also be deleted.')) return;
      try { await api(`/api/members/${button.dataset.deleteMember}`,{method:'DELETE'}); message('member-message','Member deleted.'); await renderMembers(); }
      catch(e) { message('member-message',e.message,true); }
    }));
  } catch(e) { tbody.innerHTML=emptyRow(6,e.message); }
}

const planPhotos = {
  Basic:'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
  Premium:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  Elite:'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80'
};
async function setupPlans() {
  $('#plan-form').addEventListener('submit',async event=>{
    event.preventDefault(); message('plan-message','');
    const form=event.currentTarget, body=Object.fromEntries(new FormData(form).entries());
    try { await api('/api/plans',{method:'POST',body:JSON.stringify(body)}); form.reset(); message('plan-message','Membership plan created.'); await renderPlans(); }
    catch(e) { message('plan-message',e.message,true); }
  });
  await renderPlans();
}
async function renderPlans() {
  try {
    const rows=await api('/api/plans');
    $('#plan-cards').innerHTML=rows.length?rows.map((p,i)=>`<article class="plan-card ${p.name==='Premium'?'featured':''}"><img src="${planPhotos[p.name]||planPhotos.Basic}" alt="${escapeHtml(p.name)} membership workout photo" loading="lazy"><div class="plan-body"><span class="plan-label">${p.name==='Premium'?'MOST POPULAR':p.name==='Elite'?'ALL ACCESS':'GET STARTED'}</span><h3>${escapeHtml(p.name)}</h3><div class="plan-price">${money(p.price)} <small>/ ${p.duration_days} days</small></div><p>${escapeHtml(p.description)}</p><div class="plan-access">${escapeHtml(p.access_level)}</div><p>${statusPill(p.status)}</p></div></article>`).join(''):'<p class="empty">No plans available. Add a plan below.</p>';
    $('#plans-table').innerHTML=rows.length?rows.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${p.duration_days} days</td><td>${money(p.price)}</td><td>${escapeHtml(p.access_level)}</td><td>${statusPill(p.status)}</td><td><button class="delete-btn" data-delete-plan="${p.id}">Delete</button></td></tr>`).join(''):emptyRow(6,'No plans found.');
    $('#plans-table').querySelectorAll('[data-delete-plan]').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Delete this membership plan? Plans referenced by subscriptions cannot be deleted.')) return;
      try { await api(`/api/plans/${button.dataset.deletePlan}`,{method:'DELETE'}); message('plan-message','Plan deleted.'); await renderPlans(); }
      catch(e) { message('plan-message',e.message,true); }
    }));
  } catch(e) { $('#plan-cards').innerHTML=`<p class="notice">${escapeHtml(e.message)}</p>`; $('#plans-table').innerHTML=emptyRow(6,e.message); }
}

let subscriptionPlans = [];
async function setupSubscriptions() {
  setToday($('#subscription-start'));
  $('#subscription-form').addEventListener('submit',async event=>{
    event.preventDefault(); message('subscription-message','');
    const form=event.currentTarget, body=Object.fromEntries(new FormData(form).entries());
    try { await api('/api/subscriptions',{method:'POST',body:JSON.stringify(body)}); message('subscription-message','Subscription created successfully.'); form.reset(); setToday($('#subscription-start')); $('#subscription-form [name="amount_paid"]').value='0'; updateEndPreview(); await renderSubscriptions(); }
    catch(e) { message('subscription-message',e.message,true); }
  });
  $('#subscription-plan').addEventListener('change',updateEndPreview);
  $('#subscription-start').addEventListener('change',updateEndPreview);
  await Promise.all([loadSubscriptionOptions(),renderSubscriptions()]);
}
async function loadSubscriptionOptions() {
  try {
    const [members,plans]=await Promise.all([api('/api/members'),api('/api/plans')]);
    subscriptionPlans=plans.filter(p=>p.status==='Active');
    $('#subscription-member').innerHTML='<option value="">Choose a member</option>'+members.map(m=>`<option value="${m.id}">${escapeHtml(m.first_name)} ${escapeHtml(m.last_name)} — ${escapeHtml(m.email)}</option>`).join('');
    $('#subscription-plan').innerHTML='<option value="">Choose an active plan</option>'+subscriptionPlans.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} — ${money(p.price)} / ${p.duration_days} days</option>`).join('');
    if(!members.length) message('subscription-message','Add a member before creating a subscription.',true);
    updateEndPreview();
  } catch(e) { message('subscription-message',e.message,true); }
}
function updateEndPreview() {
  const plan=subscriptionPlans.find(p=>String(p.id)===$('#subscription-plan').value);
  const start=$('#subscription-start').value;
  if(!plan||!start) { $('#subscription-end-preview').value=''; return; }
  const date=new Date(`${start}T00:00:00`); date.setDate(date.getDate()+Number(plan.duration_days));
  $('#subscription-end-preview').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
async function renderSubscriptions() {
  const tbody=$('#subscriptions-table');
  try {
    const rows=await api('/api/subscriptions');
    $('#subscription-count').textContent=`${rows.length} RECORD${rows.length===1?'':'S'}`;
    tbody.innerHTML=rows.length?rows.map(s=>`<tr><td><strong>${escapeHtml(s.member_name)}</strong><br><span class="muted">${escapeHtml(s.email||'')}</span></td><td>${escapeHtml(s.plan_name)}</td><td>${dateLabel(s.start_date)}</td><td>${dateLabel(s.end_date)}</td><td>${statusPill(s.payment_status)}</td><td>${money(s.amount_paid)}</td><td><button class="delete-btn" data-delete-sub="${s.id}">Delete</button></td></tr>`).join(''):emptyRow(7,'No subscriptions yet. Create one using the form above.');
    tbody.querySelectorAll('[data-delete-sub]').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Delete this subscription record?')) return;
      try { await api(`/api/subscriptions/${button.dataset.deleteSub}`,{method:'DELETE'}); message('subscription-message','Subscription deleted.'); await renderSubscriptions(); }
      catch(e) { message('subscription-message',e.message,true); }
    }));
  } catch(e) { tbody.innerHTML=emptyRow(7,e.message); }
}
