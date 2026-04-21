const taskInput = document.getElementById('taskInput');
const constraintsInput = document.getElementById('constraintsInput');
const resultInput = document.getElementById('resultInput');
const buildPrompt = document.getElementById('buildPrompt');
const copyPrompt = document.getElementById('copyPrompt');

function applyThemeVariables(theme) {
  if (!theme || !theme.variables) {
    return;
  }

  const rootStyle = document.documentElement.style;
  Object.entries(theme.variables).forEach(([key, value]) => {
    const cssVar = key.startsWith('--') ? key : `--${key}`;
    rootStyle.setProperty(cssVar, value);
  });
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const payload = event.data;
  if (!payload || payload.source !== 'mistaken-parent' || payload.type !== 'state') {
    return;
  }

  const themes = Array.isArray(payload.themes) ? payload.themes : [];
  const themeId = payload.settings && payload.settings.theme ? payload.settings.theme : '';
  const selectedTheme = themes.find((theme) => theme.id === themeId) || themes[0];
  applyThemeVariables(selectedTheme);
});

buildPrompt.addEventListener('click', () => {
  const task = taskInput.value.trim() || 'Solve the task clearly.';
  const constraints = constraintsInput.value.trim() || 'Keep output concise and practical.';

  resultInput.value = [
    'You are an expert assistant.',
    `Task: ${task}`,
    `Constraints: ${constraints}`,
    'Return a direct solution first, then a short explanation.'
  ].join('\n');
});

copyPrompt.addEventListener('click', async () => {
  if (!resultInput.value.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(resultInput.value);
    copyPrompt.textContent = 'Copied';
    setTimeout(() => {
      copyPrompt.textContent = 'Copy';
    }, 900);
  } catch {
    copyPrompt.textContent = 'Copy Failed';
  }
});

window.parent.postMessage({
  source: 'mistaken-settings',
  type: 'request-state'
}, window.location.origin);
