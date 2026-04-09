/**
 * Frontend Logging Service - Enhanced Version
 * Fixes:
 * - Auth/session events (login, logout, token expiry)
 * - File upload progress and errors
 * - Full API request/response interception (fetch + XHR)
 * - localStorage/sessionStorage auth token changes
 * - Media counter state changes
 * - Route change enrichment with user/role context
 * - Structured error classification
 * - Deduplication of rapid repeated logs
 */

import { api } from './api';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const LOG_TYPES = {
  AUTH: 'AUTH',
  SESSION: 'SESSION',
  UPLOAD: 'UPLOAD',
  API_REQUEST: 'API_REQUEST',
  API_RESPONSE: 'API_RESPONSE',
  API_ERROR: 'API_ERROR',
  USER_ACTION: 'USER_ACTION',
  ROUTE_CHANGE: 'ROUTE_CHANGE',
  MEDIA_STATE: 'MEDIA_STATE',
  ERROR: 'ERROR',
  PERFORMANCE: 'PERFORMANCE',
  SCREEN_ANALYSIS: 'SCREEN_ANALYSIS',
  STORAGE_CHANGE: 'STORAGE_CHANGE',
};

const MAX_LOCAL_LOGS = 200;
const DEDUP_WINDOW_MS = 500; // suppress identical logs within this window

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTimestamp = () => new Date().toISOString();

const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const getAuthToken = () => localStorage.getItem('adminToken') || null;

const getSessionAge = () => {
  const loginTime = localStorage.getItem('loginTimestamp');
  if (!loginTime) return null;
  return Math.round((Date.now() - Number(loginTime)) / 1000); // seconds
};

// ─── Deduplication ────────────────────────────────────────────────────────────

let lastLogKey = null;
let lastLogTime = 0;

const isDuplicate = log => {
  const key = `${log.type}:${log.message}`;
  const now = Date.now();
  if (key === lastLogKey && now - lastLogTime < DEDUP_WINDOW_MS) return true;
  lastLogKey = key;
  lastLogTime = now;
  return false;
};

// ─── Log Storage ──────────────────────────────────────────────────────────────

const storeLog = log => {
  try {
    const raw = localStorage.getItem('appLogs');
    const logs = raw ? JSON.parse(raw) : [];
    logs.push(log);
    if (logs.length > MAX_LOCAL_LOGS) logs.splice(0, logs.length - MAX_LOCAL_LOGS);
    localStorage.setItem('appLogs', JSON.stringify(logs));
  } catch (e) {
    console.error('[Logger] Failed to store log locally:', e);
  }
};

