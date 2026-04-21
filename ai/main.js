const STORAGE_KEY = 'mistaken.ai.v1';

const chatList = document.getElementById('chatList');
const chatThread = document.getElementById('chatThread');
const chatTitle = document.getElementById('chatTitle');
const newChatBtn = document.getElementById('newChatBtn');
const toggleSettings = document.getElementById('toggleSettings');
const settingsPanel = document.getElementById('settingsPanel');
const composeForm = document.getElementById('composeForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const apiEndpoint = document.getElementById('apiEndpoint');
const apiModel = document.getElementById('apiModel');
const apiKey = document.getElementById('apiKey');
const systemPrompt = document.getElementById('systemPrompt');
const saveConfig = document.getElementById('saveConfig');
const configStatus = document.getElementById('configStatus');

let state = loadState();

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

function setStatus(message) {
  configStatus.textContent = message;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultConversation() {
  return {
    id: uid(),
    title: 'New chat',
    messages: [
      {
        role: 'assistant',
        content: 'Hi, I am Mistaken AI. Add your API key in Settings and ask me anything.'
      }
    ]
  };
}

function loadState() {
  const fallback = {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    apiKey: '',
    systemPrompt: '',
    conversations: [defaultConversation()],
    activeId: ''
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      fallback.activeId = fallback.conversations[0].id;
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const conversations = Array.isArray(parsed.conversations) && parsed.conversations.length > 0
      ? parsed.conversations
      : [defaultConversation()];

    const activeId = typeof parsed.activeId === 'string' && conversations.some((c) => c.id === parsed.activeId)
      ? parsed.activeId
      : conversations[0].id;

    return {
      endpoint: typeof parsed.endpoint === 'string' && parsed.endpoint.trim()
        ? parsed.endpoint.trim()
        : fallback.endpoint,
      model: typeof parsed.model === 'string' && parsed.model.trim()
        ? parsed.model.trim()
        : fallback.model,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      systemPrompt: typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : '',
      conversations,
      activeId
    };
  } catch {
    fallback.activeId = fallback.conversations[0].id;
    return fallback;
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeConversation() {
  return state.conversations.find((conv) => conv.id === state.activeId) || state.conversations[0];
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bubbleHtml(message) {
  const safe = escapeHtml(message.content || '');
  const roleClass = message.role === 'user' ? 'user' : (message.role === 'assistant' ? 'assistant' : 'system');
  return `<article class="bubble ${roleClass}">${safe}</article>`;
}

function renderConversations() {
  chatList.innerHTML = '';
  state.conversations.forEach((conv) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chat-item${conv.id === state.activeId ? ' active' : ''}`;
    btn.textContent = conv.title || 'Untitled chat';
    btn.addEventListener('click', () => {
      state.activeId = conv.id;
      persistState();
      render();
    });
    chatList.appendChild(btn);
  });
}

function renderMessages() {
  const conv = activeConversation();
  chatTitle.textContent = conv.title || 'New chat';
  chatThread.innerHTML = conv.messages.map(bubbleHtml).join('');
  chatThread.scrollTop = chatThread.scrollHeight;
}

function renderConfig() {
  apiEndpoint.value = state.endpoint;
  apiModel.value = state.model;
  apiKey.value = state.apiKey;
  systemPrompt.value = state.systemPrompt;
}

function render() {
  renderConversations();
  renderMessages();
  renderConfig();
}

function appendMessage(role, content) {
  const conv = activeConversation();
  conv.messages.push({ role, content });
  if (!conv.title || conv.title === 'New chat') {
    const firstUser = conv.messages.find((item) => item.role === 'user');
    if (firstUser && firstUser.content) {
      conv.title = firstUser.content.slice(0, 42);
    }
  }
  persistState();
  render();
}

async function requestCompletion(messages) {
  const response = await fetch(state.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: state.model,
      messages
    })
  });

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const data = await response.json();
      if (data && data.error && data.error.message) {
        message = data.error.message;
      }
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const content = payload
    && payload.choices
    && payload.choices[0]
    && payload.choices[0].message
    && typeof payload.choices[0].message.content === 'string'
    ? payload.choices[0].message.content
    : '';

  if (!content) {
    throw new Error('No response content from model.');
  }

  return content;
}

async function handleSend(event) {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) {
    return;
  }

  if (!state.apiKey.trim()) {
    appendMessage('system', 'Add an API key in Settings before sending messages.');
    return;
  }

  chatInput.value = '';
  appendMessage('user', prompt);

  sendBtn.disabled = true;
  appendMessage('assistant', 'Thinking...');

  const conv = activeConversation();
  const thinkingIndex = conv.messages.length - 1;

  try {
    const baseMessages = [];
    if (state.systemPrompt.trim()) {
      baseMessages.push({ role: 'system', content: state.systemPrompt.trim() });
    }

    conv.messages.forEach((msg) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        baseMessages.push({ role: msg.role, content: msg.content });
      }
    });

    const result = await requestCompletion(baseMessages);
    conv.messages[thinkingIndex] = { role: 'assistant', content: result };
    persistState();
    render();
  } catch (error) {
    conv.messages[thinkingIndex] = {
      role: 'system',
      content: `Request failed: ${error.message}`
    };
    persistState();
    render();
  } finally {
    sendBtn.disabled = false;
  }
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

newChatBtn.addEventListener('click', () => {
  const conv = defaultConversation();
  state.conversations.unshift(conv);
  state.activeId = conv.id;
  persistState();
  render();
});

toggleSettings.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

saveConfig.addEventListener('click', () => {
  state.endpoint = apiEndpoint.value.trim() || 'https://api.openai.com/v1/chat/completions';
  state.model = apiModel.value.trim() || 'gpt-4o-mini';
  state.apiKey = apiKey.value.trim();
  state.systemPrompt = systemPrompt.value;
  persistState();
  setStatus('Saved connection settings');
});

composeForm.addEventListener('submit', handleSend);

window.parent.postMessage({
  source: 'mistaken-ai',
  type: 'request-state'
}, window.location.origin);

render();
