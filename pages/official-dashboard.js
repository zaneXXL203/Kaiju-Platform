import { apiClient } from '../services/api-client.js';
import { modelService } from '../services/model-service.js';
import { showToast } from '../components/toast.js';

export async function officialDashboardPage({ user }) {
  if (!user || !['official', 'owner'].includes(user.role)) {
    return { title: 'Official Dashboard', html: '<div class="empty-state">Official access is required.</div>' };
  }
  const [overview, modelData] = await Promise.all([
    apiClient.request('/api/admin/overview'),
    modelService.list()
  ]);

  return {
    title: 'Official Dashboard',
    html: `
      <section class="stack">
        <div class="page-title"><h1>Official Dashboard</h1><p>Manage featured models, requests, reports, announcements, and creator analytics.</p></div>
        <div class="dashboard-grid">
          <div class="metric"><strong>${overview.totals.models}</strong><span>Total models</span></div>
          <div class="metric"><strong>${overview.totals.downloads}</strong><span>Downloads</span></div>
          <div class="metric"><strong>${overview.totals.likes}</strong><span>Likes</span></div>
          <div class="metric"><strong>${overview.requests.length}</strong><span>Requests</span></div>
        </div>
        <div class="two-column">
          <div class="panel">
            <h2>Model Management</h2>
            <table class="table">
              <thead><tr><th>Model</th><th>Creator</th><th>Featured</th></tr></thead>
              <tbody>
                ${modelData.models.map((model) => `
                  <tr>
                    <td>${escapeHtml(model.title)}</td>
                    <td>${escapeHtml(model.creator)}</td>
                    <td><button class="button secondary" type="button" data-feature="${model.id}" data-on="${model.isFeatured ? '0' : '1'}">${model.isFeatured ? 'Unfeature' : 'Feature'}</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <aside class="stack">
            <form class="panel form" data-announcement-form>
              <h2>Announcement</h2>
              <div class="field"><label>Title</label><input name="title" required></div>
              <div class="field"><label>Body</label><textarea name="body" required></textarea></div>
              <button class="button" type="submit">Broadcast</button>
            </form>
            <div class="panel">
              <h2>Recent Activity</h2>
              <ul class="activity-list">${overview.recentActivity.map((item) => `<li>${escapeHtml(item.message)}</li>`).join('')}</ul>
            </div>
          </aside>
        </div>
      </section>
    `,
    afterRender() {
      document.querySelectorAll('[data-feature]').forEach((button) => {
        button.addEventListener('click', async () => {
          await apiClient.request(`/api/admin/models/${button.dataset.feature}/feature`, {
            method: 'PATCH',
            body: { featured: button.dataset.on === '1' }
          });
          showToast('Featured status updated');
          location.reload();
        });
      });
      document.querySelector('[data-announcement-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await apiClient.request('/api/admin/announcements', {
          method: 'POST',
          body: { title: form.get('title'), body: form.get('body') }
        });
        showToast('Announcement posted');
        event.currentTarget.reset();
      });
    }
  };
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
