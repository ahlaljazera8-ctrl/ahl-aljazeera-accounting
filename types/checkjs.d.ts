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
  docType?: 'foreman' | 'foremanMove' | 'party' | 'agreement' | 'accountTxn' | 'statementApproval' | 'laborReview';
  foremanId?: string;
  kind?: string;
  reversesMoveId?: string;
  date?: string;
  note?: string;
  partyId?: string;
  agreementId?: string;
  targetId?: string;
  settlesId?: string;
  reversesId?: string;
  supersedesId?: string;
  purpose?: string;
  ledger?: string;
  qty?: number;
  fxRate?: number;
  txnDate?: string;
  [key: string]: unknown;
}

interface SyncFailure {
  timeout?: boolean;
  code?: string;
  message?: string;
  client?: boolean;
}

interface FlushRow {
  id?: string;
  message?: string;
}

interface FlushResult {
  synced?: readonly string[];
  failed?: readonly FlushRow[];
  kept?: readonly string[];
  parked?: readonly string[];
}

type DependencyRead =
  { status: 'found'; doc: SyncDoc } | { status: 'missing' } | { status: 'denied' } | { status: 'transient' };

interface SyncErrorMap {
  [id: string]: string | undefined;
}

interface ProjectProbe {
  exists: boolean;
}

