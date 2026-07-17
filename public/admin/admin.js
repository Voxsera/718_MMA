/* 718 MMA Gym — Admin CRM (self-contained) */
(function () {
  const $ = (s) => document.querySelector(s);
  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const SESSIONS = ['Session 1 · 6:30–8:00 AM', 'Session 2 · 8:00–9:30 AM', 'Session 3 · 6:30–8:00 PM', 'Session 4 · 8:00–9:30 PM'];
  const sessionOptions = () => SESSIONS.map((s) => [s, s]);
  const api = {
    async get(u) { const r = await fetch(u); if (r.status === 401) { show(false); return null; } return r.json(); },
    async send(u, m, b) { const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return r.json(); },
  };
  let ROLE = 'owner';
  let TERMINAL = false; // Worldline machine configured?
  // Restricted roles: the `order` array is both the visible set and the sidebar order.
  const ROLE_VIEWS = {
    reception: { label: 'RECEPTIONIST', order: ['collections', 'members', 'trials'], land: 'collections' },
    coach: { label: 'COACH', order: ['dash', 'members', 'trials', 'classes', 'videos', 'diet'], land: 'dash' },
  };
  function applyRole() {
    const cfg = ROLE_VIEWS[ROLE]; // undefined for owner (sees everything)
    document.querySelectorAll('.side a[data-v]').forEach((a) => {
      a.style.display = (!cfg || cfg.order.includes(a.dataset.v)) ? 'block' : 'none';
    });
    const badgeEl = document.getElementById('role-badge');
    if (badgeEl) badgeEl.textContent = cfg ? cfg.label : 'OWNER';
    // Coach views members but can't add/renew (money actions).
    const addMemberBtn = document.getElementById('add-member');
    if (addMemberBtn) addMemberBtn.style.display = ROLE === 'coach' ? 'none' : '';
    if (cfg) {
      const side = document.querySelector('.side');
      let anchor = side.querySelector('.brand');
      cfg.order.forEach((v) => { const el = side.querySelector(`a[data-v="${v}"]`); if (el && anchor) { anchor.after(el); anchor = el; } });
      const active = document.querySelector('.side a.active');
      if (!active || !cfg.order.includes(active.dataset.v)) document.querySelector(`.side a[data-v="${cfg.land}"]`).click();
    }
  }
  function show(on) { $('#login').style.display = on ? 'none' : 'block'; $('#app').style.display = on ? 'flex' : 'none'; if (on) { applyRole(); if (ROLE === 'owner') loadDash(); } }

  async function checkAuth() { const r = await fetch('/api/admin/me'); if (r.ok) { try { ROLE = (await r.json()).role || 'owner'; } catch (e) {} } show(r.ok); }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await api.send('/api/admin/login', 'POST', Object.fromEntries(new FormData(e.target).entries()));
    if (res.ok) { ROLE = res.role || 'owner'; show(true); } else $('#lmsg').textContent = '⚠️ ' + (res.error || 'Login failed');
  });
  // Google sign-in for the admin portals (allow-listed accounts only).
  async function onAdminGoogle(resp) {
    $('#lmsg').textContent = '';
    const r = await api.send('/api/admin/google', 'POST', { credential: resp.credential });
    if (r.ok) { ROLE = r.role || 'owner'; show(true); } else $('#lmsg').textContent = '⚠️ ' + (r.error || 'Sign-in failed');
  }
  async function initLogin() {
    let cfg = {};
    try { cfg = await (await fetch('/api/config')).json(); } catch (e) {}
    TERMINAL = !!cfg.terminalEnabled;
    if (cfg.adminPasswordLogin) $('#login-form').style.display = 'block';
    if (cfg.googleClientId) {
      await new Promise((resolve) => {
        if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
        const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.onload = resolve; s.onerror = resolve; document.head.appendChild(s);
      });
      if (window.google && window.google.accounts && window.google.accounts.id) {
        google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: onAdminGoogle });
        google.accounts.id.renderButton(document.getElementById('gbtn'), { theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'pill', width: 300 });
      }
    } else if (!cfg.adminPasswordLogin) {
      $('#gbtn').innerHTML = '<p class="hint">Google sign-in isn\'t configured. Set GOOGLE_CLIENT_ID in .env.</p>';
    }
  }
  $('#logout').addEventListener('click', async () => { await api.send('/api/admin/logout', 'POST'); show(false); });

  // Mobile sidebar drawer
  const openMenu = () => { document.querySelector('.side').classList.add('open'); $('#side-overlay').classList.add('open'); };
  const closeMenu = () => { document.querySelector('.side').classList.remove('open'); $('#side-overlay').classList.remove('open'); };
  document.getElementById('menu-btn').addEventListener('click', openMenu);
  document.getElementById('side-overlay').addEventListener('click', closeMenu);

  document.querySelectorAll('.side a[data-v]').forEach((a) => a.addEventListener('click', () => {
    document.querySelector('.side a.active')?.classList.remove('active'); a.classList.add('active');
    const v = a.dataset.v;
    document.querySelectorAll('.view').forEach((s) => s.classList.remove('active'));
    $('#v-' + v).classList.add('active');
    $('#title').textContent = a.textContent.replace(/[^\w\s]/g, '').trim();
    closeMenu(); // collapse drawer on mobile after picking a section
    ({ dash: loadDash, events: loadEvents, trials: loadTrials, collabs: loadCollabs, payments: loadPayments, members: loadMembers, collections: loadCollections, closure: loadClosure, classes: loadClasses, videos: loadVideos, diet: loadDiet, memberships: loadPlans }[v])();
  }));

  const tbl = (cols, rows) => `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const badge = (s) => {
    const m = { new: 'pill-red', upcoming: 'pill-red', ongoing: 'pill-green', accepted: 'pill-green', paid: 'pill-green', past: 'pill-grey', completed: 'pill-grey', declined: 'pill-grey', contacted: 'pill-grey', reviewing: 'pill-grey', created: 'pill-grey', failed: 'pill-grey' };
    return `<span class="pill ${m[s] || 'pill-grey'}">${s}</span>`;
  };

  // Styled modal form. fields: [{key,label,type,placeholder,value,options:[[val,label]]}]
  function openForm(title, fields) {
    return new Promise((resolve) => {
      const overlay = $('#modal');
      $('#modal-title').textContent = title;
      $('#modal-body').innerHTML = fields.map((f) => {
        if (f.type === 'select') {
          return `<label>${f.label}</label><select data-k="${f.key}">${f.options.map((o) => `<option value="${o[0]}" ${String(f.value) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
        }
        if (f.type === 'textarea') {
          return `<label>${f.label}</label><textarea rows="3" data-k="${f.key}" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>`;
        }
        if (f.type === 'file') {
          return `<label>${f.label}</label><input type="file" data-k="${f.key}" data-file="1" accept="${f.accept || 'image/*'}" />`;
        }
        return `<label>${f.label}</label><input type="${f.type || 'text'}" data-k="${f.key}" placeholder="${f.placeholder || ''}" value="${f.value || ''}" />`;
      }).join('');
      overlay.classList.add('open');
      const body = $('#modal-body');
      const first = body.querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 50);
      const close = (val) => { overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null; resolve(val); };
      $('#modal-save').onclick = () => {
        const out = {};
        body.querySelectorAll('[data-k]').forEach((el) => { out[el.dataset.k] = el.dataset.file ? (el.files[0] || null) : el.value.trim(); });
        if (fields[0] && !out[fields[0].key]) { body.querySelector('[data-k]').style.borderColor = 'var(--red)'; return; }
        close(out);
      };
      $('#modal-cancel').onclick = () => close(null);
      overlay.onclick = (e) => { if (e.target === overlay) close(null); };
    });
  }

  // Styled confirm dialog -> resolves true/false (replaces native confirm()).
  function confirmModal(title, messageHtml, okLabel) {
    return new Promise((resolve) => {
      const overlay = $('#modal');
      $('#modal-title').textContent = title;
      $('#modal-body').innerHTML = `<p style="color:var(--grey-light);line-height:1.7;font-size:15px">${messageHtml}</p>`;
      $('#modal-save').textContent = okLabel || 'Confirm';
      $('#modal-cancel').style.display = '';
      overlay.classList.add('open');
      const close = (val) => { overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null; $('#modal-save').textContent = 'Save'; resolve(val); };
      $('#modal-save').onclick = () => close(true);
      $('#modal-cancel').onclick = () => close(false);
      overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    });
  }
  // Styled notice dialog with a single OK (replaces native alert()).
  function notifyModal(title, messageHtml) {
    return new Promise((resolve) => {
      const overlay = $('#modal');
      $('#modal-title').textContent = title;
      $('#modal-body').innerHTML = `<p style="color:var(--grey-light);line-height:1.7;font-size:15px">${messageHtml}</p>`;
      $('#modal-save').textContent = 'OK';
      $('#modal-cancel').style.display = 'none';
      overlay.classList.add('open');
      const close = () => { overlay.classList.remove('open'); $('#modal-save').onclick = null; overlay.onclick = null; $('#modal-save').textContent = 'Save'; $('#modal-cancel').style.display = ''; resolve(); };
      $('#modal-save').onclick = () => close();
      overlay.onclick = (e) => { if (e.target === overlay) close(); };
    });
  }
  // Non-dismissable "waiting" dialog (no buttons) for the terminal.
  function showWaiting(title, messageHtml) {
    const overlay = $('#modal');
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = `<p style="color:var(--grey-light);line-height:1.7;font-size:15px">${messageHtml}</p><p style="color:var(--red);font-family:var(--cond);letter-spacing:2px;margin-top:14px">● WAITING ON MACHINE…</p>`;
    $('#modal-save').style.display = 'none'; $('#modal-cancel').style.display = 'none';
    overlay.onclick = null; overlay.classList.add('open');
  }
  function hideWaiting() {
    $('#modal').classList.remove('open'); $('#modal-save').style.display = ''; $('#modal-cancel').style.display = ''; $('#modal-save').textContent = 'Save';
  }
  // Push the amount to the Worldline machine and wait for the result. Returns true on paid.
  async function chargeOnMachine(payload) {
    const r = await api.send('/api/admin/terminal/charge', 'POST', payload);
    if (!r.ok) { await notifyModal('Machine error', r.error || 'Could not reach the terminal.'); return false; }
    showWaiting('Charge on machine', `Sent <b style="color:#fff">${inr(payload.amount)}</b> to the terminal. Ask the customer to tap their card or scan the UPI QR on the machine.`);
    for (let i = 0; i < 40; i++) { // ~2 minutes
      await new Promise((res) => setTimeout(res, 3000));
      const s = await api.get('/api/admin/terminal/status/' + r.reference);
      if (s.status === 'paid') { hideWaiting(); await notifyModal('Paid ✓', `Payment received on the machine. Invoice <b style="color:#fff">${s.invoiceNo || ''}</b> generated${mailNote()}.`); return true; }
      if (s.status === 'failed') { hideWaiting(); await notifyModal('Payment failed', 'The machine reported the payment did not go through. Try again.'); return false; }
    }
    hideWaiting(); await notifyModal('Timed out', 'No response from the machine yet. Check the terminal — if the customer paid, it will still be recorded when the machine reports back.'); return false;
  }
  const mailNote = () => ' and emailed';

  async function loadDash() {
    const s = await api.get('/api/admin/summary'); if (!s) return;
    const owner = s.revenue != null; // money stats only present for owner
    const cards = [
      `<div class="stat-card"><b>${s.trials}</b><span>Trial Bookings</span><div class="hint" style="margin-top:6px">${s.newTrials} new</div></div>`,
      `<div class="stat-card"><b>${s.members}</b><span>Active Members</span><div class="hint" style="margin-top:6px">${owner ? s.payments + ' payments' : 'active'}</div></div>`,
      owner ? `<div class="stat-card"><b>${inr(s.revenue)}</b><span>Revenue</span><div class="hint" style="margin-top:6px">paid</div></div>` : '',
      `<div class="stat-card"><b>${s.upcoming}</b><span>Upcoming Events</span><div class="hint" style="margin-top:6px">${s.events} total</div></div>`,
    ].filter(Boolean);
    $('#stats').innerHTML = cards.join('');
    // Members by session
    const sc = s.sessionCounts || [];
    $('#dash-sessions').innerHTML = sc.length
      ? sc.map((x) => `<div class="stat-card"><b>${x.count}</b><span>${x.session}</span><div class="hint" style="margin-top:6px">${x.count === 1 ? 'member' : 'members'}</div></div>`).join('')
      : '<p class="hint">No active members yet.</p>';
    // Today's payments summary + list — money, owner only (hidden from coach)
    const todayWrap = document.getElementById('dash-today-wrap');
    if (todayWrap) todayWrap.style.display = owner ? '' : 'none';
    const c = owner ? await api.get('/api/admin/collections/today') : null;
    if (c && !c.error) {
      $('#dash-today-cards').innerHTML = `
        <div class="stat-card"><b>${inr(c.todayTotal)}</b><span>Collected Today</span><div class="hint" style="margin-top:6px">${c.todayCount} payments</div></div>
        <div class="stat-card"><b>${inr(c.todayCashTotal)}</b><span>Cash Today</span><div class="hint" style="margin-top:6px">${c.todayCashCount} payments</div></div>
        <div class="stat-card"><b>${inr(c.todayOnlineTotal)}</b><span>Online Today</span><div class="hint" style="margin-top:6px">${c.todayOnlineCount} payments</div></div>
        <div class="stat-card" style="border-top-color:#18a558"><b>${inr(c.cashInHand)}</b><span>Cash In Hand</span><div class="hint" style="margin-top:6px">since last handover</div></div>`;
      const trows = (c.payments || []).slice(0, 8).map((p) => `<tr><td>${istTime(p.created_at)}</td><td>${p.name || '-'}<br><span class="hint">${p.email || ''}</span></td><td>${p.plan || '-'}</td><td>${p.session || '-'}</td><td>${inr(p.amount)}</td><td>${p.method === 'cash' ? '<span class="pill pill-grey">Cash</span>' : '<span class="pill pill-green">Online</span>'}</td></tr>`);
      $('#dash-today').innerHTML = trows.length ? tbl(['Time', 'Member', 'Plan', 'Session', 'Amount', 'Method'], trows) : '<p class="hint">No payments today yet.</p>';
    }
    const trials = (await api.get('/api/admin/trials') || []).slice(0, 6);
    $('#recent-trials').innerHTML = trials.length ? tbl(['Name', 'Phone', 'Discipline', 'Date', 'Status'], trials.map((t) => `<tr><td>${t.name}</td><td>${t.phone}</td><td>${t.discipline || '-'}</td><td>${t.preferred_date || '-'}</td><td>${badge(t.status)}</td></tr>`)) : '<p class="hint">No trial bookings yet.</p>';
  }

  // Upload a picked image file -> returns URL (or '' on none). Alerts on failure.
  async function uploadImageFile(file) {
    if (!file) return '';
    const fd = new FormData(); fd.append('image', file);
    const r = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.ok) return j.url;
    alert('Image upload failed: ' + (j.error || '')); return null;
  }

  let _events = [];
  async function loadEvents() {
    const events = await api.get('/api/admin/events'); if (!events) return;
    _events = events;
    $('#events-table').innerHTML = tbl(['Event', 'Date', 'Status (auto)', 'Manage'], events.map((e) => `
      <tr><td><b style="color:#fff">${e.title}</b><br><span class="hint">${e.description || ''}</span></td><td>${e.event_date || '-'}</td><td>${badge(e.status)}</td>
        <td><button class="mini" onclick="ADMIN.editEvent(${e.id})">Edit</button>
          <button class="mini" onclick="ADMIN.delEvent(${e.id})">Delete</button></td></tr>`));
  }
  async function setEventStatus(id, status) { await api.send('/api/admin/events/' + id, 'PATCH', { status }); loadEvents(); }
  async function delEvent(id) { if (confirm('Delete this event?')) { await api.send('/api/admin/events/' + id, 'DELETE'); loadEvents(); } }

  // Status is auto-derived from the date, so it isn't in the form.
  const eventFields = (e = {}) => ([
    { key: 'title', label: 'Event title', value: e.title || '' },
    { key: 'event_date', label: 'Date (drives status automatically)', type: 'date', value: e.event_date || '' },
    { key: 'location', label: 'Location', value: e.location || '718 MMA, Shivarampally' },
    { key: 'description', label: 'Short description', type: 'textarea', value: e.description || '' },
    { key: 'imageFile', label: 'Upload new image (optional)', type: 'file', accept: 'image/*' },
    { key: 'image', label: 'or Image URL', placeholder: 'https://...', value: e.image || '' },
  ]);
  $('#add-event').addEventListener('click', async () => {
    const d = await openForm('Add Event', eventFields());
    if (!d) return;
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=70&auto=format&fit=crop';
    await api.send('/api/admin/events', 'POST', { title: d.title, event_date: d.event_date, location: d.location, description: d.description, image }); loadEvents();
  });
  async function editEvent(id) {
    const e = _events.find((x) => x.id === id); if (!e) return;
    const d = await openForm('Edit Event', eventFields(e));
    if (!d) return;
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || e.image;
    await api.send('/api/admin/events/' + id, 'PATCH', { title: d.title, event_date: d.event_date, location: d.location, description: d.description, image }); loadEvents();
  }

  async function loadTrials() {
    const rows = (await api.get('/api/admin/trials') || []).map((t) => `<tr><td>${t.name}</td><td>${t.phone}<br><span class="hint">${t.email || ''}</span></td><td>${t.discipline || '-'}</td><td>${t.preferred_date || '-'}</td><td>${badge(t.status)}</td><td><select class="mini" onchange="ADMIN.setTrial(${t.id}, this.value)">${['new', 'contacted', 'completed'].map((s) => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`);
    $('#trials-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Discipline', 'Date', 'Status', 'Update'], rows) : '<p class="hint">No bookings yet.</p>';
  }
  async function setTrial(id, status) { await api.send('/api/admin/trials/' + id, 'PATCH', { status }); }
  $('#add-trial').addEventListener('click', async () => {
    const d = await openForm('Add Trial (walk-in)', [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email (optional)' },
      { key: 'discipline', label: 'Discipline', placeholder: 'MMA, Boxing...' },
      { key: 'preferred_date', label: 'Trial date', type: 'date' },
    ]);
    if (!d) return;
    await api.send('/api/admin/trials', 'POST', d); loadTrials();
  });

  async function loadCollabs() {
    const rows = (await api.get('/api/admin/collaborations') || []).map((c) => `<tr><td>${c.name}<br><span class="hint">${c.organization || ''}</span></td><td>${c.email}<br><span class="hint">${c.phone || ''}</span></td><td>${c.type || '-'}</td><td style="max-width:260px">${c.message || ''}</td><td>${badge(c.status)}</td><td><select class="mini" onchange="ADMIN.setCollab(${c.id}, this.value)">${['new', 'reviewing', 'accepted', 'declined'].map((s) => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`);
    $('#collabs-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Type', 'Message', 'Status', 'Update'], rows) : '<p class="hint">No requests yet.</p>';
  }
  async function setCollab(id, status) { await api.send('/api/admin/collaborations/' + id, 'PATCH', { status }); }
  $('#add-collab').addEventListener('click', async () => {
    const d = await openForm('Add Collaborator', [
      { key: 'name', label: 'Contact name' },
      { key: 'organization', label: 'Organization / brand' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'type', label: 'Type', placeholder: 'Venue rental, sponsor, event...' },
      { key: 'message', label: 'Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', value: 'reviewing', options: [['new','New'],['reviewing','Reviewing'],['accepted','Accepted'],['declined','Declined']] },
    ]);
    if (!d) return;
    await api.send('/api/admin/collaborations', 'POST', d); loadCollabs();
  });

  async function loadPayments() {
    const rows = (await api.get('/api/admin/payments') || []).map((p) => `<tr><td>${p.name || '-'}<br><span class="hint">${p.email || ''} ${p.phone || ''}</span></td><td>${p.plan || '-'}</td><td>${inr(p.amount)}</td><td>${badge(p.status)}</td><td class="hint">${(p.created_at || '').slice(0,10)}</td><td>${p.status === 'paid' ? `<a class="mini" style="text-decoration:none" href="/api/admin/payments/${p.id}/invoice" target="_blank">Invoice</a>` : '-'}</td></tr>`);
    $('#payments-table').innerHTML = rows.length ? tbl(['Customer', 'Plan', 'Amount', 'Status', 'When', 'Invoice'], rows) : '<p class="hint">No payments yet.</p>';
  }

  // Fetch plans -> [{name, price, duration}] for select menus.
  async function getPlans() { return (await api.get('/api/admin/memberships')) || []; }
  function planSelectOptions(plans) { return plans.map((p) => [p.name, `${p.name} — ${inr(p.price)}`]); }

  let _members = [];
  async function loadMembers() {
    _members = (await api.get('/api/admin/members') || []);
    const rows = _members.map((m) => {
      const active = new Date(m.expires_at) > new Date();
      const manage = ROLE === 'coach' ? '—' : `<button class="mini" onclick="ADMIN.renewMember(${m.id})">Renew</button>`;
      return `<tr><td>${m.email}</td><td>${m.plan || '-'}</td><td>${m.session || '-'}</td><td>${inr(m.amount)}</td><td>${(m.expires_at || '').slice(0, 10)}</td><td>${badge(active ? 'paid' : 'past')}</td>
        <td>${manage}</td></tr>`;
    });
    $('#members-table').innerHTML = rows.length ? tbl(['Email', 'Plan', 'Session', 'Paid', 'Expires', 'Status', 'Manage'], rows) : '<p class="hint">No members yet. Memberships appear here after a successful payment.</p>';
  }
  $('#add-member').addEventListener('click', async () => {
    const plans = await getPlans();
    const d = await openForm('Add Member (offline)', [
      { key: 'name', label: 'Member name' },
      { key: 'email', label: 'Email (used for login + invoice)' },
      { key: 'phone', label: 'Phone (optional)' },
      { key: 'plan', label: 'Plan (charge this amount on the machine / cash)', type: 'select', value: (plans[0] && plans[0].name) || 'Monthly', options: planSelectOptions(plans) },
      { key: 'session', label: 'Session (which of the 4 daily slots)', type: 'select', value: SESSIONS[0], options: sessionOptions() },
      { key: 'amount', label: 'Amount paid (₹) — blank = plan price', type: 'number' },
      { key: 'method', label: 'Payment method', type: 'select', value: 'cash', options: [['cash', 'Cash'], ['online', TERMINAL ? 'Online — charge on machine' : 'Online (card / UPI on machine)']] },
      { key: 'durationDays', label: 'Duration in days (blank = auto from plan)', type: 'number' },
    ]);
    if (!d) return;
    if (!d.email) return notifyModal('Email required', 'Please enter the member\'s email — it\'s used for their app login and invoice.');
    if (!d.amount && plans.find((p) => p.name === d.plan)) d.amount = plans.find((p) => p.name === d.plan).price;
    // Online + terminal configured -> push to the machine (webhook completes the membership).
    if (d.method === 'online' && TERMINAL) {
      await chargeOnMachine({ name: d.name, email: d.email, phone: d.phone, plan: d.plan, amount: d.amount, session: d.session });
      loadMembers(); return;
    }
    const r = await api.send('/api/admin/members', 'POST', d);
    if (r.ok) await notifyModal('Member added', `Invoice <b style="color:#fff">${r.invoiceNo}</b> ${r.emailed ? 'emailed to ' + d.email : '(email not configured — set SMTP in .env)'}.`);
    else await notifyModal('Failed', r.error || 'Could not add the member.');
    loadMembers();
  });
  async function renewMember(id) {
    const plans = await getPlans();
    const d = await openForm('Renew Membership', [
      { key: 'plan', label: 'Plan (charge this amount on the machine / cash)', type: 'select', value: (plans[0] && plans[0].name) || 'Monthly', options: planSelectOptions(plans) },
      { key: 'session', label: 'Session (which of the 4 daily slots)', type: 'select', value: SESSIONS[0], options: sessionOptions() },
      { key: 'amount', label: 'Amount paid (₹) — blank = plan price', type: 'number' },
      { key: 'method', label: 'Payment method', type: 'select', value: 'cash', options: [['cash', 'Cash'], ['online', TERMINAL ? 'Online — charge on machine' : 'Online (card / UPI on machine)']] },
      { key: 'durationDays', label: 'Duration in days (blank = auto from plan)', type: 'number' },
    ]);
    if (!d) return;
    if (!d.amount && plans.find((p) => p.name === d.plan)) d.amount = plans.find((p) => p.name === d.plan).price;
    if (d.method === 'online' && TERMINAL) {
      const m = _members.find((x) => x.id === id);
      await chargeOnMachine({ name: '', email: m ? m.email : '', phone: '', plan: d.plan, amount: d.amount, session: d.session });
      loadMembers(); return;
    }
    const r = await api.send('/api/admin/members/' + id + '/renew', 'POST', d);
    if (r.ok) await notifyModal('Membership renewed', `Valid until <b style="color:#fff">${(r.expires || '').slice(0, 10)}</b>. Invoice <b style="color:#fff">${r.invoiceNo}</b> ${r.emailed ? 'emailed.' : '(email not configured).'}`);
    else await notifyModal('Failed', r.error || 'Could not renew.');
    loadMembers();
  }

  // ---- Collections & cash handover ----
  const istTime = (iso) => { try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }); } catch (e) { return ''; } };
  async function loadCollections() {
    const c = await api.get('/api/admin/collections/today'); if (!c) return;
    $('#coll-cards').innerHTML = `
      <div class="stat-card" style="border-top-color:#18a558"><b>${inr(c.cashInHand)}</b><span>Cash In Hand</span><div class="hint" style="margin-top:6px">since last handover</div></div>
      <div class="stat-card"><b>${inr(c.todayCashTotal)}</b><span>Cash Today</span><div class="hint" style="margin-top:6px">${c.todayCashCount} payments</div></div>
      <div class="stat-card"><b>${inr(c.todayOnlineTotal)}</b><span>Online Today</span><div class="hint" style="margin-top:6px">${c.todayOnlineCount} payments</div></div>
      <div class="stat-card"><b>${c.todayCount}</b><span>Total Today</span><div class="hint" style="margin-top:6px">${inr(c.todayTotal)}</div></div>`;
    $('#handover-info').textContent = c.lastHandover ? `Last handover: ${inr(c.lastHandover.amount)} on ${(c.lastHandover.created_at || '').slice(0, 10)}` : 'No handovers yet.';
    const rows = (c.payments || []).map((p) => `<tr><td>${istTime(p.created_at)}</td><td>${p.name || '-'}<br><span class="hint">${p.email || ''}</span></td><td>${p.plan || '-'}</td><td>${p.session || '-'}</td><td>${inr(p.amount)}</td><td>${p.method === 'cash' ? '<span class="pill pill-grey">Cash</span>' : '<span class="pill pill-green">Online</span>'}</td></tr>`);
    $('#coll-table').innerHTML = rows.length ? tbl(['Time', 'Member', 'Plan', 'Session', 'Amount', 'Method'], rows) : '<p class="hint">No payments today yet.</p>';
  }
  async function doHandover() {
    const c = await api.get('/api/admin/collections/today'); if (!c) return;
    if (!c.cashInHand) return notifyModal('Nothing to hand over', 'There is no cash in hand right now.');
    const ok = await confirmModal('Hand over cash', `Hand over <b style="color:#fff">${inr(c.cashInHand)}</b> in cash to the owner?<br><br>This records the handover and resets cash-in-hand to zero.`, 'Hand Over');
    if (!ok) return;
    const r = await api.send('/api/admin/handover', 'POST', {});
    if (r.ok) await notifyModal('Cash handed over', `<b style="color:#fff">${inr(r.handedOver)}</b> handed to the owner. Cash-in-hand is now zero.`);
    else await notifyModal('Failed', r.error || 'Could not complete the handover.');
    loadCollections();
  }
  { const hb = document.getElementById('handover-btn'); if (hb) hb.addEventListener('click', doHandover); }

  let _plans = [];
  async function loadPlans() {
    _plans = (await api.get('/api/admin/memberships') || []);
    const rows = _plans.map((m) => `<tr><td><b style="color:#fff">${m.name}</b></td><td>${m.type}</td><td>${m.duration}</td><td>${inr(m.price)}</td><td><button class="mini" onclick="ADMIN.editPlan(${m.id})">Edit</button></td></tr>`);
    $('#memberships-table').innerHTML = tbl(['Plan', 'Type', 'Duration', 'Price', 'Manage'], rows);
  }
  async function editPlan(id) {
    const m = _plans.find((x) => x.id === id); if (!m) return;
    const d = await openForm('Edit Plan', [
      { key: 'name', label: 'Plan name', value: m.name },
      { key: 'type', label: 'Type', type: 'select', value: m.type || 'membership', options: [['membership','Membership'],['personal-training','Personal Training']] },
      { key: 'duration', label: 'Duration label', value: m.duration || '', placeholder: 'e.g. 1 Month, 3 Months, 1 Day' },
      { key: 'price', label: 'Price (₹)', type: 'number', value: m.price },
    ]);
    if (!d) return;
    await api.send('/api/admin/memberships/' + id, 'PATCH', d); loadPlans();
  }


  // ---- Gym closure ----
  async function loadClosure() {
    const c = await api.get('/api/admin/closure'); if (!c) return;
    $('#cl-date').value = c.date || ''; $('#cl-msg').value = c.message || '';
  }
  async function saveClosure() {
    const r = await api.send('/api/admin/closure', 'POST', { date: $('#cl-date').value.trim(), message: $('#cl-msg').value.trim() });
    $('#cl-msg-out').textContent = r.ok ? '✅ Saved.' : '⚠️ Failed.';
  }
  async function clearClosure() { $('#cl-date').value = ''; await saveClosure(); }

  // ---- Classes ----
  async function loadClasses() {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rows = (await api.get('/api/admin/classes') || []).map((c) =>
      `<tr><td><b style="color:#fff">${c.title}</b></td><td>${c.discipline || '-'}</td><td>${DAYS[c.day_of_week] || '?'}</td><td>${c.start_time}-${c.end_time}</td><td>${c.capacity}</td><td>${c.coach || '-'}</td><td><button class="mini" onclick="ADMIN.delClass(${c.id})">Delete</button></td></tr>`);
    $('#classes-table').innerHTML = rows.length ? tbl(['Class', 'Discipline', 'Day', 'Time', 'Cap', 'Coach', ''], rows) : '<p class="hint">No classes yet.</p>';
  }
  async function delClass(id) { if (confirm('Delete this class?')) { await api.send('/api/admin/classes/' + id, 'DELETE'); loadClasses(); } }
  $('#add-class').addEventListener('click', async () => {
    const days = [['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday'],['0','Sunday']];
    const d = await openForm('Add Class', [
      { key: 'title', label: 'Class title' },
      { key: 'discipline', label: 'Discipline', placeholder: 'MMA, Boxing, BJJ...' },
      { key: 'day_of_week', label: 'Day of week', type: 'select', value: '1', options: days },
      { key: 'start_time', label: 'Start time', type: 'time', value: '18:30' },
      { key: 'end_time', label: 'End time', type: 'time', value: '20:00' },
      { key: 'capacity', label: 'Capacity', type: 'number', value: '20' },
      { key: 'coach', label: 'Coach' },
    ]);
    if (!d) return;
    await api.send('/api/admin/classes', 'POST', d); loadClasses();
  });

  // ---- Videos ----
  async function loadVideos() {
    const rows = (await api.get('/api/admin/videos') || []).map((v) =>
      `<tr><td><b style="color:#fff">${v.title}</b></td><td>${v.discipline || '-'}</td><td>${v.level || '-'}</td><td>${v.duration || '-'}</td><td style="max-width:240px;overflow:hidden;text-overflow:ellipsis"><a href="${v.url}" target="_blank" style="color:var(--red)">link</a></td><td><button class="mini" onclick="ADMIN.delVideo(${v.id})">Delete</button></td></tr>`);
    $('#videos-table').innerHTML = rows.length ? tbl(['Title', 'Discipline', 'Level', 'Duration', 'URL', ''], rows) : '<p class="hint">No videos yet.</p>';
  }
  async function delVideo(id) { if (confirm('Delete this video?')) { await api.send('/api/admin/videos/' + id, 'DELETE'); loadVideos(); } }
  async function uploadVideoFile() {
    const file = $('#vf-file').files[0];
    const cover = $('#vf-cover').files[0];
    const out = $('#vf-out');
    if (!$('#vf-title').value.trim()) { out.className = 'form-msg err'; out.textContent = '⚠️ Title is required.'; return; }
    if (!file) { out.className = 'form-msg err'; out.textContent = '⚠️ Choose an .mp4 file.'; return; }
    const fd = new FormData();
    fd.append('video', file);
    if (cover) fd.append('cover', cover);
    fd.append('title', $('#vf-title').value);
    fd.append('discipline', $('#vf-disc').value);
    fd.append('level', $('#vf-level').value);
    fd.append('duration', $('#vf-dur').value);
    out.className = 'form-msg'; out.textContent = 'Uploading… (large files take a while)';
    const r = await fetch('/api/admin/videos/upload', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.ok) { out.className = 'form-msg ok'; out.textContent = '✅ Uploaded.'; $('#vf-title').value=''; $('#vf-disc').value=''; $('#vf-dur').value=''; $('#vf-file').value=''; $('#vf-cover').value=''; loadVideos(); }
    else { out.className = 'form-msg err'; out.textContent = '⚠️ ' + (j.error || 'Upload failed.'); }
  }
  $('#add-video').addEventListener('click', async () => {
    const d = await openForm('Add Video', [
      { key: 'title', label: 'Video title' },
      { key: 'url', label: 'Video URL (.mp4 or hosted link)', placeholder: 'https://...' },
      { key: 'discipline', label: 'Discipline', placeholder: 'MMA, Boxing...' },
      { key: 'level', label: 'Level', type: 'select', value: 'All levels', options: [['Beginner','Beginner'],['Intermediate','Intermediate'],['Advanced','Advanced'],['All levels','All levels']] },
      { key: 'duration', label: 'Duration', placeholder: 'e.g. 6:12' },
      { key: 'thumbnail', label: 'Thumbnail URL (optional)', placeholder: 'https://...' },
    ]);
    if (!d || !d.url) { if (d && !d.url) alert('Video URL is required.'); return; }
    await api.send('/api/admin/videos', 'POST', d); loadVideos();
  });

  // ---- Diet posts ----
  async function loadDiet() {
    const rows = (await api.get('/api/admin/diet') || []).map((d) =>
      `<tr><td><img src="${d.image_url}" style="width:64px;height:64px;object-fit:cover;border-radius:4px"/></td><td>${d.title || '-'}</td><td>${d.note || ''}</td><td class="hint">${(d.created_at || '').slice(0, 10)}</td><td><button class="mini" onclick="ADMIN.delDiet(${d.id})">Delete</button></td></tr>`);
    $('#diet-table').innerHTML = rows.length ? tbl(['Image', 'Title', 'Note', 'Date', ''], rows) : '<p class="hint">No diet posts yet.</p>';
  }
  async function delDiet(id) { if (confirm('Delete this diet post?')) { await api.send('/api/admin/diet/' + id, 'DELETE'); loadDiet(); } }
  async function uploadDiet() {
    const file = $('#diet-file').files[0];
    const out = $('#diet-out');
    if (!file) { out.className = 'form-msg err'; out.textContent = '⚠️ Choose an image first.'; return; }
    const fd = new FormData();
    fd.append('image', file); fd.append('title', $('#diet-title').value); fd.append('note', $('#diet-note').value);
    out.className = 'form-msg'; out.textContent = 'Uploading…';
    const r = await fetch('/api/admin/diet', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.ok) { out.className = 'form-msg ok'; out.textContent = '✅ Uploaded.'; $('#diet-title').value = ''; $('#diet-note').value = ''; $('#diet-file').value = ''; loadDiet(); }
    else { out.className = 'form-msg err'; out.textContent = '⚠️ ' + (j.error || 'Upload failed.'); }
  }

  window.ADMIN = { setEventStatus, editEvent, delEvent, setTrial, setCollab, editPlan, renewMember, saveClosure, clearClosure, delClass, delVideo, delDiet, uploadDiet, uploadVideoFile };
  initLogin();
  checkAuth();
})();
