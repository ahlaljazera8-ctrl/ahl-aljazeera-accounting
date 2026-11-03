// Types for `tsc --noEmit` only. Nothing here is loaded by the app.
// Classic scripts publish these names on window and also call them bare.
interface Window {
  Ledger: any;
  AJ: any;
  FIREBASE_CONFIG: any;
  Sync: any;
  SyncStatus: any;
  DomSafe: any;
  AppCheck: any;
  __loginSeen?: boolean;
  __forceOffline?: boolean;
  __unhandled?: string[];
  __printed?: number;
}

declare const Ledger: Window['Ledger'];
declare const AJ: Window['AJ'];
declare const SyncStatus: Window['SyncStatus'];
declare const DomSafe: Window['DomSafe'];

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
