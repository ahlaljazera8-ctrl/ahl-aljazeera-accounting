// Types for `tsc --noEmit` only. Nothing here is loaded by the app.
// Classic scripts publish these names on window and also call them bare.
interface DomSafeApi {
  ID_RE: RegExp;
  escapeHtml(value: unknown): string;
  isSafeId(id: unknown): boolean;
  projectAttr(id: unknown): string;
  projectHref(kind: unknown, id: unknown): string;
  entryHref(id: unknown): string;
  projectButton(id: unknown, name: unknown, selected: boolean): string;
}

interface AppCheckProvider {
  // The ReCaptchaV3Provider instance. This file only passes it through.
}

interface AppCheckOptions {
  provider: AppCheckProvider;
  isTokenAutoRefreshEnabled: boolean;
}

interface AppCheckSdk {
  initializeAppCheck(app: unknown, options: AppCheckOptions): AppCheckHandle;
  ReCaptchaV3Provider: new (siteKey: string) => AppCheckProvider;
}

// The object initializeAppCheck returns. This file does not read its fields.
interface AppCheckHandle {
  [key: string]: unknown;
}

interface AppCheckApi {
  FB_VER: string;
  SDK_URL: string;
  PLACEHOLDER: string;
  siteKeyReady(siteKey: unknown): siteKey is string;
  initAppCheck(app: unknown, siteKey: unknown, importSdk?: unknown): Promise<AppCheckHandle | null>;
}

interface SyncRow {
  id?: string;
  projectId?: unknown;
  direction?: unknown;
  entryType?: string;
  amount?: unknown;
  currency?: string;
  name?: string;
  entryDate?: unknown;
  isReversal?: boolean;
  createdBy?: unknown;
  description?: unknown;
  partyName?: unknown;
  createdByName?: unknown;
  subcontractId?: unknown;
  reversesEntryId?: unknown;
}

interface SyncFailure {
  timeout?: boolean;
  code?: string;
  message?: string;
}

interface FlushRow {
  id?: string;
  message?: string;
}

interface FlushResult {
  synced?: readonly string[];
  failed?: readonly FlushRow[];
  kept?: readonly string[];
}

interface SyncErrorMap {
  [id: string]: string | undefined;
}

interface FirestoreSnap {
  exists(): boolean;
  data(): unknown;
}

interface FirestoreModule {
  doc(db: unknown, collectionName: string, id: string): unknown;
  getDocFromServer(ref: unknown): Promise<FirestoreSnap>;
}

interface SyncStatusApi {
  FB_VER: string;
  FIRESTORE_URL: string;
  REJECTED: string;
  CONFLICT: string;
  UNVERIFIED: string;
  sameContent(local: SyncRow | null | undefined, remote: SyncRow | null | undefined): boolean;
  sameReversal(local: SyncRow | null | undefined, remote: SyncRow | null | undefined): boolean;
  isTransient(err: SyncFailure | null | undefined): boolean;
  isAlreadyExists(err: SyncFailure | null | undefined): boolean;
  isDeadAuth(err: SyncFailure | null | undefined): boolean;
  failureMessage(
    err: SyncFailure | null | undefined,
    local: SyncRow | null | undefined,
    remote: SyncRow | null | undefined,
    unverified?: boolean,
  ): string;
  applyFlush(
    outbox: readonly string[] | null | undefined,
    errors: SyncErrorMap | null | undefined,
    result: FlushResult | null | undefined,
  ): { outbox: string[]; errors: SyncErrorMap };
  badgeHtml(
    id: string,
    outboxIds: readonly string[] | null | undefined,
    errors: SyncErrorMap | null | undefined,
  ): string;
  readRemote(db: unknown, collectionName: string, id: string, importSdk?: unknown): Promise<unknown>;
}

interface EntryTypeInfo {
  label: string;
  direction: string;
}

interface LedgerPolicy {
  siteCanCreateClientPayment: boolean;
  siteCanReverseOwn: boolean;
  siteSeesOnlyAssigned: boolean;
}

interface LedgerUser {
  uid?: string;
  role?: string;
  active?: boolean;
  displayName?: string;
  assignedProjectIds?: readonly string[];
  [key: string]: unknown;
}

