import { modelService } from '../services/model-service.js';
import { mountViewport } from '../components/viewport.js';
import { modelCard } from '../components/model-card.js';
import { showToast } from '../components/toast.js';

export async function modelDetailPage({ params, user }) {
  const { model, comments } = await modelService.get(params.id);
  const related = await modelService.list({ category: model.category });
  const badge = model.badge === 'OWNER'
    ? '<span class="badge-owner">Owner</span>'
    : model.badge === 'OFFICIAL'
      ? '<span class="badge-official">Official</span>'
      : '';

  return {
    title: model.title,
    html: `
      <section class="stack">
        <div class="panel model-hero">
          <div class="page-title">
            <h1>${escapeHtml(model.title)}</h1>
            <p>by ${escapeHtml(model.creatorName)} ${badge}</p>
            <div class="stat-strip">
              <div class="stat-pill"><strong>${formatNumber(model.views)}</strong><span>Views</span></div>
              <div class="stat-pill"><strong>${formatNumber(model.downloads)}</strong><span>Downloads</span></div>
              <div class="stat-pill"><strong>${formatNumber(model.likes)}</strong><span>Likes</span></div>
            </div>
          </div>
          <div class="toolbar">
            <a class="button" href="${modelService.downloadUrl(model.id)}" target="_blank" rel="noreferrer"><i data-lucide="download"></i>Download</a>
            ${user ? '<button class="button secondary" type="button" data-like><i data-lucide="heart"></i>Like</button>' : ''}
            <button class="button secondary" type="button" data-share><i data-lucide="share-2"></i>Share</button>
          </div>
        </div>

        <div class="panel viewer-shell">
          <div class="toolbar segmented" style="margin-bottom:12px;">
            <button class="button secondary is-active" type="button" data-mode="solid"><i data-lucide="box"></i>Solid</button>
            <button class="button secondary" type="button" data-mode="wireframe"><i data-lucide="scan-line"></i>Wireframe</button>
            <button class="button secondary" type="button" data-mode="ghost"><i data-lucide="layers"></i>Ghost</button>
            <button class="button secondary" type="button" data-mode="xray"><i data-lucide="activity"></i>X-Ray</button>
            <button class="button secondary" type="button" data-reset><i data-lucide="rotate-ccw"></i>Reset</button>
            <button class="button secondary" type="button" data-fullscreen><i data-lucide="maximize"></i>Fullscreen</button>
          </div>
          <div id="detail-viewport" class="viewport-detail"></div>
        </div>

        <div class="detail-grid">
          <article class="panel stack">
            <div>
              <h2>Model Information</h2>
              <p>${escapeHtml(model.description)}</p>
            </div>
            <div class="row">
              <span class="format-badge">.${escapeHtml(model.format)}</span>
              <span class="visibility-badge">${escapeHtml(model.visibility)}</span>
              <span class="status-badge">${escapeHtml(model.category)}</span>
              ${model.tags.map((tag) => `<span class="status-badge">${escapeHtml(tag)}</span>`).join('')}
            </div>
            ${model.officialNotes ? `<div class="panel" style="box-shadow:none;"><h3>Official Notes</h3><p>${escapeHtml(model.officialNotes)}</p></div>` : ''}
            <div>
              <h3>Discussion</h3>
              <ul class="activity-list" data-comments>
                ${comments.length ? comments.map((comment) => `<li><strong>${escapeHtml(comment.username)}</strong><br>${escapeHtml(comment.body)}</li>`).join('') : '<li class="muted">No comments yet.</li>'}
              </ul>
              ${user ? commentForm() : '<p class="muted">Log in to join the threaded discussion.</p>'}
            </div>
          </article>

          <aside class="panel stack">
            <div>
              <h2>Build Plan</h2>
              ${buildPlan(model.buildPlan)}
            </div>
            <div>
              <h3>Analytics</h3>
              <div class="dashboard-grid" style="grid-template-columns:1fr;">
                <div class="metric"><strong>${model.views}</strong><span>Views</span></div>
                <div class="metric"><strong>${model.downloads}</strong><span>Downloads</span></div>
                <div class="metric"><strong>${model.likes}</strong><span>Likes</span></div>
              </div>
            </div>
          </aside>
        </div>

        <section>
          <div class="section-head">
            <h2>Related Models</h2>
            <button class="button secondary" type="button" data-compare><i data-lucide="columns-2"></i>Compare Mode</button>
          </div>
          <div data-compare-area></div>
          <div class="model-grid">${related.models.filter((item) => item.id !== model.id).slice(0, 6).map(modelCard).join('')}</div>
        </section>
      </section>
    `,
    afterRender() {
      const viewport = document.querySelector('#detail-viewport');
      const controller = mountViewport(viewport, { model, autoRotate: true });
      document.querySelectorAll('[data-mode]').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelectorAll('[data-mode]').forEach((item) => item.classList.remove('is-active'));
          button.classList.add('is-active');
          controller.setMode(button.dataset.mode);
        });
      });
      document.querySelector('[data-reset]')?.addEventListener('click', () => controller.reset());
      document.querySelector('[data-fullscreen]')?.addEventListener('click', () => viewport.requestFullscreen?.());
      document.querySelector('[data-like]')?.addEventListener('click', async () => {
        const result = await modelService.like(model.id);
        showToast(result.liked ? 'Model liked' : 'Like removed');
      });
      document.querySelector('[data-share]')?.addEventListener('click', async () => {
        await navigator.clipboard?.writeText(location.href);
        showToast('Share link copied');
      });
      bindCommentForm(model.id);
      bindCompare(model);
    }
  };
}

function buildPlan(plan) {
  return `
    <ul class="compact-list">
      ${Object.entries(plan || {}).map(([key, value]) => `<li><strong>${escapeHtml(label(key))}</strong><br><span class="muted">${escapeHtml(value)}</span></li>`).join('')}
    </ul>
  `;
}

function commentForm() {
  return `
    <form class="form" data-comment-form>
      <div class="field">
        <label for="comment-body">Reply</label>
        <textarea id="comment-body" name="body" required></textarea>
      </div>
      <button class="button" type="submit">Post Comment</button>
    </form>
  `;
}

function bindCommentForm(modelId) {
  document.querySelector('[data-comment-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form).get('body');
    const response = await fetch(`/api/models/${encodeURIComponent(modelId)}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kaiju_token') || ''}`
      },
      body: JSON.stringify({ body })
    });
    if (!response.ok) return showToast('Comment failed');
    showToast('Comment posted');
    form.reset();
  });
}

function bindCompare(model) {
  document.querySelector('[data-compare]')?.addEventListener('click', () => {
    const area = document.querySelector('[data-compare-area]');
    area.innerHTML = `
      <div class="two-column" style="margin-bottom:18px;">
        <div class="viewport-small" id="compare-a"></div>
        <div class="viewport-small" id="compare-b"></div>
      </div>
    `;
    mountViewport(document.querySelector('#compare-a'), { model, autoRotate: true });
    mountViewport(document.querySelector('#compare-b'), { primitive: 'wing', autoRotate: true });
  });
}

function label(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function formatNumber(value) {
  return new Intl.NumberFormat('en', { notation: value > 999 ? 'compact' : 'standard' }).format(value);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
