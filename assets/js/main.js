const body = document.body;
const entryLoader = document.getElementById('entryLoader');
const dockToggle = document.getElementById('dockToggle');
const sectionsToggle = document.getElementById('sectionsToggle');
const sectionsPanel = document.getElementById('sectionsPanel');
const searchInput = document.getElementById('proxySearch');
const searchSubmit = document.getElementById('searchSubmit');
const tabButtons = Array.from(document.querySelectorAll('.panel-tab'));
const views = Array.from(document.querySelectorAll('.panel-view'));

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

function setPanelView(viewName) {
  tabButtons.forEach((button) => {
    const active = button.dataset.panel === viewName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  views.forEach((view) => {
    view.classList.toggle('active', view.dataset.view === viewName);
  });
}

function normalizeDestination(rawQuery) {
  const query = rawQuery.trim();

  if (/^https?:\/\//i.test(query)) {
    return query;
  }

  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(query)) {
    return `https://${query}`;
  }

  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function buildProxiedUrl(destinationUrl) {
  const uvConfig = window.__uv$config;
  if (uvConfig?.prefix && typeof uvConfig.encodeUrl === 'function') {
    return `${uvConfig.prefix}${uvConfig.encodeUrl(destinationUrl)}`;
  }

  const scramjetConfig = window.__scramjet$config || window.__scramjet?.config;
  if (scramjetConfig?.prefix) {
    if (typeof scramjetConfig.encodeUrl === 'function') {
      return `${scramjetConfig.prefix}${scramjetConfig.encodeUrl(destinationUrl)}`;
    }

    if (typeof scramjetConfig.codec?.encode === 'function') {
      return `${scramjetConfig.prefix}${scramjetConfig.codec.encode(destinationUrl)}`;
    }

    return `${scramjetConfig.prefix}${encodeURIComponent(destinationUrl)}`;
  }

  return `/service/${encodeURIComponent(destinationUrl)}`;
}

function runSearch() {
  if (!searchInput) {
    return;
  }

  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  const destinationUrl = normalizeDestination(query);
  const targetUrl = buildProxiedUrl(destinationUrl);
  body.classList.remove('sections-open');
  body.classList.add('search-transition');
  syncPanelState();

  window.setTimeout(() => {
    window.location.href = targetUrl;
  }, 950);
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

if (searchSubmit) {
  searchSubmit.addEventListener('click', runSearch);
}

if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setPanelView(button.dataset.panel);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    body.classList.remove('sections-open');
    syncPanelState();
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

syncDockState();
syncPanelState();