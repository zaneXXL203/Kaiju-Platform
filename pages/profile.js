import { modelService } from '../services/model-service.js';
import { modelCard } from '../components/model-card.js';

export async function profilePage({ params, user }) {
  if (!user && !params.username) {
    return {
      title: 'Profile',
      html: '<div class="empty-state">Log in to view your profile.</div>'
    };
  }
  const username = params.username || user.username;
  const { models } = await modelService.list();
  const owned = models.filter((model) => model.creator.toLowerCase() === username.toLowerCase());
  const profileRole = owned[0]?.creatorRole || (username === user?.username ? user.role : 'regular');
  const badge = profileRole === 'owner' ? '<span class="badge-owner">Owner</span>' : profileRole === 'official' ? '<span class="badge-official">Official</span>' : '';

  return {
    title: `${username} Profile`,
    html: `
      <section class="stack">
        <div class="panel">
          <div class="section-head" style="margin:0;">
            <div>
              <h1>${escapeHtml(username)} ${badge}</h1>
              <p class="muted">${profileRole === 'official' ? 'Official Creator' : profileRole === 'owner' ? 'Owner Command Account' : 'Kaiju community member'}</p>
            </div>
            ${username === user?.username ? '<a class="button secondary" href="/settings" data-link>Settings</a>' : ''}
          </div>
        </div>
        ${profileRole === 'official' ? '<div class="announcement"><strong>Official Creator</strong><span>Enhanced publishing and model analytics are enabled.</span></div>' : ''}
        <div class="section-head"><h2>Published Models</h2><span class="muted">${owned.length} models</span></div>
        <div class="model-grid">${owned.length ? owned.map(modelCard).join('') : '<div class="empty-state">No public models yet.</div>'}</div>
      </section>
    `
  };
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
