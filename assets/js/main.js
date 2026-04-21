const body = document.body;
const entryLoader = document.getElementById('entryLoader');
const dockToggle = document.getElementById('dockToggle');
const sectionsToggle = document.getElementById('sectionsToggle');
const sectionsPanel = document.getElementById('sectionsPanel');
const homeBtn = document.getElementById('homeBtn');
const searchInput = document.getElementById('proxySearch');
const searchSubmit = document.getElementById('searchSubmit');
const openDirect = document.getElementById('openDirect');
const webFrameShell = document.getElementById('webFrameShell');
const webFrame = document.getElementById('webFrame');
const sectionTiles = Array.from(document.querySelectorAll('.section-tile'));

const SETTINGS_STORAGE_KEY = 'mistaken.settings';
const DEFAULT_SETTINGS = {
  theme: 'gold-noir',
  searchEngine: 'duckduckgo',
  cloakTitle: 'Google',
  cloakFavicon: 'https://www.google.com/favicon.ico'
};

const SEARCH_ENGINES = {
  duckduckgo: {
    name: 'DuckDuckGo',
    queryUrl: 'https://duckduckgo.com/?q='
  },
  google: {
    name: 'Google',
    queryUrl: 'https://www.google.com/search?q='
  },
  bing: {
    name: 'Bing',
    queryUrl: 'https://www.bing.com/search?q='
  },
  brave: {
    name: 'Brave',
    queryUrl: 'https://search.brave.com/search?q='
  }
};

let availableThemes = [];
let appSettings = readSettings();
let lastRequestedUrl = '';

function syncDockState() {
  if (!dockToggle) {
    return;
  }
  const visible = !body.classList.contains('dock-hidden');
  dockToggle.setAttribute('aria-expanded', String(visible));
}

function syncPanelState() {
  if (!sectionsToggle || !sectionsPanel) {
    return;
  }
  const open = body.classList.contains('sections-open');
  sectionsToggle.setAttribute('aria-expanded', String(open));
  sectionsPanel.setAttribute('aria-hidden', String(!open));
}

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
}

function sanitizeSettings(value) {
  const input = value && typeof value === 'object' ? value : {};
  const next = { ...DEFAULT_SETTINGS };

  if (typeof input.theme === 'string') {
    next.theme = input.theme;
  }
  if (typeof input.searchEngine === 'string' && SEARCH_ENGINES[input.searchEngine]) {
    next.searchEngine = input.searchEngine;
  }
  if (typeof input.cloakTitle === 'string' && input.cloakTitle.trim()) {
    next.cloakTitle = input.cloakTitle.trim().slice(0, 80);
  }
  if (typeof input.cloakFavicon === 'string' && input.cloakFavicon.trim()) {
    next.cloakFavicon = input.cloakFavicon.trim();
  }

  return next;
}

function normalizeDestination(rawQuery) {
  const query = rawQuery.trim();

  if (/^https?:\/\//i.test(query)) {
    return query;
  }

  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(query)) {
    return `https://${query}`;
  }

  const engine = SEARCH_ENGINES[appSettings.searchEngine] || SEARCH_ENGINES.duckduckgo;
  return `${engine.queryUrl}${encodeURIComponent(query)}`;
}

function buildProxiedUrl(destinationUrl) {
  return `service/${encodeURIComponent(destinationUrl)}`;
}

async function hasActiveServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  if (navigator.serviceWorker.controller) {
    return true;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active);
  } catch {
    return false;
  }
}

function setFrameVisible() {
  if (!webFrameShell) {
    return;
  }
  webFrameShell.setAttribute('aria-hidden', 'false');
  body.classList.add('has-frame');
}

function loadInsideFrame(targetUrl, options = {}) {
  if (!webFrame) {
    return;
  }

  const { withLoader = true, fullScreen = false } = options;

  body.classList.toggle('frame-fullscreen', fullScreen);

  body.classList.remove('sections-open');
  syncDockState();
  syncPanelState();
  if (withLoader) {
    body.classList.add('search-transition');
  }

  setFrameVisible();

  const revealFrame = () => {
    body.classList.remove('search-transition');
    webFrame.removeEventListener('load', revealFrame);
    webFrame.removeEventListener('error', revealFrame);
  };

  webFrame.addEventListener('load', revealFrame, { once: true });
  webFrame.addEventListener('error', revealFrame, { once: true });

  window.setTimeout(() => {
    webFrame.src = targetUrl;
  }, withLoader ? 220 : 0);
}

async function openSearchTarget(destinationUrl) {
  lastRequestedUrl = destinationUrl;
  const useProxyRoute = await hasActiveServiceWorker();
  const targetUrl = useProxyRoute ? buildProxiedUrl(destinationUrl) : destinationUrl;
  loadInsideFrame(targetUrl, { withLoader: true, fullScreen: true });
}

async function runSearch() {
  if (!searchInput) {
    return;
  }

  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  const destinationUrl = normalizeDestination(query);
  await openSearchTarget(destinationUrl);
}

function setDocumentFavicon(url) {
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.setAttribute('rel', 'icon');
    document.head.appendChild(icon);
  }
  icon.setAttribute('href', url);
}

function applyCloakAppearance() {
  document.title = appSettings.cloakTitle;
  setDocumentFavicon(appSettings.cloakFavicon);
}

function applyTheme() {
  const theme = availableThemes.find((item) => item.id === appSettings.theme);
  if (!theme || !theme.variables) {
    return;
  }

  const rootStyle = document.documentElement.style;
  Object.entries(theme.variables).forEach(([key, value]) => {
    const cssVar = key.startsWith('--') ? key : `--${key}`;
    rootStyle.setProperty(cssVar, value);
  });
}

