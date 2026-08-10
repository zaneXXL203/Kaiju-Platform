import { apiClient } from '../services/api-client.js';
import { showToast } from '../components/toast.js';

export async function requestsPage({ user }) {
  const { requests } = await apiClient.request('/api/requests');
  const canClaim = user && ['official', 'owner'].includes(user.role);
  return {
    title: 'Request Board',
    html: `
      <section class="stack">
        <div class="page-title"><h1>Model Request Board</h1><p>Post, claim, and fulfill geometry requests.</p></div>
        ${user ? requestForm() : '<div class="empty-state">Log in to post a request.</div>'}
        <div class="model-grid">
          ${requests.length ? requests.map((request) => requestCard(request, canClaim)).join('') : '<div class="empty-state">No requests yet.</div>'}
        </div>
      </section>
    `,
    afterRender() {
      document.querySelector('[data-request-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await apiClient.request('/api/requests', {
          method: 'POST',
          body: Object.fromEntries(form.entries())
        });
        showToast('Request posted');
        location.reload();
      });
      document.querySelectorAll('[data-claim]').forEach((button) => {
        button.addEventListener('click', async () => {
          await apiClient.request(`/api/requests/${button.dataset.claim}/claim`, { method: 'POST' });
          showToast('Request claimed');
          location.reload();
        });
      });
    }
  };
}

function requestForm() {
  return `
    <form class="panel form" data-request-form>
      <div class="two-column">
        <div class="field"><label>Title</label><input name="title" required></div>
        <div class="field"><label>Category</label><select name="category"><option>Mechanical</option><option>Aerospace</option><option>Bio-Medical</option><option>Architecture</option><option>Electronics</option></select></div>
      </div>
      <div class="field"><label>Description</label><textarea name="description" required></textarea></div>
      <button class="button" type="submit">Post Request</button>
    </form>
  `;
}

function requestCard(request, canClaim) {
  return `
    <article class="panel stack">
      <h2>${escapeHtml(request.title)}</h2>
      <p>${escapeHtml(request.description)}</p>
      <div class="row">
        <span class="status-badge">${escapeHtml(request.category)}</span>
        <span class="status-badge">${escapeHtml(request.status)}</span>
      </div>
      ${canClaim && request.status === 'open' ? `<button class="button secondary" type="button" data-claim="${request.id}">Claim</button>` : ''}
    </article>
  `;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
