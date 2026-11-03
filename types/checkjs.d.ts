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

interface Window {
  Ledger: LedgerApi;
  AJ: any;
  FIREBASE_CONFIG: any;
  Sync: any;
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
