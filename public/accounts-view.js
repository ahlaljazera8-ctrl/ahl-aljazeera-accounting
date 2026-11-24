// Owner accounts list and the read-only person page. Loaded after accounts.js and before render.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountsView: api });
})(/** @returns {AccountsViewApi} */ function () {
  'use strict';

  /** @type {RenderApi | null} */
  let api = null;

  /** @type {AccountScreen} */
  const screen = {
    tab: 'overview',
    filter: 'all',
    creating: false,
    formId: '',
    name: '',
    msg: '',
    today: '',
  };

  /** @type {AccountScopeFlag} */
  let scopeFlag = { scope: 'all', projectId: '', periodKind: 'week', anchorDate: '' };

  /** @type {AccountAction[]} */
  const registry = [];
  registry.push = function (action) {
    if (action && registry.some(item => item && item.id === action.id)) return registry.length;
    return Array.prototype.push.call(registry, action);
  };
  Object.assign(globalThis, { AccountActions: registry });

  /**
   * @param {unknown} value
   */
  function esc(value) {
    const text = value == null ? '' : String(value);
    if (api && api.esc) return api.esc(text);
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * @param {number} amount
   */
  function money(amount) {
    if (api && api.money) return api.money(amount);
    return Ledger.fmt(amount) + ' د.ع';
  }

  /**
   * @param {string} key
   * @param {unknown[]} fallback
   */
  function rows(key, fallback) {
    const value = get(key, fallback);
    return Array.isArray(value) ? value : fallback;
  }

  /** @returns {FoldDoc[]} */
  function txns() {
    return /** @type {FoldDoc[]} */ (rows(K.accountTxns, []));
  }

  /** @returns {Record<string, unknown>} */
  function syncErrors() {
    const value = get(K.syncErrors, {});
    return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
  }

  /** @returns {string[]} */
  function outbox() {
    const value = get(K.outbox, []);
    return Array.isArray(value) ? /** @type {string[]} */ (value) : [];
  }

  /**
   * @param {string} name
   * @returns {string[]}
   */
  function partyErrors(name) {
    const trimmed = String(name || '').trim();
    if (trimmed.length < 1 || trimmed.length > 80) return ['name'];
    return [];
  }

  /**
   * @param {{ role?: string } | null | undefined} user
   */
  function canCreateParty(user) {
    if (demoRole()) return false;
    if (!user || !Ledger.can(user, 'owner')) return false;
    if (typeof Sync === 'undefined' || typeof Sync.collectionFor !== 'function') return false;
    return Sync.collectionFor(/** @type {any} */ ({ id: 'x', docType: 'party', name: 'x' })) === 'parties';
  }

  function readAccountScope() {
    if (!scopeFlag.anchorDate) scopeFlag.anchorDate = today();
    return {
      scope: scopeFlag.scope,
      projectId: scopeFlag.projectId,
      periodKind: scopeFlag.periodKind,
      anchorDate: scopeFlag.anchorDate,
    };
  }

  /**
   * @param {AccountScopeFlag} next
   */
  function writeAccountScope(next) {
    scopeFlag = {
      scope: next.scope === 'project' ? 'project' : 'all',
      projectId: next.scope === 'project' ? next.projectId || '' : '',
      periodKind: next.periodKind === 'month' ? 'month' : 'week',
      anchorDate: next.anchorDate || scopeFlag.anchorDate || today(),
    };
  }

  function accountPeriod() {
    const flag = readAccountScope();
    if (typeof Accounts === 'undefined' || typeof Accounts.periodBounds !== 'function') return null;
    return Accounts.periodBounds(flag.periodKind, flag.anchorDate);
  }

  /**
   * @param {string} id
   * @param {object} doc
   * @param {readonly { id: string }[]} list
   * @param {(next: object[]) => void} write
   */
  function commitDoc(id, doc, list, write) {
    const rowsNow = Array.isArray(list) ? list : [];
    if (!rowsNow.some(row => row && row.id === id)) write(rowsNow.concat([doc]));
    queueDoc(id);
  }

  /**
   * @param {FoldDoc[]} docs
   * @param {string} partyId
   * @returns {BalanceFilter}
   */
  function balanceFilter(docs, partyId) {
    const flag = readAccountScope();
    /** @type {BalanceFilter} */
    const filter = { partyId, syncErrors: syncErrors() };
    if (flag.scope === 'project' && flag.projectId) filter.projectId = flag.projectId;
    void docs;
    return filter;
  }

  /**
   * @param {{ role?: string, uid?: string } | null} user
   * @param {string} partyId
   * @returns {ReturnType<AccountsApi['statementLines']>}
   */
  function statementFor(user, partyId) {
    void user;
    const docs = txns();
    const period = accountPeriod();
    /** @type {StatementFilter} */
    const filter = balanceFilter(docs, partyId);
    if (period) {
      filter.periodStart = period.periodStart;
      filter.periodEnd = period.periodEnd;
    }
    if (typeof Accounts === 'undefined') {
      return { lines: [], opening: 0, closing: null, pendingIds: [], unreviewedCashIds: [], overLimitIds: [] };
    }
    return Accounts.statementLines(docs, filter);
  }

  /**
   * @param {{ role?: string, uid?: string } | null} user
   * @returns {AccountModel}
   */
  function modelFor(user) {
    const docs = txns();
    const errors = syncErrors();
    const index = typeof Accounts !== 'undefined' ? Accounts.rowIndex(docs, errors) : null;
    const statement = null;
    return {
      user,
      parties: /** @type {AccountModel['parties']} */ (rows(K.parties, [])),
      agreements: /** @type {AccountModel['agreements']} */ (rows(K.agreements, [])),
      txns: docs,
      projects: /** @type {AccountModel['projects']} */ (rows(K.projects, [])),
      figures: null,
      lines: [],
      pending: [],
      canCreate: canCreateParty(user),
      screen,
      index,
      statement,
    };
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function personFigures(model, partyId) {
    if (typeof Accounts === 'undefined') return null;
    return Accounts.balances(model.txns, balanceFilter(model.txns, partyId));
  }

  /**
   * Same rule as markerKind in accounts.js. That helper is not exported.
   * @param {FoldDoc | null | undefined} row
   * @returns {'' | 'rev' | 'rej' | 'revw'}
   */
  function markerKindOf(row) {
    if (!row) return '';
    if (row.kind === 'rev' || row.kind === 'rej' || row.kind === 'revw') return row.kind;
    if (typeof row.id !== 'string') return '';
    if (row.id.startsWith('rev_')) return 'rev';
    if (row.id.startsWith('rej_')) return 'rej';
    if (row.id.startsWith('revw_')) return 'revw';
    return '';
  }

  /**
   * @param {FoldDoc} row
   * @param {RowIndex} index
   * @param {'rev' | 'rej'} kind
   */
  function liveMarker(row, index, kind) {
    const bag = kind === 'rev' ? index.byReversesId : index.byTargetId;
    const ids = bag[row.id] || [];
    for (const id of ids) {
      const doc = index.byId[id];
      if (!doc || markerKindOf(doc) !== kind || !Accounts.rowLive(doc, index)) continue;
      if (kind === 'rev' && (doc.id === 'rev_' + row.id || doc.reversesId === row.id)) return true;
      if (kind === 'rej' && (doc.id === 'rej_' + row.id || doc.targetId === row.id)) return true;
    }
    return false;
  }

  /**
   * @param {FoldDoc} row
   * @param {RowIndex | null} index
   */
  function statusWord(row, index) {
    if (!index || !row || typeof row.id !== 'string') return '';
    if (Object.prototype.hasOwnProperty.call(index.syncErrors, row.id)) return '';
    if (!Accounts.rowLive(row, index)) {
      if (liveMarker(row, index, 'rej')) return 'مرفوض';
      if (liveMarker(row, index, 'rev')) return 'معكوس';
      return '';
    }
    if (Accounts.rowCounts(row, index)) return 'معتمد';
    if (liveMarker(row, index, 'rej')) return 'مرفوض';
    if (liveMarker(row, index, 'rev')) return 'معكوس';
    return '';
  }

  /**
   * @param {string} purpose
   * @param {MovementFilter} filter
   */
  function inFilter(purpose, filter) {
    if (filter === 'all') return true;
    if (filter === 'payments') return purpose === 'payLabor' || purpose === 'refundLabor';
    if (filter === 'advances') return purpose === 'advanceLabor' || purpose === 'returnAdvance' || purpose === 'settle';
    return purpose === 'laborQty' || purpose === 'approveLabor';
  }

  /**
   * @param {AccountTab} tab
   */
  function actionHtml(tab) {
    if (tab === 'overview') return '';
    const want = tab;
    return registry
      .filter(action => action && action.tab === want)
      .map(action => {
        const id = action.buttonId || 'act-' + action.id;
        const form = action.renderForm ? action.renderForm() : '';
        return '<button type="button" class="btn" id="' + esc(id) + '">' + esc(action.label) + '</button>' + form;
      })
      .join('');
  }

  /**
   * @param {AccountModel} model
   */
  function listHtml(model) {
    if (!model.user || !Ledger.can(model.user, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    const links = model.parties
      .map(person => {
        if (!person || !DomSafe.isSafeId(person.id)) return '';
        return '<a class="card proj" href="#account/' + DomSafe.projectAttr(person.id) + '"><h2>' + esc(person.name) + '</h2></a>';
      })
      .join('');
    const empty = links ? '' : '<div class="note">لا توجد حسابات أشخاص.</div>';
    const create = model.canCreate
      ? '<button type="button" class="btn" id="party-new">+ شخص جديد</button>'
      : '';
    let form = '';
    if (model.canCreate && model.screen.creating) {
      form =
        '<label class="field">اسم الشخص<input id="party-name" class="full" maxlength="80" value="' +
        esc(model.screen.name) +
        '"></label><button type="button" class="btn" id="save-party">حفظ</button>';
    }
    return '<div class="card"><h2>حسابات الأشخاص</h2>' + empty + links + create + form + '</div>';
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function accountHtml(model, partyId) {
    if (!model.user || !Ledger.can(model.user, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    if (!DomSafe.isSafeId(partyId)) return '<div class="card">معرّف غير صالح</div>';
    const person = model.parties.find(item => item && item.id === partyId);
    if (!person) return '<div class="card">الشخص غير متاح</div>';
    const tab = model.screen.tab;
    const tabs = ['overview', 'agreements', 'movements', 'statement'];
    const tabNames = { overview: 'نظرة عامة', agreements: 'العقود', movements: 'الحركات', statement: 'كشف الحساب' };
    const pills = tabs
      .map(name => {
        const on = name === tab ? ' on' : '';
        return '<button type="button" class="pill' + on + '" data-acctab="' + name + '">' + tabNames[/** @type {AccountTab} */ (name)] + '</button>';
      })
      .join('');
    return '<div class="pills">' + pills + '</div>' + tabBody(model, person.id, tab) + '<a class="btn ghost" href="#accounts">رجوع</a>';
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   * @param {AccountTab} tab
   */
  function tabBody(model, partyId, tab) {
    if (tab === 'agreements') return agreementsHtml(model, partyId) + actionHtml(tab);
    if (tab === 'movements') return movementsHtml(model, partyId) + actionHtml(tab);
    if (tab === 'statement') return statementHtml(model, partyId) + actionHtml(tab);
    return overviewHtml(model, partyId);
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function scopePills(model, partyId) {
    const flag = readAccountScope();
    const ids = new Set();
    for (const row of model.txns) if (row && row.partyId === partyId && row.projectId) ids.add(row.projectId);
    for (const row of model.agreements) if (row && row.partyId === partyId && row.projectId) ids.add(row.projectId);
    const projects = model.projects.filter(project => project && ids.has(project.id));
    const allOn = flag.scope === 'all' ? ' on' : '';
    const proj = projects
      .map(project => {
        const on = flag.scope === 'project' && flag.projectId === project.id ? ' on' : '';
        const name = project.name || project.id;
        return '<button type="button" class="pill' + on + '" data-acproj="' + esc(project.id) + '">' + esc(name) + '</button>';
      })
      .join('');
    return '<div class="pills"><button type="button" class="pill' + allOn + '" data-acscope="all">كل المشاريع</button>' + proj + '</div>';
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function overviewHtml(model, partyId) {
    const figures = personFigures(model, partyId);
    const flag = readAccountScope();
    const projectWord = flag.scope === 'project' ? 'هذا المشروع' : 'كل المشاريع';
    if (!figures) return scopePills(model, partyId) + '<div class="card"><div class="note">لا يوجد</div></div>';
    const net = figures.net;
    const owed = net < 0 ? ['مستحق عليه', -net] : ['مستحق له', net > 0 ? net : 0];
    const lines = [
      ['عمل معتمد', figures.approvedLabor],
      ['مدفوع للعمل', figures.payments],
      ['سلف قائمة عليه', figures.openAdvances],
      owed,
    ];
    const body = lines.map(([label, amount]) => '<div class="kv"><span>' + label + '</span>' + money(/** @type {number} */ (amount)) + '</div>').join('');
    return scopePills(model, partyId) + '<div class="card"><div class="note">' + projectWord + '</div>' + body + '</div>';
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function agreementsHtml(model, partyId) {
    const methodName = { lump: 'مبلغ مقطوع', unit: 'حسب الإنجاز (الكمية × سعر الوحدة)', daily: 'باليوم', milestone: 'مرحلة' };
    const cards = model.agreements.filter(row => row && row.partyId === partyId && !String(row.id).startsWith('rev_'));
    if (!cards.length) return '<div class="card"><div class="note">لا توجد عقود.</div></div>';
    return cards
      .map(row => {
        const reversed = model.agreements.some(item => item && (item.id === 'rev_' + row.id || item.reversesId === row.id));
        const method = methodName[/** @type {'lump'} */ (row.method)] || '';
        const mark = reversed ? '<small>معكوس</small>' : '';
        return '<div class="card"><div class="kv"><span>الوصف</span><b>' + esc(row.description || '') + '</b></div><div class="kv"><span>' + esc(method) + '</span>' + mark + '</div></div>';
      })
      .join('');
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function movementsHtml(model, partyId) {
    const filter = model.screen.filter;
    const filters = [
      ['all', 'كل'],
      ['payments', 'الدفعات'],
      ['advances', 'السلف'],
      ['measurements', ''],
    ];
    const pills = filters
      .map(([id, label]) => {
        const on = id === filter ? ' on' : '';
        const text = label || ' ';
        return '<button type="button" class="pill' + on + '" data-acfilter="' + id + '">' + text + '</button>';
      })
      .join('');
    const flag = readAccountScope();
    const figures = personFigures(model, partyId);
    const pending = new Set((figures && figures.pendingIds) || []);
    const over = new Set((figures && figures.overLimitIds) || []);
    const unreviewed = new Set((figures && figures.unreviewedCashIds) || []);
    const sent = new Set(outbox());
    const body = model.txns
      .filter(row => row && row.partyId === partyId && inFilter(row.purpose || '', filter))
      .filter(row => flag.scope !== 'project' || !flag.projectId || row.projectId === flag.projectId)
      .map(row => {
        const index = model.index;
        const refused = index && Object.prototype.hasOwnProperty.call(index.syncErrors, row.id);
        const word = statusWord(row, index);
        const bits = [word];
        if (refused) bits.push('رُفض الإرسال');
        if (pending.has(row.id)) bits.push('بانتظار الاعتماد');
        if (unreviewed.has(row.id)) bits.push('غير مدقّق');
        if (sent.has(row.id)) bits.push('لم يُرسل');
        if (over.has(row.id) && (row.purpose === 'payLabor' || row.purpose === 'refundLabor')) bits.push('المُرجَع أكبر من الدفعة');
        if (over.has(row.id) && row.purpose === 'approveLabor') bits.push('الخصم أكبر من العمل المعتمد');
        const amount = row.purpose === 'approveDeduct' || typeof row.amount !== 'number' ? '' : money(row.amount);
        return '<div class="card" data-purpose="' + esc(row.purpose || '') + '"><span>' + esc(bits.filter(Boolean).join(' ')) + '</span>' + amount + '</div>';
      })
      .join('');
    const empty = body ? '' : '<div class="note">لا يوجد</div>';
    return '<div class="pills">' + pills + '</div>' + empty + body;
  }

  /**
   * @param {AccountModel} model
   * @param {string} partyId
   */
  function statementHtml(model, partyId) {
    const doc = statementFor(model.user, partyId);
    const flag = readAccountScope();
    const weekOn = flag.periodKind === 'week' ? ' on' : '';
    const monthOn = flag.periodKind === 'month' ? ' on' : '';
    const period = accountPeriod();
    const dates = period
      ? '<label class="field">من<input id="statement-from" value="' + esc(flag.anchorDate) + '"></label><div class="kv"><span>من</span><b>' + esc(period.periodStart) + '</b></div><div class="kv"><span>إلى</span><b>' + esc(period.periodEnd) + '</b></div>'
      : '';
    const lines = doc.lines.map(line => '<div class="kv"><span>' + esc(line.label) + '</span>' + money(line.amount) + '</div>').join('');
    const pending = doc.pendingIds.length ? '<div class="note">بانتظار الاعتماد</div>' : '';
    const blocked = doc.unreviewedCashIds.length || doc.overLimitIds.length ? '<div class="note">لا يُعتمد الكشف وفيه مبلغ غير مدقّق</div>' : '';
    const note = '<div class="note">الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.</div>';
    return (
      '<div class="pills"><button type="button" class="pill' + weekOn + '" data-acperiod="week">أسبوعي</button><button type="button" class="pill' + monthOn + '" data-acperiod="month">شهري</button></div>' +
      dates +
      '<div class="card">' +
      lines +
      pending +
      blocked +
      note +
      '</div>'
    );
  }

  /**
   * @param {RenderApi} next
   */
  function install(next) {
    api = next;
    next.views.accounts = () => listHtml(modelFor(me()));
    next.views.account = arg => accountHtml(modelFor(me()), arg || '');
    next.titles.accounts = 'حسابات';
    next.titles.account = 'حسابات';
  }

  function accountGlyph() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '5');
    rect.setAttribute('y', '4');
    rect.setAttribute('width', '14');
    rect.setAttribute('height', '16');
    rect.setAttribute('rx', '2');
    svg.append(rect);
    return svg;
  }

  /**
   * @param {{ role?: string } | null | undefined} user
   */
  function syncTab(user) {
    const tabs = document.querySelector('.tabs');
    if (!tabs) return;
    let link = /** @type {HTMLAnchorElement | null} */ (tabs.querySelector('[data-tab="accounts"]'));
    if (!user || !Ledger.can(user, 'owner')) {
      if (link) link.remove();
      return;
    }
    if (!link) {
      link = document.createElement('a');
      link.href = '#accounts';
      link.dataset.tab = 'accounts';
      const span = document.createElement('span');
      span.textContent = 'حسابات';
      link.append(accountGlyph(), span);
      tabs.appendChild(link);
    }
  }

  /**
   * @param {HTMLButtonElement} button
   */
  function onClick(button) {
    if (!button) return false;
    for (const action of registry) {
      if (action && action.onClick && action.onClick(button)) return true;
    }
    if (button.disabled) return false;
    if (button.dataset.acctab) {
      const next = button.dataset.acctab;
      if (next === 'overview' || next === 'agreements' || next === 'movements' || next === 'statement') screen.tab = next;
      if (api) api.render();
      return true;
    }
    if (button.dataset.acfilter) {
      const next = button.dataset.acfilter;
      if (next === 'all' || next === 'payments' || next === 'advances' || next === 'measurements') screen.filter = next;
      if (api) api.render();
      return true;
    }
    if (button.dataset.acscope === 'all') {
      writeAccountScope({ scope: 'all', projectId: '', periodKind: readAccountScope().periodKind, anchorDate: readAccountScope().anchorDate });
      if (api) api.render();
      return true;
    }
    if (button.dataset.acproj) {
      writeAccountScope({
        scope: 'project',
        projectId: button.dataset.acproj,
        periodKind: readAccountScope().periodKind,
        anchorDate: readAccountScope().anchorDate,
      });
      if (api) api.render();
      return true;
    }
    if (button.dataset.acperiod === 'week' || button.dataset.acperiod === 'month') {
      const flag = readAccountScope();
      writeAccountScope({ scope: flag.scope, projectId: flag.projectId, periodKind: button.dataset.acperiod, anchorDate: flag.anchorDate });
      if (api) api.render();
      return true;
    }
    if (button.id === 'party-new') {
      screen.creating = true;
      screen.formId = screen.formId || uuid();
      if (api) api.render();
      return true;
    }
    if (button.id === 'save-party') {
      button.disabled = true;
      const field = /** @type {HTMLInputElement | null} */ (document.querySelector('#party-name'));
      const name = field ? field.value : screen.name;
      screen.name = name;
      if (partyErrors(name).length) {
        button.disabled = false;
        return true;
      }
      const id = screen.formId || uuid();
      screen.formId = id;
      const user = me();
      const row = {
        id,
        docType: 'party',
        name: name.trim(),
        createdBy: user && user.uid ? user.uid : '',
        createdAtServer: null,
        deviceId: deviceId || '',
      };
      const parties = /** @type {{ id: string }[]} */ (rows(K.parties, []));
      commitDoc(id, row, parties, next => {
        set(K.parties, next);
      });
      screen.creating = false;
      screen.formId = '';
      screen.name = '';
      if (api) api.render();
      return true;
    }
    return false;
  }

  /**
   * @param {HTMLElement} el
   */
  function onInput(el) {
    if (!el || el.id !== 'statement-from') return false;
    const input = /** @type {HTMLInputElement} */ (el);
    const flag = readAccountScope();
    writeAccountScope({ scope: flag.scope, projectId: flag.projectId, periodKind: flag.periodKind, anchorDate: input.value });
    return true;
  }

  return {
    install,
    syncTab,
    onClick,
    onInput,
    readAccountScope,
    writeAccountScope,
    accountPeriod,
    modelFor,
    accountHtml,
    listHtml,
    statementFor,
    commitDoc,
    partyErrors,
    canCreateParty,
  };
});
