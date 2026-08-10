import { apiClient } from '../services/api-client.js';

const PATTERN = [2, 1, 2, 1];
const GROUP_GAP_MS = 600;
const TOTAL_TIMEOUT_MS = 8000;

export function attachSecretEntry({ trigger, indicator, input, onAccepted }) {
  let sequence = [];
  let groupClicks = 0;
  let groupTimer = null;
  let timeoutTimer = null;

  function reset() {
    sequence = [];
    groupClicks = 0;
    clearTimeout(groupTimer);
    clearTimeout(timeoutTimer);
    indicator.classList.remove('active', 'error');
  }

  function beginTimeout() {
    clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(reset, TOTAL_TIMEOUT_MS);
  }

  function commitGroup() {
    if (!groupClicks) return;
    sequence.push(groupClicks);
    groupClicks = 0;

    const matchesPrefix = sequence.every((value, index) => value === PATTERN[index]);
    if (!matchesPrefix) {
      reset();
      return;
    }

    if (sequence.length === PATTERN.length) {
      indicator.classList.add('active');
      input.value = '';
      input.focus();
      clearTimeout(timeoutTimer);
      timeoutTimer = setTimeout(reset, 30_000);
    }
  }

  trigger.addEventListener('click', () => {
    if (!sequence.length && !groupClicks) beginTimeout();
    groupClicks += 1;
    clearTimeout(groupTimer);
    groupTimer = setTimeout(commitGroup, GROUP_GAP_MS);
  });

  input.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter') return;
    if (!indicator.classList.contains('active')) return;
    event.preventDefault();
    const secretCode = input.value.trim();
    if (!secretCode) {
      reset();
      return;
    }
    try {
      const result = await apiClient.request('/api/auth/check-secret', {
        method: 'POST',
        body: { secretCode }
      });
      if (result.accepted) {
        onAccepted(secretCode, result.role);
        reveal(result.role === 'owner' ? 'OWNER' : 'OFFICIAL');
        trigger.style.filter = 'brightness(3) drop-shadow(0 0 24px white)';
        setTimeout(() => {
          trigger.style.filter = '';
        }, 1000);
        reset();
      } else {
        indicator.classList.add('error');
        setTimeout(() => {
          indicator.classList.remove('error');
          indicator.classList.add('active');
        }, 620);
      }
    } catch {
      indicator.classList.add('error');
    }
  });
}

function reveal(text) {
  const node = document.createElement('div');
  node.className = 'official-reveal-text';
  node.textContent = text;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2100);
}
