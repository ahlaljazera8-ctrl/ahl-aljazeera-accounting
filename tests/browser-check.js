// Headless Chrome via raw CDP (no npm deps). Run: node --experimental-websocket tests/browser-check.js
const fs = require('fs'); const path = require('path');
const { openChrome } = require('./chrome-debug.js');
const BASE = 'http://127.0.0.1:8765/'; const SHOTS = path.join(__dirname, '..', 'shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chrome;
(async () => {
  const opened = await openChrome({ userDataDir: '/tmp/aj-chrome-' + Date.now() });
  chrome = opened.chrome;
  const tgt = opened.page;
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
    if (role === 'site' && hash === 'entry') check('s2: site entry offers مقاول and hides agreed amounts', ['مصروف','مواد','عمالة/سلفة','مقاول','دفعة عميل'].every(t => info.text.includes(t)) && !info.text.includes('المتفق عليه') && !info.text.includes('المتبقي'));
    if (role === 'site') check(`${name}: reverse buttons only on own non-reversed entries`, await ev(`(()=>{const es=AJ.get('entries');const bs=[...document.querySelectorAll('[data-rev]')].map(b=>b.dataset.rev);return bs.every(id=>{const e=es.find(x=>x.id===id);return e.createdBy==='u-ahmed'&&!e.isReversal&&!es.some(x=>x.reversesEntryId===id)})&&(location.hash!=='#project/p-school'||bs.length>0)})()`));
    if (role === 'site' && hash === 'home') check('s1: own client payment listed', /دفعة عميل/.test(info.text));
    if (role === 'site' && hash === 'projects') {
      check('s3: only assigned projects', !info.text.includes('بناية السوق') && info.text.includes('مشروع المدرسة'));
      check('s3: site has no archived filter', !info.text.includes('المؤرشفة') && !info.text.includes('استعادة') && !info.text.includes('أرشفة') && await ev(`!document.querySelector('#project-filter')`));
    }
    if (role === 'owner' && hash === 'entry') check('o2: all 5 types offered', ['مصروف','مواد','عمالة/سلفة','مقاول','دفعة عميل'].every(t => info.text.includes(t)));
    if (hash === 'entry') check(name + ': payee input', info.text.includes('الجهة المستلمة / المورّد (اختياري)') && await ev(`(()=>{const el=document.querySelector('#party');return !!el && el.maxLength===100})()`));
    if (role === 'owner' && hash === 'project/p-school') {
      check('o4: rows show the recorder name', info.text.includes('أمير'));
      check('o4: old entry without a name shows a dash', await ev(`(()=>{const row=[...document.querySelectorAll('.entry')].find(el=>el.innerText.includes('إدخال خاطئ')&&!el.innerText.includes('تصحيح'));return !!row&&row.innerText.includes('—')&&!row.innerText.includes('أحمد')})()`));
      check('o4: owner project shows the contract value', info.text.includes('قيمة العقد') && info.text.includes('60,000,000') && await ev(`document.querySelector('#contract') && document.querySelector('#contract').value==='60000000'`));
      check('o4: all-entries option on the project', info.text.includes('عرض جميع القيود') && await ev(`document.querySelector('#all-entries') && document.querySelector('#all-entries').getAttribute('href')==='#entries/p-school'`));
      check('o4: archive sits below the new-entry button', await ev(`(()=>{const entry=[...document.querySelectorAll('a.btn')].find(a=>a.textContent.includes('قيد لهذا المشروع'));const manage=document.querySelector('#project-manage');if(!entry||!manage)return false;const gap=manage.getBoundingClientRect().top-entry.getBoundingClientRect().bottom;const border=parseFloat(getComputedStyle(manage).borderTopWidth)||0;const text=manage.innerText||'';return gap>=40&&border>=1&&text.includes('إدارة المشروع')&&text.includes('أرشفة المشروع')&&!manage.innerText.includes('قيد لهذا المشروع')})()`));
    }
    if (role === 'owner' && hash === 'person/u-ahmed') {
      check('o5: instructions name the Firebase UID column', info.text.includes('Firebase') && info.text.includes('Authentication') && info.text.includes('Users') && info.text.includes('User UID'));
      check('o5: projects are named checkboxes', await ev(`(()=>{const boxes=[...document.querySelectorAll('[data-assign]')]; const ids=boxes.map(b=>b.dataset.assign).slice().sort().join(); const on=boxes.filter(b=>b.checked).map(b=>b.dataset.assign).slice().sort().join(); const text=document.querySelector('#main').innerText; return ids==='p-market,p-road,p-school' && on==='p-road,p-school' && text.includes('مشروع المدرسة') && text.includes('مشروع الطريق') && text.includes('بناية السوق') && !text.includes('كل المشاريع') && document.querySelector('#person-uid').readOnly && document.querySelector('#person-name').value==='أحمد' && document.querySelector('#person-role').value==='site' && document.querySelector('#person-active').checked===true})()`));
    }
    if (role === 'site' && hash === 'project/p-school') {
      check('s4: site project hides the contract', !info.text.includes('قيمة العقد') && !info.text.includes('60,000,000') && await ev(`!document.querySelector('#contract') && !document.body.innerHTML.includes('projectFinance')`));
      check('s4: all-entries option on the project', info.text.includes('عرض جميع القيود') && await ev(`document.querySelector('#all-entries') && document.querySelector('#all-entries').getAttribute('href')==='#entries/p-school'`));
      check('s4: site has no project management', !info.text.includes('إدارة المشروع') && !info.text.includes('أرشفة') && await ev(`!document.querySelector('#project-manage') && !document.querySelector('#archive-project')`));
    }
    if (role === 'site' && hash === 'home') check('s1: own rows show the recorder', info.text.includes('أحمد'));
    if (role === 'owner' && hash === 'home') check('o1: totals shown', /صافي الربح/.test(info.text));
    if (hash === 'home') check(name + ': home card is only the connection pill', await ev(`(()=>{
      const card = document.querySelector('#main .card');
      const pill = card && card.querySelector('.pill');
      const n = (AJ.get('outbox') || []).length;
      const mainText = document.querySelector('#main').innerText;
      const btn = document.querySelector('#outbox');
      if (btn.getAttribute('aria-expanded') !== 'true') btn.click();
      const panel = document.querySelector('#bell-panel');
      const text = panel.innerText;
      const visible = panel.hidden === false && panel.getBoundingClientRect().height > 0;
      btn.click();
      return pill && pill.textContent === 'متصل (محاكاة)'
        && card.innerText.trim() === 'متصل (محاكاة)'
        && !mainText.includes('قيود محفوظة على الهاتف')
        && !mainText.includes('يُرسل تلقائياً')
        && text.includes(n + ' قيود محفوظة على الهاتف')
        && text.includes('لم تُرسل بعد. اضغط «إرسال الآن» للمحاكاة (لا يوجد خادم حقيقي).')
        && visible
        && text.split('متصل').length === 2;
    })()`));
  }
  await go(`${BASE}index.html?role=owner#project/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(300);
  const subScreen = await ev(`(()=>{
    const text = document.querySelector('#main').innerText;
    const bars = [...document.querySelectorAll('[data-bar]')].map(el => ({ id: el.getAttribute('data-bar'), over: el.classList.contains('over'), width: (el.querySelector('i') || {}).style.width }));
    const cards = [...document.querySelectorAll('a.card.proj')];
    const badged = cards.filter(c => c.innerText.includes('مسدّد بالكامل')).map(c => (c.querySelector('h2') || {}).textContent);
    const linkish = [...document.querySelectorAll('#main button, #main a')].filter(el => /ربط/.test(el.textContent || ''));
    const stored = (AJ.get('subcontracts') || []).map(s => Object.keys(s).slice().sort().join(','));
    const terms = AJ.get('subcontractTerms') || {};
    const noor = terms['sc-noor'] || {};
    return {
      rtl: document.documentElement.dir,
      width: window.innerWidth,
      hz: document.documentElement.scrollWidth > window.innerWidth,
      text,
      bars, badged, links: linkish.length, stored,
      noorKeys: Object.keys(noor).slice().sort().join(','),
      section: !!document.querySelector('#subcontracts'),
    };
  })()`);
  check('subcontracts: project section for the owner', subScreen && subScreen.section && subScreen.text.includes('المقاولون') && subScreen.text.includes('ورشة الحدادة') && subScreen.text.includes('شركة النور للبناء') && subScreen.text.includes('مقاول الكهرباء') && subScreen.text.includes('+ عقد مقاول'));
  check('subcontracts: agreed, paid, and remaining are on the project', subScreen && subScreen.text.includes('4,000,000') && subScreen.text.includes('1,500,000') && subScreen.text.includes('2,500,000') && subScreen.text.includes('3,000,000') && subScreen.text.includes('3,200,000') && subScreen.text.includes(await ev(`Ledger.fmt(-200000)`)));
  check('subcontracts: bars match the paid ratio and clamp the overpayment', subScreen && JSON.stringify(subScreen.bars) === JSON.stringify([{id:'sc-hadaada',over:false,width:'37.5%'},{id:'sc-noor',over:false,width:'100%'},{id:'sc-kahraba',over:true,width:'100%'}]));
  check('subcontracts: fully paid badge is only on Noor and is not stored', subScreen && JSON.stringify(subScreen.badged) === JSON.stringify(['شركة النور للبناء']) && subScreen.noorKeys === 'originalAmount' && subScreen.stored.every(keys => !keys.includes('paid') && !keys.includes('remaining') && !keys.includes('originalAmount')));
  check('subcontracts: project has no link control', subScreen && subScreen.links === 0 && !subScreen.text.includes('ربط'));
  check('subcontracts: project rtl, 390px, no overflow', subScreen && subScreen.rtl === 'rtl' && subScreen.width === 390 && subScreen.hz === false);
  fs.mkdirSync('/opt/cursor/artifacts/screenshots', { recursive: true });
  const ownerShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync('/opt/cursor/artifacts/screenshots/owner-subcontracts.png', Buffer.from(ownerShot.result.data, 'base64'));
  fs.writeFileSync(path.join(SHOTS, 'owner-subcontracts.png'), Buffer.from(ownerShot.result.data, 'base64'));
  await go(`${BASE}index.html?role=owner#sub/sc-kahraba`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(300);
  const detail = await ev(`(()=>{
    const text = document.querySelector('#main').innerText;
    const paid = [...document.querySelectorAll('.kv')].find(el => (el.innerText || '').includes('المدفوع'));
    const unlinked = document.querySelector('#unlinked');
    return {
      title: document.querySelector('#title').textContent,
      text,
      paid: paid ? paid.innerText : '',
      unlinked: unlinked ? unlinked.innerText : '',
      buttons: unlinked ? unlinked.querySelectorAll('button, a').length : -1,
      rtl: document.documentElement.dir,
      width: window.innerWidth,
      hz: document.documentElement.scrollWidth > window.innerWidth,
      warn: !!document.querySelector('.warnbox'),
    };
  })()`);
  check('subcontracts: electricity detail shows agreed 3,000,000 and paid 3,200,000', detail && detail.title === 'مقاول الكهرباء' && detail.text.includes('3,000,000') && detail.paid.includes('3,200,000') && !detail.paid.includes('7,200,000'));
  check('subcontracts: overpayment warns and names the extra 200,000', detail && detail.warn && detail.text.includes('تنبيه فقط') && detail.text.includes('لا يمنع') && detail.text.includes('200,000'));
  check('subcontracts: dated amendment is listed and old entry stays unlinked', detail && detail.text.includes('2026-10-18') && detail.text.includes('نقطة إنارة إضافية') && detail.text.includes('لا يُعدَّل صف ولا يُحذف') && detail.unlinked.includes('غير مرتبط') && detail.unlinked.includes('7,200,000') && detail.unlinked.includes('مقاول كهرباء'));
  check('subcontracts: unlinked row has no link control', detail && detail.buttons === 0 && !detail.text.includes('ربط'));
  check('subcontracts: detail rtl, 390px, no overflow', detail && detail.rtl === 'rtl' && detail.width === 390 && detail.hz === false);
  await go(`${BASE}index.html?role=owner#entry/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  await ev(`document.querySelector('[data-type="subcontractor"]').click(); 1`);
  await sleep(200);
  const picker = await ev(`(()=>{
    const sel = document.querySelector('#subcontract');
    const names = sel ? [...sel.options].map(o => o.textContent) : [];
    const digits = names.some(n => /[0-9٠-٩]/.test(n));
    return { names, digits, party: !!document.querySelector('#party'), rtl: document.documentElement.dir, width: window.innerWidth, hz: document.documentElement.scrollWidth > window.innerWidth };
  })()`);
  check('subcontracts: owner payment replaces the free-text name with this project only', picker && !picker.party && JSON.stringify(picker.names) === JSON.stringify(['ورشة الحدادة','شركة النور للبناء','مقاول الكهرباء']) && picker.digits === false);
  check('subcontracts: payment form rtl, 390px, no overflow', picker && picker.rtl === 'rtl' && picker.width === 390 && picker.hz === false);
  await go(`${BASE}index.html?role=owner#entry`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  await ev(`document.querySelector('[data-proj="p-school"]').click(); document.querySelector('[data-type="subcontractor"]').click(); 1`);
  await sleep(150);
  await ev(`document.querySelector('[data-proj="p-road"]').click(); 1`);
  await sleep(150);
  check('subcontracts: another project does not offer this project\'s names', await ev(`(()=>{const sel=document.querySelector('#subcontract'); const names=sel?[...sel.options].map(o=>o.textContent):['missing']; return names.length===0 || !names.includes('مقاول الكهرباء');})()`));
  await go(`${BASE}index.html?role=owner#subnew/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  const addSub = await ev(`(()=>{
    return { name: (document.querySelector('#sub-name')||{}).value, amount: (document.querySelector('#sub-amount')||{}).value, work: (document.querySelector('#sub-work')||{}).value, text: document.querySelector('#main').innerText, rtl: document.documentElement.dir, width: window.innerWidth, hz: document.documentElement.scrollWidth > window.innerWidth };
  })()`);
  check('subcontracts: add form is name, agreed amount, and the work', addSub && addSub.name === 'مقاول السباكة' && addSub.amount === '1,500,000' && addSub.work === 'تمديد شبكة الماء للمجمع المدرسي' && addSub.text.includes('حفظ العقد') && addSub.text.includes('لا يتغير المبلغ إلا بملحق'));
  check('subcontracts: add form rtl, 390px, no overflow', addSub && addSub.rtl === 'rtl' && addSub.width === 390 && addSub.hz === false);
  await go(`${BASE}index.html?role=owner#amend/sc-kahraba`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  const addAm = await ev(`(()=>{
    return { title: document.querySelector('#title').textContent, date: (document.querySelector('#am-date')||{}).value, amount: (document.querySelector('#am-amount')||{}).value, note: (document.querySelector('#am-note')||{}).value, text: document.querySelector('#main').innerText, rtl: document.documentElement.dir, width: window.innerWidth, hz: document.documentElement.scrollWidth > window.innerWidth };
  })()`);
  check('subcontracts: amendment form shows the current agreed amount and an add-only row', addAm && addAm.title === 'مقاول الكهرباء' && addAm.text.includes('3,000,000') && addAm.date === '2026-10-28' && addAm.amount === '200,000' && addAm.note === 'خزان ماء إضافي' && addAm.text.includes('يُضاف فقط') && addAm.text.includes('لا تعديل ولا حذف'));
  check('subcontracts: amendment form rtl, 390px, no overflow', addAm && addAm.rtl === 'rtl' && addAm.width === 390 && addAm.hz === false);
  await go(`${BASE}index.html?role=site#entry/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  await ev(`document.querySelector('[data-type="subcontractor"]').click(); 1`);
  await sleep(200);
  const siteForm = await ev(`(()=>{
    const pills = [...document.querySelectorAll('[data-type]')].map(b => ({ id: b.getAttribute('data-type'), label: b.textContent }));
    const sel = document.querySelector('#subcontract');
    const names = sel ? [...sel.options].map(o => o.textContent) : [];
    return { who: document.querySelector('#who').textContent, pills, names, digits: names.some(n => /[0-9٠-٩]/.test(n)), party: !!document.querySelector('#party'), text: document.querySelector('#main').innerText, rtl: document.documentElement.dir, width: window.innerWidth, hz: document.documentElement.scrollWidth > window.innerWidth };
  })()`);
  check('subcontracts: site مقاول form picks names only and shows no agreed or remaining amount', siteForm && siteForm.who.includes('أحمد') && siteForm.pills.some(p => p.id === 'subcontractor' && p.label === 'مقاول') && siteForm.party === false && JSON.stringify(siteForm.names) === JSON.stringify(['ورشة الحدادة','شركة النور للبناء','مقاول الكهرباء']) && siteForm.digits === false && !siteForm.text.includes('المتفق عليه') && !siteForm.text.includes('المتبقي') && !siteForm.text.includes('3,000,000') && !siteForm.text.includes('4,000,000') && !siteForm.text.includes('2,500,000'));
  check('subcontracts: site entry rtl, 390px, no overflow', siteForm && siteForm.rtl === 'rtl' && siteForm.width === 390 && siteForm.hz === false);
  await ev(`document.querySelector('#subcontract').scrollIntoView({block:'center'}); 1`);
  await sleep(200);
  fs.mkdirSync('/opt/cursor/artifacts/screenshots', { recursive: true });
  const siteShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync('/opt/cursor/artifacts/screenshots/site-subcontractor-form.png', Buffer.from(siteShot.result.data, 'base64'));
  fs.writeFileSync(path.join(SHOTS, 'site-subcontractor-form.png'), Buffer.from(siteShot.result.data, 'base64'));
  await go(`${BASE}index.html?role=site#project/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  check('subcontracts: site project hides names, agreed amounts, and the badge', await ev(`(()=>{const text=document.querySelector('#main').innerText; return !document.querySelector('#subcontracts') && !text.includes('المتفق عليه') && !text.includes('مسدّد بالكامل') && !text.includes('3,000,000') && !text.includes('4,000,000') && !text.includes('3,200,000') && !text.includes('قيمة العقد');})()`));
  await go(`${BASE}index.html?role=site#sub/sc-kahraba`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  check('subcontracts: site detail does not show the amount', await ev(`(()=>{const text=document.querySelector('#main').innerText; return text.includes('هذه الشاشة للمالك') && !text.includes('3,000,000') && !text.includes('3,200,000') && !document.querySelector('.warnbox');})()`));
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
  check('header bell shows the unsent count', await ev(`(()=>{const btn=document.querySelector('#outbox');const badge=btn&&btn.querySelector('.bell-badge');const panel=document.querySelector('#bell-panel');const n=AJ.get('outbox').length;const label=(btn&&btn.getAttribute('aria-label'))||'';const text=panel?panel.innerText:'';return btn&&btn.tagName==='BUTTON'&&n===${after}&&label.includes('لم يُرسل بعد: '+n)&&badge&&badge.hidden===false&&badge.textContent===String(n)&&text.includes('لم يُرسل بعد')&&text.includes('آخر مزامنة')&&text.includes('إرسال الآن')&&text.includes(String(n))&&!document.querySelector('#send')})()`));
  // offline reload: SW must control page, then block network
  await ev(`navigator.serviceWorker.ready.then(()=>1)`); await go(`${BASE}index.html?role=owner#home`);
  check('service worker controls page', await ev('!!navigator.serviceWorker.controller'));
  await send('Network.enable'); await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Page.reload', { ignoreCache: false }); await sleep(1500);
  const off = await ev(`(()=>{const btn=document.querySelector('#outbox');const badge=btn&&btn.querySelector('.bell-badge');const n=String((AJ.get('outbox')||[]).length);return {t:document.querySelector('main')?.innerText||'', label:(btn&&btn.getAttribute('aria-label'))||'', badge:badge?badge.textContent:'', hidden:!(badge&&badge.hidden===false), on:navigator.onLine, n}})()`);
  check('offline reload renders app with data', off.t.includes('صافي الربح') && off.n === String(after) && off.label.includes('لم يُرسل بعد: ' + off.n) && off.label.includes('بدون إنترنت') && off.badge === off.n && off.hidden === false && off.on === false);
  await send('Page.captureScreenshot', { format: 'png' }).then(s => fs.writeFileSync(path.join(SHOTS, 'offline-reload-owner-home.png'), Buffer.from(s.result.data, 'base64')));
  await ev(`(()=>{const b=document.querySelector('#outbox');if(b.getAttribute('aria-expanded')!=='true')b.click();document.querySelector('#bell-send').click();return 1})(); AJ.flush().then(()=>1)`);
  check('send now drains outbox', (await ev(`AJ.get('outbox').length`)) === 0 && (await ev(`(()=>{const btn=document.querySelector('#outbox');const badge=btn.querySelector('.bell-badge');const text=document.querySelector('#bell-panel').innerText;return badge.hidden===true&&(btn.getAttribute('aria-label')||'').includes('لم يُرسل بعد: 0')&&text.includes('لم يُرسل بعد')&&text.includes('إرسال الآن')&&text.includes('0')})()`)));
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
  const fracKept = await ev(`(()=>{
    dispatchEvent(new Event('offline'));
    dispatchEvent(new Event('online'));
    const msg = (document.querySelector('#msg') && document.querySelector('#msg').innerText) || '';
    return { msg, saved: (AJ.get('entries') || []).some(e => e && e.description === 'amount-case' && e.amount === 1.5) };
  })()`);
  check('amount 1.5 message survives a redraw', fracKept && fracKept.saved === false && /صحيحاً/.test(fracKept.msg));
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
  const partyKept = await ev(`(()=>{
    dispatchEvent(new Event('offline'));
    dispatchEvent(new Event('online'));
    return (document.querySelector('#msg') && document.querySelector('#msg').textContent) || '';
  })()`);
  check('the party limit message survives a redraw', /100/.test(partyKept || ''));
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
  const nameKept = await ev(`(()=>{
    dispatchEvent(new Event('offline'));
    dispatchEvent(new Event('online'));
    return (document.querySelector('#person-msg') && document.querySelector('#person-msg').textContent) || '';
  })()`);
  check('the person-name limit message survives a redraw', /80/.test(nameKept || ''));
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
    const ctx = { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY, syncErrors: AJ.get('syncErrors') || {} };
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
  const clearOfBar = async (selector) => ev(`(()=>{
    const el = document.querySelector(${JSON.stringify(selector)});
    const bar = document.querySelector('.tabs');
    if (!el || !bar) return { ok: false, reason: 'missing' };
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTop = scroller.scrollHeight;
    let er = el.getBoundingClientRect();
    let br = bar.getBoundingClientRect();
    if (er.top < 0) {
      scroller.scrollTop += er.bottom - (br.top - 12);
      er = el.getBoundingClientRect();
      br = bar.getBoundingClientRect();
    }
    return {
      ok: er.width >= 1 && er.height >= 1 && er.top >= -0.5 && er.bottom <= br.top + 0.5,
      top: Math.round(er.top), bottom: Math.round(er.bottom), barTop: Math.round(br.top), gap: Math.round(br.top - er.bottom)
    };
  })()`);
  const lastRow = await clearOfBar('#entry-list .entry:last-child');
  console.log('last row clearance ' + JSON.stringify(lastRow));
  check('owner list last row stays above the bar', lastRow && lastRow.ok === true);
  await ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const saveClear = await clearOfBar('#save');
  console.log('save button clearance ' + JSON.stringify(saveClear));
  check('entry save button stays above the bar', saveClear && saveClear.ok === true);
  await ev(`location.hash='#home'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const tabs = await ev(`(()=>{
    const links = [...document.querySelectorAll('.tabs a')];
    const bar = document.querySelector('.tabs');
    const on = document.querySelector('.tabs a.on');
    const cs = on ? getComputedStyle(on) : null;
    const xs = links.map(a => a.getBoundingClientRect().x);
    const boxes = links.map(a => { const r = a.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    const barCs = bar ? getComputedStyle(bar) : null;
    return {
      order: links.map(a => a.dataset.tab).join(','),
      labels: links.map(a => (a.querySelector('span') || {}).textContent || '').join('|'),
      icons: links.every(a => !!a.querySelector('svg')),
      rtl: xs.length > 1 && xs.every((x, i) => i === 0 || x < xs[i - 1] - 1),
      on: on && on.dataset.tab,
      bg: cs && cs.backgroundColor,
      color: cs && cs.color,
      others: links.filter(a => a !== on).map(a => getComputedStyle(a).backgroundColor).join('|'),
      boxes,
      radius: barCs ? parseFloat(barCs.borderTopLeftRadius) : 0,
      shadow: barCs ? barCs.boxShadow : '',
      side: bar ? Math.min(bar.getBoundingClientRect().left, innerWidth - bar.getBoundingClientRect().right) : 0,
      bottom: barCs ? parseFloat(barCs.bottom) : 0,
      pad: parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom),
      hz: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  })()`);
  console.log('owner tabs ' + JSON.stringify(tabs));
  const green = 'rgb(15, 92, 77)';
  check('owner home fills the home tab and keeps four tappable tabs', tabs && tabs.order === 'home,entry,projects,people' && tabs.labels === 'الرئيسية|قيد جديد|المشاريع|الأشخاص' && tabs.icons === true && tabs.rtl === true && tabs.on === 'home' && tabs.bg === green && tabs.color === 'rgb(255, 255, 255)' && tabs.others.indexOf(green) === -1 && tabs.boxes.every(b => b.w >= 44 && b.h >= 44) && tabs.radius >= 20 && tabs.shadow && tabs.shadow !== 'none' && tabs.side >= 8 && tabs.bottom >= 46 && tabs.pad >= 170 && tabs.hz === false);
  const entryBox = await ev(`(()=>{
    const a = document.querySelector('.tabs a[data-tab="entry"]');
    const r = a.getBoundingClientRect();
    const x = r.x + r.width / 2;
    const y = r.y + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, w: r.width, h: r.height, tab: hit && hit.closest('a') && hit.closest('a').dataset.tab };
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: entryBox.x, y: entryBox.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: entryBox.x, y: entryBox.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: entryBox.x, y: entryBox.y, button: 'left', clickCount: 1 });
  await sleep(250);
  const tapped = await ev(`(()=>{
    const on = document.querySelector('.tabs a.on');
    const home = document.querySelector('.tabs a[data-tab="home"]');
    return {
      hash: location.hash,
      on: on && on.dataset.tab,
      bg: on ? getComputedStyle(on).backgroundColor : '',
      homeBg: home ? getComputedStyle(home).backgroundColor : ''
    };
  })()`);
  console.log('entry tap ' + JSON.stringify({ entryBox, tapped }));
  check('entry tab is a 44px target and shows the new entry screen', entryBox && entryBox.tab === 'entry' && entryBox.w >= 44 && entryBox.h >= 44 && tapped && tapped.hash === '#entry' && tapped.on === 'entry' && tapped.bg === green && tapped.homeBg !== green);
  const beforeSafe = await ev(`({bottom:parseFloat(getComputedStyle(document.querySelector('.tabs')).bottom), pad:parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom)})`);
  const safeCall = await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 0, bottom: 50 } });
  await sleep(150);
  const afterSafe = await ev(`({bottom:parseFloat(getComputedStyle(document.querySelector('.tabs')).bottom), pad:parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom), err:${JSON.stringify(!!(safeCall && safeCall.error))}})`);
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 0, bottom: 0 } });
  console.log('safe area ' + JSON.stringify({ beforeSafe, afterSafe, safeError: safeCall && safeCall.error }));
  check('safe area inset lifts the bar and the page padding', beforeSafe && afterSafe && !safeCall.error && beforeSafe.bottom >= 46 && afterSafe.bottom >= beforeSafe.bottom + 12 && afterSafe.pad >= beforeSafe.pad + 12);
  await ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const savedKept = await ev(`(()=>{
    const before = (AJ.get('entries') || []).length;
    document.querySelector('#amt').value = '1000';
    document.querySelector('#desc').value = 'يبقى بعد الرسم';
    document.querySelector('#save').click();
    const msg = (document.querySelector('#msg') && document.querySelector('#msg').innerText) || '';
    dispatchEvent(new Event('offline'));
    dispatchEvent(new Event('online'));
    const after = (document.querySelector('#msg') && document.querySelector('#msg').innerText) || '';
    return { added: (AJ.get('entries') || []).length - before, msg, after };
  })()`);
  check('the saved confirmation survives a redraw', savedKept && savedKept.added === 1 && /حُفظ/.test(savedKept.msg) && /حُفظ/.test(savedKept.after));
  const longName = 'W'.repeat(80);
  const planted = await ev(`(async () => {
    const name = ${JSON.stringify(longName)};
    const stamp = (AJ.get('entries') || []).reduce((m, e) => Math.max(m, e.createdAtDevice || 0), 0) + 1000;
    return await new Promise((resolve, reject) => {
      const q = indexedDB.open('aj-p0');
      q.onerror = () => reject(q.error || new Error('idb'));
      q.onsuccess = () => {
        const d = q.result;
        const tx = d.transaction('entries', 'readwrite');
        tx.objectStore('entries').put({
          id: 'long-name-row', projectId: 'p-school', direction: 'expense', entryType: 'materials',
          amount: 17, currency: 'IQD', entryDate: '2026-11-01', description: 'اسم طويل', partyName: 'جهة',
          isReversal: false, createdAtDevice: stamp, createdAtServer: stamp,
          createdBy: 'u-ameer', createdByName: name, deviceId: 'long'
        });
        tx.oncomplete = () => {
          const check = d.transaction('entries').objectStore('entries').get('long-name-row');
          check.onsuccess = () => { const hit = check.result && check.result.createdByName === name; d.close(); resolve(hit ? 'stored' : 'missing'); };
          check.onerror = () => { d.close(); reject(check.error); };
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  })()`);
  check('a long recorder name can be stored', planted === 'stored');
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
  await go(`${BASE}index.html?role=owner&fresh=long#project/p-school`);
  await ev(`dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(300);
  const longRow = await ev(`(async ()=>{
    const name = ${JSON.stringify(longName)};
    const row = [...document.querySelectorAll('.entry')].find(el => (el.innerText || '').includes(name));
    const page = document.documentElement;
    const small = row && [...row.querySelectorAll('small')].find(el => (el.textContent || '').includes(name));
    const cs = small ? getComputedStyle(small) : null;
    const ids = (AJ.get('entries') || []).map(e => e.id);
    const idb = await new Promise(resolve => {
      const q = indexedDB.open('aj-p0');
      q.onerror = () => resolve('err');
      q.onsuccess = () => {
        const d = q.result;
        const g = d.transaction('entries').objectStore('entries').get('long-name-row');
        g.onsuccess = () => { d.close(); resolve(g.result ? 'yes' : 'no'); };
        g.onerror = () => { d.close(); resolve('get-err'); };
      };
    });
    return {
      found: !!row,
      full: !!row && row.innerText.includes(name),
      hz: page.scrollWidth > page.clientWidth + 1,
      wrap: cs ? cs.overflowWrap : '',
      rowWide: row ? row.scrollWidth > page.clientWidth + 1 : true,
      has: ids.includes('long-name-row'),
      idb,
      n: ids.length,
      hash: location.hash,
      title: document.querySelector('#title') && document.querySelector('#title').textContent,
      rows: document.querySelectorAll('.entry').length
    };
  })()`);
  console.log('long name row ' + JSON.stringify(longRow));
  check('an 80-character recorder name stays inside the entry row', longRow && longRow.found && longRow.full && longRow.hz === false && longRow.rowWide === false && (longRow.wrap === 'anywhere' || longRow.wrap === 'break-word'));
  await ev(`location.hash='#entries/p-school'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const longList = await ev(`(()=>{
    const name = ${JSON.stringify(longName)};
    const row = [...document.querySelectorAll('#entry-list .entry')].find(el => (el.innerText || '').includes(name));
    const page = document.documentElement;
    return { found: !!row, full: !!row && row.innerText.includes(name), hz: page.scrollWidth > page.clientWidth + 1 };
  })()`);
  check('the long recorder name does not widen the full entry list', longList && longList.found && longList.full && longList.hz === false);
  await ev(`document.querySelector('#entry-list a.entry-open').click(); 1`);
  await sleep(200);
  const longDetail = await ev(`(()=>{
    const page = document.documentElement;
    return { hz: page.scrollWidth > page.clientWidth + 1, text: (document.querySelector('#main') && document.querySelector('#main').innerText) || '' };
  })()`);
  check('the long recorder name does not widen the entry details', longDetail && longDetail.hz === false && longDetail.text.includes(longName.slice(0, 40)));
  const rejectedId = await ev(`(async () => {
    const entries = AJ.get('entries') || [];
    const bad = entries.find(e => e && e.id === 'long-name-row');
    const good = entries.find(e => e && e.projectId === 'p-school' && e.id !== 'long-name-row' && !e.isReversal);
    if (!bad || !good) return null;
    await new Promise((resolve, reject) => {
      const q = indexedDB.open('aj-p0');
      q.onerror = () => reject(q.error || new Error('idb'));
      q.onsuccess = () => {
        const d = q.result;
        const tx = d.transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ [bad.id]: 'رُفض الإرسال' }, 'syncErrors');
        tx.oncomplete = () => { d.close(); resolve(1); };
        tx.onerror = () => reject(tx.error);
      };
    });
    return { bad: bad.id, good: good.id, goodAmount: good.amount };
  })()`);
  check('a rejected entry id was chosen for the export', !!(rejectedId && rejectedId.bad && rejectedId.good));
  await go(`${BASE}index.html?role=owner&fresh=csv#home`);
  await sleep(300);
  const csvExport = await ev(`(async () => {
    const orig = URL.createObjectURL;
    let text = '';
    URL.createObjectURL = function (blob) {
      window.__csvBlob = blob;
      return orig.apply(this, arguments);
    };
    const btn = document.querySelector('#csv');
    if (btn) btn.click();
    if (window.__csvBlob) text = await window.__csvBlob.text();
    URL.createObjectURL = orig;
    const lines = text.replace(/^\\uFEFF/, '').trim().split(/\\r?\\n/).filter(Boolean);
    const screen = (document.querySelector('#main') && document.querySelector('#main').innerText) || '';
    return { text, rows: Math.max(0, lines.length - 1), hasBad: text.includes(${JSON.stringify(rejectedId && rejectedId.bad)}), hasGood: text.includes(${JSON.stringify(rejectedId && rejectedId.good)}), screen };
  })()`);
  check('the ledger CSV matches the screen and omits a server rejection', csvExport && csvExport.hasBad === false && csvExport.hasGood === true && csvExport.rows === (await ev(`(AJ.get('entries') || []).filter(e => !(AJ.get('syncErrors') || {})[e.id]).length`)));
  await ev(`location.hash=${JSON.stringify('#detail/' + (rejectedId && rejectedId.bad))}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const rejectedPrint = await ev(`(()=>{
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    const printBtn = document.querySelector('#entry-print');
    const pdfBtn = document.querySelector('#entry-pdf');
    if (printBtn) printBtn.click();
    if (pdfBtn) pdfBtn.click();
    return {
      buttons: !!printBtn || !!pdfBtn,
      printed: window.__printed,
      sheet: (document.querySelector('#print-root') && document.querySelector('#print-root').textContent) || '',
      reason: (document.querySelector('#main') && document.querySelector('#main').innerText) || ''
    };
  })()`);
  check('print and PDF are not offered for a server-rejected entry', rejectedPrint && rejectedPrint.buttons === false && rejectedPrint.printed === 0 && rejectedPrint.sheet.trim() === '' && /رُفض الإرسال/.test(rejectedPrint.reason));
  await ev(`location.hash=${JSON.stringify('#detail/' + (rejectedId && rejectedId.good))}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const acceptedPrint = await ev(`(()=>{
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    document.querySelector('#entry-print').click();
    document.querySelector('#entry-pdf').click();
    const text = (document.querySelector('#print-root') && document.querySelector('#print-root').textContent) || '';
    return { printed: window.__printed, text, hasId: text.includes(${JSON.stringify(rejectedId && rejectedId.good)}) };
  })()`);
  check('print and PDF still include an entry the server accepted', acceptedPrint && acceptedPrint.printed === 2 && acceptedPrint.hasId === true);
  const plantedView = await ev(`(async () => {
    const stamp = 9900000000000000;
    const rejected = { id: 'view-rejected', projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 919191, currency: 'IQD', entryDate: '2026-11-05', description: 'مرفوض للعرض', partyName: 'جهة مرفوضة', isReversal: false, createdAtDevice: stamp + 2, createdAtServer: null, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'view' };
    const pending = { id: 'view-pending', projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 818181, currency: 'IQD', entryDate: '2026-11-05', description: 'ينتظر للعرض', partyName: 'جهة تنتظر', isReversal: false, createdAtDevice: stamp + 1, createdAtServer: null, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'view' };
    return await new Promise((resolve, reject) => {
      const q = indexedDB.open('aj-p0');
      q.onerror = () => reject(q.error || new Error('idb'));
      q.onsuccess = () => {
        const d = q.result;
        const tx = d.transaction(['entries', 'outbox', 'meta'], 'readwrite');
        const meta = tx.objectStore('meta');
        const cur = meta.get('syncErrors');
        cur.onsuccess = () => {
          const prev = cur.result && typeof cur.result === 'object' ? cur.result : {};
          meta.put(Object.assign({}, prev, { [rejected.id]: 'رُفض الإرسال' }), 'syncErrors');
        };
        tx.objectStore('entries').put(rejected);
        tx.objectStore('entries').put(pending);
        tx.objectStore('outbox').put({ id: pending.id, queuedAt: stamp });
        tx.oncomplete = () => { d.close(); resolve('ok'); };
        tx.onerror = () => reject(tx.error);
      };
    });
  })()`);
  check('view-all fixtures are stored', plantedView === 'ok');
  await go(`${BASE}index.html?role=owner&fresh=viewall#entries/p-school`);
  await ev(`dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(300);
  const viewAll = await ev(`(()=>{
    const school = (AJ.get('entries') || []).filter(e => e && e.projectId === 'p-school');
    const errors = AJ.get('syncErrors') || {};
    const out = AJ.get('outbox') || [];
    const rejectedIds = school.filter(e => errors[e.id]).map(e => e.id);
    const pending = school.find(e => e.id === 'view-pending');
    const note = ((document.querySelector('#entry-count') || {}).textContent || '').trim();
    const m = note.match(/^(\\d+) من (\\d+)$/);
    const ids = [...document.querySelectorAll('#entry-list a.entry-open')].map(a => (a.getAttribute('href') || '').replace('#detail/', ''));
    const text = ((document.querySelector('#entry-list') || {}).innerText) || '';
    return {
      note,
      shown: m ? Number(m[1]) : -1,
      total: m ? Number(m[2]) : -1,
      rows: ids.length,
      rejectedIds,
      listHasRejected: ids.some(id => rejectedIds.includes(id)),
      listHasPending: ids.includes('view-pending'),
      textHasRejectedParty: text.includes('جهة مرفوضة'),
      textHasPendingParty: text.includes('جهة تنتظر'),
      stored: school.length,
      pendingOk: !!pending && pending.createdAtServer == null && out.includes('view-pending') && !errors['view-pending'],
      rejectedStored: errors['view-rejected'] === 'رُفض الإرسال' && school.some(e => e.id === 'view-rejected'),
    };
  })()`);
  console.log('view-all rejected ' + JSON.stringify(viewAll));
  check('view-all count and list drop a server rejection and keep a pending entry', viewAll && viewAll.pendingOk === true && viewAll.rejectedStored === true && viewAll.rejectedIds.length >= 1 && viewAll.listHasRejected === false && viewAll.listHasPending === true && viewAll.textHasRejectedParty === false && viewAll.textHasPendingParty === true && viewAll.shown === viewAll.rows && viewAll.rows > 0 && viewAll.total === viewAll.stored - viewAll.rejectedIds.length && viewAll.total < viewAll.stored && viewAll.shown <= viewAll.total);
  await go(`${BASE}index.html?role=owner#project/p-market`);
  await ev(`document.querySelector('#project-manage').scrollIntoView({block:'center'})`);
  await sleep(250);
  const shotView = async file => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(SHOTS, file), Buffer.from(s.result.data, 'base64')); };
  await shotView('archive-section.png');
  check('archive section is separated from the new-entry button', await ev(`(()=>{const entry=[...document.querySelectorAll('a.btn')].find(a=>a.textContent.includes('قيد لهذا المشروع'));const manage=document.querySelector('#project-manage');if(!entry||!manage)return false;const gap=manage.getBoundingClientRect().top-entry.getBoundingClientRect().bottom;return gap>=40&&(manage.innerText||'').includes('أرشفة المشروع')})()`));
  const ledgerBefore = await ev(`(AJ.get('entries')||[]).length`);
  await ev(`document.querySelector('#archive-project').click(); 1`);
  await sleep(200);
  await shotView('archive-dialog.png');
  const dialog = await ev(`(()=>{const yes=document.querySelector('#confirm-yes');const no=document.querySelector('#confirm-no');if(!yes||!no)return null;const bg=getComputedStyle(yes).backgroundColor;return {ask:(document.querySelector('#confirm-dialog')||{}).innerText||'',yes:yes.textContent,no:no.textContent,danger:bg==='rgb(198, 40, 40)'}})()`);
  check('archive asks for نعم in red and إلغاء', dialog && dialog.yes === 'نعم' && dialog.no === 'إلغاء' && dialog.danger && dialog.ask.includes('أرشفة'));
  await ev(`document.querySelector('#confirm-no').click(); 1`);
  await sleep(150);
  check('إلغاء leaves the project on the main list', await ev(`!document.querySelector('#confirm-dialog') && (AJ.get('projects').find(p=>p.id==='p-market')||{}).status!=='archived' && location.hash==='#project/p-market'`));
  await ev(`document.querySelector('#archive-project').click(); document.querySelector('#confirm-yes').click(); 1`);
  await sleep(200);
  const archived = await ev(`(()=>{const p=(AJ.get('projects')||[]).find(x=>x.id==='p-market');const text=document.querySelector('#main').innerText||'';return {status:p&&p.status,hash:location.hash,text,entries:(AJ.get('entries')||[]).length}})()`);
  check('archive keeps every ledger row and hides the project', archived && archived.status === 'archived' && archived.hash === '#projects' && !archived.text.includes('بناية السوق') && archived.text.includes('مشروع المدرسة') && archived.entries === ledgerBefore);
  await ev(`document.querySelector('[data-list="archived"]').click(); 1`);
  await sleep(200);
  await shotView('archive-list.png');
  check('المؤرشفة lists the project with استعادة', await ev(`(()=>{const text=document.querySelector('#main').innerText||'';const btn=document.querySelector('[data-restore="p-market"]');return text.includes('بناية السوق')&&text.includes('استعادة')&&!!btn&&!text.includes('مشروع المدرسة')&&!document.querySelector('#newproj')})()`));
  await ev(`document.querySelector('#role').value='site'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(200);
  check('site never sees the archived filter or the archived project', await ev(`(()=>{const text=document.querySelector('#main').innerText||'';return !document.querySelector('#project-filter')&&!document.querySelector('[data-restore]')&&!document.querySelector('#project-manage')&&!text.includes('المؤرشفة')&&!text.includes('بناية السوق')&&!text.includes('أرشفة')&&!text.includes('استعادة')})()`));
  await ev(`document.querySelector('#role').value='owner'; location.hash='#projects'; document.querySelector('#role').dispatchEvent(new Event('change')); 1`);
  await sleep(150);
  await ev(`document.querySelector('[data-list="archived"]').click(); document.querySelector('[data-restore="p-market"]').click(); 1`);
  await sleep(150);
  check('restore uses the same confirm buttons', await ev(`(()=>{const yes=document.querySelector('#confirm-yes');const no=document.querySelector('#confirm-no');const ask=(document.querySelector('#confirm-dialog')||{}).innerText||'';return !!yes&&yes.textContent==='نعم'&&!!no&&no.textContent==='إلغاء'&&getComputedStyle(yes).backgroundColor==='rgb(198, 40, 40)'&&ask.includes('استعادة')})()`));
  await ev(`document.querySelector('#confirm-yes').click(); 1`);
  await sleep(200);
  check('restore clears the project from المؤرشفة', await ev(`(()=>{const p=(AJ.get('projects')||[]).find(x=>x.id==='p-market');const text=document.querySelector('#main').innerText||'';return p&&p.status==='active'&&!text.includes('بناية السوق')&&!document.querySelector('[data-restore]')&&(AJ.get('entries')||[]).length===${ledgerBefore}})()`));
  await ev(`document.querySelector('[data-list="open"]').click(); 1`);
  await sleep(150);
  check('the restored project is back on the main list', await ev(`(()=>{const text=document.querySelector('#main').innerText||'';return text.includes('بناية السوق')&&text.includes('مشروع المدرسة')&&!!document.querySelector('#newproj')})()`));
  await go(`${BASE}index.html?role=owner#entry/p-school`);
  await ev('dispatchEvent(new HashChangeEvent("hashchange"))');
  await sleep(200);
  const overPaid = await ev(`(()=>{
    document.querySelector('[data-type="subcontractor"]').click();
    const sel = document.querySelector('#subcontract');
    sel.value = 'sc-kahraba';
    document.querySelector('#amt').value = '1000';
    document.querySelector('#desc').value = 'دفعة فوق العقد';
    document.querySelector('#save').click();
    const row = (AJ.get('entries') || []).find(e => e.description === 'دفعة فوق العقد');
    return row ? { type: row.entryType, sub: row.subcontractId, amount: row.amount } : null;
  })()`);
  check('subcontracts: an overpayment is saved and does not block', overPaid && overPaid.type === 'subcontractor' && overPaid.sub === 'sc-kahraba' && overPaid.amount === 1000);
  await ev(`location.hash='#sub/sc-kahraba'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  check('subcontracts: the warning is still a warning after the extra payment', await ev(`(()=>{const text=document.querySelector('#main').innerText; return !!document.querySelector('.warnbox') && text.includes('تنبيه فقط') && text.includes('دفعة فوق العقد');})()`));
  await ev(`location.hash='#amend/sc-kahraba'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
  await sleep(200);
  const added = await ev(`(()=>{
    const before = (AJ.get('subcontractAmendments') || []).length;
    document.querySelector('#save-amend').click();
    const rows = AJ.get('subcontractAmendments') || [];
    const row = rows.find(a => a.note === 'خزان ماء إضافي' && a.subcontractId === 'sc-kahraba');
    return { before, after: rows.length, amount: row && row.amount, date: row && row.date, controls: document.querySelectorAll('#main button').length };
  })()`);
  check('subcontracts: an amendment is appended and the form does not offer edit or delete', added && added.after === added.before + 1 && added.amount === 200000 && added.date === '2026-10-28');
  const p = results.filter(r => r[1]).length; console.log(`browser checks: ${p}/${results.length} passed`);
  ws.close(); chrome.kill(); process.exit(p === results.length ? 0 : 1);
})().catch(e => { console.error(e); if (chrome) chrome.kill(); process.exit(2); });
