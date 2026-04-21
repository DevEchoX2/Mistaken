(function applySavedTheme() {
  const SETTINGS_STORAGE_KEY = 'mistaken.settings';
  const defaultSettings = {
    theme: 'gold-noir',
    cloakTitle: 'Google',
    cloakFavicon: 'https://www.google.com/favicon.ico'
  };

  function sanitizeSettings(value) {
    const input = value && typeof value === 'object' ? value : {};
    return {
      theme: typeof input.theme === 'string' ? input.theme : defaultSettings.theme,
      cloakTitle: typeof input.cloakTitle === 'string' && input.cloakTitle.trim()
        ? input.cloakTitle.trim().slice(0, 80)
        : defaultSettings.cloakTitle,
      cloakFavicon: typeof input.cloakFavicon === 'string' && input.cloakFavicon.trim()
        ? input.cloakFavicon.trim()
        : defaultSettings.cloakFavicon
    };
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...defaultSettings };
      }
      return sanitizeSettings(JSON.parse(raw));
    } catch {
      return { ...defaultSettings };
    }
  }

  function setFavicon(url) {
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.setAttribute('rel', 'icon');
      document.head.appendChild(icon);
    }
    icon.setAttribute('href', url);
  }

  function applyVariables(variables) {
    if (!variables || typeof variables !== 'object') {
      return;
    }
    const rootStyle = document.documentElement.style;
    Object.entries(variables).forEach(([key, value]) => {
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      rootStyle.setProperty(cssVar, value);
    });
  }

  async function init() {
    const settings = readSettings();
    document.title = settings.cloakTitle || document.title;
    setFavicon(settings.cloakFavicon);

    try {
      const response = await fetch('assets/json/themes.json', { cache: 'no-store' });
      const data = await response.json();
      const themes = Array.isArray(data.themes) ? data.themes : [];
      const selected = themes.find((theme) => theme.id === settings.theme) || themes[0];
      applyVariables(selected && selected.variables ? selected.variables : null);
    } catch {
      // Silent fallback to default CSS vars.
    }
  }

  init();
})();
