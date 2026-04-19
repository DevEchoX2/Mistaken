const body = document.body;
const entryLoader = document.getElementById('entryLoader');
const dockToggle = document.getElementById('dockToggle');
const sectionsToggle = document.getElementById('sectionsToggle');
const sectionsPanel = document.getElementById('sectionsPanel');
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