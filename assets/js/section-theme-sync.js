(function applySectionTheme() {
  const SETTINGS_STORAGE_KEY = 'mistaken.settings';
  const FALLBACK = {
    theme: 'gold-noir',
    cloakTitle: 'Google',
    cloakFavicon: 'https://www.google.com/favicon.ico'
  };

  function readSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...FALLBACK };
      }
      const parsed = JSON.parse(raw);
      return {
        theme: typeof parsed.theme === 'string' ? parsed.theme : FALLBACK.theme,
        cloakTitle: typeof parsed.cloakTitle === 'string' && parsed.cloakTitle.trim()
          ? parsed.cloakTitle.trim().slice(0, 80)
          : FALLBACK.cloakTitle,
        cloakFavicon: typeof parsed.cloakFavicon === 'string' && parsed.cloakFavicon.trim()
          ? parsed.cloakFavicon.trim()
          : FALLBACK.cloakFavicon
      };
    } catch {
      return { ...FALLBACK };
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
      const response = await fetch('../assets/json/themes.json', { cache: 'no-store' });
      const data = await response.json();
      const themes = Array.isArray(data.themes) ? data.themes : [];
      const selected = themes.find((theme) => theme.id === settings.theme) || themes[0];
      applyVariables(selected && selected.variables ? selected.variables : null);
    } catch {
      // Keep defaults if theme file fails.
    }
  }

  init();
})();
