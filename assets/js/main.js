const body = document.body;
const dockToggle = document.getElementById('dockToggle');
const sectionsToggle = document.getElementById('sectionsToggle');
const sectionsPanel = document.getElementById('sectionsPanel');
const tabButtons = Array.from(document.querySelectorAll('.panel-tab'));
const views = Array.from(document.querySelectorAll('.panel-view'));

function syncDockState() {
  const visible = !body.classList.contains('dock-hidden');
  dockToggle.setAttribute('aria-expanded', String(visible));
}

function syncPanelState() {
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

dockToggle.addEventListener('click', () => {
  body.classList.toggle('dock-hidden');
  if (body.classList.contains('dock-hidden')) {
    body.classList.remove('sections-open');
  }
  syncDockState();
  syncPanelState();
});

sectionsToggle.addEventListener('click', () => {
  if (body.classList.contains('dock-hidden')) {
    body.classList.remove('dock-hidden');
    syncDockState();
  }
  body.classList.toggle('sections-open');
  syncPanelState();
});

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

syncDockState();
syncPanelState();