interface SessionCache {
  projects?: LedgerProject[];
  entries?: LedgerEntry[];
  outbox?: string[];
  users?: LedgerUser[];
  sessionUser?: LedgerUser | null;
  role?: string;
  deviceId?: string;
  statusPending?: string[];
  [key: string]: unknown;
}

interface SessionProfileInput {
  displayName?: string;
  email?: string;
  role?: string;
  active?: unknown;
  assignedProjectIds?: unknown;
  createdAtServer?: unknown;
  createdBy?: string;
}

interface SessionFirebase {
  currentUser(): Promise<{ uid: string } | null>;
  idToken?(force?: boolean): Promise<unknown>;
  profile(uid: string): Promise<{ active?: boolean } | null | undefined>;
}

interface OutboxRow {
  id: string;
  queuedAt: number;
}

interface LedgerProject {
  id?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
}

interface LedgerEntry {
  id?: string;
  projectId?: string;
  direction?: string;
  entryType?: string;
  amount?: number;
  currency?: string;
  entryDate?: unknown;
  description?: string;
  partyName?: string;
  isReversal?: boolean;
  reversesEntryId?: string;
  reversalReason?: unknown;
  createdBy?: string;
  createdByName?: string;
  createdAtDevice?: unknown;
  createdAtServer?: number | null;
  deviceId?: unknown;
  subcontractId?: string;
  name?: string;
  [key: string]: unknown;
}

interface LedgerSubcontract {
  id?: string;
  projectId?: string;
  [key: string]: unknown;
}

interface ValidateCtx {
  user?: LedgerUser | null;
  ledger?: readonly LedgerEntry[];
  projects?: readonly LedgerProject[];
  policy?: LedgerPolicy;
  subcontracts?: readonly LedgerSubcontract[] | null;
}

interface LedgerViewCtx {
  syncErrors?: Record<string, unknown>;
  projects?: readonly LedgerProject[];
  entries?: readonly LedgerEntry[];
  policy?: LedgerPolicy;
  [key: string]: unknown;
}

interface AmountResult {
  ok: boolean;
  amount?: number;
  error?: string;
}

interface ExportField {
  key: string;
  label: string;
  value: string;
}

interface ReversalCtx {
  user: LedgerUser;
  reason?: unknown;
  now?: unknown;
  deviceId?: unknown;
  entryDate?: unknown;
  id?: unknown;
}

interface LedgerBook {
  all(): LedgerEntry[];
  append(entry: LedgerEntry, ctx: ValidateCtx): LedgerEntry;
}

interface LedgerTotals {
  received?: number;
  spent: number;
  profit?: number;
  byType: Record<string, number>;
}

interface PageOpts {
  limit?: number | null;
}

interface ProjectListRow {
  id?: string;
  type: string;
  amount: string;
  entryDate: string;
  recorder: string;
  party: string;
  reversalStatus: string;
}

interface SubcontractFigures {
  agreed: number;
  paid: number;
  remaining: number;
  over: boolean;
  settled: boolean;
  width: number;
}

