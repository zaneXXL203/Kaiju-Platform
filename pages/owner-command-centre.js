import { apiClient } from '../services/api-client.js';
import { mountLiveTelemetry } from '../components/live-telemetry.js';
import { showToast } from '../components/toast.js';

export async function ownerCommandCentrePage({ user }) {
  if (user?.role !== 'owner') {
    return { title: 'Owner Command Centre', html: '<div class="empty-state">Owner access is required.</div>' };
  }
  const [telemetry, userData] = await Promise.all([
    apiClient.request('/api/owner/telemetry'),
    apiClient.request('/api/owner/users')
  ]);
  return {
    title: 'Owner Command Centre',
    html: `
      <section class="stack">
        <div class="section-head">
          <div class="page-title">
            <h1>Kaiju Owner Command Centre</h1>
            <p>Live platform telemetry, role control, system health, and all-access moderation.</p>
          </div>
          <span class="badge-owner">Live</span>
        </div>
        <div data-owner-telemetry>
          <div class="dashboard-grid">
            <div class="metric"><strong>${telemetry.activeUsers}</strong><span>Active users</span></div>
            <div class="metric"><strong>${telemetry.downloadsPerMinute}</strong><span>Downloads/min</span></div>
            <div class="metric"><strong>${telemetry.searchesPerMinute}</strong><span>Searches/min</span></div>
            <div class="metric"><strong>${telemetry.aiChatsPerMinute}</strong><span>AI chats/min</span></div>
          </div>
        </div>
        <div class="panel">
          <h2>User Roles</h2>
          <table class="table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              ${userData.users.map((account) => `
                <tr>
                  <td>${escapeHtml(account.username)}</td>
                  <td>${escapeHtml(account.email)}</td>
                  <td><span class="status-badge">${escapeHtml(account.role)}</span></td>
                  <td>
                    <select data-role-user="${account.id}">
                      ${['regular', 'official', 'owner'].map((role) => `<option value="${role}" ${role === account.role ? 'selected' : ''}>${role}</option>`).join('')}
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `,
    afterRender() {
      mountLiveTelemetry(document.querySelector('[data-owner-telemetry]'));
      document.querySelectorAll('[data-role-user]').forEach((select) => {
        select.addEventListener('change', async () => {
          await apiClient.request(`/api/owner/users/${select.dataset.roleUser}/role`, {
            method: 'PATCH',
            body: { role: select.value }
          });
          showToast('Role updated');
        });
      });
    }
  };
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