async function loadThemes() {
  try {
    const response = await fetch('assets/json/themes.json', { cache: 'no-store' });
    const data = await response.json();
    availableThemes = Array.isArray(data.themes) ? data.themes : [];

    const selectedThemeExists = availableThemes.some((theme) => theme.id === appSettings.theme);
    if (!selectedThemeExists && availableThemes.length > 0) {
      appSettings.theme = availableThemes[0].id;
      saveSettings();
    }

    applyTheme();
  } catch {
    availableThemes = [];
  }
}

function sendSettingsStateToFrame(targetWindow = webFrame?.contentWindow) {
  if (!targetWindow) {
    return;
  }

  const payload = {
    source: 'mistaken-parent',
    type: 'state',
    settings: appSettings,
    themes: availableThemes,
    searchEngines: Object.entries(SEARCH_ENGINES).map(([id, value]) => ({
      id,
      name: value.name
    }))
  };

  targetWindow.postMessage(payload, window.location.origin);
}

function updateSettings(nextSettings) {
  appSettings = sanitizeSettings({ ...appSettings, ...nextSettings });
  saveSettings();
  applyTheme();
  applyCloakAppearance();
  sendSettingsStateToFrame();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function launchAboutBlankCloak() {
  const popup = window.open('about:blank', '_blank');
  if (!popup) {
    return false;
  }

  const escapedTitle = escapeHtml(appSettings.cloakTitle || 'Google');
  const escapedFavicon = escapeHtml(appSettings.cloakFavicon || 'https://www.google.com/favicon.ico');
  const escapedSrc = escapeHtml(window.location.href);

  popup.document.write(`<!doctype html><html><head><title>${escapedTitle}</title><link rel="icon" href="${escapedFavicon}"><style>html,body{margin:0;height:100%;overflow:hidden;background:#000;}iframe{border:0;width:100%;height:100%;}</style></head><body><iframe src="${escapedSrc}" referrerpolicy="no-referrer"></iframe></body></html>`);
  popup.document.close();
  window.location.replace('https://www.google.com');
  return true;
}

function launchInlineCloakFallback() {
  applyCloakAppearance();
  return true;
}

function goHome() {
  body.classList.remove('has-frame', 'frame-fullscreen', 'sections-open');
  webFrameShell?.setAttribute('aria-hidden', 'true');
  if (webFrame) {
    webFrame.src = 'about:blank';
  }
  syncDockState();
  syncPanelState();
}

if (dockToggle) {
  dockToggle.addEventListener('click', () => {
    body.classList.toggle('dock-hidden');
    if (body.classList.contains('dock-hidden')) {
      body.classList.remove('sections-open');
    }
    syncDockState();
    syncPanelState();
  });
}

if (sectionsToggle) {
  sectionsToggle.addEventListener('click', () => {
    if (body.classList.contains('dock-hidden')) {
      body.classList.remove('dock-hidden');
      syncDockState();
    }
    body.classList.toggle('sections-open');
    syncPanelState();
  });
}

if (homeBtn) {
  homeBtn.addEventListener('click', goHome);
}

sectionTiles.forEach((tile) => {
  tile.addEventListener('click', () => {
    const target = tile.dataset.target;
    if (!target) {
      return;
    }
    const delimiter = target.includes('?') ? '&' : '?';
    const targetUrl = `${target}${delimiter}ts=${Date.now()}`;
    loadInsideFrame(targetUrl, { withLoader: false, fullScreen: true });
  });
});

if (searchSubmit) {
  searchSubmit.addEventListener('click', runSearch);
}

if (openDirect) {
  openDirect.addEventListener('click', () => {
    if (!lastRequestedUrl) {
      if (searchInput && searchInput.value.trim()) {
        lastRequestedUrl = normalizeDestination(searchInput.value);
      }
    }
    if (!lastRequestedUrl) {
      return;
    }
    window.open(lastRequestedUrl, '_blank', 'noopener');
  });
}

if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    body.classList.remove('sections-open');
    syncDockState();
    syncPanelState();
  }
});

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const payload = event.data;
  if (!payload || !['mistaken-settings', 'mistaken-ai'].includes(payload.source)) {
    return;
  }

  if (payload.type === 'request-state') {
    sendSettingsStateToFrame(event.source);
    return;
  }

  if (payload.type === 'apply-settings' && payload.settings) {
    updateSettings(payload.settings);
    return;
  }

  if (payload.type === 'run-about-blank-cloak') {
    const success = launchAboutBlankCloak();
    if (event.source && 'postMessage' in event.source) {
      event.source.postMessage({
        source: 'mistaken-parent',
        type: 'cloak-result',
        ok: success
      }, event.origin);
    }
    return;
  }

  if (payload.type === 'run-about-blank-inline-cloak') {
    const success = launchInlineCloakFallback();
    if (event.source && 'postMessage' in event.source) {
      event.source.postMessage({
        source: 'mistaken-parent',
        type: 'inline-cloak-result',
        ok: success
      }, event.origin);
    }
  }
});

document.addEventListener('click', (event) => {
  if (!sectionsPanel || !sectionsToggle) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const clickedInsidePanel = sectionsPanel.contains(target);
  const clickedToggle = sectionsToggle.contains(target);

  if (!clickedInsidePanel && !clickedToggle) {
    body.classList.remove('sections-open');
    syncDockState();
    syncPanelState();
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}

if (entryLoader) {
  window.setTimeout(() => {
    body.classList.remove('is-loading');
    body.classList.add('site-loaded');
  }, 2200);
}

applyCloakAppearance();
loadThemes();

syncDockState();
syncPanelState();