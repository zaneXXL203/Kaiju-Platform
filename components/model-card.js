export function modelCard(model) {
  return `
    <article class="model-card">
      <a class="model-thumb" href="/models/${model.id}" data-link aria-label="Open ${escapeHtml(model.title)}">
        ${badge(model)}
        <span class="model-preview-mark"><i data-lucide="box"></i>${escapeHtml(model.category)}</span>
      </a>
      <div class="model-body">
        <div class="model-title">
          <h3><a href="/models/${model.id}" data-link>${escapeHtml(model.title)}</a></h3>
          <span class="format-badge">.${escapeHtml(model.format)}</span>
        </div>
        <div class="meta-line">
          by <a href="/profile/${encodeURIComponent(model.creator)}" data-link>${escapeHtml(model.creatorName || model.creator)}</a>
          <span class="visibility-badge">${escapeHtml(model.visibility)}</span>
        </div>
        <p class="muted">${escapeHtml(model.description).slice(0, 118)}${model.description?.length > 118 ? '...' : ''}</p>
        <div class="model-actions">
          <div class="stat-line">
            <span><i data-lucide="heart"></i>${model.likes}</span>
            <span><i data-lucide="download"></i>${model.downloads}</span>
            <span><i data-lucide="eye"></i>${model.views}</span>
          </div>
          <a class="icon-button" href="/models/${model.id}" data-link aria-label="Open ${escapeHtml(model.title)}"><i data-lucide="arrow-up-right"></i></a>
        </div>
      </div>
    </article>
  `;
}

export function badge(model) {
  if (model.badge === 'OWNER') return '<span class="badge-owner card-badge">Owner</span>';
  if (model.badge === 'OFFICIAL') return '<span class="badge-official card-badge">Official</span>';
  return '';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