interface LedgerApi {
  ENTRY_TYPES: Record<string, EntryTypeInfo>;
  DEFAULT_POLICY: LedgerPolicy;
  MAX_AMOUNT_IQD: number;
  PROJECT_ENTRY_PAGE: number;
  sign(entry: LedgerEntry): number;
  totals(entries: readonly LedgerEntry[]): LedgerTotals;
  can(user: LedgerUser | null | undefined, action: string): boolean;
  canSeeProject(user: LedgerUser, project: LedgerProject, policy?: LedgerPolicy): boolean;
  visibleProjects(user: LedgerUser, projects: readonly LedgerProject[], policy?: LedgerPolicy): LedgerProject[];
  projectList(
    user: LedgerUser,
    projects: readonly LedgerProject[],
    policy: LedgerPolicy | undefined,
    list: string,
  ): LedgerProject[];
  nextProjectStatus(
    user: LedgerUser | null | undefined,
    project: LedgerProject | null | undefined,
    action: string,
  ): string | null;
  visibleEntries(
    user: LedgerUser,
    entries: readonly LedgerEntry[],
    projects: readonly LedgerProject[],
    policy?: LedgerPolicy,
  ): LedgerEntry[];
  projectSummary(user: LedgerUser, entries: readonly LedgerEntry[]): LedgerTotals;
  validateEntry(entry: LedgerEntry, ctx: ValidateCtx): string[];
  parseAmount(raw: unknown, opts?: { allowZero?: boolean }): AmountResult;
  recorderName(user: LedgerUser | null | undefined): string;
  displayRecorder(entry: LedgerEntry | null | undefined): string;
  reversalId(originalId: string | undefined): string;
  createLedger(initial?: readonly LedgerEntry[]): LedgerBook;
  makeReversal(orig: LedgerEntry, ctx: ReversalCtx): LedgerEntry;
  toCSV(entries: readonly LedgerEntry[], projects: readonly LedgerProject[]): string;
  CSV_COLS: readonly string[];
  canExportCSV(user: LedgerUser): boolean | undefined;
  canCreateProject(user: LedgerUser): boolean | undefined;
  countedEntries(
    entries: readonly LedgerEntry[] | null | undefined,
    errors: Record<string, unknown> | null | undefined,
  ): LedgerEntry[];
  fmt(n: number): string;
  subcontractBalance(
    originalAmount: number,
    amendments: readonly LedgerEntry[] | null | undefined,
    entries: readonly LedgerEntry[] | null | undefined,
    subcontractId: string,
  ): SubcontractFigures;
  baghdadTime(ms: unknown): string;
  entryExportFields(
    user: LedgerUser | null | undefined,
    entry: LedgerEntry | null | undefined,
    ctx?: LedgerViewCtx,
  ): ExportField[] | null;
  entryToCSV(
    user: LedgerUser | null | undefined,
    entry: LedgerEntry | null | undefined,
    ctx?: LedgerViewCtx,
  ): string | null;
  projectEntryList(
    user: LedgerUser | null | undefined,
    projectId: string,
    ctx?: LedgerViewCtx,
    opts?: PageOpts | null,
  ): { rows: ProjectListRow[]; total: number; reads: number } | null;
}

interface ServerStamp {
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
}

interface SyncDoc {
  id?: string;
  projectId?: string;
  entryType?: string;
  name?: string;
  currency?: string;
  agreedOn?: string;
  subcontractId?: string;
  date?: string;
  isExample?: boolean;
  deviceId?: string;
  description?: string;
  partyName?: string;
  createdByName?: string;
  isReversal?: boolean;
  reversesEntryId?: string;
  reversalReason?: unknown;
  contractAmount?: number;
  location?: string;
  createdAtServer?: number | null;
  createdBy?: string;
  amount?: number;
  note?: string;
  work?: string;
  clientName?: string;
  status?: string;
  createdAtDevice?: unknown;
  [key: string]: unknown;
}

interface SyncUser {
  uid?: string;
  role?: string;
  active?: boolean;
  assignedProjectIds?: readonly string[] | null;
  [key: string]: unknown;
}

interface ReadSpec {
  collection: string;
  id?: string;
  where?: readonly (readonly [
    string,
    '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in',
    unknown,
  ])[];
}

interface DeleteDoc {
  collection: string;
  id: string;
}

interface DeleteFound {
  entryIds?: readonly string[] | null;
  subcontractIds?: readonly string[] | null;
  amendmentIds?: readonly string[] | null;
  termIds?: readonly string[] | null;
  finance?: unknown;
}

interface LocalStore {
  entries?: readonly SyncDoc[] | null;
  projects?: readonly SyncDoc[] | null;
  subcontracts?: readonly SyncDoc[] | null;
  amendments?: readonly SyncDoc[] | null;
  finance?: Record<string, { contractAmount?: number }> | null;
  terms?: Record<string, { originalAmount?: number }> | null;
  outbox?: readonly string[] | null;
  syncErrors?: Record<string, unknown> | null;
  statusPending?: readonly string[] | null;
  [key: string]: unknown;
}

