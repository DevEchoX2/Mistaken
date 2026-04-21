const themeSelect = document.getElementById('themeSelect');
const engineSelect = document.getElementById('engineSelect');
const cloakTitleInput = document.getElementById('cloakTitle');
const cloakFaviconInput = document.getElementById('cloakFavicon');
const saveButton = document.getElementById('saveSettings');
const aboutBlankButton = document.getElementById('aboutBlank');
const aboutBlankFallbackButton = document.getElementById('aboutBlankFallback');
const statusText = document.getElementById('statusText');

let currentState = {
  settings: {
    theme: 'gold-noir',
    searchEngine: 'duckduckgo',
    cloakTitle: 'Google',
    cloakFavicon: 'https://www.google.com/favicon.ico'
  },
  themes: [],
  searchEngines: []
};

function setStatus(message) {
  statusText.textContent = message;
}

function renderThemeOptions(themes, selectedTheme) {
  themeSelect.innerHTML = '';
  themes.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    option.selected = theme.id === selectedTheme;
    themeSelect.appendChild(option);
  });
}

function renderSearchEngineOptions(searchEngines, selectedEngine) {
  engineSelect.innerHTML = '';
  searchEngines.forEach((engine) => {
    const option = document.createElement('option');
    option.value = engine.id;
    option.textContent = engine.name;
    option.selected = engine.id === selectedEngine;
    engineSelect.appendChild(option);
  });
}

function hydrateForm() {
  renderThemeOptions(currentState.themes, currentState.settings.theme);
  renderSearchEngineOptions(currentState.searchEngines, currentState.settings.searchEngine);
  cloakTitleInput.value = currentState.settings.cloakTitle || '';
  cloakFaviconInput.value = currentState.settings.cloakFavicon || '';
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const payload = event.data;
  if (!payload || payload.source !== 'mistaken-parent') {
    return;
  }

  if (payload.type === 'state') {
    currentState = payload;
    hydrateForm();
    setStatus('Loaded current settings');
  }

  if (payload.type === 'cloak-result') {
    setStatus(payload.ok ? 'Opened cloaked about:blank tab' : 'Popup blocked by browser');
  }

  if (payload.type === 'inline-cloak-result') {
    setStatus(payload.ok ? 'Applied in-tab cloak fallback' : 'Fallback cloak failed');
  }
});

saveButton.addEventListener('click', () => {
  const settings = {
    theme: themeSelect.value,
    searchEngine: engineSelect.value,
    cloakTitle: cloakTitleInput.value.trim() || 'Google',
    cloakFavicon: cloakFaviconInput.value.trim() || 'https://www.google.com/favicon.ico'
  };

  window.parent.postMessage({
    source: 'mistaken-settings',
    type: 'apply-settings',
    settings
  }, window.location.origin);

  setStatus('Settings saved');
});

aboutBlankButton.addEventListener('click', () => {
  window.parent.postMessage({
    source: 'mistaken-settings',
    type: 'run-about-blank-cloak'
  }, window.location.origin);
});

aboutBlankFallbackButton.addEventListener('click', () => {
  window.parent.postMessage({
    source: 'mistaken-settings',
    type: 'run-about-blank-inline-cloak'
  }, window.location.origin);
});

window.parent.postMessage({
  source: 'mistaken-settings',
  type: 'request-state'
}, window.location.origin);
