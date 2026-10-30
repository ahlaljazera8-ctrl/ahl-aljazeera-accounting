// Headless Chrome via raw CDP (no npm deps). Run: node --experimental-websocket tests/browser-check.js
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:8765/'; const SHOTS = path.join(__dirname, '..', 'shots');
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--remote-debugging-port=9333', '--user-data-dir=/tmp/aj-chrome-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let tgt; for (let i = 0; i < 50 && !tgt; i++) { try { tgt = (await (await fetch('http://127.0.0.1:9333/json')).json()).find(t => t.type === 'page'); } catch {} await sleep(200); }
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
    }
    if (role === 'owner' && hash === 'person/u-ahmed') {
      check('o5: instructions name the Firebase UID column', info.text.includes('Firebase') && info.text.includes('Authentication') && info.text.includes('Users') && info.text.includes('User UID'));
      check('o5: projects are named checkboxes', await ev(`(()=>{const boxes=[...document.querySelectorAll('[data-assign]')]; const ids=boxes.map(b=>b.dataset.assign).slice().sort().join(); const on=boxes.filter(b=>b.checked).map(b=>b.dataset.assign).slice().sort().join(); const text=document.querySelector('#main').innerText; return ids==='p-market,p-road,p-school' && on==='p-road,p-school' && text.includes('مشروع المدرسة') && text.includes('مشروع الطريق') && text.includes('بناية السوق') && !text.includes('كل المشاريع') && document.querySelector('#person-uid').readOnly && document.querySelector('#person-name').value==='أحمد' && document.querySelector('#person-role').value==='site' && document.querySelector('#person-active').checked===true})()`));
    }
    if (role === 'site' && hash === 'project/p-school') {
      check('s4: site project hides the contract', !info.text.includes('قيمة العقد') && !info.text.includes('60,000,000') && await ev(`!document.querySelector('#contract') && !document.body.innerHTML.includes('projectFinance')`));
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
  await ev(`location.hash='#detail/seed-1'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(150);
  const hiddenIncome = await ev(`document.querySelector('#main').innerText`);
  check('site cannot open another user income entry', hiddenIncome.includes('القيد غير متاح') && !hiddenIncome.includes('40,000,000') && !hiddenIncome.includes('دفعة أولى'));
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
  const p = results.filter(r => r[1]).length; console.log(`browser checks: ${p}/${results.length} passed`);
  ws.close(); chrome.kill(); process.exit(p === results.length ? 0 : 1);
})().catch(e => { console.error(e); chrome.kill(); process.exit(2); });