interface FlushCall {
  ids: readonly string[];
  load: (id: string) => SyncDoc | null | undefined;
  write: (local: SyncDoc) => unknown;
  exists?: (local: SyncDoc) => unknown;
  readServer?: (local: SyncDoc) => unknown;
}

interface PullCall {
  user?: SyncUser | null;
  watermark?: { entries?: unknown; projects?: unknown };
  read: (spec: ReadSpec) => Promise<readonly SyncDoc[]>;
  localEntries?: readonly SyncDoc[] | null;
  localProjects?: readonly SyncDoc[] | null;
  pendingIds?: readonly string[] | null;
  [key: string]: unknown;
}

interface SubPull {
  user?: SyncUser | null;
  since?: unknown;
  read: (spec: ReadSpec) => Promise<readonly SyncDoc[]>;
}

interface PersonValue {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  active: boolean;
  assignedProjectIds: string[];
}

interface PersonResult {
  ok: boolean;
  errors?: string[];
  value?: PersonValue;
}

interface DroppedProject {
  entries: LedgerEntry[];
  projects: LedgerProject[];
  subcontracts: SyncDoc[];
  amendments: SyncDoc[];
  finance: Record<string, { contractAmount?: number }>;
  terms: Record<string, { originalAmount?: number }>;
  outbox: string[];
  syncErrors: Record<string, unknown>;
  statusPending: string[];
}

interface SyncApi {
  isSeed(doc: SyncDoc | null | undefined): boolean;
  collectionFor(doc: SyncDoc | null | undefined): string | null;
  toRemote(doc: SyncDoc): SyncDoc;
  withServerTime(doc: SyncDoc, sentinel: unknown): SyncDoc;
  fromRemote(data: SyncDoc): SyncDoc;
  mergeById(
    local: readonly SyncDoc[] | null | undefined,
    incoming: readonly SyncDoc[] | null | undefined,
    pendingIds: readonly string[] | null | undefined,
  ): SyncDoc[];
  siteReads(uid: string | null | undefined, projectIds: readonly string[] | null | undefined): readonly ReadSpec[];
  pullChanges(opts: PullCall): Promise<{
    entries: SyncDoc[];
    projects: SyncDoc[];
    incomingEntries: SyncDoc[];
    incomingProjects: SyncDoc[];
    watermark: { entries: number | null; projects: number | null };
    missingProjectIds: string[];
  }>;
  flushOutbox(opts: FlushCall): Promise<{
    synced: string[];
    kept: string[];
    failed: { id: string; message: string }[];
    adopted: { id: string; remote: SyncDoc }[];
    authDead: boolean;
  }>;
  contractAmountOf(doc: SyncDoc | null | undefined): number | null;
  withoutContractAmount(doc: SyncDoc | null | undefined): SyncDoc | null | undefined;
  splitProjectSave(
    project: SyncDoc | null | undefined,
    amount?: unknown,
  ): {
    project: SyncDoc | null | undefined;
    finance: { contractAmount: number } | null;
  };
  projectsForClient(
    user: SyncUser | null | undefined,
    projects: readonly SyncDoc[] | null | undefined,
  ): (SyncDoc | null | undefined)[];
  financeReads(
    user: SyncUser | null | undefined,
    projectIds: readonly string[] | null | undefined,
  ): readonly ReadSpec[];
  personInput(input: SyncUser | null | undefined): PersonResult;
  readSetKey(user: SyncUser | null | undefined): string;
  readSetChanged(prev: SyncUser | null | undefined, next: SyncUser | null | undefined): boolean;
  stripMoney(doc: SyncDoc | null | undefined): SyncDoc | null | undefined;
  termsPayload(amount: unknown): { originalAmount: number } | null;
  subcontractReads(user: SyncUser | null | undefined, since: unknown): readonly ReadSpec[];
  pullSubcontracts(opts: SubPull): Promise<{
    subcontracts: SyncDoc[];
    amendments: SyncDoc[];
    watermark: number | null;
  }>;
  exactProjectName(typed: unknown, name: unknown): boolean;
  projectDeleteDocs(projectId: string | undefined, found: DeleteFound | null | undefined): DeleteDoc[];
  projectDeleteBatches(docs: readonly DeleteDoc[] | null | undefined): DeleteDoc[][];
  missingRequestedIds(
    specs: readonly ReadSpec[] | null | undefined,
    rows: readonly SyncDoc[] | null | undefined,
  ): string[];
  dropProjectLocal(
    store: LocalStore | null | undefined,
    projectId: string,
    opts: { dropPending?: boolean } | null | undefined,
  ): DroppedProject;
}

