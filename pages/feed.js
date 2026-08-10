import { apiClient } from '../services/api-client.js';

export async function feedPage() {
  const { activity } = await apiClient.request('/api/feed');
  return {
    title: 'Activity Feed',
    html: `
      <section class="stack">
        <div class="page-title"><h1>Activity Feed</h1><p>Live-ish social activity from uploads, downloads, likes, comments, and admin actions.</p></div>
        <div class="panel">
          <ul class="activity-list">
            ${activity.map((item) => `<li>${escapeHtml(item.message)}<br><span class="muted">${new Date(item.created_at).toLocaleString()}</span></li>`).join('')}
          </ul>
        </div>
      </section>
    `
  };
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
