import { apiClient } from '../services/api-client.js';

export function mountLiveTelemetry(container) {
  if (!container) return;
  const render = (data) => {
    container.innerHTML = `
      <div class="dashboard-grid">
        <div class="metric"><strong>${data.activeUsers}</strong><span>Active users</span></div>
        <div class="metric"><strong>${data.downloadsPerMinute}</strong><span>Downloads/min</span></div>
        <div class="metric"><strong>${data.searchesPerMinute}</strong><span>Searches/min</span></div>
        <div class="metric"><strong>${data.aiChatsPerMinute}</strong><span>AI chats/min</span></div>
      </div>
      <div class="two-column" style="margin-top:18px;">
        <div class="panel">
          <h2>User Activity Feed</h2>
          <ul class="activity-list">
            ${data.recentActivity.map((item) => `<li>${escapeHtml(item.message)}<br><span class="muted">${new Date(item.created_at).toLocaleString()}</span></li>`).join('')}
          </ul>
        </div>
        <div class="panel">
          <h2>System Health</h2>
          <ul class="compact-list">
            <li>Server: ${data.health.server}</li>
            <li>Database: ${data.health.database}</li>
            <li>Storage: ${data.health.storageUsed}</li>
            <li>API: ${data.health.api}</li>
          </ul>
        </div>
      </div>
    `;
  };

  const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/owner-telemetry?token=${encodeURIComponent(apiClient.token)}`;
  const socket = new WebSocket(wsUrl);
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'telemetry') render(data.payload);
  });
  socket.addEventListener('error', () => {
    container.innerHTML = '<div class="empty-state">Owner telemetry socket could not connect.</div>';
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}
