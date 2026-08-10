import { showToast } from './toast.js';

const interactiveSelector = '.button, .icon-button, .nav-link, .aider-button, .ai-orb';
const revealSelector = '.panel, .auth-card, .metric, .announcement, .viewport-hero, .viewport-detail, .viewport-small';

export function bindInteractions({ router }) {
  bindRipples();
  bindCardTilt();
  bindScrollReveal();
  bindNavScroll();
  bindKeyboardShortcuts(router);
}

function bindRipples() {
  document.querySelectorAll(interactiveSelector).forEach((control) => {
    if (control.dataset.rippleBound) return;
    control.dataset.rippleBound = 'true';
    control.addEventListener('pointerdown', (event) => {
      if (event.button && event.button !== 0) return;
      const rect = control.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'button-ripple';
      ripple.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
      ripple.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
      control.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });
}

function bindCardTilt() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  document.querySelectorAll('.model-card').forEach((card) => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = 'true';

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${(x - 0.5) * 5}deg`);
      card.style.setProperty('--tilt-y', `${(0.5 - y) * 5}deg`);
      card.classList.add('is-tilting');
    });

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
}

function bindScrollReveal() {
  document.querySelectorAll(revealSelector).forEach((element) => {
    element.classList.add('is-visible');
  });
}

function bindNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  if (window.__kaijuNavScrollBound) return;
  window.__kaijuNavScrollBound = true;
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.nav').forEach((node) => {
      node.classList.toggle('is-scrolled', window.scrollY > 8);
    });
  }, { passive: true });
}

function bindKeyboardShortcuts(router) {
  if (window.__kaijuShortcutsBound) return;
  window.__kaijuShortcutsBound = true;

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target?.matches?.('input, textarea, select, [contenteditable="true"]');
    if (isTyping) return;

    if (event.key === 'u' || event.key === 'U') {
      router.navigate('/upload');
      showToast('Upload opened');
    }

    if (event.key === 's' || event.key === 'S') {
      event.preventDefault();
      document.querySelector('[data-nav-search] input')?.focus();
    }

    if (event.key === 'a' || event.key === 'A') {
      document.querySelector('[data-aider-toggle]')?.click();
    }

    if (event.key === 'Escape') {
      document.querySelector('[data-aider-drawer]')?.classList.remove('open');
    }
  });
}