interface GoneProjectNames {
  [projectId: string]: string;
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
  PROJECT_DELETED: string;
  sameContent(local: SyncRow | null | undefined, remote: SyncRow | null | undefined): boolean;
  sameReversal(local: SyncRow | null | undefined, remote: SyncRow | null | undefined): boolean;
  payloadDiffers(local: SyncRow | null | undefined, remote: SyncRow | null | undefined): boolean;
  dependencyStatus(
    err: SyncFailure | null | undefined,
    exists: boolean | null,
  ): 'found' | 'missing' | 'denied' | 'transient' | 'auth';
  isTransient(err: SyncFailure | null | undefined): boolean;
  isAlreadyExists(err: SyncFailure | null | undefined): boolean;
  isDeadAuth(err: SyncFailure | null | undefined): boolean;
  failureMessage(
    err: SyncFailure | null | undefined,
    local: SyncRow | null | undefined,
    remote: SyncRow | null | undefined,
    unverified?: boolean,
  ): string;
  messageAfterProjectProbe(baseMessage: string, probe: ProjectProbe | null | undefined, neverSent?: boolean): string;
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

type ForemanMoveKind = 'advance' | 'settle' | 'return';

interface Foreman {
  id?: string;
  name?: string;
  note?: string;
  projectId?: string;
  createdAtServer?: number | null;
  createdBy?: string;
  docType?: 'foreman';
}

interface ForemanMove {
  id?: string;
  foremanId?: string;
  kind?: ForemanMoveKind;
  amount?: number;
  date?: string;
  note?: string;
  isReversal?: boolean;
  reversesMoveId?: string;
  reversalReason?: unknown;
  createdAtDevice?: number;
  createdAtServer?: number | null;
  createdBy?: string;
  deviceId?: string;
  docType?: 'foremanMove';
}

interface ForemanFigures {
  held: number;
  remaining: number;
  owedToForeman: number;
  state: 'holding' | 'owed' | 'settled';
}

interface ForemanExportSummary {
  foremanId: string;
  foremanName: string;
  advances: number;
  settled: number;
  spent: number;
  returned: number;
  remaining: number;
  owedToForeman: number;
}

interface SettleGuard {
  stale: boolean;
  pendingIds: string[];
  lastSync: number | null;
}

interface SessionCache {
  projects?: LedgerProject[];
  entries?: LedgerEntry[];
  outbox?: string[];
  users?: LedgerUser[];
  sessionUser?: LedgerUser | null;
  role?: string;
  deviceId?: unknown;
  statusPending?: string[];
  foremen?: Foreman[];
  foremanMoves?: ForemanMove[];
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
  foremanId?: string;
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
  foremen?: readonly Foreman[] | null;
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
  entryProjectChoice(input: {
    requestedId?: string;
    currentId?: string;
    openIds: readonly string[];
    stored?: readonly { id?: string; status?: string }[] | null;
  }): EntryProjectChoice;
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
  foremanBalance(
    foremanId: string,
    moves: readonly ForemanMove[] | null | undefined,
    entries: readonly LedgerEntry[] | null | undefined,
    errors?: Record<string, unknown> | null,
  ): ForemanFigures;
  FOREMAN_CUSTODY_COLS: readonly string[];
  FOREMAN_SUMMARY_COLS: readonly string[];
  foremanCustodyToCSV(
    foremen: readonly Foreman[] | null | undefined,
    moves: readonly ForemanMove[] | null | undefined,
    entries: readonly LedgerEntry[] | null | undefined,
    projects: readonly LedgerProject[] | null | undefined,
    errors?: Record<string, unknown> | null,
  ): string;
  foremanSummaryToCSV(
    foremen: readonly Foreman[] | null | undefined,
    moves: readonly ForemanMove[] | null | undefined,
    entries: readonly LedgerEntry[] | null | undefined,
    errors?: Record<string, unknown> | null,
  ): string;
  validateForemanMove(
    move: {
      id?: string;
      foremanId?: string;
      kind?: string;
      amount?: number;
      date?: string;
      note?: string;
      isReversal?: boolean;
      reversesMoveId?: string;
      reversalReason?: unknown;
      createdBy?: string;
    },
    ctx: { user?: LedgerUser | null; moves?: readonly ForemanMove[] | null; foremen?: readonly Foreman[] | null },
  ): string[];
  foremanMoveReversal(
    orig: ForemanMove,
    ctx: { user: LedgerUser; reason: string; now: number; deviceId: string; date: string },
  ): ForemanMove;
  settleGuard(
    foremanId: string,
    opts: {
      outbox?: readonly string[] | null;
      moves?: readonly ForemanMove[] | null;
      entries?: readonly LedgerEntry[] | null;
      lastSyncMs?: number | null;
      nowMs: number;
      watermark?: unknown;
    },
  ): SettleGuard;
  foremanDeleteBlock(
    projectId: string,
    entries: readonly LedgerEntry[] | null | undefined,
    foremen: readonly Foreman[] | null | undefined,
    errors: Record<string, unknown> | null | undefined,
  ): string;
  guardedForemanDelete(
    check: unknown,
    projectId: string,
    entries: readonly LedgerEntry[] | null | undefined,
    foremen: readonly Foreman[] | null | undefined,
    errors: Record<string, unknown> | null | undefined,
  ): string;
  personProjectDeleteBlock(
    projectId: string,
    docs: readonly FoldDoc[] | null | undefined,
    parties: readonly { id?: string; name?: string }[] | null | undefined,
    syncErrors: Record<string, unknown> | null | undefined,
    balancesFn: ((docs: readonly FoldDoc[], filter: BalanceFilter) => { net: number }) | null | undefined,
  ): string;
  rememberedProjectName(
    projectId: string,
    projects: readonly LedgerProject[] | null | undefined,
    goneNames: GoneProjectNames | null | undefined,
  ): string;
  deletedProjectEntries(
    user: LedgerUser | null | undefined,
    entries: readonly LedgerEntry[] | null | undefined,
    errors: Record<string, unknown> | null | undefined,
    message: string,
  ): LedgerEntry[];
  canExportRejected(user: LedgerUser | null | undefined): boolean;
  rejectedLogoutBlocked(listed: readonly { id: string }[], exportedIds: readonly string[] | null | undefined): boolean;
  rejectedEntriesToCSV(
    entries: readonly LedgerEntry[],
    projects: readonly LedgerProject[] | null | undefined,
    goneNames: GoneProjectNames | null | undefined,
    errors: Record<string, unknown> | null | undefined,
  ): string;
  REJECTED_HEADERS: readonly string[];
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
  docType?: 'foreman' | 'foremanMove' | 'party' | 'agreement' | 'accountTxn' | 'statementApproval' | 'laborReview';
  foremanId?: string;
  kind?: string;
  reversesMoveId?: string;
  partyId?: string;
  agreementId?: string;
  targetId?: string;
  settlesId?: string;
  reversesId?: string;
  supersedesId?: string;
  purpose?: string;
  method?: string;
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
  foremen?: readonly SyncDoc[] | null;
  foremanMoves?: readonly SyncDoc[] | null;
  parties?: readonly SyncDoc[] | null;
  agreements?: readonly SyncDoc[] | null;
  accountTxns?: readonly SyncDoc[] | null;
  statementApprovals?: readonly SyncDoc[] | null;
  laborReviews?: readonly SyncDoc[] | null;
  slotLosers?: Readonly<Record<string, SyncDoc>> | null;
  linkRefusals?: Readonly<Record<string, SyncDoc>> | null;
  goneProjectNames?: GoneProjectNames | null;
  rejectedExportedIds?: readonly string[] | null;
  [key: string]: unknown;
}

interface QueueStores {
  entries?: readonly SyncDoc[] | null;
  projects?: readonly SyncDoc[] | null;
  subcontracts?: readonly SyncDoc[] | null;
  amendments?: readonly SyncDoc[] | null;
  foremen?: readonly SyncDoc[] | null;
  foremanMoves?: readonly SyncDoc[] | null;
  parties?: readonly SyncDoc[] | null;
  agreements?: readonly SyncDoc[] | null;
  accountTxns?: readonly SyncDoc[] | null;
  statementApprovals?: readonly SyncDoc[] | null;
  laborReviews?: readonly SyncDoc[] | null;
  [key: string]: readonly SyncDoc[] | null | undefined;
}

interface FlushCall {
  ids: readonly string[];
  load: (id: string) => SyncDoc | null | undefined;
  write: (local: SyncDoc) => unknown;
  exists?: (local: SyncDoc) => unknown;
  readServer?: (local: SyncDoc) => unknown;
  projectProbe?: (local: SyncDoc) => Promise<ProjectProbe | null> | ProjectProbe | null;
  readDependency?: (id: string) => Promise<DependencyRead>;
  mintId?: () => string;
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

type EntryProjectBlock = 'missing' | 'archived' | '';

interface EntryProjectChoice {
  projectId: string;
  blocked: EntryProjectBlock;
}

interface RemovedLocalIds {
  projectIds: string[];
  entryIds: string[];
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
  foremen: SyncDoc[];
  foremanMoves: SyncDoc[];
  parties: SyncDoc[];
  agreements: SyncDoc[];
  accountTxns: SyncDoc[];
  statementApprovals: SyncDoc[];
  laborReviews: SyncDoc[];
  slotLosers: Record<string, SyncDoc>;
  linkRefusals: Record<string, SyncDoc>;
  goneProjectNames: GoneProjectNames;
  removed: RemovedLocalIds;
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
    parked: string[];
    slotLosers: { key: string; doc: SyncDoc }[];
    linkRefusals: { localId: string; doc: SyncDoc }[];
    authDead: boolean;
  }>;
  queueRefusal(doc: SyncDoc | null | undefined): string | null;
  localDoc(id: string, stores: QueueStores | null | undefined): SyncDoc | null;
  accountReads(user: SyncUser | null | undefined, since: unknown): readonly ReadSpec[];
  pullAccounts(opts: SubPull): Promise<{
    parties: SyncDoc[];
    agreements: SyncDoc[];
    accountTxns: SyncDoc[];
    statementApprovals: SyncDoc[];
    laborReviews: SyncDoc[];
    watermark: number | null;
  }>;
  ACCOUNTS_MARK: string;
  slotLoserKey(id: string): string;
  slotLoserViews(
    losers: Readonly<Record<string, SyncDoc>> | null | undefined,
  ): { key: string; doc: SyncDoc; readOnly: true }[];
  linkRefusalViews(
    refusals: Readonly<Record<string, SyncDoc>> | null | undefined,
  ): { key: string; doc: SyncDoc; readOnly: true }[];
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
  FOREMEN: string;
  FOREMAN_MOVES: string;
  usesPutIfMissing(col: string | null | undefined): boolean;
  foremanReads(user: SyncUser | null | undefined, since: unknown): readonly ReadSpec[];
  pullForemen(opts: SubPull): Promise<{
    foremen: SyncDoc[];
    moves: SyncDoc[];
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

interface RenderApi {
  views: Record<string, (arg: string) => string>;
  titles: Record<string, string>;
  state: Record<string, unknown>;
  render(): void;
  esc(s: unknown): string;
  money(n: number, cls?: string): string;
  queueDoc(id: string): void;
  confirmShell(inner: string, labelId?: string): string;
  lastSyncAt(): number;
  formatSyncTime(ms: number): string;
  saveCsvFiles?(list: readonly { csv: string; filename: string }[]): Promise<'shared' | 'downloaded' | 'aborted'>;
}

interface SettleParts {
  lead: string;
  amount: string;
  tail: string;
  after: string;
}

interface ForemenUiApi {
  install(api: RenderApi): void;
  onClick(b: HTMLButtonElement): boolean;
  onInput(el: HTMLElement): boolean;
  settleParts(kind: string, amount: number, owed: number): SettleParts;
  syncLine(lastSyncMs: number, format?: (ms: number) => string): string;
}

type ActionTab = 'agreements' | 'movements' | 'statement' | 'contractor';
type AccountTab = 'overview' | 'agreements' | 'movements' | 'statement';
type MovementFilter = 'all' | 'payments' | 'advances' | 'measurements';

interface AccountAction {
  id: string;
  tab: ActionTab;
  label: string;
  buttonId: string;
  renderForm: () => string;
  onClick: (button: HTMLButtonElement) => boolean;
  save: (input: object) => { doc: object | null; errors: string[] };
}

interface AccountScopeFlag {
  scope: 'project' | 'all';
  projectId: string;
  periodKind: 'week' | 'month';
  anchorDate: string;
}

interface AccountScreen {
  tab: AccountTab;
  filter: MovementFilter;
  creating: boolean;
  formId: string;
  name: string;
  msg: string;
  today: string;
}

interface PendingRow {
  id: string;
  label: string;
  amount: number;
}

interface AccountModel {
  user: { role?: string; uid?: string } | null;
  parties: Array<{ id: string; name: string }>;
  agreements: Array<{
    id: string;
    partyId?: string;
    projectId?: string;
    method?: string;
    description?: string;
    reversesId?: string;
  }>;
  txns: FoldDoc[];
  projects: Array<{ id: string; name?: string }>;
  figures: Balance | null;
  lines: StatementLine[];
  pending: PendingRow[];
  canCreate: boolean;
  screen: AccountScreen;
  index: RowIndex | null;
  statement: ReturnType<AccountsApi['statementLines']> | null;
}

interface AccountModule {
  install(api: RenderApi): void;
}

interface GroupedAmountInput {
  value: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  setSelectionRange?(start: number, end: number): void;
}

interface AccountPaymentApi {
  install(api: RenderApi): void;
  paymentSplit(amount: number, approvedUnpaid: number): { payLabor: number; advanceLabor: number };
  cashDoc(
    purpose: 'payLabor' | 'advanceLabor' | 'returnAdvance' | 'refundLabor',
    input: object,
  ): { doc: object | null; errors: string[] };
  reviewDoc(input: object): { doc: object | null; errors: string[] };
  /** Western thousands grouping. A later screen can reuse this without a second copy. */
  groupThousands(raw: string): string;
  /** Digits only. Commas are not part of the saved amount. */
  plainAmount(raw: string): number | null;
  /** Group the field and keep the caret on the same digit. */
  applyGroupedAmount(input: GroupedAmountInput): void;
  /** Ids the shared listener groups. #cw-qty, #cw-days, and #cw-per stay out. */
  readonly amountFieldIds: readonly string[];
}

interface AccountCorrectApi {
  install(api: RenderApi): void;
  deductDoc(input: object): { doc: object | null; errors: string[] };
  deductPosition(
    targetId: string,
    amount: number,
  ): { id: string; cumAmount: number } | { error: 'full' | 'blocked' | 'spent' | 'cumulative' | 'targetId' };
  noMoreDeductLine(approvalId: string, cause: 'full' | 'blocked' | 'spent'): string;
  approveDeductDoc(input: object): { doc: object | null; errors: string[] };
  rejectDoc(input: object): { doc: object | null; errors: string[] };
  supersedeDoc(input: object): { doc: object | null; errors: string[] };
  reversalDoc(input: object): { doc: object | null; errors: string[] };
  endMeasurementDocs(input: object): { docs: object[]; errors: string[] };
}

type BookedFigure =
  'approvedLabor' | 'payments' | 'refunds' | 'advancesPaid' | 'cashReturned' | 'deductions' | 'settlements';
interface CorrectionRow {
  key: BookedFigure;
  label: string;
  part: 'late' | 'reversed';
  kind: 'window' | 'tail';
  amount: number;
  effect: 1 | -1 | 0;
  source: { periodStart: string; periodEnd: string };
}
interface BookedStatement {
  periodStart: string;
  periodEnd: string;
  opening: number;
  lines: readonly StatementLine[];
  corrections: readonly CorrectionRow[];
  closing: number;
  issuedAt: number | null;
  queuedIds: readonly string[];
  pendingIds: readonly string[];
  unreviewedCashIds: readonly string[];
  overLimitIds: readonly string[];
  orphanDrawIds: readonly string[];
}
interface Mustakhlas {
  work: number;
  deductions: number;
  advancesNet: number;
  corrections: readonly CorrectionRow[];
  net: number;
}
interface ContractorTotals {
  cost: number;
  paidToContractors: number;
  oldPaid: number;
  unlinked: number;
  newApproved: number;
  newCash: number;
  reclassAdvance: 0;
}

/** One «انخصم» answer (ameer:10, ameer:11). Synced doc in collection laborReviews, id 'lrv_' + entryId (§4.4). */
interface LaborReview {
  id: string;
  docType: 'laborReview';
  entryId: string;
  projectId: string;
  decision: 'deducted';
  reviewedOn: string;
  createdBy: string;
  createdByName: string;
  createdAtServer: number | null;
  deviceId: string;
}

interface ReclassCtx {
  entries: readonly LedgerEntry[];
  txns: readonly FoldDoc[];
  syncErrors: Readonly<Record<string, unknown>>;
  outbox: readonly string[];
  reviews: readonly LaborReview[];
  index: RowIndex;
  activeProjectIds: ReadonlySet<string>;
}

type ReclassState =
  | { kind: 'bothFacts'; expense: LedgerEntry; review: LaborReview; revId: string; advanceIds: readonly string[] }
  | { kind: 'open'; expense: LedgerEntry; canCancel: boolean }
  | { kind: 'reviewed'; expense: LedgerEntry; review: LaborReview }
  | { kind: 'reviewRefused'; expense: LedgerEntry; reviewId: string }
  | { kind: 'revRefused'; expense: LedgerEntry; revId: string }
  | { kind: 'other'; expense: LedgerEntry }
  | { kind: 'revQueued'; expense: LedgerEntry; revId: string }
  | { kind: 'owed'; expense: LedgerEntry; revId: string; refusedAdvanceIds: readonly string[] }
  | { kind: 'advQueued'; expense: LedgerEntry; advanceId: string }
  | { kind: 'done'; expense: LedgerEntry; advanceId: string }
  | { kind: 'duplicate'; expense: LedgerEntry; plan: DuplicatePlan };

interface DuplicatePlan {
  mode: 'oldest' | 'ownerPicks';
  keepId: string;
  reverseIds: readonly string[];
  blockedIds: readonly string[];
}

interface StillOwedInput {
  entry: LedgerEntry;
  reversalReason: string;
  user: LedgerUser;
  deviceId: string;
  entryDate: string;
  now: number;
}

interface AdvanceAfterInput {
  expenseId: string;
  partyId: string;
  projectId: string;
  amount: number;
  advanceId: string;
  createdBy: string;
  createdByName: string;
  deviceId: string;
  originalDate: string;
}

interface AccountReclassApi extends AccountModule {
  token(expenseId: string): string;
  tokenOf(description: unknown): string;
  misbookedCandidates(entries: readonly LedgerEntry[], syncErrors: Readonly<Record<string, unknown>>): readonly LedgerEntry[];
  rowState(expense: LedgerEntry, ctx: ReclassCtx): ReclassState;
  stillOwedReversal(input: StillOwedInput): { doc: LedgerEntry | null; errors: string[] };
  advanceAfterReversal(input: AdvanceAfterInput): { doc: object | null; errors: string[] };
  advanceStillOwed(entries: readonly LedgerEntry[], txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>): readonly LedgerEntry[];
  coveringAdvances(expenseId: string, txns: readonly FoldDoc[], index: RowIndex): readonly FoldDoc[];
  duplicatePlan(covering: readonly FoldDoc[], index: RowIndex): DuplicatePlan;
  hasLiveDraw(advanceId: string, index: RowIndex): boolean;
  refusedAdvanceIds(expenseId: string, txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>): readonly string[];
  reclassTotal(entries: readonly LedgerEntry[], txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>, projectId: string): number;
  reviewDoc(input: { entry: LedgerEntry; user: LedgerUser; deviceId: string; day: string }): { doc: LaborReview | null; errors: string[] };
}
type IssueGateError = 'offline' | 'queued' | 'pull' | 'changed' | 'review' | 'period' | 'open' | 'inactive' | 'epoch';
interface IssueGateResult {
  ok: boolean;
  errors: readonly IssueGateError[];
}
interface BookContext {
  byId: Readonly<Record<string, FoldDoc>>;
  approvals: readonly StatementApprovalRow[];
  syncErrors: Readonly<Record<string, unknown>>;
  today: string;
}
interface PeriodStatementInput {
  docs: readonly FoldDoc[];
  approvals: readonly StatementApprovalRow[];
  syncErrors: Readonly<Record<string, unknown>>;
  outbox: readonly string[];
  partyId: string;
  projectId?: string;
  periodKind: 'week' | 'month';
  periodStart: string;
  periodEnd: string;
  today: string;
}
interface IssueGateInput {
  shown: BookedStatement;
  recompute: () => BookedStatement | null;
  online: () => boolean;
  inFlight: () => Promise<unknown> | null;
  flush: () => Promise<unknown>;
  timeoutMs: number;
  epoch: () => number;
  lastSyncAt: () => number;
  outbox: () => readonly string[];
  now: () => number;
  demo: boolean;
  projectActive: boolean;
  today: string;
}
interface StatementApprovalRow {
  id: string;
  partyId: string;
  projectId?: string;
  periodKind: 'week' | 'month';
  periodStart: string;
  periodEnd: string;
  createdBy: string;
  createdAtServer: number | null;
}
interface SettleInput {
  measurementId: string;
  settlesId: string;
  amount: number;
  gen: string;
  txnDate: string;
  createdBy: string;
  deviceId: string;
  createdByName?: string;
}
interface StatementApprovalInput {
  id: string;
  partyId: string;
  projectId?: string;
  periodKind: 'week' | 'month';
  periodStart: string;
  periodEnd: string;
  createdBy: string;
}
interface AccountStatementApi extends AccountModule {
  bookDay(doc: FoldDoc, ctx: BookContext): string;
  bookedBy(docs: readonly FoldDoc[], day: string, ctx: BookContext): FoldDoc[];
  periodStatement(input: PeriodStatementInput): BookedStatement | null;
  mustakhlas(statement: BookedStatement): Mustakhlas;
  contractorTotals(
    entries: readonly LedgerEntry[],
    txns: readonly FoldDoc[],
    syncErrors: Readonly<Record<string, unknown>>,
    filter: { projectId: string },
  ): ContractorTotals;
  approvedUnitQty(
    txns: readonly FoldDoc[],
    agreements: readonly object[],
    partyId: string,
    index: RowIndex,
    projectId?: string,
  ): number;
  balanceSentence(net: number): { label: string; direction: string; amountText: string };
  settleDoc(input: SettleInput): { doc: object | null; errors: string[] };
  statementApprovalDoc(input: StatementApprovalInput): { doc: object | null; errors: string[] };
  issueGate(input: IssueGateInput): Promise<IssueGateResult>;
  statementCardHtml(statement: BookedStatement): string;
  mustakhlasHtml(statement: BookedStatement): string;
  totalsCardHtml(totals: ContractorTotals): string;
  correctionText(row: CorrectionRow): string;
  renderedShown(): BookedStatement | null;
  settleGen(measurementId: string, index: RowIndex): string;
}

type PayMethod = 'lump' | 'unit' | 'daily' | 'milestone';

interface AgreementDocInput {
  id: string;
  partyId: string;
  projectId: string;
  method: PayMethod;
  description: string;
  lumpAmount?: number;
  unitRate?: number;
  unitQty?: number;
  unitName?: string;
  dayRate?: number;
  milestoneAmount?: number;
  createdBy?: string;
  deviceId?: string;
}

interface StoredAgreement {
  method: PayMethod;
  id: string;
  partyId: string;
  projectId: string;
  description: string;
  currency: 'IQD';
  lumpAmount?: number;
  unitRate?: number;
  unitQty?: number;
  unitName?: string;
  dayRate?: number;
  milestoneAmount?: number;
  milestoneMode?: string;
}

interface LaborWorkInput {
  id?: string;
  agreement?: StoredAgreement;
  agreementId?: string;
  gen?: string;
  approvedQty?: number;
  qty?: number;
  targetId?: string;
  target?: { id: string; purpose: string };
  projectId?: string;
  partyId?: string;
  createdBy?: string;
  createdByName?: string;
  deviceId?: string;
  txnDate?: string;
  amount?: number;
}

interface AccountWorkApi {
  install(api: RenderApi): void;
  syncTab(user: { role?: string } | null | undefined): void;
  slotBodyId(agreementId: string, gen: string): string;
  agreementDoc(input: AgreementDocInput): { doc: object | null; errors: string[] };
  agreementReversalDoc(input: {
    agreement: StoredAgreement;
    reversalReason: string;
    createdBy: string;
    deviceId: string;
  }): { doc: object | null; errors: string[] };
  laborQtyDoc(input: LaborWorkInput): { doc: object | null; errors: string[] };
  approveLaborDoc(input: LaborWorkInput): { doc: object | null; errors: string[] };
  /** بانتظار أمير. Not approved. unitByProgress is not painted. */
  pendingAmeer: { readonly newContract: string; readonly unitByProgress: string };
}

interface AccountsViewApi {
  install(api: RenderApi): void;
  syncTab(user: { role?: string } | null | undefined): void;
  onClick(button: HTMLButtonElement): boolean;
  onInput(el: HTMLElement): boolean;
  readAccountScope(): AccountScopeFlag;
  writeAccountScope(next: AccountScopeFlag): void;
  accountPeriod(): { periodStart: string; periodEnd: string } | null;
  modelFor(user: { role?: string; uid?: string } | null): AccountModel;
  accountHtml(model: AccountModel, partyId: string): string;
  listHtml(model: AccountModel): string;
  statementFor(
    user: { role?: string; uid?: string } | null,
    partyId: string,
  ): ReturnType<AccountsApi['statementLines']>;
  commitDoc(id: string, doc: object, rows: readonly { id: string }[], write: (next: object[]) => void): void;
  partyErrors(name: string): string[];
  canCreateParty(user: { role?: string } | null | undefined): boolean;
}

interface PeopleRow {
  uid?: string;
  displayName?: string;
  email?: string;
  role?: string;
  active?: boolean;
  assignedProjectIds?: readonly string[];
  [key: string]: unknown;
}

interface PeopleLoadState {
  inflight?: boolean;
  failedAt?: number;
  syncedAt?: number;
  online?: boolean;
}

interface PeopleApply {
  stale: boolean;
  next: PeopleRow[];
  changed: boolean;
}

interface PeopleLoadResult {
  skipped?: string;
  changed: boolean;
  stale?: boolean;
}

interface PeopleLoaderDeps {
  now(): number;
  online(): boolean;
  timeoutMs?: number;
  timeout(p: Promise<unknown>, ms: number): Promise<unknown>;
  load(): Promise<unknown>;
  read(): PeopleRow[];
  write(rows: PeopleRow[]): void;
  stamp(ms: number): void;
}

interface PeopleLoader {
  run(reason?: string): Promise<PeopleLoadResult>;
  failed(): boolean;
  reset(): void;
}

interface PeopleDirApi {
  TIMEOUT_MS: number;
  COOLDOWN_MS: number;
  SUCCESS_TTL_MS: number;
  OFFLINE_LEAD: string;
  UPDATE_LEAD: string;
  LOAD_ERROR: string;
  RETRY_LABEL: string;
  RENDER_ERROR: string;
  samePeople(a: readonly PeopleRow[] | null | undefined, b: readonly PeopleRow[] | null | undefined): boolean;
  syncNoteLead(offline: boolean, failed: boolean): string;
  syncNote(lead: string, time: string): string;
  loadPlan(
    state: PeopleLoadState | null | undefined,
    now: number,
    reason: string,
  ): 'inflight' | 'offline' | 'cooldown' | 'fresh' | 'start';
  directoryView(count: number, stamp: number, offline: boolean, failed: boolean): 'ready' | 'note' | 'retry' | 'error';
  acceptGeneration(token: number, current: number): boolean;
  applyPeople(
    token: number,
    current: number,
    prev: readonly PeopleRow[] | null | undefined,
    rows: readonly PeopleRow[] | null | undefined,
  ): PeopleApply;
  shouldRedraw(result: PeopleLoadResult | null | undefined, bannerShowing?: boolean): boolean;
  createLoader(deps: PeopleLoaderDeps): PeopleLoader;
}

interface FoldDoc {
  id: string;
  purpose?: string;
  ledger?: 'labor';
  amount?: number;
  paidAs?: 'payLabor' | 'advanceLabor';
  targetId?: string;
  settlesId?: string;
  reversesId?: string;
  supersedesId?: string;
  partyId?: string;
  projectId?: string;
  currency?: 'IQD' | 'USD';
  txnDate?: string;
  kind?: 'body' | 'appr' | 'rej' | 'sup' | 'rev' | 'revw' | 'stl';
}

interface BalanceFilter {
  partyId?: string;
  projectId?: string;
  currency?: 'IQD';
  periodEnd?: string;
  syncErrors?: Readonly<Record<string, unknown>> | null;
}

interface Balance {
  net: number;
  payableGross: number;
  payable: number;
  recoverable: number;
  openAdvances: number;
  netAdvances: number;
  approvedLabor: number;
  payments: number;
  refunds: number;
  advancesPaid: number;
  cashReturned: number;
  deductions: number;
  settlements: number;
  overLimitIds: readonly string[];
  unreviewedCashIds: readonly string[];
  pendingIds: readonly string[];
}

interface RowIndex {
  byId: Readonly<Record<string, FoldDoc>>;
  byReversesId: Readonly<Record<string, readonly string[]>>;
  bySupersedesId: Readonly<Record<string, readonly string[]>>;
  byTargetId: Readonly<Record<string, readonly string[]>>;
  syncErrors: Readonly<Record<string, unknown>>;
}

interface StatementLine {
  key: string;
  label: string;
  amount: number;
  sign: number;
  entersClosing: boolean;
}

interface StatementFilter extends BalanceFilter {
  periodStart?: string;
}

interface AccountsApi {
  CONTRACTOR_COST_START: string | null;
  PURPOSES: Readonly<
    Record<
      string,
      {
        ledger: 'labor';
        required: readonly string[];
        forbidden: readonly string[];
        points: Readonly<Record<string, readonly string[]>>;
        effect: { cost: number; person: number; cash: number };
        statementLine: string;
        statementSign: number;
        needsApproval: boolean;
      }
    >
  >;
  unitPrice(agreement: object | null | undefined): { amount: number; errors: string[] };
  workPosition(
    agreement: object | null | undefined,
    input: object,
  ): {
    approvedQty: number | null;
    deliveredQty: number | null;
    notCompleted: number | null;
    earned: number;
    errors: string[];
  };
  post(action: string, input?: object): { doc: object | null; errors: string[] };
  personBalance(
    docs: readonly FoldDoc[] | null | undefined,
    syncErrors?: Readonly<Record<string, unknown>> | null,
  ): number;
  cashPointerErrors(
    table: Readonly<
      Record<
        string,
        { needsApproval: boolean; effect: { cash: number }; points: Readonly<Record<string, readonly string[]>> }
      >
    >,
  ): string[];
  projectCost(
    projectId: string,
    legacySpent: number,
    txns: readonly FoldDoc[] | null | undefined,
    syncErrors: Readonly<Record<string, unknown>> | null | undefined,
    start: string | null,
  ): number;
  rowIndex(docs: readonly FoldDoc[], syncErrors?: Readonly<Record<string, unknown>> | null): RowIndex;
  rowLive(row: FoldDoc | null | undefined, index: RowIndex): boolean;
  rowCounts(row: FoldDoc | null | undefined, index: RowIndex): boolean;
  balances(docs: readonly FoldDoc[], filter?: BalanceFilter): Balance;
  statementLines(
    docs: readonly FoldDoc[],
    filter?: StatementFilter,
  ): {
    lines: readonly StatementLine[];
    opening: number;
    closing: number | null;
    pendingIds: readonly string[];
    unreviewedCashIds: readonly string[];
    overLimitIds: readonly string[];
  };
  periodBounds(kind: 'week' | 'month', day: string): { periodStart: string; periodEnd: string } | null;
}

interface Window {
  Ledger: LedgerApi;
  Accounts: AccountsApi;
  AJ: any;
  FIREBASE_CONFIG: any;
  Sync: SyncApi;
  SyncStatus: SyncStatusApi;
  DomSafe: DomSafeApi;
  AppCheck: AppCheckApi;
  ForemenUI: ForemenUiApi;
  PeopleDir: PeopleDirApi;
  AccountsView?: AccountsViewApi;
  AccountWork?: AccountWorkApi;
  AccountPayment?: AccountPaymentApi;
  AccountCorrect?: AccountCorrectApi;
  AccountStatement?: AccountStatementApi;
  AccountReclass?: AccountReclassApi;
  AccountShare?: AccountModule;
  AccountActions?: AccountAction[];
  __loginSeen?: boolean;
  __forceOffline?: boolean;
  __unhandled?: string[];
  __printed?: number;
}

declare const Ledger: Window['Ledger'];
declare const Accounts: Window['Accounts'];
declare const AJ: Window['AJ'];
declare const Sync: Window['Sync'];
declare const SyncStatus: Window['SyncStatus'];
declare const DomSafe: DomSafeApi;
declare const AppCheck: AppCheckApi;
declare const AccountsView: AccountsViewApi;
declare const AccountPayment: AccountPaymentApi;
declare const ForemenUI: ForemenUiApi;
declare const PeopleDir: PeopleDirApi;
declare var AccountActions: AccountAction[];
declare function queueDoc(id: string): void;

// session.js and app.js are classic scripts. checkJs treats each file as a module,
// so the names they share are declared here. Nothing here is loaded by the app.
declare var K: Record<string, string>;
declare var cache: Record<string, any>;
declare var db: IDBDatabase | null;
declare var writing: Promise<unknown>;
declare var sessionEpoch: number;
declare var deviceId: string | undefined;
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
declare function closeSession(stillBlocked: () => boolean): Promise<boolean>;
declare function ensureFirebase(): Promise<any>;
declare function disposeFirebase(signOutUser?: boolean): Promise<boolean>;
declare var SIGNOUT_PENDING: string;
declare function signOutPending(): string;
declare function markSignOutPending(uid: string): void;
declare function clearSignOutPending(expected: string): void;
declare function logoutUid(): string;
declare function isDeadAuth(err: any): boolean;
declare function render(): void;
declare function flushRemote(opts?: { fromOutside?: boolean }): Promise<unknown>;
declare function sendNow(): void;
declare function rebuildFirebase(signOutUser?: boolean): Promise<any>;
declare function isImportFailure(err: any): boolean;
declare function cacheSnapshot(): any;
declare function writeCache(next: DroppedProject, before?: LocalStore | null): Promise<unknown>;
declare function deleteRemovedLocalIds(
  removed: RemovedLocalIds | null | undefined,
  before: LocalStore | null | undefined,
): Promise<void>;
declare function withTimeout<T>(p: T, ms: number, step: string): Promise<T>;
declare function isPoison(err: any): boolean;
declare var LOGIN_MS: number;
declare var FB_LOAD_MS: number;
declare var fbGeneration: number;
declare var L: any;
declare var POLICY: any;
declare function paintBell(): void;
declare var deleteLock: boolean;
declare var flushing: Promise<unknown> | null;
declare var flushTimer: ReturnType<typeof setTimeout> | null;
declare var lastSyncAt: number;

// App errors carry a timeout flag, a Firebase code, or ledger validation messages.
interface Error {
  timeout?: boolean;
  abandoned?: boolean;
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