const sendLogToBackend = async log => {
  try {
    const token = getAuthToken();
    await fetch(`${api.baseUrl}/api/logs/frontend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(log),
    });
  } catch {
    // silently fail — already stored locally
  }
};

// ─── Log Factory ──────────────────────────────────────────────────────────────

const createLog = (level, type, message, data = null) => {
  const user = getUserInfo();
  const log = {
    level,
    type,
    message,
    data,
    timestamp: getTimestamp(),
    userId: user?.id || null,
    username: user?.name || 'anonymous',
    userRole: user?.role || null,          // <-- captures soccom vs superadmin
    sessionAgeSeconds: getSessionAge(),    // <-- how old is the session?
    hasToken: !!getAuthToken(),            // <-- is there even a token?
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  return log;
};

const emit = (level, type, message, data = null) => {
  const log = createLog(level, type, message, data);
  if (isDuplicate(log)) return;
  storeLog(log);
  sendLogToBackend(log);
  return log;
};

// ─── Auth & Session Tracking ─────────────────────────────────────────────────
// Patches localStorage so any token set/removal is caught automatically.

const patchLocalStorageForAuth = () => {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);

    if (key === 'adminToken') {
      if (value) {
        // Record login timestamp for session age tracking
        originalSetItem('loginTimestamp', String(Date.now()));
        emit(LOG_LEVELS.INFO, LOG_TYPES.AUTH, 'Auth token set — user logged in', {
          tokenLength: value.length,
          tokenPrefix: value.substring(0, 10) + '...',
        });
      }
    }

    if (key === 'adminUser') {
      try {
        const parsed = JSON.parse(value);
        emit(LOG_LEVELS.INFO, LOG_TYPES.AUTH, 'Admin user stored in localStorage', {
          userId: parsed?.id,
          role: parsed?.role,
          name: parsed?.name,
        });
      } catch { /* ignore */ }
    }
  };

  localStorage.removeItem = key => {
    if (key === 'adminToken') {
      emit(LOG_LEVELS.WARN, LOG_TYPES.AUTH, 'Auth token removed — user logged out or session cleared', {
        sessionAgeSeconds: getSessionAge(),
        triggeredFrom: new Error().stack?.split('\n')[2]?.trim() || 'unknown',
      });
    }
    originalRemoveItem(key);
  };
};

// Watch for token expiry by polling the token's validity on a short interval.
const watchTokenExpiry = () => {
  let hadToken = !!getAuthToken();

  setInterval(() => {
    const hasToken = !!getAuthToken();
    if (hadToken && !hasToken) {
      // Token disappeared without an explicit removeItem call (e.g., cleared by another tab)
      emit(LOG_LEVELS.WARN, LOG_TYPES.SESSION, 'Auth token disappeared unexpectedly (possible session expiry or tab conflict)', {
        sessionAgeSeconds: getSessionAge(),
        url: window.location.href,
      });
    }
    hadToken = hasToken;
  }, 2000);
};

// ─── Fetch Interceptor ────────────────────────────────────────────────────────
// Captures every API call: method, URL, status, duration, and response body on error.

const patchFetch = () => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = (init.method || 'GET').toUpperCase();

    // Skip logging calls made by the logger itself to avoid loops
    if (url?.includes('/api/logs/frontend')) return originalFetch(input, init);

    const startTime = Date.now();

    emit(LOG_LEVELS.DEBUG, LOG_TYPES.API_REQUEST, `→ ${method} ${url}`, {
      method,
      url,
      hasBody: !!init.body,
      contentType: init.headers?.['Content-Type'] || null,
    });

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;
      const status = response.status;
      const level = status >= 500 ? LOG_LEVELS.ERROR
        : status >= 400 ? LOG_LEVELS.WARN
          : LOG_LEVELS.INFO;

      // Clone and read body only on error so we don't consume the real stream
      let responseBody = null;
      if (status >= 400) {
        try {
          const clone = response.clone();
          responseBody = await clone.text();
        } catch { /* ignore */ }
      }

      const logData = { method, url, status, duration, responseBody };

      // Specifically flag auth failures — these are what's logging the admin out
      if (status === 401 || status === 403) {
        emit(LOG_LEVELS.ERROR, LOG_TYPES.SESSION,
          `⚠️  ${status} response — likely cause of logout on ${method} ${url}`, {
          ...logData,
          sessionAgeSeconds: getSessionAge(),
          tokenPresentAtRequest: !!init.headers?.Authorization,
        });
      } else {
        emit(level, LOG_TYPES.API_RESPONSE, `← ${status} ${method} ${url} (${duration}ms)`, logData);
      }

      return response;
    } catch (err) {
      const duration = Date.now() - startTime;
      emit(LOG_LEVELS.ERROR, LOG_TYPES.API_ERROR, `✗ Network error on ${method} ${url}`, {
        method,
        url,
        duration,
        error: err.message,
        stack: err.stack?.split('\n').slice(0, 3).join(' | '),
      });
      throw err;
    }
  };
};

// ─── XHR Interceptor ─────────────────────────────────────────────────────────
// Some upload libraries use XHR instead of fetch — catch those too.

const patchXHR = () => {
  const OriginalXHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function () {
    const xhr = new OriginalXHR();
    let method, url, startTime;

    const originalOpen = xhr.open.bind(xhr);
    xhr.open = (m, u, ...rest) => {
      method = m.toUpperCase();
      url = u;
      return originalOpen(m, u, ...rest);
    };

    const originalSend = xhr.send.bind(xhr);
    xhr.send = body => {
      startTime = Date.now();
      emit(LOG_LEVELS.DEBUG, LOG_TYPES.API_REQUEST, `→ XHR ${method} ${url}`, { method, url });

      xhr.addEventListener('load', () => {
        const duration = Date.now() - startTime;
        const status = xhr.status;
        const level = status >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;

        if (status === 401 || status === 403) {
          emit(LOG_LEVELS.ERROR, LOG_TYPES.SESSION,
            `⚠️  XHR ${status} — likely logout trigger on ${method} ${url}`, {
            method, url, status, duration,
            responseText: xhr.responseText?.substring(0, 300),
          });
        } else {
          emit(level, LOG_TYPES.API_RESPONSE,
            `← XHR ${status} ${method} ${url} (${duration}ms)`, {
            method, url, status, duration,
          });
        }
      });

      xhr.addEventListener('error', () => {
        emit(LOG_LEVELS.ERROR, LOG_TYPES.API_ERROR, `✗ XHR network error ${method} ${url}`, {
          method, url, duration: Date.now() - startTime,
        });
      });

      return originalSend(body);
    };

    return xhr;
  };
};

// ─── File Upload Tracking ─────────────────────────────────────────────────────
// Call logger.trackUpload(file, formData) wrapping your actual upload fetch/XHR.

const trackUpload = async (file, uploadFn) => {
  const meta = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
  };

  emit(LOG_LEVELS.INFO, LOG_TYPES.UPLOAD, `Upload started: ${file.name}`, meta);
  const start = Date.now();

  try {
    const result = await uploadFn();
    const duration = Date.now() - start;
    emit(LOG_LEVELS.INFO, LOG_TYPES.UPLOAD, `Upload complete: ${file.name} (${duration}ms)`, {
      ...meta,
      duration,
      result: typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : result,
    });
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    emit(LOG_LEVELS.ERROR, LOG_TYPES.UPLOAD, `Upload failed: ${file.name}`, {
      ...meta,
      duration,
      error: err.message,
    });
    throw err;
  }
};

// ─── Media Counter Tracking ───────────────────────────────────────────────────
// Call logger.trackMediaCounter(before, after) whenever you update the count.

const trackMediaCounter = (before, after, context = {}) => {
  const changed = before !== after;
  emit(
    changed ? LOG_LEVELS.INFO : LOG_LEVELS.WARN,
    LOG_TYPES.MEDIA_STATE,
    changed
      ? `Media counter updated: ${before} → ${after}`
      : `Media counter unchanged after publish action (still ${before})`,
    { before, after, delta: after - before, ...context }
  );
};

// ─── DOM / Screen Analysis ────────────────────────────────────────────────────

const analyzeDOM = () => ({
  timestamp: getTimestamp(),
  url: window.location.href,
  title: document.title,
  viewport: { width: window.innerWidth, height: window.innerHeight },
  elements: {
    forms: Array.from(document.forms).map(form => ({
      id: form.id || null,
      action: form.action || null,
      method: form.method || null,
      inputs: Array.from(form.elements).slice(0, 5).map(el => ({
        type: el.type, name: el.name, id: el.id, tag: el.tagName,
      })),
    })),
    buttons: Array.from(document.querySelectorAll('button')).slice(0, 20).map(btn => ({
      text: btn.textContent?.substring(0, 30).trim() || null,
      id: btn.id || null,
      disabled: btn.disabled,
    })),
    images: Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
      src: img.src?.substring(0, 100),
      alt: img.alt || null,
      loaded: img.complete && img.naturalWidth > 0,  // <-- tells you if the image actually rendered
      width: img.width,
      height: img.height,
    })),
    headings: Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 10).map(h => ({
      level: h.tagName,
      text: h.textContent?.substring(0, 60).trim() || null,
    })),
    pageText: document.body?.innerText?.substring(0, 500) || '',
  },
  structure: {
    bodyChildren: document.body?.children?.length || 0,
    totalElements: document.querySelectorAll('*').length,
  },
});

const capturePerformanceMetrics = () => {
  try {
    const timing = window.performance?.timing || {};
    return {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart || 0,
      domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart || 0,
      firstPaint: window.performance?.getEntriesByType?.('paint')?.[0]?.startTime || 0,
    };
  } catch (e) {
    return { error: e.message };
  }
};

let consoleLogs = [];

const runScreenAnalysis = () => {
  const log = createLog(LOG_LEVELS.INFO, LOG_TYPES.SCREEN_ANALYSIS,
    `Screen snapshot — ${window.location.pathname}`, {
    dom: analyzeDOM(),
    performance: capturePerformanceMetrics(),
    network: { online: navigator.onLine, cookiesEnabled: navigator.cookieEnabled },
    recentConsoleLogs: consoleLogs.slice(-10),
    auth: {                                      // <-- include auth state in every snapshot
      hasToken: !!getAuthToken(),
      sessionAgeSeconds: getSessionAge(),
      user: getUserInfo(),
    },
  });

  storeLog(log);
  sendLogToBackend(log);
};

// ─── Console Capture ──────────────────────────────────────────────────────────

const setupConsoleCapture = () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    consoleLogs.push({ type: 'warn', message: args.join(' '), time: getTimestamp() });
    if (consoleLogs.length > 50) consoleLogs.shift();
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    consoleLogs.push({ type: 'error', message: args.join(' '), time: getTimestamp() });
    if (consoleLogs.length > 50) consoleLogs.shift();
    originalError.apply(console, args);
  };
};

// ─── Event Listeners ──────────────────────────────────────────────────────────

let lastUrl = window.location.href;
const observeUrlChanges = () => {
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      emit(LOG_LEVELS.INFO, LOG_TYPES.ROUTE_CHANGE, `Route changed to ${lastUrl}`, {
        url: lastUrl,
        user: getUserInfo(),
        hasToken: !!getAuthToken(),
        sessionAgeSeconds: getSessionAge(),
      });
      runScreenAnalysis();
    }
  }, 500);
};

const setupClickTracking = () => {
  document.addEventListener('click', event => {
    const target = event.target;
    const tag = target.tagName.toUpperCase();
    const type = tag === 'A' ? 'LINK_CLICK'
      : tag === 'BUTTON' ? 'BUTTON_CLICK'
        : 'CLICK';

    emit(LOG_LEVELS.INFO, LOG_TYPES.USER_ACTION, type, {
      tag,
      id: target.id || null,
      text: target.textContent?.substring(0, 50)?.trim() || null,
      href: target.href || null,
    });
  }, true);
};

const setupFormTracking = () => {
  document.addEventListener('submit', event => {
    const form = event.target;
    emit(LOG_LEVELS.INFO, LOG_TYPES.USER_ACTION, 'FORM_SUBMIT', {
      formId: form.id || null,
      formAction: form.action || null,
      method: form.method || null,
      hasToken: !!getAuthToken(),
      sessionAgeSeconds: getSessionAge(),
    });
  });
};

const setupErrorTracking = () => {
  window.addEventListener('error', event => {
    emit(LOG_LEVELS.ERROR, LOG_TYPES.ERROR, 'JavaScript runtime error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    emit(LOG_LEVELS.ERROR, LOG_TYPES.ERROR, 'Unhandled promise rejection', {
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack?.split('\n').slice(0, 3).join(' | '),
    });
  });
};

const setupPerformanceTracking = () => {
  window.addEventListener('load', () => {
    const timing = window.performance.timing;
    emit(LOG_LEVELS.INFO, LOG_TYPES.PERFORMANCE, 'Page load complete', {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
    });
  });
};

let screenAnalysisInterval = null;
const startPeriodicScreenAnalysis = () => {
  // Don't run screen analysis at all - causes too much noise
  // Only runs once on initial page load if needed
};

// ─── Public Logger API ────────────────────────────────────────────────────────

const logger = {
  info: (message, data) => emit(LOG_LEVELS.INFO, LOG_TYPES.USER_ACTION, message, data),
  warn: (message, data) => emit(LOG_LEVELS.WARN, LOG_TYPES.USER_ACTION, message, data),
  error: (message, data) => emit(LOG_LEVELS.ERROR, LOG_TYPES.ERROR, message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      emit(LOG_LEVELS.DEBUG, LOG_TYPES.USER_ACTION, message, data);
    }
  },

  // Auth helpers — call these explicitly in your login/logout handlers
  logLogin: (user) => emit(LOG_LEVELS.INFO, LOG_TYPES.AUTH, 'User login', {
    userId: user?.id, role: user?.role, name: user?.name,
  }),
  logLogout: (reason = 'manual') => emit(LOG_LEVELS.WARN, LOG_TYPES.AUTH, `User logout: ${reason}`, {
    sessionAgeSeconds: getSessionAge(),
    reason,
  }),

  // Upload — wrap your upload call: logger.trackUpload(file, () => fetch(...))
  trackUpload,

  // Media counter — call before and after you update state/DB
  trackMediaCounter,

  userAction: (action, data) => emit(LOG_LEVELS.INFO, LOG_TYPES.USER_ACTION, action, data),
  pageView: (name, url = window.location.href) => emit(LOG_LEVELS.INFO, 'PAGE_VIEW', name, { url }),
  apiRequest: (method, endpoint, status, duration) =>
    emit(LOG_LEVELS.INFO, LOG_TYPES.API_RESPONSE, `${method} ${endpoint}`, { method, endpoint, status, duration }),

  analyzeScreen: () => runScreenAnalysis(),

  getStoredLogs: () => { try { return JSON.parse(localStorage.getItem('appLogs') || '[]'); } catch { return []; } },
  clearStoredLogs: () => localStorage.removeItem('appLogs'),

  // Dump a summary to console for quick debugging
  printSummary: () => {
    const logs = logger.getStoredLogs();
    const byType = logs.reduce((acc, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {});
    const errors = logs.filter(l => l.level === 'ERROR');
    console.group('[Logger Summary]');
    console.table(byType);
    console.group('Errors');
    errors.forEach(e => console.warn(e.timestamp, e.message, e.data));
    console.groupEnd();
    console.groupEnd();
  },
};

// ─── Initialization ───────────────────────────────────────────────────────────

const initializeTracking = () => {
  // Patch globals first so every subsequent call is captured
  patchLocalStorageForAuth();
  patchFetch();
  patchXHR();
  watchTokenExpiry();

  setupConsoleCapture();
  startPeriodicScreenAnalysis();
  observeUrlChanges();
  setupClickTracking();
  setupFormTracking();
  setupErrorTracking();
  setupPerformanceTracking();

  emit(LOG_LEVELS.INFO, LOG_TYPES.SESSION, 'Logger initialized', {
    user: getUserInfo(),
    hasToken: !!getAuthToken(),
    sessionAgeSeconds: getSessionAge(),
    url: window.location.href,
  });

  console.log(
    '%c🔍 Enhanced Logger Active',
    'background:#1a1a2e;color:#e94560;padding:4px 10px;border-radius:4px;font-weight:bold'
  );
  console.log(
    '%c   Auth · Fetch · XHR · Upload · Session · Media counter tracking enabled',
    'color:#888'
  );
  console.log('%c   Call logger.printSummary() to inspect captured logs', 'color:#888');
};

export default logger;
export { initializeTracking };