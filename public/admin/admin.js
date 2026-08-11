/* 718 MMA Gym — Admin CRM (self-contained) */
(function () {
  const $ = (s) => document.querySelector(s);
  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const dstr = (s) => { if (!s) return '-'; const d = new Date(s); if (isNaN(d)) return '-'; return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; }; // DD-MM-YYYY
  const SESSIONS = ['Session 1 · 6:30–8:00 AM', 'Session 2 · 8:00–9:30 AM', 'Session 3 · 6:30–8:00 PM', 'Session 4 · 8:00–9:30 PM'];
  const sessionOptions = () => SESSIONS.map((s) => [s, s]);
  const api = {
    async get(u) { const r = await fetch(u, { cache: 'no-store' }); if (r.status === 401) { show(false); return null; } return r.json(); },
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
    ['new-admission', 'start-renewal'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = ROLE === 'coach' ? 'none' : '';
    });
    // Excel import is owner-only.
    const impToggle = document.getElementById('import-toggle');
    if (impToggle) impToggle.style.display = ROLE === 'owner' ? '' : 'none';
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

  // Sidebar: mobile = slide-in drawer, desktop = freely collapse/expand (state remembered).
  const wrapEl = document.querySelector('.admin-wrap');
  const isMobile = () => window.matchMedia('(max-width:900px)').matches;
  const openMenu = () => { document.querySelector('.side').classList.add('open'); $('#side-overlay').classList.add('open'); };
  const closeMenu = () => { document.querySelector('.side').classList.remove('open'); $('#side-overlay').classList.remove('open'); };
  const setCollapsed = (on) => { wrapEl.classList.toggle('side-collapsed', on); try { localStorage.setItem('sideCollapsed', on ? '1' : '0'); } catch (e) {} };
  try { if (localStorage.getItem('sideCollapsed') === '1') wrapEl.classList.add('side-collapsed'); } catch (e) {}
  const toggleSidebar = () => {
    if (isMobile()) { document.querySelector('.side').classList.contains('open') ? closeMenu() : openMenu(); }
    else { setCollapsed(!wrapEl.classList.contains('side-collapsed')); }
  };
  document.getElementById('menu-btn').addEventListener('click', toggleSidebar);
  { const st = document.getElementById('side-toggle'); if (st) st.addEventListener('click', toggleSidebar); }
  document.getElementById('side-overlay').addEventListener('click', closeMenu);

  document.querySelectorAll('.side a[data-v]').forEach((a) => a.addEventListener('click', () => {
    document.querySelector('.side a.active')?.classList.remove('active'); a.classList.add('active');
    const v = a.dataset.v;
    document.querySelectorAll('.view').forEach((s) => s.classList.remove('active'));
    $('#v-' + v).classList.add('active');
    $('#title').textContent = a.textContent.replace(/[^\w\s]/g, '').trim();
    closeMenu(); // collapse drawer on mobile after picking a section
    ({ dash: loadDash, events: loadEvents, certs: loadCerts, trials: loadTrials, collabs: loadCollabs, payments: loadPayments, members: loadMembers, collections: loadCollections, reports: loadReports, closure: loadClosure, classes: loadClasses, videos: loadVideos, diet: loadDiet, memberships: loadPlans }[v])();
  }));

  const tbl = (cols, rows) => `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const badge = (s) => {
    const m = { new: 'pill-red', upcoming: 'pill-red', ongoing: 'pill-green', accepted: 'pill-green', paid: 'pill-green', past: 'pill-grey', completed: 'pill-grey', declined: 'pill-grey', contacted: 'pill-grey', reviewing: 'pill-grey', created: 'pill-grey', failed: 'pill-grey' };
    return `<span class="pill ${m[s] || 'pill-grey'}">${s}</span>`;
  };

  // Styled modal form. fields: [{key,label,type,placeholder,value,options:[[val,label]]}]
  function openForm(title, fields, onRender) {
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
        if (f.type === 'checkbox') {
          return `<label class="chk" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:12px"><input type="checkbox" data-k="${f.key}" style="width:auto;margin:0" ${f.value ? 'checked' : ''} /> <span>${f.label}</span></label>`;
        }
        return `<label>${f.label}</label><input type="${f.type || 'text'}" data-k="${f.key}" placeholder="${f.placeholder || ''}" value="${f.value || ''}" />`;
      }).join('');
      overlay.classList.add('open');
      const body = $('#modal-body');
      if (onRender) { try { onRender(body); } catch (e) { console.error(e); } }
      const first = body.querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 50);
      const close = (val) => { overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null; resolve(val); };
      $('#modal-save').onclick = () => {
        const out = {};
        body.querySelectorAll('[data-k]').forEach((el) => { out[el.dataset.k] = el.type === 'checkbox' ? el.checked : (el.dataset.file ? (el.files[0] || null) : el.value.trim()); });
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
  // Wide dialog for the billing ledger. Resolves 'edit' or 'close'.
  function detailsModal(title, html) {
    return new Promise((resolve) => {
      const overlay = $('#modal');
      const card = overlay.querySelector('.modal-card');
      $('#modal-title').textContent = title;
      $('#modal-body').innerHTML = html;
      $('#modal-save').textContent = 'Close';
      $('#modal-cancel').textContent = 'Edit Member';
      $('#modal-cancel').style.display = (ROLE === 'owner') ? '' : 'none';
      if (card) { card.style.maxWidth = '880px'; }
      overlay.classList.add('open');
      const close = (val) => {
        overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null;
        $('#modal-save').textContent = 'Save'; $('#modal-cancel').textContent = 'Cancel'; $('#modal-cancel').style.display = '';
        if (card) { card.style.maxWidth = ''; } resolve(val);
      };
      $('#modal-save').onclick = () => close('close');
      $('#modal-cancel').onclick = () => close('edit');
      overlay.onclick = (e) => { if (e.target === overlay) close('close'); };
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
  const TBA = 'To be announced';
  const eventFields = (e = {}) => ([
    { key: 'title', label: 'Event title', value: e.title || '' },
    { key: 'event_date', label: 'Date (drives status automatically)', type: 'date', value: e.event_date === TBA ? '' : (e.event_date || '') },
    { key: 'tba', label: 'Date: To be announced (use when the date is not finalized)', type: 'checkbox', value: e.event_date === TBA },
    { key: 'location', label: 'Location', value: e.location || '718 MMA, Shivarampally' },
    { key: 'description', label: 'Short description', type: 'textarea', value: e.description || '' },
    { key: 'imageFile', label: 'Upload new image (optional)', type: 'file', accept: 'image/*' },
    { key: 'image', label: 'or Image URL', placeholder: 'https://...', value: e.image || '' },
  ]);
  // Grey out / ignore the date input while "To be announced" is ticked.
  const wireTba = (body) => {
    const chk = body.querySelector('[data-k="tba"]');
    const dateEl = body.querySelector('[data-k="event_date"]');
    if (!chk || !dateEl) return;
    const sync = () => { dateEl.disabled = chk.checked; dateEl.style.opacity = chk.checked ? '.45' : '1'; };
    chk.addEventListener('change', sync); sync();
  };
  $('#add-event').addEventListener('click', async () => {
    const d = await openForm('Add Event', eventFields(), wireTba);
    if (!d) return;
    const event_date = d.tba ? TBA : d.event_date;
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=70&auto=format&fit=crop';
    await api.send('/api/admin/events', 'POST', { title: d.title, event_date, location: d.location, description: d.description, image }); loadEvents();
  });
  async function editEvent(id) {
    const e = _events.find((x) => x.id === id); if (!e) return;
    const d = await openForm('Edit Event', eventFields(e), wireTba);
    if (!d) return;
    const event_date = d.tba ? TBA : d.event_date;
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || e.image;
    await api.send('/api/admin/events/' + id, 'PATCH', { title: d.title, event_date, location: d.location, description: d.description, image }); loadEvents();
  }

  // ---- Certificates ----
  let _certs = [];
  async function loadCerts() {
    const rows = await api.get('/api/admin/certificates'); if (!rows) return;
    _certs = rows;
    $('#certs-table').innerHTML = rows.length ? tbl(['Cert ID', 'Name', 'Course', 'Date', 'Photo', 'Public Link', 'Manage'], rows.map((c) => `
      <tr><td><b style="color:#fff">${c.cert_id}</b></td><td>${c.name}</td><td>${c.course || '-'}</td><td>${c.cert_date || '-'}</td>
        <td>${c.photo ? '✓' : '—'}</td>
        <td><a href="/certifications/${encodeURIComponent(c.cert_id)}" target="_blank" style="color:var(--red)">/certifications/${c.cert_id}</a></td>
        <td><button class="mini" onclick="ADMIN.editCert(${c.id})">Edit</button>
          <button class="mini" onclick="ADMIN.delCert(${c.id})">Delete</button></td></tr>`)) : '<p class="hint">No certificates yet — add the first one.</p>';
  }
  const certFields = (c = {}) => ([
    { key: 'name', label: 'Person name', value: c.name || '' },
    { key: 'cert_id', label: 'Certificate ID — goes in the QR link (e.g. 718-MT-001)', value: c.cert_id || '', placeholder: '718-MT-001' },
    { key: 'course', label: 'Course / discipline', value: c.course || '', placeholder: 'Muay Thai' },
    { key: 'cert_date', label: 'Certified on', type: 'date', value: c.cert_date || '' },
    { key: 'imageFile', label: 'Upload certificate image', type: 'file', accept: 'image/*' },
    { key: 'image', label: 'or certificate image URL', placeholder: 'https://...', value: c.image || '' },
    { key: 'photoFile', label: 'Upload person photo (optional)', type: 'file', accept: 'image/*' },
    { key: 'photo', label: 'or person photo URL (optional)', placeholder: 'https://...', value: c.photo || '' },
  ]);
  $('#add-cert').addEventListener('click', async () => {
    const d = await openForm('Add Certificate', certFields());
    if (!d) return;
    if (!d.cert_id) { await notifyModal('Missing ID', 'Certificate ID is required — it becomes the QR link.'); return; }
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || '';
    let photo = await uploadImageFile(d.photoFile); if (photo === null) return;
    photo = photo || d.photo || '';
    const r = await api.send('/api/admin/certificates', 'POST', { cert_id: d.cert_id, name: d.name, course: d.course, cert_date: d.cert_date, image, photo });
    if (r && r.error) { await notifyModal('Could not save', r.error); }
    loadCerts();
  });
  async function editCert(id) {
    const c = _certs.find((x) => x.id === id); if (!c) return;
    const d = await openForm('Edit Certificate', certFields(c));
    if (!d) return;
    if (!d.cert_id) { await notifyModal('Missing ID', 'Certificate ID is required — it becomes the QR link.'); return; }
    let image = await uploadImageFile(d.imageFile); if (image === null) return;
    image = image || d.image || c.image;
    let photo = await uploadImageFile(d.photoFile); if (photo === null) return;
    photo = photo || d.photo || '';
    const r = await api.send('/api/admin/certificates/' + id, 'PATCH', { cert_id: d.cert_id, name: d.name, course: d.course, cert_date: d.cert_date, image, photo });
    if (r && r.error) { await notifyModal('Could not save', r.error); }
    loadCerts();
  }
  async function delCert(id) {
    const ok = await confirmModal('Delete certificate', 'Delete this certificate? Its QR link will stop working. This cannot be undone.', 'Delete');
    if (ok) { await api.send('/api/admin/certificates/' + id, 'DELETE'); loadCerts(); }
  }

  async function loadTrials() {
    const rows = (await api.get('/api/admin/trials') || []).map((t) => `<tr><td>${t.name}</td><td>${t.phone}<br><span class="hint">${t.email || ''}</span></td><td>${t.discipline || '-'}</td><td>${t.preferred_date || '-'}</td><td>${badge(t.status)}</td><td><select class="mini" onchange="ADMIN.setTrial(${t.id}, this.value)">${['new', 'contacted', 'completed'].map((s) => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>${ROLE === 'owner' ? ` <button class="mini" style="border-color:var(--red);color:var(--red)" onclick="ADMIN.delTrial(${t.id})">Delete</button>` : ''}</td></tr>`);
    $('#trials-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Discipline', 'Date', 'Status', 'Manage'], rows) : '<p class="hint">No bookings yet.</p>';
  }
  async function setTrial(id, status) { await api.send('/api/admin/trials/' + id, 'PATCH', { status }); }
  async function delTrial(id) {
    const ok = await confirmModal('Delete trial booking', 'Delete this trial booking? This cannot be undone.', 'Delete');
    if (!ok) return;
    const r = await api.send('/api/admin/trials/' + id, 'DELETE');
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not delete.');
    loadTrials();
  }
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
    const rows = (await api.get('/api/admin/collaborations') || []).map((c) => `<tr><td>${c.name}<br><span class="hint">${c.organization || ''}</span></td><td>${c.email}<br><span class="hint">${c.phone || ''}</span></td><td>${c.type || '-'}</td><td style="max-width:260px">${c.message || ''}</td><td>${badge(c.status)}</td><td><select class="mini" onchange="ADMIN.setCollab(${c.id}, this.value)">${['new', 'reviewing', 'accepted', 'declined'].map((s) => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>${ROLE === 'owner' ? ` <button class="mini" style="border-color:var(--red);color:var(--red)" onclick="ADMIN.delCollab(${c.id})">Delete</button>` : ''}</td></tr>`);
    $('#collabs-table').innerHTML = rows.length ? tbl(['Name', 'Contact', 'Type', 'Message', 'Status', 'Manage'], rows) : '<p class="hint">No requests yet.</p>';
  }
  async function setCollab(id, status) { await api.send('/api/admin/collaborations/' + id, 'PATCH', { status }); }
  async function delCollab(id) {
    const ok = await confirmModal('Delete collaboration', 'Delete this collaboration request? This cannot be undone.', 'Delete');
    if (!ok) return;
    const r = await api.send('/api/admin/collaborations/' + id, 'DELETE');
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not delete.');
    loadCollabs();
  }
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
    const rows = (await api.get('/api/admin/payments') || []).map((p) => `<tr><td>${p.name || '-'}<br><span class="hint">${p.email || ''} ${p.phone || ''}</span></td><td>${p.plan || '-'}</td><td>${inr(p.amount)}</td><td>${badge(p.status)}</td><td class="hint">${(p.created_at || '').slice(0,10)}</td><td>${p.status === 'paid' ? `<a class="mini" style="text-decoration:none" href="/api/admin/payments/${p.id}/invoice" target="_blank">Invoice</a>` : '-'} <button class="mini" onclick="ADMIN.delPayment(${p.id})">Delete</button></td></tr>`);
    $('#payments-table').innerHTML = rows.length ? tbl(['Customer', 'Plan', 'Amount', 'Status', 'When', 'Manage'], rows) : '<p class="hint">No payments yet.</p>';
  }
  async function delPayment(id) {
    const ok = await confirmModal('Delete payment', 'Delete this payment record? This cannot be undone.', 'Delete');
    if (!ok) return;
    const r = await api.send('/api/admin/payments/' + id, 'DELETE');
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not delete.');
    loadPayments();
  }

  // Fetch plans -> [{name, price, duration}] for select menus.
  async function getPlans() { return (await api.get('/api/admin/memberships')) || []; }
  function planSelectOptions(plans) { return plans.map((p) => [p.name, `${p.name} — ${inr(p.price)}`]); }

  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  // Turn a date-only value into a real timestamp: today -> the actual current time; a past date -> local noon (avoids timezone date-shift).
  const stampFor = (dateStr) => {
    if (!dateStr || dateStr === today()) return new Date().toISOString();
    const d = new Date(dateStr + 'T12:00:00');
    return isNaN(d) ? new Date().toISOString() : d.toISOString();
  };
  let _members = [];
  async function loadMembers() {
    _members = (await api.get('/api/admin/members') || []);
    renderMembers();
  }
  const memberIdNum = (id) => { const n = parseInt(String(id || '').replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  function renderMembers() {
    const box = document.getElementById('member-search');
    const q = (box ? box.value : '').trim().toLowerCase();
    let list = q
      ? _members.filter((m) => [m.name, m.membership_id, m.email, m.phone, m.plan].some((f) => String(f || '').toLowerCase().includes(q)))
      : _members.slice();
    const sortBy = (document.getElementById('member-sort') || {}).value || 'recent';
    if (sortBy === 'id-asc') list.sort((a, b) => memberIdNum(a.membership_id) - memberIdNum(b.membership_id));
    else if (sortBy === 'id-desc') list.sort((a, b) => memberIdNum(b.membership_id) - memberIdNum(a.membership_id));
    else if (sortBy === 'expiry-asc') list.sort((a, b) => new Date(a.expires_at || 0) - new Date(b.expires_at || 0));
    else if (sortBy === 'name-asc') list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const rows = list.map((m) => {
      const active = new Date(m.expires_at) > new Date();
      const combo = m.name ? `${m.name}(${m.membership_id || ''})` : (m.membership_id || '-');
      const pend = m.pending_amount || 0;
      const paidAmt = m.paid_amount != null ? m.paid_amount : m.amount;
      let manage = '—';
      if (ROLE !== 'coach') {
        manage = '';
        manage += `<button class="mini" onclick="ADMIN.showDetails(${m.id})">Details</button> `;
        if (pend > 0) manage += `<button class="mini" style="border-color:var(--red);color:var(--red)" onclick="ADMIN.clearPending(${m.id})">Pending ${inr(pend)}</button> `;
        manage += `<button class="mini" onclick="ADMIN.renewMember(${m.id})">Renew</button>`;
        if (ROLE === 'owner') manage += ` <button class="mini" onclick="ADMIN.editMember(${m.id})">Edit</button>`;
        if (ROLE === 'owner') manage += ` <button class="mini" onclick="ADMIN.delMember(${m.id}, '${(m.email || '').replace(/'/g, '')}')">Delete</button>`;
      }
      return `<tr>
        <td><b style="color:#fff">${m.membership_id || '-'}</b></td>
        <td>${m.name || '-'}</td>
        <td>${combo}</td>
        <td>${m.email || '-'}</td>
        <td>${m.phone || '-'}</td>
        <td>${m.plan || '-'}</td>
        <td>${inr(m.amount)}</td>
        <td>${inr(paidAmt)}</td>
        <td>${pend > 0 ? `<span style="color:var(--red)">${inr(pend)}</span>` : '-'}</td>
        <td>${m.method || '-'}</td>
        <td>${dstr(m.starts_at)}</td>
        <td>${dstr(m.expires_at)}</td>
        <td>${active ? '<span class="status-pill active">Active</span>' : '<span class="status-pill expired">Expired</span>'}</td>
        <td>${manage}</td></tr>`;
    });
    const countEl = document.getElementById('member-count');
    if (countEl) countEl.textContent = q ? `${list.length} of ${_members.length}` : `${_members.length} member${_members.length === 1 ? '' : 's'}`;
    $('#members-table').innerHTML = rows.length
      ? tbl(['Membership No', 'Name', 'Member (Name/ID)', 'Email', 'Mobile', 'Package', 'Amount', 'Paid', 'Pending', 'Mode of Payment', 'Date', 'Expires', 'Status', 'Manage'], rows)
      : (q ? `<p class="hint">No members match “${q}”.</p>` : '<p class="hint">No members yet.</p>');
  }
  { const it = document.getElementById('import-toggle'); if (it) it.addEventListener('click', openImportModal); }
  { const ss = document.getElementById('member-sort'); if (ss) ss.addEventListener('change', renderMembers); }
  { const sb = document.getElementById('member-search'); const cl = document.getElementById('member-search-clear'); const wrap = sb ? sb.closest('.search-wrap') : null;
    if (sb) sb.addEventListener('input', () => { if (wrap) wrap.classList.toggle('has-text', !!sb.value); renderMembers(); });
    if (sb) sb.addEventListener('keydown', (e) => { if (e.key === 'Escape') { sb.value = ''; if (wrap) wrap.classList.remove('has-text'); renderMembers(); } });
    if (cl) cl.addEventListener('click', () => { sb.value = ''; if (wrap) wrap.classList.remove('has-text'); renderMembers(); sb.focus(); }); }
  $('#new-admission').addEventListener('click', async () => {
    const plans = await getPlans();
    const priceOf = (name) => { const p = plans.find((x) => x.name === name); return p ? p.price : 0; };
    const d = await openForm('New Admission', [
      { key: 'name', label: 'Member name' },
      { key: 'membershipId', label: 'Membership No (blank = auto, e.g. 718MMA…)' },
      { key: 'email', label: 'Email (optional — needed for reminders/invoice)' },
      { key: 'phone', label: 'Mobile (optional)' },
      { key: 'plan', label: 'Package', type: 'select', value: (plans[0] && plans[0].name) || 'Monthly', options: planSelectOptions(plans) },
      { key: 'session', label: 'Session (optional)', type: 'select', value: SESSIONS[0], options: sessionOptions() },
      { key: 'discountType', label: 'Discount (optional)', type: 'select', value: 'none', options: [['none', 'No discount'], ['percent', 'Percentage off (%)'], ['amount', 'Flat amount off (₹)']] },
      { key: 'discountValue', label: 'Discount value (e.g. 10 = 10% or ₹10, per above)', type: 'number' },
      { key: 'amount', label: 'Total payable (₹) — auto-filled from package & discount; edit only to override', type: 'number', value: (plans[0] && plans[0].price) || '' },
      { key: 'cashAmount', label: 'Paid in cash now (₹) — blank = full amount in cash', type: 'number' },
      { key: 'onlineAmount', label: 'Paid online / POS now (₹)', type: 'number' },
      { key: 'date', label: 'Date paid (membership starts this day)', type: 'date', value: today() },
    ], (body) => {
      const q = (k) => body.querySelector(`[data-k="${k}"]`);
      const planSel = q('plan'), dType = q('discountType'), dVal = q('discountValue'), amt = q('amount');
      let overridden = false;
      amt.addEventListener('input', () => { overridden = true; });
      const recompute = () => {
        if (overridden) return;
        const price = priceOf(planSel.value);
        const v = parseInt(dVal.value, 10) || 0;
        let disc = 0;
        if (v > 0 && dType.value === 'percent') disc = Math.round(price * v / 100);
        else if (v > 0 && dType.value === 'amount') disc = v;
        amt.value = Math.max(0, price - disc);
      };
      [planSel, dType, dVal].forEach((el) => { el.addEventListener('input', recompute); el.addEventListener('change', recompute); });
      recompute();
    });
    if (!d) return;
    const planObj = plans.find((p) => p.name === d.plan);
    const listPrice = planObj ? planObj.price : 0;
    // --- discount ---
    const dv = parseInt(d.discountValue, 10) || 0;
    let discount = 0, discountNote = '';
    if (dv > 0 && d.discountType === 'percent') { discount = Math.round(listPrice * dv / 100); discountNote = `${dv}% off (−${inr(discount)})`; }
    else if (dv > 0 && d.discountType === 'amount') { discount = dv; discountNote = `${inr(dv)} off`; }
    // --- total ---
    let total = parseInt(d.amount, 10) || 0;
    if (!total) total = Math.max(0, listPrice - discount);
    d.amount = total; d.discount = discount; d.discountNote = discountNote;
    d.date = stampFor(d.date);
    // --- payment split: if nothing entered, assume paid in full (cash) — never silently "all pending" ---
    let cash = parseInt(d.cashAmount, 10) || 0;
    let online = parseInt(d.onlineAmount, 10) || 0;
    if (!cash && !online) { cash = total; d.cashAmount = String(total); }
    const paid = cash + online;
    const pending = Math.max(0, total - paid);
    if (pending > 0) {
      const tiny = pending <= 20;
      const ok = await confirmModal('Confirm pending balance',
        `Total is <b style="color:#fff">${inr(total)}</b> and <b style="color:#fff">${inr(paid)}</b> was paid now, leaving <b style="color:#e8112d">${inr(pending)}</b> to collect later.` +
        (tiny ? `<br><br>That's only <b style="color:#e8112d">${inr(pending)}</b> — did you mistype the amount? If it's a typo, press Cancel and fix it.` : '<br><br>Record this as a pending balance?'),
        `Yes — ${inr(pending)} due later`);
      if (!ok) return;
    }
    const r = await api.send('/api/admin/members', 'POST', d);
    if (r.ok) {
      const pendMsg = r.pending > 0 ? `<br><b style="color:#e8112d">${inr(r.pending)} still due</b> — use the Pending button when they pay.` : '';
      const discMsg = discountNote ? `<br>Discount applied: <b style="color:#fff">${discountNote}</b>.` : '';
      await notifyModal('Member added', `Membership No <b style="color:#fff">${r.memberId}</b>.${r.invoiceNo ? ` Invoice ${r.invoiceNo}${r.emailed ? ' emailed' : ''}.` : ''}${discMsg}${pendMsg}`);
    } else await notifyModal('Failed', r.error || 'Could not add the member.');
    loadMembers();
  });
  $('#start-renewal').addEventListener('click', async () => {
    if (!_members.length) await loadMembers();
    if (!_members.length) { await notifyModal('No members yet', 'Add a new admission before recording a renewal.'); return; }
    const memberId = await openRenewalPicker();
    if (memberId) await renewMember(memberId);
  });
  function openRenewalPicker() {
    return new Promise((resolve) => {
      const overlay = $('#modal');
      const body = $('#modal-body');
      let selected = null;
      $('#modal-title').textContent = 'Select Member For Renewal';
      body.innerHTML = `<div class="renewal-picker">
        <div class="search-wrap"><svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input id="renewal-member-search" type="text" placeholder="Search members by name, ID, email, mobile or package" autocomplete="off" spellcheck="false" /></div>
        <p class="hint" id="renewal-picker-note">Choose the member whose membership you want to renew.</p>
        <div class="renewal-results" id="renewal-results"></div>
      </div>`;
      const input = $('#renewal-member-search');
      const results = $('#renewal-results');
      const note = $('#renewal-picker-note');
      const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const render = () => {
        const q = input.value.trim().toLowerCase();
        const list = _members.filter((m) => !q || [m.name, m.membership_id, m.email, m.phone, m.plan].some((f) => String(f || '').toLowerCase().includes(q)));
        results.innerHTML = list.length ? list.map((m) => `<button type="button" class="renewal-result${selected === m.id ? ' selected' : ''}" data-member-id="${m.id}"><b>${esc(m.name || 'Unnamed member')}</b><span>${esc(m.membership_id || 'No membership ID')} · ${esc(m.plan || 'No package')} · expires ${dstr(m.expires_at)}</span><small>${esc(m.email || m.phone || '')}</small></button>`).join('') : '<p class="hint" style="padding:12px">No members match your search.</p>';
      };
      const close = (value) => {
        overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null;
        $('#modal-save').textContent = 'Save'; resolve(value);
      };
      results.addEventListener('click', (e) => {
        const button = e.target.closest('[data-member-id]');
        if (!button) return;
        selected = Number(button.dataset.memberId);
        const member = _members.find((m) => m.id === selected);
        note.textContent = member ? `Selected: ${member.name || 'Unnamed member'} (${member.membership_id || 'No ID'}).` : '';
        render();
      });
      input.addEventListener('input', render);
      $('#modal-save').textContent = 'Continue';
      $('#modal-save').onclick = () => { if (!selected) { note.textContent = 'Choose a member from the search results to continue.'; return; } close(selected); };
      $('#modal-cancel').onclick = () => close(null);
      overlay.onclick = (e) => { if (e.target === overlay) close(null); };
      render(); overlay.classList.add('open'); setTimeout(() => input.focus(), 50);
    });
  }
  async function clearPending(id) {
    const m = _members.find((x) => x.id === id);
    const due = m ? (m.pending_amount || 0) : 0;
    const d = await openForm('Clear Pending Balance', [
      { key: 'date', label: `Date received (balance due: ${inr(due)})`, type: 'date', value: today() },
      { key: 'cashAmount', label: 'Received in cash (₹)', type: 'number' },
      { key: 'onlineAmount', label: 'Received online / POS (₹)', type: 'number' },
    ]);
    if (!d) return;
    d.date = stampFor(d.date);
    const r = await api.send('/api/admin/members/' + id + '/clear-pending', 'POST', d);
    if (r.ok) await notifyModal('Balance updated', r.pending > 0 ? `Recorded. Remaining due: <b style="color:#e8112d">${inr(r.pending)}</b>.` : 'Fully paid — no balance remaining. ✓');
    else await notifyModal('Failed', r.error || 'Could not update the balance.');
    loadMembers();
  }
  // Proper billing ledger: member profile + account summary + per-transaction Bill/Paid/Due table.
  async function showDetails(id) {
    const data = await api.get('/api/admin/members/' + id + '/details');
    if (!data || !data.member) { await notifyModal('Not found', 'Could not load this member.'); return; }
    const m = data.member;
    const active = new Date(m.expires_at) > new Date();
    const dt = (s) => { if (!s) return '-'; const d = new Date(s); return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };
    const typeOf = (note) => {
      const n = (note || '').toLowerCase();
      if (n.startsWith('renewal')) return 'Renewal';
      if (n.startsWith('balance')) return 'Balance payment';
      if (n.startsWith('imported')) return 'Imported';
      return 'New membership';
    };
    const pays = data.payments || [];
    let billed = 0, collected = 0;
    const rowsHtml = pays.map((p) => {
      const bill = p.bill_amount != null ? p.bill_amount : 0;
      const paid = p.amount || 0;
      const due = p.due_amount || 0;
      billed += bill; collected += paid;
      const disc = (p.note || '').includes('·') ? p.note.split('·').slice(1).join('·').trim() : '';
      return `<tr>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a;white-space:nowrap">${dt(p.created_at)}</td>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a">${typeOf(p.note)}${disc ? `<br><span class="hint">${disc}</span>` : ''}</td>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a;text-align:right">${bill ? inr(bill) : '—'}</td>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a;text-align:right;color:#3ecf8e">${inr(paid)}</td>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a;text-align:right">${due > 0 ? `<span style="color:#e8112d">${inr(due)}</span>` : '—'}</td>
        <td style="padding:8px 10px;border-top:1px solid #2a2a2a">${p.method || '-'}</td></tr>`;
    }).join('');
    const balance = m.pending_amount || 0;
    const history = rowsHtml
      ? `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;min-width:640px">
           <thead><tr style="color:var(--red);font-family:var(--cond);letter-spacing:1px;text-align:left">
             <th style="padding:8px 10px">Date &amp; time</th><th style="padding:8px 10px">Type</th>
             <th style="padding:8px 10px;text-align:right">Bill</th><th style="padding:8px 10px;text-align:right">Paid</th>
             <th style="padding:8px 10px;text-align:right">Due</th><th style="padding:8px 10px">Method</th></tr></thead>
           <tbody>${rowsHtml}</tbody>
           <tfoot><tr style="border-top:2px solid var(--red);font-weight:700">
             <td style="padding:8px 10px" colspan="2">Totals</td>
             <td style="padding:8px 10px;text-align:right;color:#fff">${inr(billed)}</td>
             <td style="padding:8px 10px;text-align:right;color:#3ecf8e">${inr(collected)}</td>
             <td style="padding:8px 10px;text-align:right">${balance > 0 ? `<span style="color:#e8112d">${inr(balance)}</span>` : '—'}</td>
             <td style="padding:8px 10px"></td></tr></tfoot>
         </table></div>`
      : '<p class="hint" style="margin-top:6px">No transactions recorded yet.</p>';
    const card = (label, value, color) => `<div style="flex:1;min-width:120px;background:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px 14px">
        <div style="font-size:20px;font-weight:800;color:${color || '#fff'}">${value}</div>
        <div class="hint" style="margin-top:2px">${label}</div></div>`;
    const info = `
      <div style="font-size:14px;line-height:1.8;margin-bottom:14px">
        <b style="color:#fff;font-size:16px">${m.name || '-'}</b> &nbsp;·&nbsp; Membership No <b style="color:#fff">${m.membership_id || '-'}</b>
        &nbsp;·&nbsp; ${active ? '<span style="color:#3ecf8e">● Active</span>' : '<span style="color:var(--red)">● Expired</span>'}<br>
        ${m.email || 'no email'} &nbsp;·&nbsp; ${m.phone || 'no mobile'}<br>
        Package: <b style="color:#fff">${m.plan || '-'}</b> &nbsp;·&nbsp; Session: ${m.session || '-'}
        &nbsp;·&nbsp; ${dstr(m.starts_at)} → <b style="color:#fff">${dstr(m.expires_at)}</b>
        ${m.discount_note ? `<br>Discount: <b style="color:#fff">${m.discount_note}</b>` : ''}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
        ${card('Total billed', inr(billed))}
        ${card('Total collected', inr(collected), '#3ecf8e')}
        ${card('Balance due', balance > 0 ? inr(balance) : '₹0', balance > 0 ? '#e8112d' : '#3ecf8e')}
      </div>
      ${balance > 0 ? `<p class="hint" style="margin:0 0 12px">This member owes <b style="color:#e8112d">${inr(balance)}</b> — use the red <b style="color:#fff">Pending</b> button on their row to record it when they pay.</p>` : ''}
      <div class="seg" style="margin:0 0 4px">Billing history</div>${history}`;
    const act = await detailsModal('Member Account · ' + (m.membership_id || ''), info);
    if (act === 'edit') await editMember(id);
  }
  async function renewMember(id) {
    const plans = await getPlans();
    const cur = _members.find((x) => x.id === id);
    const priceOf = (name) => { const p = plans.find((x) => x.name === name); return p ? p.price : 0; };
    const startPlan = (cur && cur.plan) || (plans[0] && plans[0].name) || 'Monthly';
    const d = await openForm('Renew Membership', [
      { key: 'plan', label: 'Package to renew into', type: 'select', value: startPlan, options: planSelectOptions(plans) },
      { key: 'session', label: 'Session (which of the 4 daily slots)', type: 'select', value: (cur && cur.session) || SESSIONS[0], options: sessionOptions() },
      { key: 'discountType', label: 'Discount (optional)', type: 'select', value: 'none', options: [['none', 'No discount'], ['percent', 'Percentage off (%)'], ['amount', 'Flat amount off (₹)']] },
      { key: 'discountValue', label: 'Discount value (e.g. 10 = 10% or ₹10, per above)', type: 'number' },
      { key: 'amount', label: 'Total payable (₹) — auto-filled from package & discount; edit to override', type: 'number', value: priceOf(startPlan) },
      { key: 'cashAmount', label: 'Paid in cash now (₹) — blank = full amount in cash', type: 'number' },
      { key: 'onlineAmount', label: 'Paid online / POS now (₹)', type: 'number' },
      { key: 'date', label: 'Renewal date', type: 'date', value: today() },
      { key: 'durationDays', label: 'Duration in days (blank = auto from package)', type: 'number' },
    ], (body) => {
      const q = (k) => body.querySelector(`[data-k="${k}"]`);
      const planSel = q('plan'), dType = q('discountType'), dVal = q('discountValue'), amt = q('amount');
      let overridden = false;
      amt.addEventListener('input', () => { overridden = true; });
      const recompute = () => {
        if (overridden) return;
        const price = priceOf(planSel.value);
        const v = parseInt(dVal.value, 10) || 0;
        let disc = 0;
        if (v > 0 && dType.value === 'percent') disc = Math.round(price * v / 100);
        else if (v > 0 && dType.value === 'amount') disc = v;
        amt.value = Math.max(0, price - disc);
      };
      [planSel, dType, dVal].forEach((el) => { el.addEventListener('input', recompute); el.addEventListener('change', recompute); });
      recompute();
    });
    if (!d) return;
    const listPrice = priceOf(d.plan);
    const dv = parseInt(d.discountValue, 10) || 0;
    let discount = 0, discountNote = '';
    if (dv > 0 && d.discountType === 'percent') { discount = Math.round(listPrice * dv / 100); discountNote = `${dv}% off (−${inr(discount)})`; }
    else if (dv > 0 && d.discountType === 'amount') { discount = dv; discountNote = `${inr(dv)} off`; }
    let total = parseInt(d.amount, 10) || 0;
    if (!total) total = Math.max(0, listPrice - discount);
    d.amount = total; d.discountNote = discountNote;
    let cash = parseInt(d.cashAmount, 10) || 0;
    let online = parseInt(d.onlineAmount, 10) || 0;
    if (!cash && !online) { cash = total; d.cashAmount = String(total); }
    const paid = cash + online;
    const pending = Math.max(0, total - paid);
    if (pending > 0) {
      const tiny = pending <= 20;
      const ok = await confirmModal('Confirm pending balance',
        `Renewal total is <b style="color:#fff">${inr(total)}</b> and <b style="color:#fff">${inr(paid)}</b> was paid now, leaving <b style="color:#e8112d">${inr(pending)}</b> to collect later.` +
        (tiny ? `<br><br>That's only <b style="color:#e8112d">${inr(pending)}</b> — did you mistype? Press Cancel to fix it.` : '<br><br>Record this as a pending balance?'),
        `Yes — ${inr(pending)} due later`);
      if (!ok) return;
    }
    // Online-on-machine path (only when nothing was split to cash and a terminal is configured).
    if (TERMINAL && online > 0 && cash === 0) {
      await chargeOnMachine({ name: cur ? cur.name : '', email: cur ? cur.email : '', phone: cur ? cur.phone : '', plan: d.plan, amount: total, session: d.session });
      loadMembers(); return;
    }
    d.date = stampFor(d.date);
    const r = await api.send('/api/admin/members/' + id + '/renew', 'POST', d);
    if (r.ok) {
      const pendMsg = r.pending > 0 ? `<br><b style="color:#e8112d">${inr(r.pending)} still due</b> — use the Pending button when they pay.` : '';
      await notifyModal('Membership renewed', `Valid until <b style="color:#fff">${dstr(r.expires)}</b>.${r.invoiceNo ? ` Invoice <b style="color:#fff">${r.invoiceNo}</b>${r.emailed ? ' emailed.' : '.'}` : ''}${pendMsg}<br>Same member row updated — see <b style="color:#fff">Details</b> for the full history.`);
    } else await notifyModal('Failed', r.error || 'Could not renew.');
    loadMembers();
  }
  // Manually edit any member's details (owner). Covers renewed values too.
  async function editMember(id) {
    const plans = await getPlans();
    const m = _members.find((x) => x.id === id);
    if (!m) return;
    const dinp = (s) => (s ? new Date(s).toLocaleDateString('en-CA') : today());
    const d = await openForm('Edit Member', [
      { key: 'name', label: 'Member name', value: m.name || '' },
      { key: 'membershipId', label: 'Membership No', value: m.membership_id || '' },
      { key: 'email', label: 'Email', value: m.email || '' },
      { key: 'phone', label: 'Mobile', value: m.phone || '' },
      { key: 'plan', label: 'Package', type: 'select', value: m.plan || (plans[0] && plans[0].name), options: planSelectOptions(plans) },
      { key: 'session', label: 'Session', type: 'select', value: m.session || SESSIONS[0], options: sessionOptions() },
      { key: 'amount', label: 'Total amount (₹)', type: 'number', value: m.amount || 0 },
      { key: 'cashAmount', label: 'Paid in cash (₹)', type: 'number', value: m.cash_amount || 0 },
      { key: 'onlineAmount', label: 'Paid online / POS (₹)', type: 'number', value: m.online_amount || 0 },
      { key: 'pendingAmount', label: 'Pending / due (₹)', type: 'number', value: m.pending_amount || 0 },
      { key: 'startDate', label: 'Start date', type: 'date', value: dinp(m.starts_at) },
      { key: 'expiryDate', label: 'Expiry date', type: 'date', value: dinp(m.expires_at) },
    ]);
    if (!d) return;
    d.startDate = d.startDate ? new Date(d.startDate + 'T12:00:00').toISOString() : '';
    d.expiryDate = d.expiryDate ? new Date(d.expiryDate + 'T12:00:00').toISOString() : '';
    const r = await api.send('/api/admin/members/' + id, 'PATCH', d);
    if (r.ok) await notifyModal('Saved', 'Member details updated.');
    else await notifyModal('Failed', r.error || 'Could not save the changes.');
    loadMembers();
  }
  async function delMember(id, email) {
    const ok = await confirmModal('Delete member', `Delete <b style="color:#fff">${email}</b> and <b style="color:#fff">all their memberships and payments</b>? This cannot be undone.`, 'Delete');
    if (!ok) return;
    const r = await api.send('/api/admin/members/' + id, 'DELETE');
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not delete.');
    loadMembers();
  }
  // Import members via a clean modal dialog (keeps the members page uncluttered).
  function openImportModal() {
    const overlay = $('#modal');
    const card = overlay.querySelector('.modal-card');
    $('#modal-title').textContent = 'Import Members from Excel';
    $('#modal-body').innerHTML = `
      <p class="hint" style="line-height:1.75;margin-bottom:14px">First row = column headers. Columns:
        <b style="color:#fff">membership_no, date, name, email, mobile, package, amount, paid, pending, mode_of_payment</b>.
        Blank <b style="color:#fff">membership_no</b> auto-generates 718MMA…. Only members with an <b style="color:#fff">email</b> get reminders.
        Dates as <b style="color:#fff">YYYY-MM-DD</b> (or DD-MM-YYYY). No emails are sent on import.</p>
      <input id="import-file" type="file" accept=".xlsx,.xls,.csv"
        style="width:100%;padding:11px;border:1px solid var(--line);border-radius:8px;background:var(--ink);color:#fff;font-size:14px" />
      <div class="form-msg" id="import-out" style="margin-top:12px"></div>`;
    $('#modal-save').textContent = 'Import Sheet';
    $('#modal-cancel').textContent = 'Close';
    $('#modal-cancel').style.display = '';
    if (card) card.style.maxWidth = '560px';
    overlay.classList.add('open');
    const cleanup = () => {
      overlay.classList.remove('open'); $('#modal-save').onclick = null; $('#modal-cancel').onclick = null; overlay.onclick = null;
      $('#modal-save').textContent = 'Save'; $('#modal-cancel').textContent = 'Cancel'; if (card) card.style.maxWidth = '';
    };
    $('#modal-cancel').onclick = cleanup;
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
    $('#modal-save').onclick = () => importMembers();
  }
  async function importMembers() {
    const file = document.getElementById('import-file').files[0];
    const out = document.getElementById('import-out');
    if (!file) { out.className = 'form-msg err'; out.textContent = '⚠️ Choose an .xlsx or .csv file first.'; return; }
    const fd = new FormData(); fd.append('file', file);
    out.className = 'form-msg'; out.textContent = 'Importing…';
    const r = await fetch('/api/admin/members/import', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.ok) {
      out.className = 'form-msg ok';
      out.innerHTML = `✅ Imported <b>${j.imported}</b> of ${j.total}. ${j.skipped ? 'Skipped ' + j.skipped + '.' : ''}` + (j.errors && j.errors.length ? '<br><span class="hint">' + j.errors.join('<br>') + '</span>' : '');
      document.getElementById('import-file').value = ''; loadMembers();
    } else { out.className = 'form-msg err'; out.textContent = '⚠️ ' + (j.error || 'Import failed.'); }
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

  // ---- Financial reports & daily expenses (owner only) ----
  async function loadReports() {
    const period = ($('#report-period') || {}).value || 'month';
    const r = await api.get('/api/admin/reports?period=' + encodeURIComponent(period));
    if (!r || r.error) return;
    const s = r.summary || {};
    $('#report-cards').innerHTML = [
      ['Collections', inr(s.collections), 'paid payments'], ['Expenses', inr(s.expenses), 'recorded expenses'],
      ['Net Collections', inr(s.netCollections), r.label], ['New Admissions', s.admissions || 0, 'members started'],
      ['Renewals', s.renewals || 0, 'renewal payments'], ['Outstanding Due', inr(s.outstanding), 'current member balances'],
    ].map(([value, amount, note], i) => `<div class="stat-card" style="border-top-color:${i === 2 ? '#3ecf8e' : (i === 1 || i === 5 ? 'var(--red)' : '')}"><b>${amount}</b><span>${value}</span><div class="hint" style="margin-top:6px">${note}</div></div>`).join('');
    const expenses = (r.expenses || []).map((e) => `<tr><td>${dstr(e.expense_date)}</td><td><b style="color:#fff">${e.category || 'General'}</b></td><td>${e.description || '-'}</td><td>${inr(e.amount)}</td><td class="hint">${e.created_by || '-'}</td><td><button class="mini" onclick="ADMIN.delExpense(${e.id})">Delete</button></td></tr>`);
    $('#report-expenses').innerHTML = expenses.length ? tbl(['Date', 'Category', 'Description', 'Amount', 'Added by', ''], expenses) : '<p class="hint">No expenses recorded for this period.</p>';
    const payments = (r.payments || []).map((p) => `<tr><td>${dstr(p.created_at)}</td><td><b style="color:#fff">${p.name || '-'}</b><br><span class="hint">${p.email || ''}</span></td><td>${p.plan || '-'}</td><td>${p.method || '-'}</td><td>${inr(p.amount)}</td></tr>`);
    $('#report-payments').innerHTML = payments.length ? tbl(['Date', 'Member', 'Plan', 'Method', 'Amount'], payments) : '<p class="hint">No paid collections for this period.</p>';
  }
  async function addExpense() {
    const d = await openForm('Add Daily Expense', [
      { key: 'expense_date', label: 'Expense date', type: 'date', value: today() },
      { key: 'category', label: 'Category', type: 'select', value: 'General', options: [['General','General'],['Rent','Rent'],['Utilities','Utilities'],['Equipment','Equipment'],['Maintenance','Maintenance'],['Marketing','Marketing'],['Staff','Staff'],['Supplies','Supplies'],['Other','Other']] },
      { key: 'description', label: 'Description (optional)', placeholder: 'e.g. Cleaning supplies' },
      { key: 'amount', label: 'Amount (₹)', type: 'number' },
    ]);
    if (!d) return;
    const r = await api.send('/api/admin/expenses', 'POST', d);
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not add the expense.');
    else await loadReports();
  }
  async function delExpense(id) {
    const ok = await confirmModal('Delete expense', 'Delete this expense entry? This cannot be undone.', 'Delete');
    if (!ok) return;
    const r = await api.send('/api/admin/expenses/' + id, 'DELETE');
    if (!r.ok) await notifyModal('Failed', r.error || 'Could not delete the expense.');
    else await loadReports();
  }
  { const el = $('#report-period'); if (el) el.addEventListener('change', loadReports); }
  { const el = $('#add-expense'); if (el) el.addEventListener('click', addExpense); }
  { const el = $('#export-report-pdf'); if (el) el.addEventListener('click', () => window.open('/api/admin/reports/export/pdf?period=' + encodeURIComponent($('#report-period').value), '_blank')); }
  { const el = $('#export-report-xlsx'); if (el) el.addEventListener('click', () => window.open('/api/admin/reports/export/xlsx?period=' + encodeURIComponent($('#report-period').value), '_blank')); }

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

  window.ADMIN = { setEventStatus, editEvent, delEvent, editCert, delCert, setTrial, delTrial, setCollab, delCollab, editPlan, renewMember, editMember, showDetails, delMember, delPayment, clearPending, importMembers, delExpense, saveClosure, clearClosure, delClass, delVideo, delDiet, uploadDiet, uploadVideoFile };
  initLogin();
  checkAuth();
})();
