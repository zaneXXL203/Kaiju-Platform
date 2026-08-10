export function renderAiderX() {
  return `
    <section class="aider-drawer" data-aider-drawer aria-label="AIDER-X">
      <div class="aider-head">
        <div>
          <strong>AIDER-X</strong>
          <span class="muted">Live geometry assistant</span>
        </div>
        <span class="ai-status" data-aider-status>Ready</span>
        <button class="icon-button" type="button" data-aider-clear aria-label="Clear chat"><i data-lucide="trash-2"></i></button>
        <button class="icon-button" type="button" data-aider-toggle aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <div class="aider-messages" data-aider-messages></div>
      <div class="aider-quick-row" data-aider-prompts>
        <button type="button" data-prompt="Find official mechanical models with the highest downloads.">Official mechanical</button>
        <button type="button" data-prompt="Compare the top two models and explain which one is better for manufacturing.">Compare top models</button>
        <button type="button" data-prompt="Give me a checklist for uploading a clean .kaiju model.">Upload checklist</button>
      </div>
    </section>
    <section class="ai-bar-shell" aria-label="AIDER-X command bar">
      <form class="ai-command-bar" data-aider-form>
        <button class="ai-orb" type="button" data-aider-toggle aria-label="Open AIDER-X">
          <i data-lucide="sparkles"></i>
        </button>
        <div class="ai-input-wrap">
          <span>AIDER-X</span>
          <input name="message" placeholder="Ask AI to find, compare, explain, or prepare a Kaiju model..." autocomplete="off">
        </div>
        <div class="ai-chip-row" data-aider-prompts>
          <button type="button" data-prompt="Show me official models only."><i data-lucide="badge-check"></i>Official</button>
          <button type="button" data-prompt="Help me compare two CAD models."><i data-lucide="columns-2"></i>Compare</button>
          <button type="button" data-prompt="Prepare my upload metadata and build plan."><i data-lucide="file-up"></i>Upload prep</button>
        </div>
        <button class="icon-button ai-expand" type="button" data-aider-toggle aria-label="Open chat panel">
          <i data-lucide="panel-top-open"></i>
        </button>
        <button class="button ai-send" type="submit">
          <i data-lucide="send"></i>
          Ask
        </button>
      </form>
    </section>
  `;
}

export function mountAiderX() {
  const drawer = document.querySelector('[data-aider-drawer]');
  const messages = document.querySelector('[data-aider-messages]');
  const form = document.querySelector('[data-aider-form]');
  const status = document.querySelector('[data-aider-status]');
  if (!drawer || !messages || !form) return;

  let socket;
  const pending = [];
  let typingNode;

  const setStatus = (text) => {
    if (status) status.textContent = text;
  };

  const addMessage = (text, type = '') => {
    const node = document.createElement('div');
    node.className = `message ${type}`;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  };

  const showTyping = () => {
    if (typingNode) return;
    typingNode = document.createElement('div');
    typingNode.className = 'message assistant is-thinking';
    typingNode.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typingNode);
    messages.scrollTop = messages.scrollHeight;
  };

  const hideTyping = () => {
    typingNode?.remove();
    typingNode = null;
  };

  const connect = () => {
    if (socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) return;
    setStatus('Connecting');
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/aider-x`);
    socket.addEventListener('open', () => {
      setStatus('Ready');
      while (pending.length) socket.send(pending.shift());
    });
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'typing') {
        setStatus('Thinking');
        showTyping();
        return;
      }
      setStatus('Ready');
      hideTyping();
      addMessage(data.message || 'AIDER-X is ready.');
    });
    socket.addEventListener('close', () => setStatus('Offline'));
    socket.addEventListener('error', () => setStatus('Offline'));
  };

  document.querySelectorAll('[data-aider-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      drawer.classList.toggle('open');
      connect();
    });
  });

  const sendMessage = (text) => {
    if (!text) return;
    drawer.classList.add('open');
    connect();
    addMessage(text, 'user');
    if (socket.readyState === WebSocket.OPEN) socket.send(text);
    else pending.push(text);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.elements.message;
    const text = input.value.trim();
    sendMessage(text);
    input.value = '';
  });

  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      sendMessage(button.dataset.prompt);
    });
  });

  document.querySelector('[data-aider-clear]')?.addEventListener('click', () => {
    hideTyping();
    messages.innerHTML = '';
    setStatus('Ready');
  });
}
