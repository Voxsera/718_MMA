/* 718 MMA Gym — Admin CRM (self-contained) */
(function () {
  const $ = (s) => document.querySelector(s);
  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const api = {
    async get(u) { const r = await fetch(u); if (r.status === 401) { show(false); return null; } return r.json(); },
    async send(u, m, b) { const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return r.json(); },
  };
  function show(on) { $('#login').style.display = on ? 'none' : 'block'; $('#app').style.display = on ? 'flex' : 'none'; if (on) loadDash(); }

  async function checkAuth() { const r = await fetch('/api/admin/me'); show(r.ok); }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await api.send('/api/admin/login', 'POST', Object.fromEntries(new FormData(e.target).entries()));
    if (res.ok) show(true); else $('#lmsg').textContent = '⚠️ ' + (res.error || 'Login failed');
  });
  $('#logout').addEventListener('click', async () => { await api.send('/api/admin/logout', 'POST'); show(false); });

  document.querySelectorAll('.side a[data-v]').forEach((a) => a.addEventListener('click', () => {
    document.querySelector('.side a.active')?.classList.remove('active'); a.classList.add('active');
    const v = a.dataset.v;
    document.querySelectorAll('.view').forEach((s) => s.classList.remove('active'));
    $('#v-' + v).classList.add('active');
    $('#title').textContent = a.textContent.replace(/[^\w\s]/g, '').trim();
    ({ dash: loadDash, events: loadEvents, trials: loadTrials, collabs: loadCollabs, payments: loadPayments, members: loadMembers, memberships: loadPlans }[v])();
  }));

  const tbl = (cols, rows) => `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const badge = (s) => {
    const m = { new: 'pill-red', upcoming: 'pill-red', ongoing: 'pill-green', accepted: 'pill-green', paid: 'pill-green', past: 'pill-grey', completed: 'pill-grey', declined: 'pill-grey', contacted: 'pill-grey', reviewing: 'pill-grey', created: 'pill-grey', failed: 'pill-grey' };
    return `<span class="pill ${m[s] || 'pill-grey'}">${s}</span>`;
  };

  async function loadDash() {
    const s = await api.get('/api/admin/summary'); if (!s) return;
    $('#stats').innerHTML = `
      <div class="stat-card"><b>${s.trials}</b><span>Trial Bookings</span><div class="hint" style="margin-top:6px">${s.newTrials} new</div></div>
      <div class="stat-card"><b>${s.members}</b><span>Active Members</span><div class="hint" style="margin-top:6px">${s.payments} payments</div></div>
      <div class="stat-card"><b>${inr(s.revenue)}</b><span>Revenue</span><div class="hint" style="margin-top:6px">paid</div></div>
      <div class="stat-card"><b>${s.upcoming}</b><span>Upcoming Events</span><div class="hint" style="margin-top:6px">${s.events} total</div></div>`;
    const trials = (await api.get('/api/admin/trials') || []).slice(0, 6);
    $('#recent-trials').innerHTML = trials.length ? tbl(['Name', 'Phone', 'Discipline', 'Date', 'Status'], trials.map((t) => `<tr><td>${t.name}</td><td>${t.phone}</td><td>${t.discipline || '-'}</td><td>${t.preferred_date || '-'}</td><td>${badge(t.status)}</td></tr>`)) : '<p class="hint">No trial bookings yet.</p>';
  }

  async function loadEvents() {
    const events = await api.get('/api/admin/events'); if (!events) return;
    $('#events-table').innerHTML = tbl(['Event', 'Date', 'Status', 'Manage'], events.map((e) => `
      <tr><td><b style="color:#fff">${e.title}</b><br><span class="hint">${e.description || ''}</span></td><td>${e.event_date || '-'}</td><td>${badge(e.status)}</td>
        <td><select class="mini" onchange="ADMIN.setEventStatus(${e.id}, this.value)">${['upcoming', 'ongoing', 'past'].map((s) => `<option value="${s}" ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <button class="mini" onclick="ADMIN.delEvent(${e.id})">Delete</button></td></tr>`));
  }
  async function setEventStatus(id, status) { await api.send('/api/admin/events/' + id, 'PATCH', { status }); loadEvents(); }
  async function delEvent(id) { if (confirm('Delete this event?')) { await api.send('/api/admin/events/' + id, 'DELETE'); loadEvents(); } }
  $('#add-event').addEventListener('click', async () => {
    const title = prompt('Event title:'); if (!title) return;
    await api.send('/api/admin/events', 'POST', { title, event_date: prompt('Date (YYYY-MM-DD):') || '', location: prompt('Location:') || '718 MMA, Shivarampally', description: prompt('Short description:') || '', status: (prompt('Status (upcoming/ongoing/past):', 'upcoming') || 'upcoming').toLowerCase(), image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=70&auto=format&fit=crop' });
    loadEvents();
  });

  async function loadTrials() {
    const rows = (await api.get('/api/admin/trials') || []).map((t) => `<tr><td>${t.name}</td><td>${t.phone}<br><span class="hint">${t.email || ''}</span></td><td>${t.discipline || '-'}</td><td>${t.preferred_date || '-'}</td><td>${badge(t.status)}</td><td><select class="mini" onchange="ADMIN.setTrial(${t.id}, this.value)">${['new', 'contacted', 'completed'].map((s) => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`);
    $('#trials-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Discipline', 'Date', 'Status', 'Update'], rows) : '<p class="hint">No bookings yet.</p>';
  }
  async function setTrial(id, status) { await api.send('/api/admin/trials/' + id, 'PATCH', { status }); }

  async function loadCollabs() {
    const rows = (await api.get('/api/admin/collaborations') || []).map((c) => `<tr><td>${c.name}<br><span class="hint">${c.organization || ''}</span></td><td>${c.email}<br><span class="hint">${c.phone || ''}</span></td><td>${c.type || '-'}</td><td style="max-width:260px">${c.message || ''}</td><td>${badge(c.status)}</td><td><select class="mini" onchange="ADMIN.setCollab(${c.id}, this.value)">${['new', 'reviewing', 'accepted', 'declined'].map((s) => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`);
    $('#collabs-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Type', 'Message', 'Status', 'Update'], rows) : '<p class="hint">No requests yet.</p>';
  }
  async function setCollab(id, status) { await api.send('/api/admin/collaborations/' + id, 'PATCH', { status }); }

  async function loadPayments() {
    const rows = (await api.get('/api/admin/payments') || []).map((p) => `<tr><td>${p.name || '-'}<br><span class="hint">${p.email || ''} ${p.phone || ''}</span></td><td>${p.plan || '-'}</td><td>${inr(p.amount)}</td><td>${badge(p.status)}</td><td class="hint">${p.created_at}</td></tr>`);
    $('#payments-table').innerHTML = rows.length ? tbl(['Customer', 'Plan', 'Amount', 'Status', 'When'], rows) : '<p class="hint">No payments yet.</p>';
  }

  async function loadMembers() {
    const rows = (await api.get('/api/admin/members') || []).map((m) => { const active = new Date(m.expires_at) > new Date(); return `<tr><td>${m.email}</td><td>${m.plan || '-'}</td><td>${inr(m.amount)}</td><td>${(m.expires_at || '').slice(0, 10)}</td><td>${badge(active ? 'paid' : 'past')}</td></tr>`; });
    $('#members-table').innerHTML = rows.length ? tbl(['Email', 'Plan', 'Paid', 'Expires', 'Status'], rows) : '<p class="hint">No members yet. Memberships appear here after a successful payment.</p>';
  }

  async function loadPlans() {
    const rows = (await api.get('/api/admin/memberships') || []).map((m) => `<tr><td><b style="color:#fff">${m.name}</b></td><td>${m.type}</td><td>${m.duration}</td><td>${inr(m.price)}</td><td><button class="mini" onclick="ADMIN.editPrice(${m.id}, ${m.price})">Edit Price</button></td></tr>`);
    $('#memberships-table').innerHTML = tbl(['Plan', 'Type', 'Duration', 'Price', 'Manage'], rows);
  }
  async function editPrice(id, current) { const price = prompt('New price (₹):', current); if (price === null) return; await api.send('/api/admin/memberships/' + id, 'PATCH', { price: parseInt(price, 10) }); loadPlans(); }

  window.ADMIN = { setEventStatus, delEvent, setTrial, setCollab, editPrice };
  checkAuth();
})();
