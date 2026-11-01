// Headless Chrome via raw CDP (no npm deps). Run: node --experimental-websocket tests/browser-check.js
const { spawn } = require('child_process'); const fs = require('fs'); const http = require('http'); const net = require('net'); const path = require('path');
const BASE = 'http://127.0.0.1:8765/'; const SHOTS = path.join(__dirname, '..', 'shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
  });
}
// Read the loopback debugger with node:http. fetch() follows HTTP_PROXY, and
// the runner's Chrome can take longer than 10s to publish its first page.
function debuggerText(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname, timeout: 2000 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body.replace(/^\)\]\}'\s*/, '')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('debugger timeout')); });
  });
}
let chrome;
(async () => {
  const port = await freePort();
  let chromeLog = '';
  chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-address=127.0.0.1', '--remote-allow-origins=*',
    '--remote-debugging-port=' + port, '--user-data-dir=/tmp/aj-chrome-' + Date.now(),
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const keep = chunk => { chromeLog = (chromeLog + chunk).slice(-4000); };
  chrome.stdout.on('data', keep); chrome.stderr.on('data', keep);
  let tgt; let last = '';
  for (let i = 0; i < 100 && !tgt; i++) {
    try {
      const list = JSON.parse(await debuggerText(port, '/json/list'));
      last = JSON.stringify(list).slice(0, 400);
      tgt = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch (err) { last = String(err && err.message || err); }
    if (!tgt) await sleep(200);
  }
  if (!tgt) throw new Error('Chrome did not open a page (' + last + ')\n' + chromeLog);
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
  const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.result.value;
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const go = async url => { await send('Page.navigate', { url }); await sleep(900); for (let i = 0; i < 30 && !(await ev('document.body&&document.body.dataset.ready')); i++) await sleep(100); };
  const results = [];
  const check = (name, ok) => { results.push([name, !!ok]); console.log((ok ? 'PASS ' : 'FAIL ') + name); };
  const screens = [['o1-home','owner','home'],['o2-entry','owner','entry'],['o3-projects','owner','projects'],['o4-profit','owner','project/p-school'],
                   ['o5-people','owner','person/u-ahmed'],
                   ['s1-home','site','home'],['s2-entry','site','entry'],['s3-projects','site','projects'],['s4-profit','site','project/p-school']];
  await go(BASE + 'index.html');
  const login = await ev(`({dir:document.documentElement.dir, email:!!document.querySelector('#login-email'), pass:!!document.querySelector('#login-password'), btn:(document.querySelector('#login-btn')||{}).textContent||'', loginHidden:document.querySelector('#login').hidden, shellHidden:document.querySelector('#shell').hidden, text:document.querySelector('#login').innerText, hz:document.documentElement.scrollWidth>innerWidth})`);
  check('login: dir=rtl', login.dir === 'rtl');
  check('login: form shown, ledger hidden', login.email && login.pass && login.btn.includes('دخول') && login.loginHidden === false && login.shellHidden === true);
  check('login: no profit or received text', !/ربح|المقبوض|خسارة/.test(login.text));
  check('login: no horizontal overflow', !login.hz);
  check('hostile project id is not written into HTML', await ev(`DomSafe.projectButton(${JSON.stringify('"><img src=x onerror=alert(1)>')},'اسم',false)==='' && DomSafe.projectHref('project',${JSON.stringify('"><img src=x onerror=alert(1)>')})==='#projects'`));
  check('rejected sync shows an Arabic error, not لم يُرسل', await ev(`(()=>{const h=SyncStatus.badgeHtml('e1',['e1'],{e1:'رُفض الإرسال'});return h.includes('رُفض الإرسال')&&!h.includes('لم يُرسل')&&h.includes('data-sync="error"')})()`));
  await ev(`document.querySelector('#login-btn').click()`);
  await sleep(150);
  check('login: empty submit stays on the login screen', await ev(`document.querySelector('#shell').hidden === true && document.querySelector('#login').hidden === false && (document.querySelector('#login-msg').innerText||'').length > 0`));
  await ev(`new Promise(r=>{const q=indexedDB.deleteDatabase('aj-p0');q.onsuccess=q.onerror=q.onblocked=()=>r(1)})`);
  for (const [name, role, hash] of screens) {
    await go(`${BASE}index.html?role=${role}#${hash}`); await ev('dispatchEvent(new HashChangeEvent("hashchange"))'); await sleep(300);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const png = Buffer.from(shot.result.data, 'base64');
    fs.writeFileSync(path.join(SHOTS, name + '.png'), png);
    if (name === 'o4-profit') fs.writeFileSync(path.join(SHOTS, 'owner-project-contract.png'), png);
    if (name === 'o5-people') {
      fs.writeFileSync(path.join(SHOTS, 'owner-people-top.png'), png);
      await ev(`document.querySelector('#save-person').scrollIntoView({block:'center'})`);
      await sleep(250);
      const form = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOTS, 'owner-people.png'), Buffer.from(form.result.data, 'base64'));
    }
    if (name === 's4-profit') fs.writeFileSync(path.join(SHOTS, 'site-project-no-contract.png'), png);
    if (name === 'o2-entry') {
      await ev(`document.querySelector('#party').scrollIntoView({block:'center'})`);
      await sleep(250);
      const form = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOTS, 'new-entry-form.png'), Buffer.from(form.result.data, 'base64'));
    }
    const info = await ev(`({dir:document.documentElement.dir, text:document.querySelector('main').innerText, hz:document.documentElement.scrollWidth>innerWidth})`);
    check(`${name}: dir=rtl`, info.dir === 'rtl'); check(`${name}: no horizontal overflow`, !info.hz);
    if (role === 'site') check(`${name}: no profit/received/loss text`, !/ربح|المقبوض|خسارة/.test(info.text));
    if (role === 'site' && hash === 'entry') check('s2: all 5 types offered', ['مصروف','مواد','عمالة/سلفة','مقاول','دفعة عميل'].every(t => info.text.includes(t)));
    if (role === 'site') check(`${name}: reverse buttons only on own non-reversed entries`, await ev(`(()=>{const es=AJ.get('entries');const bs=[...document.querySelectorAll('[data-rev]')].map(b=>b.dataset.rev);return bs.every(id=>{const e=es.find(x=>x.id===id);return e.createdBy==='u-ahmed'&&!e.isReversal&&!es.some(x=>x.reversesEntryId===id)})&&(location.hash!=='#project/p-school'||bs.length>0)})()`));
    if (role === 'site' && hash === 'home') check('s1: own client payment listed', /دفعة عميل/.test(info.text));
    if (role === 'site' && hash === 'projects') check('s3: only assigned projects', !info.text.includes('بناية السوق') && info.text.includes('مشروع المدرسة'));
    if (role === 'owner' && hash === 'entry') check('o2: all 5 types offered', ['مصروف','مواد','عمالة/سلفة','مقاول','دفعة عميل'].every(t => info.text.includes(t)));
    if (hash === 'entry') check(name + ': payee input', info.text.includes('الجهة المستلمة / المورّد (اختياري)') && await ev(`(()=>{const el=document.querySelector('#party');return !!el && el.maxLength===100})()`));
    if (role === 'owner' && hash === 'project/p-school') {
      check('o4: rows show the recorder name', info.text.includes('أمير'));
      check('o4: old entry without a name shows a dash', await ev(`(()=>{const row=[...document.querySelectorAll('.entry')].find(el=>el.innerText.includes('إدخال خاطئ')&&!el.innerText.includes('تصحيح'));return !!row&&row.innerText.includes('—')&&!row.innerText.includes('أحمد')})()`));
      check('o4: owner project shows the contract value', info.text.includes('قيمة العقد') && info.text.includes('60,000,000') && await ev(`document.querySelector('#contract') && document.querySelector('#contract').value==='60000000'`));
      check('o4: all-entries option on the project', info.text.includes('عرض جميع القيود') && await ev(`document.querySelector('#all-entries') && document.querySelector('#all-entries').getAttribute('href')==='#entries/p-school'`));
    }
    if (role === 'owner' && hash === 'person/u-ahmed') {
      check('o5: instructions name the Firebase UID column', info.text.includes('Firebase') && info.text.includes('Authentication') && info.text.includes('Users') && info.text.includes('User UID'));
      check('o5: projects are named checkboxes', await ev(`(()=>{const boxes=[...document.querySelectorAll('[data-assign]')]; const ids=boxes.map(b=>b.dataset.assign).slice().sort().join(); const on=boxes.filter(b=>b.checked).map(b=>b.dataset.assign).slice().sort().join(); const text=document.querySelector('#main').innerText; return ids==='p-market,p-road,p-school' && on==='p-road,p-school' && text.includes('مشروع المدرسة') && text.includes('مشروع الطريق') && text.includes('بناية السوق') && !text.includes('كل المشاريع') && document.querySelector('#person-uid').readOnly && document.querySelector('#person-name').value==='أحمد' && document.querySelector('#person-role').value==='site' && document.querySelector('#person-active').checked===true})()`));
    }
    if (role === 'site' && hash === 'project/p-school') {
      check('s4: site project hides the contract', !info.text.includes('قيمة العقد') && !info.text.includes('60,000,000') && await ev(`!document.querySelector('#contract') && !document.body.innerHTML.includes('projectFinance')`));
      check('s4: all-entries option on the project', info.text.includes('عرض جميع القيود') && await ev(`document.querySelector('#all-entries') && document.querySelector('#all-entries').getAttribute('href')==='#entries/p-school'`));
    }
    if (role === 'site' && hash === 'home') check('s1: own rows show the recorder', info.text.includes('أحمد'));
    if (role === 'owner' && hash === 'home') check('o1: totals shown', /صافي الربح/.test(info.text));
  }
  // functional: save expense as site -> outbox +1; send now drains
  await go(`${BASE}index.html?role=site#entry`);
  const before = await ev(`AJ.get('outbox').length`);
  await ev(`document.querySelector('[data-add="1000"]').click(); document.querySelector('#save').click(); 1`);
  const after = await ev(`AJ.get('outbox').length`);
  check(`save adds to outbox (${before}->${after})`, after === before + 1);
  await ev('AJ.flush().then(()=>1)');
  const idb = async () => ev(`new Promise(r=>{const q=indexedDB.open('aj-p0');q.onsuccess=()=>{const d=q.result,t=d.transaction(['entries','outbox','projects']);const out={};let n=3;for(const s of ['entries','outbox','projects']){const g=t.objectStore(s).count();g.onsuccess=()=>{out[s]=g.result;if(!--n)r(out)}}}})`);
  const ls = await ev('localStorage.length');
  const i1 = await idb();
  check(`data in IndexedDB (entries ${i1.entries}, outbox ${i1.outbox}, projects ${i1.projects}), localStorage empty (${ls})`, i1.entries > 10 && i1.outbox === after && i1.projects === 3 && ls === 0);
  await send('Page.reload', {}); await sleep(1200);
  const i2 = await idb(); const after2 = await ev(`AJ.get('outbox').length`);
  check('IndexedDB data survives reload', i2.entries === i1.entries && i2.outbox === i1.outbox && after2 === after);
  check('navigator.storage.persist called (result: ' + (await ev('String(AJ.persisted)')) + ')', (await ev('typeof navigator.storage.persist')) === 'function');
  check('header counter updated', (await ev(`document.querySelector('#outbox').innerText`)).includes(String(after)));
  // offline reload: SW must control page, then block network
  await ev(`navigator.serviceWorker.ready.then(()=>1)`); await go(`${BASE}index.html?role=owner#home`);
  check('service worker controls page', await ev('!!navigator.serviceWorker.controller'));
  await send('Network.enable'); await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Page.reload', { ignoreCache: false }); await sleep(1500);
  const off = await ev(`({t:document.querySelector('main')?.innerText||'', ob:document.querySelector('#outbox')?.innerText, on:navigator.onLine})`);
  check('offline reload renders app with data', off.t.includes('صافي الربح') && off.ob.includes(String(after)));
  await send('Page.captureScreenshot', { format: 'png' }).then(s => fs.writeFileSync(path.join(SHOTS, 'offline-reload-owner-home.png'), Buffer.from(s.result.data, 'base64')));
  await ev(`document.querySelector('#send').click(); AJ.flush().then(()=>1)`);
  check('send now drains outbox', (await ev(`AJ.get('outbox').length`)) === 0 && (await ev(`document.querySelector('#outbox').innerText`)).includes('0'));
  const csv = await ev(`(()=>{let got=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x'};document.querySelector('#csv').click();URL.createObjectURL=o;return got?got.text():null})()`);
  check('owner CSV export produces rows', csv && csv.split('\r\n').length > 10 && csv.includes('reversesEntryId') && csv.includes('createdByName') && csv.includes('partyName'));
  const shotOf = async file => { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(path.join(SHOTS, file), Buffer.from(s.result.data, 'base64')); };
  await ev(`location.hash='#entry'; document.querySelector('#role').value='owner'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  await ev(`document.querySelector('[data-proj="p-school"]').click(); 1`);
  await ev(`document.querySelector('[data-add="1000000"]').click(); 1`);
  await ev(`document.querySelector('#party').value='  مكتب الأنوار  '; document.querySelector('#desc').value='قيد للعرض'; document.querySelector('#save').click(); 1`);
  const saved = await ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description==='قيد للعرض');return e&&{party:e.partyName,name:e.createdByName,project:e.projectId}})()`);
  check('save stores trimmed payee and the owner name', saved && saved.party === 'مكتب الأنوار' && saved.name === 'أمير' && saved.project === 'p-school');
  await ev(`location.hash='#project/p-school'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  check('tapping a row opens details', await ev(`(()=>{const row=[...document.querySelectorAll('.entry')].find(el=>el.innerText.includes('قيد للعرض'));row.querySelector('a.entry-open').click();return location.hash.startsWith('#detail/')})()`));
  await sleep(200);
  const ownerDetail = await ev(`document.querySelector('#main').innerText`);
  check('owner details show the entry', ['النوع','المبلغ','مشروع المدرسة','قيد للعرض','مكتب الأنوار','أمير','لم يُرسل','1,000,000'].every(t => ownerDetail.includes(t)));
  await shotOf('owner-details.png');
  const ownerButtons = await ev(`['#entry-print','#entry-pdf','#entry-file'].map(s => { const el = document.querySelector(s); return el ? el.textContent : ''; })`);
  check('owner details have print, PDF, and file buttons', ownerButtons && ownerButtons.join('|') === 'طباعة|حفظ PDF|حفظ كملف');
  const ownerPrint = await ev(`(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    document.querySelector('#entry-print').click();
    document.querySelector('#entry-pdf').click();
    const text = document.querySelector('#print-root').textContent || '';
    const entry = (AJ.get('entries') || []).find(e => e.description === 'قيد للعرض');
    const fields = Ledger.entryExportFields(AJ.get('users').find(u => u.uid === 'u-ameer'), entry, { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY });
    return { printed: window.__printed, ok: !!fields && fields.every(f => text.includes(f.value)), text };
  })()`);
  check('owner print layout shows the entry fields', ownerPrint && ownerPrint.printed === 2 && ownerPrint.ok && ['أهل الجزيرة','مشروع المدرسة','1,000,000','مكتب الأنوار','أمير','قيد للعرض','د.ع'].every(t => ownerPrint.text.includes(t)));
  const ownerFile = await ev(`(async () => {
    const u = AJ.get('users').find(x => x.uid === 'u-ameer');
    const entry = (AJ.get('entries') || []).find(e => e.description === 'قيد للعرض');
    const expected = Ledger.entryToCSV(u, entry, { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY });
    const body = expected.slice(1);
    const bomOf = async file => { const b = new Uint8Array(await file.arrayBuffer()); return b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF; };
    let shared = null;
    navigator.canShare = () => true;
    navigator.share = async (data) => { const file = data.files[0]; shared = { text: await file.text(), name: file.name, bom: await bomOf(file) }; };
    document.querySelector('#entry-file').click();
    for (let i = 0; i < 20 && !shared; i++) await new Promise(r => setTimeout(r, 20));
    let downloaded = null;
    navigator.canShare = () => false;
    const prev = URL.createObjectURL;
    URL.createObjectURL = b => { downloaded = b; return 'blob:entry-export'; };
    document.querySelector('#entry-file').click();
    const downloadText = downloaded ? await downloaded.text() : '';
    const downloadBom = downloaded ? await bomOf(downloaded) : false;
    URL.createObjectURL = prev;
    return { body, shared, downloadText, downloadBom, bom: expected.charCodeAt(0) === 0xFEFF };
  })()`);
  check('owner entry CSV share and download match', ownerFile && ownerFile.bom && ownerFile.shared && ownerFile.shared.bom && ownerFile.downloadBom && ownerFile.shared.text === ownerFile.body && ownerFile.downloadText === ownerFile.body && ownerFile.shared.name.indexOf('aj-entry-') === 0 && ownerFile.body.includes('قيد للعرض') && ownerFile.body.includes('مكتب الأنوار'));
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 2, mobile: false });
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await sleep(150);
  check('owner print stylesheet hides the app', await ev(`getComputedStyle(document.querySelector('#print-root')).display === 'block' && getComputedStyle(document.querySelector('#app')).display === 'none'`));
  check('owner print keeps the Baghdad clock in order', await ev(`(() => { const row = [...document.querySelectorAll('#print-root tr')].find(tr => tr.textContent.includes('وقت التسجيل')); const cell = row && row.querySelector('td'); const date = [...document.querySelectorAll('#print-root tr')].find(tr => tr.textContent.includes('تاريخ القيد')); return !!cell && /^\\d{2}:\\d{2}:\\d{2}$/.test(cell.textContent.trim()) && cell.dir === 'ltr' && getComputedStyle(cell).direction === 'ltr' && !!date && !cell.textContent.includes(date.querySelector('td').textContent.trim()); })()`));
  await shotOf('print-layout-owner.png');
  await send('Emulation.setEmulatedMedia', { media: 'screen' });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  check('back returns to the project', await ev(`document.querySelector('#back').click(); location.hash==='#project/p-school'`));
  await ev(`const row=[...document.querySelectorAll('.entry')].find(el=>el.innerText.includes('إدخال خاطئ')&&!el.innerText.includes('تصحيح')); row.querySelector('a.entry-open').click(); 1`);
  await sleep(200);
  const reversed = await ev(`document.querySelector('#main').innerText`);
  check('reversed entry shows the link and reason, and a dash for the old name', reversed.includes('عرض قيد العكس') && reversed.includes('مبلغ مكرر (مثال)') && reversed.includes('—') && !reversed.includes('أحمد'));
  await ev(`document.querySelector('#role').value='site'; location.hash='#home'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  check('site home row opens own details', await ev(`(()=>{const a=document.querySelector('#main a.entry-open'); if(!a) return false; a.click(); return location.hash.startsWith('#detail/')})()`));
  await sleep(200);
  const siteDetail = await ev(`({text:document.querySelector('#main').innerText, html:document.querySelector('#main').innerHTML})`);
  check('site details show the recorder and no profit or others income', siteDetail.text.includes('سجّله') && siteDetail.text.includes('أحمد') && !/ربح|المقبوض|خسارة/.test(siteDetail.text) && !siteDetail.text.includes('40,000,000') && !siteDetail.text.includes('30,000,000'));
  await ev(`location.hash='#project/p-road'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  check('site project row opens details', await ev(`(()=>{const row=[...document.querySelectorAll('.entry')].find(el=>el.innerText.includes('أجور')); if(!row) return false; row.querySelector('a.entry-open').click(); return location.hash.startsWith('#detail/')})()`));
  await sleep(200);
  const labour = await ev(`document.querySelector('#main').innerText`);
  check('site expense details show the recorder and hide profit', labour.includes('أجور') && labour.includes('أحمد') && labour.includes('8,200,000') && !/ربح|المقبوض|خسارة/.test(labour) && !labour.includes('11,200,000'));
  await shotOf('site-details.png');
  const siteButtons = await ev(`['#entry-print','#entry-pdf','#entry-file'].map(s => { const el = document.querySelector(s); return el ? el.textContent : ''; })`);
  check('site details have print, PDF, and file buttons', siteButtons && siteButtons.join('|') === 'طباعة|حفظ PDF|حفظ كملف');
  const sitePrint = await ev(`(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    document.querySelector('#entry-print').click();
    document.querySelector('#entry-pdf').click();
    const text = document.querySelector('#print-root').textContent || '';
    const entry = (AJ.get('entries') || []).find(e => e.id === 'seed-6');
    const fields = Ledger.entryExportFields(AJ.get('users').find(u => u.uid === 'u-ahmed'), entry, { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY });
    const banned = ['ربح','المقبوض','خسارة','قيمة العقد','contractAmount','profit','60,000,000','40,000,000','11,200,000','30,000,000','60000000'];
    return { printed: window.__printed, ok: !!fields && fields.every(f => text.includes(f.value)), clean: banned.every(w => !text.includes(w)), text };
  })()`);
  check('site print layout has the expense and no hidden money', sitePrint && sitePrint.printed === 2 && sitePrint.ok && sitePrint.clean && ['أهل الجزيرة','مشروع الطريق','عمالة/سلفة','8,200,000','أحمد','أجور','تاريخ القيد','2026-10-06','وقت التسجيل','12:00:06'].every(t => sitePrint.text.includes(t)) && !sitePrint.text.includes('2026-10-01'));
  const siteFile = await ev(`(async () => {
    const u = AJ.get('users').find(x => x.uid === 'u-ahmed');
    const entry = (AJ.get('entries') || []).find(e => e.id === 'seed-6');
    const ctx = { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY };
    const expected = Ledger.entryToCSV(u, entry, ctx);
    const hidden = Ledger.entryToCSV(u, (AJ.get('entries') || []).find(e => e.id === 'seed-1'), ctx);
    const body = expected.slice(1);
    const bomOf = async file => { const b = new Uint8Array(await file.arrayBuffer()); return b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF; };
    let shared = null;
    navigator.canShare = () => true;
    navigator.share = async (data) => { const file = data.files[0]; shared = { text: await file.text(), bom: await bomOf(file) }; };
    document.querySelector('#entry-file').click();
    for (let i = 0; i < 20 && shared == null; i++) await new Promise(r => setTimeout(r, 20));
    navigator.canShare = () => false;
    let downloaded = null;
    const prev = URL.createObjectURL;
    URL.createObjectURL = b => { downloaded = b; return 'blob:entry-export'; };
    document.querySelector('#entry-file').click();
    const downloadText = downloaded ? await downloaded.text() : '';
    const downloadBom = downloaded ? await bomOf(downloaded) : false;
    URL.createObjectURL = prev;
    return { body, shared, downloadText, downloadBom, hidden, bom: expected.charCodeAt(0) === 0xFEFF };
  })()`);
  check('site entry CSV share and download omit hidden money', siteFile && siteFile.hidden === null && siteFile.bom && siteFile.shared && siteFile.shared.bom && siteFile.downloadBom && siteFile.shared.text === siteFile.body && siteFile.downloadText === siteFile.body && siteFile.body.includes('8,200,000') && siteFile.body.includes('أجور') && !siteFile.body.includes('11,200,000') && !siteFile.body.includes('contractAmount') && !siteFile.body.includes('40,000,000'));
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 2, mobile: false });
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await sleep(150);
  check('site print stylesheet hides the app', await ev(`getComputedStyle(document.querySelector('#print-root')).display === 'block' && getComputedStyle(document.querySelector('#app')).display === 'none' && !(document.querySelector('#print-root').textContent || '').includes('11,200,000')`));
  check('site print keeps the Baghdad clock in order', await ev(`(() => { const row = [...document.querySelectorAll('#print-root tr')].find(tr => tr.textContent.includes('وقت التسجيل')); const cell = row && row.querySelector('td'); const dateRow = [...document.querySelectorAll('#print-root tr')].find(tr => tr.textContent.includes('تاريخ القيد')); const date = dateRow && dateRow.querySelector('td').textContent.trim(); return !!cell && cell.textContent.trim() === '12:00:06' && date === '2026-10-06' && cell.dir === 'ltr' && getComputedStyle(cell).direction === 'ltr' && !(document.querySelector('#print-root').textContent || '').includes('2026-10-01'); })()`));
  await shotOf('print-layout-site.png');
  await send('Emulation.setEmulatedMedia', { media: 'screen' });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await ev(`location.hash='#detail/seed-1'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  const hiddenIncome = await ev(`document.querySelector('#main').innerText`);
  check('site cannot open another user income entry', hiddenIncome.includes('القيد غير متاح') && !hiddenIncome.includes('40,000,000') && !hiddenIncome.includes('دفعة أولى'));
  check('hidden entry has no export buttons', await ev(`!document.querySelector('#entry-print') && !document.querySelector('#entry-pdf') && !document.querySelector('#entry-file')`));
  await ev(`location.hash='#project/p-school'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  const revTap = await ev(`(()=>{window.prompt=()=>null; const before=location.hash; const btn=document.querySelector('[data-rev]'); if(!btn||btn.closest('a')) return 'nested-or-missing'; btn.click(); return location.hash===before && !location.hash.startsWith('#detail/') ? 'stayed' : location.hash})()`);
  check('reverse click does not open details', revTap === 'stayed');
  const revDone = await ev(`(()=>{window.prompt=()=>'خطأ في الإدخال'; const before=location.hash; const n=(AJ.get('entries')||[]).length; const btn=document.querySelector('[data-rev]'); btn.click(); const rows=AJ.get('entries')||[]; const added=rows.length===n+1; const last=rows[rows.length-1]; return before===location.hash && !location.hash.startsWith('#detail/') && added && last.isReversal===true && last.createdByName==='أحمد'})()`);
  check('reverse still writes a reversal in the recorder name', revDone === true);
  await ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  await ev(`document.querySelector('[data-add="1000"]').click(); 1`);
  await ev(`document.querySelector('#party').value=${JSON.stringify('<img src=x onerror=alert(1)>')}; document.querySelector('#desc').value=${JSON.stringify('<script>alert(1)</script>')}; document.querySelector('#save').click(); 1`);
  await ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.partyName==='<img src=x onerror=alert(1)>'); location.hash='#detail/'+e.id; return 1})()`);
  await sleep(150);
  const xss = await ev(`({img:!!document.querySelector('#main img'), script:!!document.querySelector('#main script'), html:document.querySelector('#main').innerHTML, text:document.querySelector('#main').innerText})`);
  check('details escape payee and description', xss.img === false && xss.script === false && !xss.html.includes('<img') && !xss.html.includes('<script') && xss.text.includes('<img') && xss.text.includes('alert(1)'));
  await ev(`document.querySelector('#role').value='owner'; location.hash='#person/u-ahmed'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  await ev(`document.querySelector('[data-assign="p-road"]').checked=false; document.querySelector('[data-assign="p-market"]').checked=true; document.querySelector('#person-name').value='أحمد الموقع'; document.querySelector('#save-person').click(); 1`);
  await sleep(250);
  check('editing a person stores the name and exactly the checked projects', await ev(`(()=>{const u=AJ.get('users').find(x=>x.uid==='u-ahmed'); const ids=(u.assignedProjectIds||[]).slice().sort().join(); return location.hash==='#people' && u.displayName==='أحمد الموقع' && u.active===true && u.role==='site' && ids==='p-market,p-school'})()`));
  await ev(`location.hash='#person'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const hostile = '<img src=x onerror=alert(1)>';
  await ev(`document.querySelector('#person-uid').value='u-new'; document.querySelector('#person-name').value=${JSON.stringify(hostile)}; document.querySelector('#person-email').value='new@example.invalid'; document.querySelector('#person-role').value='owner'; document.querySelector('#person-active').checked=false; document.querySelector('[data-assign="p-school"]').checked=true; document.querySelector('#save-person').click(); 1`);
  await sleep(250);
  const made = await ev(`(()=>{const u=AJ.get('users').find(x=>x.uid==='u-new'); const html=document.querySelector('#main').innerHTML; return {ok:!!u && u.role==='owner' && u.active===false && u.assignedProjectIds.join()==='p-school' && u.displayName===${JSON.stringify(hostile)}, img:!!document.querySelector('#main img'), raw:html.includes('<img'), text:document.querySelector('#main').innerText.includes('<img')}})()`);
  check('a new person is stored and the name is escaped', made.ok && made.img === false && made.raw === false && made.text === true);
  await ev(`document.querySelector('#role').value='site'; location.hash='#projects'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  const siteProjects = await ev(`({text:document.querySelector('#main').innerText, tab:!!document.querySelector('[data-tab="people"]')})`);
  check('site sees exactly the projects assigned in the owner screen', siteProjects.text.includes('مشروع المدرسة') && siteProjects.text.includes('بناية السوق') && !siteProjects.text.includes('مشروع الطريق') && siteProjects.tab === false);
  await ev(`location.hash='#people'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  check('site person screen does not list people', await ev(`document.querySelector('#main').innerText.includes('هذه الشاشة للمالك') && !document.querySelector('#person-uid') && !document.querySelector('[data-assign]')`));
  await ev(`document.querySelector('#role').value='owner'; location.hash='#project/p-school'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  await ev(`document.querySelector('#contract').value='1234567'; document.querySelector('#save-contract').click(); 1`);
  await sleep(200);
  check('owner save stores the contract away from the project', await ev(`(()=>{const p=AJ.get('projects').find(x=>x.id==='p-school'); const f=(AJ.get('projectFinance')||{})['p-school']; return !!p && !('contractAmount' in p) && f.contractAmount===1234567 && f.pending===true && (AJ.get('outbox')||[]).includes('p-school') && document.querySelector('#main').innerText.includes('1,234,567')})()`));
  await ev(`document.querySelector('#role').value='site'; location.hash='#project/p-school'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  const hiddenContract = await ev(`document.querySelector('#main').innerText`);
  check('site project still has no contract after the owner save', !hiddenContract.includes('قيمة العقد') && !hiddenContract.includes('1,234,567') && !hiddenContract.includes('60,000,000') && await ev(`!document.querySelector('#contract')`));
  await go(`${BASE}index.html?role=owner#entry`);
  const keptForm = await ev(`(()=>{
    document.querySelector('#desc').value = 'ملاحظة لا تُمسح';
    document.querySelector('#party').value = 'جهة لا تُمسح';
    document.querySelector('#amt').value = '٧';
    dispatchEvent(new Event('offline'));
    dispatchEvent(new Event('online'));
    const pill = document.querySelector('[data-type="labour"]');
    if (pill) pill.click();
    const desc = document.querySelector('#desc');
    const party = document.querySelector('#party');
    const amt = document.querySelector('#amt');
    return { desc: desc && desc.value, party: party && party.value, amt: amt && amt.value };
  })()`);
  check('note, party, and amount survive online, offline, and a re-render', keptForm && keptForm.desc === 'ملاحظة لا تُمسح' && keptForm.party === 'جهة لا تُمسح' && keptForm.amt === '٧');
  const attempt = async raw => ev(`(()=>{
    const before = (AJ.get('entries') || []).length;
    const amt = document.querySelector('#amt');
    amt.value = ${JSON.stringify(raw)};
    document.querySelector('#desc').value = 'amount-case';
    document.querySelector('#save').click();
    const entries = AJ.get('entries') || [];
    const msg = (document.querySelector('#msg') && document.querySelector('#msg').innerText) || '';
    const added = entries.length - before;
    const last = added ? entries[entries.length - 1] : null;
    return { added, msg, amount: last && last.amount, desc: last && last.description };
  })()`);
  const neg = await attempt('-3');
  check('amount -3 is rejected and not stored as 3', neg.added === 0 && /صحيحاً/.test(neg.msg));
  const frac = await attempt('1.5');
  check('amount 1.5 is rejected and not stored as 15', frac.added === 0 && /صحيحاً/.test(frac.msg));
  const comma = await attempt('2,5');
  check('amount 2,5 is rejected and not stored as 25', comma.added === 0 && /صحيحاً/.test(comma.msg));
  const indic = await attempt('٧');
  check('Arabic-Indic ٧ is saved as 7', indic.added === 1 && indic.amount === 7);
  const ceiling = await attempt('10000000000');
  check('the rules ceiling 10000000000 is accepted', ceiling.added === 1 && ceiling.amount === 10000000000);
  const over = await attempt('10000000001');
  check('amount above 10000000000 is rejected with the ceiling', over.added === 0 && /10,000,000,000/.test(over.msg));
  const huge = await attempt('99999999999999999999');
  check('a 20-digit amount is rejected and not stored as 1e20', huge.added === 0 && /10,000,000,000/.test(huge.msg));
  const partyLimit = await ev(`(()=>{
    const el = document.querySelector('#party');
    el.value = 'ا'.repeat(el.maxLength);
    el.setSelectionRange(el.value.length, el.value.length);
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, data: 'ز', inputType: 'insertText' }));
    return (document.querySelector('#msg') && document.querySelector('#msg').textContent) || '';
  })()`);
  check('an over-long party name shows a limit message', /100/.test(partyLimit));
  const nameLimit = await ev(`(()=>{
    const role = document.querySelector('#role');
    role.value = 'owner';
    role.dispatchEvent(new Event('change'));
    location.hash = '#person';
    dispatchEvent(new HashChangeEvent('hashchange'));
    const el = document.querySelector('#person-name');
    if (!el) return 'missing';
    el.focus();
    el.value = 'ن'.repeat(el.maxLength);
    el.setSelectionRange(el.value.length, el.value.length);
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, data: 'ا', inputType: 'insertText' }));
    return (document.querySelector('#person-msg') && document.querySelector('#person-msg').textContent) || 'empty';
  })()`);
  check('an over-long person name shows a limit message', /80/.test(nameLimit || ''));
  const wide = await ev(`(()=>{
    const who = document.querySelector('#who');
    who.textContent = 'مستخدم موقع · ' + 'و'.repeat(80);
    const wrap = getComputedStyle(who).overflowWrap;
    const hz = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return { wrap, hz };
  })()`);
  check('an 80-character name without spaces does not widen the page', wide && wide.hz === false && (wide.wrap === 'anywhere' || wide.wrap === 'break-word'));
  const listView = async (role, projectId, limit = 50) => ev(`(()=>{
    const u = (AJ.get('users') || []).find(x => x.uid === ${JSON.stringify(role === 'site' ? 'u-ahmed' : 'u-ameer')});
    const ctx = { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY };
    const list = Ledger.projectEntryList(u, ${JSON.stringify(projectId)}, ctx, { limit: ${Number(limit) || 50} });
    const text = (document.querySelector('#main') && document.querySelector('#main').innerText) || '';
    const html = (document.querySelector('#main') && document.querySelector('#main').innerHTML) || '';
    const rows = [...document.querySelectorAll('#entry-list a.entry-open')];
    const ids = rows.map(a => (a.getAttribute('href') || '').replace('#detail/', ''));
    const fields = !!list && rows.length === list.rows.length && list.rows.every((row, i) => {
      const t = rows[i].innerText;
      return t.includes(row.type) && t.includes(row.amount) && t.includes(row.entryDate) && t.includes(row.recorder) && t.includes(row.party) && (!row.reversalStatus || t.includes(row.reversalStatus));
    });
    return {
      same: !!list && ids.join('|') === list.rows.map(r => r.id).join('|'),
      fields, reads: list && list.reads, total: list && list.total, n: rows.length,
      keys: !!list && list.rows.every(r => Object.keys(r).join(',') === 'id,type,amount,entryDate,recorder,party,reversalStatus'),
      text, html, more: !!document.querySelector('#more-entries'),
      hz: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      hash: location.hash, tab: document.querySelector('.tabs a.on') && document.querySelector('.tabs a.on').dataset.tab,
    };
  })()`);
  await ev(`document.querySelector('#role').value='owner'; location.hash='#project/p-school'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  check('owner project screen has the all-entries button', await ev(`(()=>{const a=document.querySelector('#all-entries'); return !!a && a.textContent==='عرض جميع القيود' && a.getAttribute('href')==='#entries/p-school'})()`));
  await ev(`document.querySelector('#all-entries').click(); 1`);
  await sleep(200);
  const ownerEntries = await listView('owner', 'p-school');
  check('owner list is this project, newest first, from memory', ownerEntries && ownerEntries.same && ownerEntries.fields && ownerEntries.keys && ownerEntries.reads === 0 && ownerEntries.total > 0 && ownerEntries.n === ownerEntries.total && ownerEntries.more === false && ownerEntries.hash === '#entries/p-school' && ownerEntries.tab === 'projects' && ownerEntries.text.includes('قيد عكسي') && ownerEntries.text.includes('معكوس') && ownerEntries.text.includes('40,000,000') && !ownerEntries.text.includes('بناية السوق') && !ownerEntries.text.includes('6,800,000') && !ownerEntries.text.includes('قيمة العقد') && !ownerEntries.text.includes('60,000,000') && !ownerEntries.html.includes('contractAmount') && ownerEntries.hz === false);
  await shotOf('owner-all-entries.png');
  const ownerHref = await ev(`(()=>{const a=document.querySelector('#entry-list a.entry-open'); if(!a) return ''; a.click(); return a.getAttribute('href')||''; })()`);
  await sleep(200);
  check('tapping a listed entry opens its details', await ev(`location.hash===${JSON.stringify(ownerHref)} && location.hash.startsWith('#detail/') && !!document.querySelector('#entry-print') && !!document.querySelector('#entry-pdf') && !!document.querySelector('#entry-file')`));
  await ev(`document.querySelector('#back').click(); 1`);
  await sleep(200);
  check('details back returns to the project list', await ev(`location.hash==='#entries/p-school' && !!document.querySelector('#entry-list')`));
  check('project list works offline from the cache', await ev(`navigator.onLine===false && (document.querySelector('#entry-list').innerText||'').includes('كل القيود')`));
  await ev(`document.querySelector('#role').value='site'; location.hash='#project/p-school'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  check('site project screen has the all-entries button', await ev(`(()=>{const a=document.querySelector('#all-entries'); return !!a && a.textContent==='عرض جميع القيود' && !document.querySelector('#main').innerText.includes('قيمة العقد')})()`));
  await ev(`document.querySelector('#all-entries').click(); 1`);
  await sleep(200);
  const siteEntries = await listView('site', 'p-school');
  const siteBanned = ['ربح', 'المقبوض', 'خسارة', 'قيمة العقد', 'contractAmount', 'projectFinance', '60,000,000', '40,000,000 د.ع', '10,000,000 د.ع', '11,200,000', '6,800,000', 'بناية السوق', 'دفعة عميل'];
  check('site list shows only allowed project entries', siteEntries && siteEntries.same && siteEntries.fields && siteEntries.keys && siteEntries.reads === 0 && siteEntries.more === false && siteEntries.text.includes('30,000,000') && siteEntries.text.includes('معكوس') && siteEntries.text.includes('قيد عكسي') && siteBanned.every(w => !siteEntries.text.includes(w) && !siteEntries.html.includes(w)) && siteEntries.hz === false);
  await shotOf('site-all-entries.png');
  const siteHref = await ev(`(()=>{const row=[...document.querySelectorAll('#entry-list a.entry-open')].find(a=>a.innerText.includes('30,000,000')); if(!row) return ''; row.click(); return row.getAttribute('href')||''; })()`);
  await sleep(200);
  check('tapping a site row opens details without forbidden money', await ev(`(()=>{const text=document.querySelector('#main').innerText; return location.hash===${JSON.stringify(siteHref)} && location.hash.startsWith('#detail/') && text.includes('30,000,000') && text.includes('أمير') && !!document.querySelector('#entry-print') && !/ربح|المقبوض|خسارة/.test(text) && !text.includes('40,000,000') && !text.includes('قيمة العقد'); })()`));
  await ev(`location.hash='#entries/p-market'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  const siteMarket = await listView('site', 'p-market');
  check('site market list shows the expense and hides the client payment', siteMarket && siteMarket.same && siteMarket.text.includes('6,800,000') && siteMarket.text.includes('مقاول') && !siteMarket.text.includes('6,000,000') && !siteMarket.text.includes('دفعة عميل') && !/ربح|المقبوض|خسارة|قيمة العقد/.test(siteMarket.text));
  await ev(`location.hash='#entries/p-road'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  check('site cannot list a project that was unassigned', await ev(`document.querySelector('#main').innerText.includes('المشروع غير متاح') && !document.querySelector('#entry-list') && !document.querySelector('#main').innerText.includes('2,000,000') && !document.querySelector('#main').innerText.includes('11,200,000') && !document.querySelector('#main').innerText.includes('8,200,000')`));
  await ev(`document.querySelector('#back-project').click(); 1`);
  await sleep(100);
  check('list back from a hidden project returns to projects', await ev(`location.hash==='#projects'`));
  await ev(`document.querySelector('#role').value='owner'; location.hash='#projects'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  const emptyId = await ev(`(()=>{ window.prompt=(q)=>String(q).includes('زبون')?'زبون فارغ':'مشروع فارغ'; document.querySelector('#newproj').click(); const card=[...document.querySelectorAll('a.proj')].find(a=>a.innerText.includes('مشروع فارغ')); if(!card) return ''; const id=(card.getAttribute('href')||'').replace('#project/',''); location.hash='#entries/'+id; dispatchEvent(new HashChangeEvent('hashchange')); return id; })()`);
  await sleep(150);
  check('a project with no entries shows an empty list', await ev(`(()=>{const text=document.querySelector('#main').innerText; const title=document.querySelector('#title').textContent; return ${JSON.stringify(emptyId)} && location.hash==='#entries/'+${JSON.stringify(emptyId)} && text.includes('لا توجد قيود لهذا المشروع') && title.includes('مشروع فارغ') && !document.querySelector('#more-entries') && !document.querySelector('#entry-list a.entry-open')})()`));
  await shotOf('empty-all-entries.png');
  const wrote = await ev(`(async () => { try {
    const base = 9000000000000000;
    await new Promise((resolve, reject) => {
      const q = indexedDB.open('aj-p0');
      q.onerror = () => reject(q.error || new Error('idb'));
      q.onsuccess = () => {
        const d = q.result;
        const tx = d.transaction('entries', 'readwrite');
        const st = tx.objectStore('entries');
        const img = '<img src=x onerror=alert(1)>';
        st.put({ id: 'bulk-img', projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 4242, currency: 'IQD', entryDate: '2026-11-04', description: 'جملة', partyName: img, isReversal: false, createdAtDevice: base + 2000, createdAtServer: base + 2000, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'bulk' });
        for (let i = 0; i < 80; i++) st.put({ id: 'bulk-' + i, projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 3000 + i, currency: 'IQD', entryDate: '2026-11-01', description: 'جملة', partyName: 'مورّد ' + i, isReversal: false, createdAtDevice: base + i, createdAtServer: base + i, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'bulk' });
        for (let i = 0; i < 5; i++) st.put({ id: 'bulk-pay-' + i, projectId: 'p-school', direction: 'income', entryType: 'clientPayment', amount: 777777, currency: 'IQD', entryDate: '2026-11-02', description: 'دفعة مخفية', partyName: 'زبون', isReversal: false, createdAtDevice: base + 1000 + i, createdAtServer: base + 1000 + i, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'bulk' });
        st.put({ id: 'bulk-other', projectId: 'p-market', direction: 'expense', entryType: 'materials', amount: 654321, currency: 'IQD', entryDate: '2026-11-03', description: 'سوق', partyName: 'آخر', isReversal: false, createdAtDevice: base + 5000, createdAtServer: base + 5000, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'bulk' });
        tx.oncomplete = () => { d.close(); resolve(1); };
        tx.onerror = () => reject(tx.error);
      };
    });
    return 'ok';
  } catch (e) { return String(e && e.message || e); } })()`);
  check('many entries are stored in the local cache', wrote === 'ok');
  await ev(`location.hash='#entries/p-school'; 1`);
  await send('Page.reload', { ignoreCache: false });
  await sleep(1500);
  for (let i = 0; i < 40 && !(await ev(`document.body && document.body.dataset.ready==='1' && location.hash.indexOf('#entries/p-school')===0`)); i++) await sleep(150);
  const paged = await listView('owner', 'p-school');
  check('a large project pages 50 rows and stays offline', paged && paged.same && paged.fields && paged.n === 50 && paged.total > 50 && paged.more === true && paged.reads === 0 && paged.text.includes('50 من ' + paged.total) && paged.text.includes('777,777') && paged.text.includes('4,242') && !paged.text.includes('654,321') && !paged.html.includes('<img') && paged.text.includes('<img') && await ev(`navigator.onLine===false`));
  await ev(`document.querySelector('#role').value='site'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  const sitePage = await listView('site', 'p-school');
  check('site page hides other client payments while paging', sitePage && sitePage.same && sitePage.n === 50 && sitePage.more === true && sitePage.reads === 0 && !sitePage.text.includes('777,777') && !sitePage.text.includes('40,000,000') && !sitePage.text.includes('654,321') && !sitePage.text.includes('قيمة العقد') && !/ربح|المقبوض|خسارة/.test(sitePage.text));
  await ev(`(()=>{ let i=0; while (document.querySelector('#more-entries') && i<20) { document.querySelector('#more-entries').click(); i++; } return i; })()`);
  await sleep(200);
  const siteAll = await listView('site', 'p-school', 1000);
  check('المزيد reveals the rest of the site list without forbidden amounts', siteAll && siteAll.same && siteAll.n === siteAll.total && siteAll.total > 50 && siteAll.more === false && siteAll.text.includes('30,000,000') && siteAll.text.includes('معكوس') && !siteAll.text.includes('777,777') && !siteAll.text.includes('40,000,000') && !siteAll.text.includes('10,000,000 د.ع') && !siteAll.text.includes('654,321') && !siteAll.html.includes('contractAmount') && !/ربح|المقبوض|خسارة|قيمة العقد/.test(siteAll.text));
  await ev(`document.querySelector('#role').value='owner'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await ev(`(()=>{ let i=0; while (document.querySelector('#more-entries') && i<20) { document.querySelector('#more-entries').click(); i++; } return i; })()`);
  await sleep(200);
  const ownerAll = await listView('owner', 'p-school', 1000);
  check('owner المزيد keeps the other project out and shows the client payments', ownerAll && ownerAll.same && ownerAll.n === ownerAll.total && ownerAll.more === false && ownerAll.text.includes('777,777') && ownerAll.text.includes('40,000,000') && !ownerAll.text.includes('654,321') && !ownerAll.text.includes('بناية السوق') && !ownerAll.text.includes('قيمة العقد'));
  const p = results.filter(r => r[1]).length; console.log(`browser checks: ${p}/${results.length} passed`);
  ws.close(); chrome.kill(); process.exit(p === results.length ? 0 : 1);
})().catch(e => { console.error(e); if (chrome) chrome.kill(); process.exit(2); });