interface Window {
  Ledger: LedgerApi;
  AJ: any;
  FIREBASE_CONFIG: any;
  Sync: SyncApi;
  SyncStatus: SyncStatusApi;
  DomSafe: DomSafeApi;
  AppCheck: AppCheckApi;
  __loginSeen?: boolean;
  __forceOffline?: boolean;
  __unhandled?: string[];
  __printed?: number;
}

declare const Ledger: Window['Ledger'];
declare const AJ: Window['AJ'];
declare const SyncStatus: Window['SyncStatus'];
declare const DomSafe: DomSafeApi;
declare const AppCheck: AppCheckApi;

// session.js and app.js are classic scripts. checkJs treats each file as a module,
// so the names they share are declared here. Nothing here is loaded by the app.
declare var K: Record<string, string>;
declare var cache: Record<string, any>;
declare var db: IDBDatabase | null;
declare var writing: Promise<unknown>;
declare var sessionEpoch: number;
declare var deviceId: string | undefined;
declare var directoryPromise: Promise<unknown> | null;
declare var syncNotice: string;
declare var REPAIR_MSG: string;
declare var SUSPENDED_MSG: string;
declare var SESSION_DEAD_MSG: string;
declare var MISSING_PROFILE_MSG: string;
declare function get(k: string, d?: any): any;
declare function set(k: string, v: any): Promise<unknown>;
declare function openDB(name: string): Promise<IDBDatabase>;
declare function loadAll(): Promise<void>;
declare function uuid(): string;
declare function today(): string;
declare function demoRole(): string;
declare function me(): any;
declare function $(selector: string): any;
declare function showLogin(): void;
declare function showApp(): void;
declare function markReady(): void;
declare function profileFrom(uid: string, data: any): any;
declare function loginError(err: any): string;
declare function showLoginMessage(message: string): void;
declare function holdSession(message: string): Promise<void>;
declare function localSession(): Promise<any>;
declare function openUserDb(uid: string): Promise<void>;
declare function enterSession(fb: any, uid: string, data: any): Promise<void>;
declare function closeSession(): Promise<boolean>;
declare function ensureFirebase(): Promise<any>;
declare function disposeFirebase(signOutUser?: boolean): Promise<void>;
declare function isDeadAuth(err: any): boolean;
declare function render(): void;
declare function flushRemote(): Promise<unknown>;
declare function rebuildFirebase(signOutUser?: boolean): Promise<any>;
declare function isImportFailure(err: any): boolean;
declare function cacheSnapshot(): any;
declare function writeCache(next: any): void;
declare function withTimeout<T>(p: T, ms: number, step: string): Promise<T>;
declare function isPoison(err: any): boolean;
declare var LOGIN_MS: number;
declare var L: any;
declare var POLICY: any;
declare function paintBell(): void;
declare var deleteLock: boolean;
declare var flushing: Promise<unknown> | null;
declare var lastSyncAt: number;

// App errors carry a timeout flag, a Firebase code, or ledger validation messages.
interface Error {
  timeout?: boolean;
  code?: string;
  errors?: string[];
}

// querySelector is Element. The pages only bind HTML controls.
interface Element {
  // Current DOM types `hidden` as `boolean | string` (`until-found`).
  hidden: boolean | string;
  disabled: boolean;
  dataset: DOMStringMap;
  innerText: string;
  click(): void;
}

// iOS Safari. The WebKit upgrade test reads it.
interface Navigator {
  standalone?: boolean;
}

// Listeners use event.target as the element under the pointer.
interface EventTarget {
  closest?(selector: string): Element | null;
  id?: string;
  maxLength?: number;
  selectionStart?: number | null;
  selectionEnd?: number | null;
}
